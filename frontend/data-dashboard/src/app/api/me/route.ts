import { NextRequest, NextResponse } from "next/server"

const BACKEND_ME_URL = process.env.BACKEND_ME_URL ?? "http://localhost:8080/me"

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? ""

  let backendResponse: Response

  try {
    backendResponse = await fetch(BACKEND_ME_URL, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        accept: "application/json",
      },
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { detail: "Backend unavailable" },
      { status: 503 }
    )
  }

  const body = await backendResponse.text()

  return new NextResponse(body, {
    status: backendResponse.status,
    headers: {
      "content-type": backendResponse.headers.get("content-type") ?? "application/json",
    },
  })
}
