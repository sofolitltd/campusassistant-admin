import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

// Session cookies. The login form posts the tokens here rather than holding
// them in localStorage, so the access token lands in an httpOnly cookie that
// page scripts can't read and that Server Components can.
//
// admin_user is deliberately *not* httpOnly: it holds no secret, only the
// display identity, and the client needs it to render the shell and to know
// whether a session exists at all.

const TOKEN_COOKIE = "admin_token"
const ADMIN_COOKIE = "admin_user"

const DEFAULT_MAX_AGE = 60 * 60 * 24 // 24h, only used if the API omits expires_in

export async function POST(request: NextRequest) {
  let body: { access_token?: string; admin?: unknown; expires_in?: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.access_token) {
    return Response.json({ error: "access_token is required" }, { status: 400 })
  }

  const store = await cookies()
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: body.expires_in && body.expires_in > 0 ? body.expires_in : DEFAULT_MAX_AGE,
  }

  store.set(TOKEN_COOKIE, body.access_token, options)
  store.set(ADMIN_COOKIE, JSON.stringify(body.admin ?? null), {
    ...options,
    httpOnly: false,
  })

  return Response.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete(TOKEN_COOKIE)
  store.delete(ADMIN_COOKIE)
  return Response.json({ ok: true })
}
