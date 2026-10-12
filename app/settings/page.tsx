"use client"

import { useEffect, useState } from "react"
import { KeyRound, LogOut, Mail, ShieldCheck } from "lucide-react"

import { api } from "@/lib/api"
import { getAdmin, type AdminInfo } from "@/lib/auth"
import { LogoutConfirm } from "@/components/logout-confirm"
import { cn } from "@/lib/utils"

const inputCls =
  "w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase() || "A"
}

export default function SettingsPage() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setAdmin(getAdmin())
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!admin) return
    setMessage(null)

    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." })
      return
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." })
      return
    }

    setSaving(true)
    try {
      await api.admins.changePassword(admin.id, password)
      setMessage({ type: "success", text: "Password updated." })
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update password" })
    } finally {
      setSaving(false)
    }
  }

  if (!admin) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="max-w-2xl space-y-6 lg:mx-0">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your admin account.</p>
      </div>

      <div className="rounded-sm border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xl font-bold text-primary">
            {initials(admin.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{admin.name}</p>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              {admin.email}
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {admin.role}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="rounded-sm border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <KeyRound className="h-4 w-4" />
          Change password
        </h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {message && (
          <p
            className={cn(
              "mt-3 text-sm",
              message.type === "success" ? "text-success" : "text-destructive"
            )}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-sm bg-primary-gradient px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update password"}
        </button>
      </form>

      <button
        onClick={() => setLogoutOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-sm border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
      <LogoutConfirm open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  )
}
