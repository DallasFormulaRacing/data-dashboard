import { NextRequest, NextResponse } from "next/server"

const BACKEND_CALLBACK_URL = process.env.BACKEND_CALLBACK_URL ?? "http://localhost:8080/auth/callback"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect("/login?error=invalid_callback")
  }

  try {
    // Forward the callback to the backend
    const backendCallbackUrl = new URL(BACKEND_CALLBACK_URL)
    backendCallbackUrl.searchParams.set("code", code)
    backendCallbackUrl.searchParams.set("state", state)

    const backendResponse = await fetch(backendCallbackUrl.toString(), {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    })

    // Extract cookies from backend response
    const setCookieHeader = backendResponse.headers.get("set-cookie")

    // If backend redirects, keep cookie but always continue to frontend /home.
    if (backendResponse.status === 302 || backendResponse.status === 301) {
      const response = NextResponse.redirect(new URL("/home", request.nextUrl.origin), {
        status: backendResponse.status,
      })

      // Forward the set-cookie header
      if (setCookieHeader) {
        response.headers.set("set-cookie", setCookieHeader)
      }

      return response
    }

    if (!backendResponse.ok) {
      return NextResponse.redirect("/login?error=backend_error")
    }

    return backendResponse
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect("/login?error=backend_unavailable")
  }
}
