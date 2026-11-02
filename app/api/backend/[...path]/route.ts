import { cookies } from "next/headers"
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

// Same-origin proxy to the Go backend.
//
// Client components must never hold the API key or the access token: both
// used to be shipped to the browser (NEXT_PUBLIC_API_KEY in the bundle, the
// JWT in localStorage). Instead they call /api/backend/* on this origin, and
// this handler attaches the credentials server-side:
//
//   - X-API-Key comes from API_KEY, which is *not* NEXT_PUBLIC_* and so never
//     reaches the browser.
//   - Authorization comes from the admin_token cookie, which is httpOnly and
//     so is unreadable by any script on the page.
//
// Server Components skip this hop entirely — they call the backend directly
// (see getApiUrl in lib/api.ts).

function backendUrl(): string {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("Missing required env var: API_URL")
  return url.replace(/\/$/, "")
}

// Headers worth passing through. Everything else (cookie, host, origin, the
// browser's own auth headers) is deliberately dropped so a client can't talk
// past the proxy by setting its own X-API-Key or Authorization.
const FORWARDED_REQUEST_HEADERS = ["content-type", "accept", "accept-language"]
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition", "cache-control"]

async function forward(request: NextRequest, path: string[]) {
  const store = await cookies()
  let token = store.get(ADMIN_ACCESS_COOKIE)?.value
  const refreshToken = store.get(ADMIN_REFRESH_COOKIE)?.value
  let refreshAttempted = false

  async function refreshSession(refreshToken: string) {
    refreshAttempted = true
    try {
      const session = await refreshAdminAccessToken(refreshToken)
      if (session) {
        token = session.access_token
        store.set(ADMIN_ACCESS_COOKIE, token, accessCookieOptions(session.expires_in))
      }
      return session
    } catch (error) {
      console.error("Admin session refresh failed in API proxy", error)
      throw error
    }
  }

  if (shouldRefreshAccessToken(token) && refreshToken) {
    try {
      const session = await refreshSession(refreshToken)
      if (!session && isAccessTokenExpired(token)) {
        store.delete(ADMIN_ACCESS_COOKIE)
        store.delete(ADMIN_REFRESH_COOKIE)
        store.delete(ADMIN_USER_COOKIE)
        return Response.json({ error: "Session expired; sign in again" }, { status: 401 })
      }
    } catch {
      if (isAccessTokenExpired(token)) {
        return Response.json({ error: "Session refresh is temporarily unavailable" }, { status: 502 })
      }
    }
  }

  const target = `${backendUrl()}/${path.join("/")}${request.nextUrl.search}`

  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  if (process.env.API_KEY) headers.set("X-API-Key", process.env.API_KEY)

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const retryRequest = hasBody && refreshToken ? request.clone() : request

  async function send(source: Request, bearerToken: string | undefined) {
    const requestHeaders = new Headers(headers)
    if (bearerToken) requestHeaders.set("Authorization", `Bearer ${bearerToken}`)
    else requestHeaders.delete("Authorization")

    return fetch(target, {
      method: request.method,
      headers: requestHeaders,
      body: hasBody ? source.body : undefined,
      // Required by undici when streaming a request body through rather than
      // buffering it — this is what lets multipart uploads pass through.
      ...(hasBody ? { duplex: "half" as const } : {}),
      redirect: "manual",
      cache: "no-store",
    } as RequestInit)
  }

  let response: Response
  try {
    response = await send(request, token)
  } catch {
    return Response.json({ error: "Upstream API unreachable" }, { status: 502 })
  }

  if (response.status === 401 && refreshToken && !refreshAttempted) {
    try {
      const session = await refreshSession(refreshToken)
      if (session) {
        try {
          response = await send(retryRequest, session.access_token)
        } catch {
          return Response.json({ error: "Upstream API unreachable" }, { status: 502 })
        }
      }
    } catch {
      return Response.json({ error: "Session refresh is temporarily unavailable" }, { status: 502 })
    }
  }

  if (response.status === 401) {
    store.delete(ADMIN_ACCESS_COOKIE)
    store.delete(ADMIN_REFRESH_COOKIE)
    store.delete(ADMIN_USER_COOKIE)
  }

  const responseHeaders = new Headers()
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

type Context = { params: Promise<{ path: string[] }> }

async function handler(request: NextRequest, context: Context) {
  const { path } = await context.params
  return forward(request, path)
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
