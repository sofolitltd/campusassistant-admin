"use client"

// Mint a fresh forgot-password code for an account whose reset email never
// landed — hits POST /admin/password-resets/issue. Shared by the Password
// Resets page (type-in any address) and the Users page action menu (email
// prefilled from the row). The returned code is displayed exactly once, so
// the issued view gives it Copy + countdown treatment instead of a plain toast.
import { useEffect, useState } from "react"
import { Copy, KeyRound, Loader2, X, Check, AlertTriangle } from "lucide-react"
import { api, type IssuedResetCode } from "@/lib/api"

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"

export interface ResetCodeTarget {
  // Email to issue for. Prefilled = locked when given (Users-page action);
  // empty = free-text input (Password Resets page).
  email?: string
  accountType?: "user" | "admin"
}

interface IssueResetCodeModalProps {
  open: boolean
  target: ResetCodeTarget | null
  onClose: () => void
  // Fired after a successful issue (not on bare close) so callers can
  // refresh whatever list is showing the reset history.
  onSuccess?: () => void
}

export function IssueResetCodeModal({ open, target, onClose, onSuccess }: IssueResetCodeModalProps) {
  const [email, setEmail] = useState("")
  const [accountType, setAccountType] = useState<"user" | "admin">("user")
  const [issuing, setIssuing] = useState(false)
  const [issued, setIssued] = useState<IssuedResetCode | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  // Reset per open so a second issue in the same session starts clean.
  useEffect(() => {
    if (!open) return
    setEmail(target?.email || "")
    setAccountType(target?.accountType || "user")
    setIssuing(false)
    setIssued(null)
    setCopied(false)
    setError("")
  }, [open, target])

  if (!open) return null
  const lockedEmail = !!target?.email

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault()
    const addr = email.trim().toLowerCase()
    if (!addr) return setError("Enter the account email first")
    setIssuing(true)
    setError("")
    try {
      const code = await api.passwordResets.issueCode(addr, accountType)
      setIssued(code)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Failed to issue a code — try again")
    } finally {
      setIssuing(false)
    }
  }

  async function handleCopy() {
    if (!issued) return
    try {
      await navigator.clipboard.writeText(issued.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (http, permissions) — the code stays on screen to
      // read manually, so a silent failure is fine.
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-sm border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <KeyRound className="h-4 w-4 text-primary" />
            {issued ? "Reset Code" : "Issue Fresh Reset Code"}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {issued ? (
          // ── Issued view: the one chance to read the code ─────────────
          <div className="space-y-4 p-6">
            <div className="rounded-md bg-destructive-subtle p-3">
              <p className="flex items-center gap-2 text-xs font-bold text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Shown once — neither stored nor emailable later. Copy it now and read it to the user.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Valid <strong className="text-foreground">{issued.minutes} minutes</strong> for{" "}
              <strong className="text-foreground">{issued.email}</strong> ({issued.account_type}).
              Issuing another code invalidates this one.
            </p>
            <div className="flex items-center justify-center gap-3 rounded-md border bg-muted/30 p-4">
              <span className="font-mono text-3xl font-black tracking-[0.35em] text-foreground">
                {issued.code}
              </span>
              <button
                onClick={handleCopy}
                title="Copy code"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-accent transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              Expires {new Date(issued.expires_at).toLocaleTimeString()} — user continues in the app via
              “verify code → set new password”.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-md bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          // ── Form view ────────────────────────────────────────────────
          <form onSubmit={handleIssue} className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Mints the code server-side and shows it here instead of emailing — for users who
              never received it.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={lockedEmail}
                placeholder="user@example.com"
                autoFocus={!lockedEmail}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as "user" | "admin")}
                disabled={lockedEmail}
                className={inputCls}
              >
                <option value="user">User (app account)</option>
                <option value="admin">Admin (dashboard account)</option>
              </select>
            </div>
            {error && <p className="rounded-sm bg-destructive-subtle p-2 text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={issuing}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
              >
                {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Get Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
