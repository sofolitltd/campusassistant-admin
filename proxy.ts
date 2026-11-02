import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  accessCookieOptions,
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  ADMIN_USER_COOKIE,
  isAccessTokenExpired,
  refreshAdminAccessToken,
  shouldRefreshAccessToken,
} from "@/lib/admin-session"

// Request-time auth gate. This is the real guard — the checks in app-shell.tsx
// are cosmetic, since a client component can't be trusted to hold one.
//
// Named proxy.ts, not middleware.ts: the middleware file convention is
// deprecated in this version of Next and renamed to proxy
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).

// Routes reachable without a session. Anything not listed here bounces a
// logged-out visitor to /login, so new auth screens must be added.
const AUTH_PAGES = ["/login", "/forgot-password"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let accessToken = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE)?.value
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  )

  let refreshedSession: Awaited<ReturnType<typeof refreshAdminAccessToken>> = null
  if (shouldRefreshAccessToken(accessToken) && refreshToken) {
    try {
      refreshedSession = await refreshAdminAccessToken(refreshToken)
      if (refreshedSession) {
        accessToken = refreshedSession.access_token
        request.cookies.set(ADMIN_ACCESS_COOKIE, accessToken)
      }
    } catch (error) {
      console.error("Admin session refresh failed in proxy", error)
      if (isAccessTokenExpired(accessToken)) {
        return NextResponse.json({ error: "Session refresh is temporarily unavailable" }, { status: 503 })
      }
    }
  }

  const hasSession = !!accessToken && !isAccessTokenExpired(accessToken)
  if (!hasSession && !isAuthPage) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete(ADMIN_ACCESS_COOKIE)
    response.cookies.delete(ADMIN_REFRESH_COOKIE)
    response.cookies.delete(ADMIN_USER_COOKIE)
    return response
  }

  const headers = new Headers(request.headers)
  if (refreshedSession) {
    headers.set("cookie", request.cookies.toString())
  }

  const response = hasSession && isAuthPage
    ? NextResponse.redirect(new URL("/", request.url))
    : NextResponse.next({ request: { headers } })
  if (refreshedSession) {
    response.cookies.set(ADMIN_ACCESS_COOKIE, refreshedSession.access_token, accessCookieOptions(refreshedSession.expires_in))
  } else if (!hasSession && (accessToken || refreshToken)) {
    response.cookies.delete(ADMIN_ACCESS_COOKIE)
    response.cookies.delete(ADMIN_REFRESH_COOKIE)
    response.cookies.delete(ADMIN_USER_COOKIE)
  }
  return response
}

export const config = {
  // Page requests only. /api is excluded so the login form can reach
  // /api/session while it still has no cookie; the proxy route under
  // /api/backend does its own cookie check.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
}
