import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import {
  accessCookieOptions,
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  ADMIN_USER_COOKIE,
  tokenMaxAge,
} from "@/lib/admin-session"

// Session cookies. The login form posts the tokens here rather than holding
// them in localStorage, so the access token lands in an httpOnly cookie that
// page scripts can't read and that Server Components can.
//
// admin_user is deliberately *not* httpOnly: it holds no secret, only the
// display identity, and the client needs it to render the shell and to know
// whether a session exists at all.

const DEFAULT_MAX_AGE = 60 * 60 * 24 // 24h, only used if the API omits expires_in
const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 7

export async function POST(request: NextRequest) {
  let body: { access_token?: string; refresh_token?: string; admin?: unknown; expires_in?: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.access_token || !body.refresh_token) {
    return Response.json({ error: "access_token and refresh_token are required" }, { status: 400 })
  }

  const store = await cookies()
  const accessMaxAge = body.expires_in && body.expires_in > 0 ? body.expires_in : DEFAULT_MAX_AGE
  const refreshMaxAge = tokenMaxAge(body.refresh_token, DEFAULT_REFRESH_MAX_AGE)

  store.set(ADMIN_ACCESS_COOKIE, body.access_token, accessCookieOptions(accessMaxAge))
  store.set(ADMIN_REFRESH_COOKIE, body.refresh_token, accessCookieOptions(refreshMaxAge))
  store.set(ADMIN_USER_COOKIE, JSON.stringify(body.admin ?? null), {
    ...accessCookieOptions(refreshMaxAge),
    httpOnly: false,
  })

  return Response.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete(ADMIN_ACCESS_COOKIE)
  store.delete(ADMIN_REFRESH_COOKIE)
  store.delete(ADMIN_USER_COOKIE)
  return Response.json({ ok: true })
}
