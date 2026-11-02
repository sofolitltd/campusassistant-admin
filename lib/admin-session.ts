export const ADMIN_ACCESS_COOKIE = "admin_token"
export const ADMIN_REFRESH_COOKIE = "admin_refresh"
export const ADMIN_USER_COOKIE = "admin_user"

const REFRESH_SKEW_SECONDS = 60

function tokenExpiry(token: string): number | null {
  const payload = token.split(".")[1]
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as Record<string, unknown>
    return typeof decoded.exp === "number" ? decoded.exp : null
  } catch {
    return null
  }
}

export function tokenMaxAge(token: string, fallbackSeconds: number): number {
  const expiresAt = tokenExpiry(token)
  return expiresAt === null
    ? fallbackSeconds
    : Math.max(1, Math.floor(expiresAt - Date.now() / 1000))
}

export function isAccessTokenExpired(token?: string): boolean {
  if (!token) return true
  const expiresAt = tokenExpiry(token)
  return expiresAt === null || expiresAt <= Date.now() / 1000
}

export function shouldRefreshAccessToken(token?: string): boolean {
  if (!token) return true
  const expiresAt = tokenExpiry(token)
  return expiresAt === null || expiresAt <= Date.now() / 1000 + REFRESH_SKEW_SECONDS
}

export function accessCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

export async function refreshAdminAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) throw new Error("Missing required env var: API_URL")

  const headers = new Headers({ "Content-Type": "application/json" })
  if (process.env.API_KEY) headers.set("X-API-Key", process.env.API_KEY)

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/refresh`, {
    method: "POST",
    headers,
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  })

  if (response.status === 401) return null
  if (!response.ok) throw new Error(`Session refresh failed: ${response.status}`)

  const payload: unknown = await response.json()
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Session refresh returned an invalid response")
  }

  const data = payload as Record<string, unknown>
  if (typeof data.access_token !== "string" || !data.access_token || typeof data.expires_in !== "number" || data.expires_in <= 0) {
    throw new Error("Session refresh returned an invalid access token")
  }

  return { access_token: data.access_token, expires_in: data.expires_in }
}
