from __future__ import annotations

import os
import json
import time
import secrets
import base64
import hmac
import hashlib
from typing import Any, Dict, List

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from starlette.middleware.sessions import SessionMiddleware

load_dotenv()
import asyncio
import csv

CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "../frontend/data-dashboard/public/data/race-telemetry.csv")

# ---- Config ----
DATABASE_URL = os.environ["DATABASE_URL"]

DFR_AUTH_URL = os.environ["DFR_AUTH_URL"]
DFR_TOKEN_URL = os.environ["DFR_TOKEN_URL"]
DFR_USERINFO_URL = os.environ["DFR_USERINFO_URL"]

DFR_CLIENT_ID = os.environ["DFR_CLIENT_ID"]
DFR_CLIENT_SECRET = os.environ["DFR_CLIENT_SECRET"]
DFR_REDIRECT_URI = os.environ["DFR_REDIRECT_URI"]
DFR_SCOPE = os.environ.get("DFR_SCOPE", "").strip()

SESSION_SECRET = os.environ["SESSION_SECRET"]

STATE_COOKIE = "oauth_state"
SESSION_COOKIE = "session"

app = FastAPI()

# ---- Middleware for OAuth state session ----
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    same_site="lax",
    session_cookie="oauth_state_session",
    https_only=False,  # change to True in production HTTPS
    max_age=60 * 60 * 24 * 7,
)

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# ---- DB SQL ----
# Only upsert the fields we care about.
UPSERT_AND_RETURN_SQL = text("""
    INSERT INTO public.users (
      discord_id,
      discord_username,
      discord_name,
      avatar_url,
      is_admin,
      roles,
      last_login_at
    )
    VALUES (
      :discord_id,
      :discord_username,
      :discord_name,
      :avatar_url,
      :is_admin,
      :roles,
      now()
    )
    ON CONFLICT (discord_id)
    DO UPDATE SET
      discord_username = EXCLUDED.discord_username,
      discord_name     = EXCLUDED.discord_name,
      avatar_url       = EXCLUDED.avatar_url,
      is_admin         = EXCLUDED.is_admin,
      roles            = EXCLUDED.roles,
      last_login_at    = EXCLUDED.last_login_at
    RETURNING
      discord_id,
      discord_username,
      discord_name,
      avatar_url,
      roles,
      is_admin,
      presets,
      created_at,
      last_login_at,
      updated_at;
""")

GET_USER_SQL = text("""
  SELECT
    discord_id,
    discord_username,
    discord_name,
    avatar_url,
    roles,
    is_admin,
    presets,
    created_at,
    last_login_at,
    updated_at
  FROM public.users
  WHERE discord_id = :discord_id
""")

# ---- Minimal signed session token (HMAC) ----
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")

def _b64url_decode(s: str) -> bytes:
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)

def create_session(discord_id: str, exp_seconds: int = 60 * 60 * 24 * 7) -> str:
    payload = {"sub": discord_id, "exp": int(time.time()) + exp_seconds}
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(SESSION_SECRET.encode("utf-8"), body, hashlib.sha256).digest()
    return f"{_b64url(body)}.{_b64url(sig)}"

