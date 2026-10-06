import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Request-time auth gate. This is the real guard — the checks in app-shell.tsx
// are cosmetic, since a client component can't be trusted to hold one.
//
// Named proxy.ts, not middleware.ts: the middleware file convention is
// deprecated in this version of Next and renamed to proxy
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).

// Routes reachable without a session. Anything not listed here bounces a
// logged-out visitor to /login, so new auth screens must be added.
const AUTH_PAGES = ["/login", "/forgot-password"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = !!request.cookies.get("admin_token")?.value
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  )

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}

export const config = {
  // Page requests only. /api is excluded so the login form can reach
  // /api/session while it still has no cookie; the proxy route under
  // /api/backend does its own cookie check.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
}
