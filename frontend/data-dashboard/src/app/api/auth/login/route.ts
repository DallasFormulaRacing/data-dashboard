import { NextResponse } from "next/server"

const BACKEND_AUTH_LOGIN_URL = process.env.BACKEND_AUTH_LOGIN_URL ?? "http://localhost:8080/auth/login"

export async function GET(request: Request) {
  try {
    // Redirect to backend auth endpoint, which will handle OAuth flow
    return NextResponse.redirect(BACKEND_AUTH_LOGIN_URL, { status: 302 })
  } catch (error) {
    console.error("Auth redirect failed:", error)
    const loginPageUrl = new URL("/login?error=backend_unavailable", request.url)
    return NextResponse.redirect(loginPageUrl)
  }
}
