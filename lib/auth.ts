const TOKEN_KEY = "admin_token"
const ADMIN_KEY = "admin_user"

export interface AdminInfo {
  id: string
  email: string
  name: string
  role: string
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function setAdmin(admin: AdminInfo): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function getAdmin(): AdminInfo | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(ADMIN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
