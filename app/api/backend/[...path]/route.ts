import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

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
  const token = store.get("admin_token")?.value

  const target = `${backendUrl()}/${path.join("/")}${request.nextUrl.search}`

  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  if (process.env.API_KEY) headers.set("X-API-Key", process.env.API_KEY)
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const hasBody = request.method !== "GET" && request.method !== "HEAD"

  let response: Response
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Required by undici when streaming a request body through rather than
      // buffering it — this is what lets multipart uploads pass through.
      duplex: "half",
      redirect: "manual",
      cache: "no-store",
    } as RequestInit)
  } catch {
    return Response.json({ error: "Upstream API unreachable" }, { status: 502 })
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