def verify_session(token: str) -> str:
    try:
        body_b64, sig_b64 = token.split(".")
        body = _b64url_decode(body_b64)
        sig = _b64url_decode(sig_b64)
        expected = hmac.new(SESSION_SECRET.encode("utf-8"), body, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError("bad signature")
        payload = json.loads(body.decode("utf-8"))
        if int(time.time()) >= int(payload["exp"]):
            raise ValueError("expired")
        return str(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")

def get_current_user_id(request: Request) -> str:
    print("Cookies on /me:", request.cookies)
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return verify_session(token)

# ---- OAuth helpers ----
def build_authorize_url(state: str) -> str:
    from urllib.parse import urlencode
    params = {
        "client_id": DFR_CLIENT_ID,
        "redirect_uri": DFR_REDIRECT_URI,
        "response_type": "code",
        "state": state,
    }
    if DFR_SCOPE:
        params["scope"] = DFR_SCOPE
    return f"{DFR_AUTH_URL}?{urlencode(params)}"

async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """
    Uses Basic Auth (supported by the DFR Discord-Auth implementation).
    """
    basic = base64.b64encode(f"{DFR_CLIENT_ID}:{DFR_CLIENT_SECRET}".encode("utf-8")).decode("utf-8")
    headers = {
        "Authorization": f"Basic {basic}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": DFR_REDIRECT_URI,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(DFR_TOKEN_URL, data=data, headers=headers)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Token exchange failed: {r.text}")
        return r.json()

async def fetch_userinfo(access_token: str) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(DFR_USERINFO_URL, headers=headers)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Userinfo failed: {r.text}")
        return r.json()

# ---- Business logic mapping (unchanged) ----
def roles_dict_to_array(roles_obj: Any) -> List[str]:
    """
    Input from /userinfo:
      roles: { "role_id": "Role Name", ... }
    Output for Postgres:
      roles: ["Role Name", ...]  (text[])
    """
    if isinstance(roles_obj, dict):
        # Keep only role names (values), unique, stable order
        return sorted({str(v).strip() for v in roles_obj.values() if v is not None and str(v).strip()})
    if isinstance(roles_obj, list):
        return [str(x).strip() for x in roles_obj if x is not None and str(x).strip()]
    return []

def compute_is_admin(role_names: List[str]) -> bool:
    """
    is_admin true if any role contains 'lead' or 'pm' (case-insensitive).
    """
    for r in role_names:
        rl = r.lower()
        if "lead" in rl or "pm" in rl:
            return True
    return False

def upsert_user_from_userinfo(userinfo: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reads only what you want from auth:
      discord_id, discord_name, discord_username, avatar_url, roles
    Then:
      - roles stored as text[]
      - is_admin computed from roles containing 'Lead' or 'PM'
    Returns DB row including presets.
    """
    discord_id = str(userinfo.get("discord_id") or userinfo.get("sub") or "")
    if not discord_id:
        raise HTTPException(status_code=502, detail="userinfo missing discord_id/sub")

    discord_name = userinfo.get("discord_name")
    discord_username = userinfo.get("discord_username")  # note: your payload uses discord_username
    avatar_url = userinfo.get("avatar_url")

    role_names = roles_dict_to_array(userinfo.get("roles"))
    is_admin = compute_is_admin(role_names)

    params = {
        "discord_id": discord_id,
        "discord_username": discord_username or "",
        "discord_name": discord_name,
        "avatar_url": avatar_url,
        "is_admin": is_admin,
        "roles": role_names,  # text[]
    }

    with engine.begin() as conn:
        row = conn.execute(UPSERT_AND_RETURN_SQL, params).mappings().one()

    return dict(row)

def get_user_from_db(discord_id: str) -> Dict[str, Any]:
    with engine.begin() as conn:
        row = conn.execute(GET_USER_SQL, {"discord_id": discord_id}).mappings().one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)

# ---- Endpoints ----
@app.get("/auth/login")
def auth_login(request: Request):
    state = secrets.token_urlsafe(24)
    url = build_authorize_url(state)

    print("LOGIN state generated:", state)
    print("Redirect URI:", DFR_REDIRECT_URI)
    print("Authorize URL:", url)

    request.session["oauth_state"] = state

    return RedirectResponse(url=url)

@app.get("/auth/callback")
async def auth_callback(request: Request, code: str, state: str):
    print("CALLBACK state from query:", state)
    print("CALLBACK state from session:", request.session.get("oauth_state"))

    expected_state = request.session.get("oauth_state")
    if not expected_state or state != expected_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    request.session.pop("oauth_state", None)

    token_json = await exchange_code_for_token(code)
    access_token = token_json.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail=f"Missing access_token: {token_json}")

    userinfo = await fetch_userinfo(access_token)

    # UPSERT + return row
    user_row = upsert_user_from_userinfo(userinfo)

    # Create session cookie for future /me calls
    session = create_session(user_row["discord_id"])
    resp = RedirectResponse(url="/me", status_code=302)
    resp.set_cookie(
        key=SESSION_COOKIE,
        value=session,
        httponly=True,
        secure=False,  # True in production
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    print("SETTING COOKIE:", session)
    return resp

@app.get("/me")
def me(discord_id: str = Depends(get_current_user_id)):
    return get_user_from_db(discord_id)

@app.post("/preset/create")
async def create_preset(
    request: Request,
    discord_id: str = Depends(get_current_user_id)
):
    preset_json = await request.json()

    stmt = text("""
        UPDATE public.users
        SET presets = presets || :preset::jsonb
        WHERE discord_id = :discord_id
        RETURNING
            discord_id,
            presets,
            updated_at;
    """)

    with engine.begin() as conn:
        row = conn.execute(
            stmt,
            {
                "discord_id": discord_id,
                "preset": json.dumps(preset_json),
            }
        ).mappings().one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return dict(row)

@app.websocket("/ws/telemetry")
async def websocket_telemetry(
    websocket: WebSocket,
    read_csv: bool = False,
    simulate: bool = False,
    frequency_ms: int = 100
):
    await websocket.accept()
    try:
        if read_csv and simulate:
            while True:
                if not os.path.exists(CSV_FILE_PATH):
                    await websocket.send_json({"error": "CSV file not found"})
                    await asyncio.sleep(5)
                    continue
                
                with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        parsed_row = {}
                        for k, v in row.items():
                            try:
                                parsed_row[k] = float(v)
                            except ValueError:
                                parsed_row[k] = v
                        await websocket.send_json(parsed_row)
                        await asyncio.sleep(frequency_ms / 1000.0)
        elif read_csv and not simulate:
            if not os.path.exists(CSV_FILE_PATH):
                await websocket.send_json({"error": "CSV file not found"})
            else:
                with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    all_rows = []
                    for row in reader:
                        parsed_row = {}
                        for k, v in row.items():
                            try:
                                parsed_row[k] = float(v)
                            except ValueError:
                                parsed_row[k] = v
                        all_rows.append(parsed_row)
                    await websocket.send_json(all_rows)
            # Keep connection open
            while True:
                await asyncio.sleep(1)
        else:
            while True:
                data = await websocket.receive_text()
                await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("Client disconnected from telemetry WebSocket.")
    except Exception as e:
        print(f"WebSocket Error: {e}")