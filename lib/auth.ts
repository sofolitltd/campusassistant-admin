// Client-side view of the admin session.
//
// The access token itself is NOT here: it lives in an httpOnly cookie set by
// app/api/session, so nothing on the page can read it (and so Server
// Components can). What the client keeps is the display identity, in a plain
// readable cookie — it holds no secret, and the shell needs it to decide what
// to render.
//
// The real auth gate is proxy.ts, which checks the httpOnly cookie on every
// request. Anything in this file is UX only.

const ADMIN_COOKIE = "admin_user"

export interface AdminInfo {
  id: string
  email: string
  name: string
  role: string
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getAdmin(): AdminInfo | null {
  const raw = readCookie(ADMIN_COOKIE)
  if (!raw || raw === "null") return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getAdmin()
}

/** Exchange login tokens for session cookies. */
export async function startSession(payload: {
  access_token: string
  expires_in?: number
  admin: AdminInfo
}): Promise<void> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Could not start session")
}

/** Clear the session cookies. */
export async function endSession(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" })
}
