"use client"

import { useState } from "react"
import { RefreshCcw, Search, KeyRound, CircleCheck, CircleAlert, Mail } from "lucide-react"

import { api, type PasswordResetView } from "@/lib/api"
import { cn } from "@/lib/utils"
import { IssueResetCodeModal, type ResetCodeTarget } from "@/components/IssueResetCodeModal"

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"

const STATUS_STYLES: Record<PasswordResetView["status"], string> = {
  pending: "bg-info-subtle text-info",
  verified: "bg-info-subtle text-info",
  used: "bg-success-subtle text-success",
  superseded: "bg-muted text-muted-foreground",
  expired: "bg-warning-subtle text-warning",
  exhausted: "bg-destructive-subtle text-destructive",
}

const STATUS_LABELS: Record<PasswordResetView["status"], string> = {
  pending: "Pending",
  verified: "Code verified",
  used: "Used",
  superseded: "Superseded",
  expired: "Expired",
  exhausted: "Exhausted",
}

function StatusBadge({ status }: { status: PasswordResetView["status"] }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function DeliveryBadge({ reset }: { reset: PasswordResetView }) {
  if (reset.email_status === "failed") {
    return (
      <span
        title={reset.email_error || "SMTP error"}
        className="inline-flex cursor-help items-center gap-1 rounded-full bg-destructive-subtle px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-destructive"
      >
        <CircleAlert className="h-2.5 w-2.5" /> Email failed
      </span>
    )
  }
  if (reset.email_status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-success">
        <CircleCheck className="h-2.5 w-2.5" /> Email sent
      </span>
    )
  }
  // No correlated send log (e.g. admin-issued code, or older than the log).
  return (
    <span title="No matching code-email log — this code was likely issued from the admin panel" className="inline-flex cursor-help items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
      <Mail className="h-2.5 w-2.5" /> No email
    </span>
  )
}

interface PasswordResetsClientProps {
  initialResets: PasswordResetView[]
  initialTotal: number
  pageSize: number
}

export default function PasswordResetsClient({ initialResets, initialTotal, pageSize }: PasswordResetsClientProps) {
  const [resets, setResets] = useState(initialResets)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [email, setEmail] = useState("")
  const [accountType, setAccountType] = useState<"user" | "admin" | "">("")
  const [status, setStatus] = useState<PasswordResetView["status"] | "">("")
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [modalTarget, setModalTarget] = useState<ResetCodeTarget | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function refresh(opts?: { email?: string; accountType?: "user" | "admin" | ""; status?: PasswordResetView["status"] | ""; page?: number }) {
    const next = { email, accountType, status, page, ...opts }
    setLoading(true)
    setLoadError("")
    try {
      const params = new URLSearchParams()
      params.set("page", String(next.page))
      if (next.email.trim()) params.set("email", next.email.trim())
      if (next.accountType) params.set("account_type", next.accountType)
      if (next.status) params.set("status", next.status)
      const res = await api.passwordResets.getAll(params.toString())
      setResets(res.resets || [])
      setTotal(res.total)
      setPage(next.page)
    } catch (err: any) {
      // Keep showing the last good data; surface why the refresh failed.
      setLoadError(err.message || "Failed to load password resets")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Password Resets</h1>
          <p className="text-sm text-muted-foreground">
            Every “forgot password” request (7-day history), with email delivery status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={() => setModalTarget({})}
            className="flex items-center gap-2 rounded-md bg-primary-gradient px-3 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <KeyRound className="h-4 w-4" />
            Issue Fresh Code
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refresh({ page: 1, email })}
            onBlur={() => email !== "" && refresh({ page: 1 })}
            placeholder="Filter by email..."
            className={cn(inputCls, "pl-9")}
          />
        </div>
        <select
          value={accountType}
          onChange={(e) => refresh({ page: 1, accountType: e.target.value as "user" | "admin" | "" })}
          className={inputCls + " w-auto"}
        >
          <option value="">All accounts</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={status}
          onChange={(e) => refresh({ page: 1, status: e.target.value as PasswordResetView["status"] | "" })}
          className={inputCls + " w-auto"}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Code verified</option>
          <option value="used">Used</option>
          <option value="superseded">Superseded</option>
          <option value="expired">Expired</option>
          <option value="exhausted">Exhausted</option>
        </select>
        <span className="text-sm text-muted-foreground">{total} requests</span>
      </div>

      {loadError && <p className="rounded-sm bg-destructive-subtle p-2 text-sm text-destructive">{loadError}</p>}

      {resets.length === 0 && !loadError ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border bg-card p-12 text-center">
          <Search className="h-8 w-8 opacity-20" />
          <p className="text-sm text-muted-foreground">No reset requests match this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">Attempts</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 hidden lg:table-cell">Requested</th>
                <th className="px-4 py-3 hidden xl:table-cell">Expires</th>
                <th className="px-4 py-3 hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {resets.map((reset) => (
                <tr key={reset.id} className="hover:bg-muted/30">
                  <td className="max-w-[220px] truncate px-4 py-2.5 font-medium">{reset.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="capitalize text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {reset.account_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={reset.status} /></td>
                  <td className="hidden px-4 py-2.5 text-xs text-muted-foreground md:table-cell">{reset.attempts}/5</td>
                  <td className="px-4 py-2.5"><DeliveryBadge reset={reset} /></td>
                  <td className="hidden whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground lg:table-cell">
                    {new Date(reset.created_at).toLocaleString()}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground xl:table-cell">
                    {new Date(reset.expires_at).toLocaleString()}
                  </td>
                  <td className="hidden px-4 py-2.5 font-mono text-xs text-muted-foreground lg:table-cell">{reset.request_ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong></span>
        <div className="flex gap-2">
          <button
            onClick={() => refresh({ page: page - 1 })}
            disabled={page <= 1 || loading}
            className="rounded border px-3 py-1.5 font-bold transition-all hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
          >
            PREVIOUS
          </button>
          <button
            onClick={() => refresh({ page: page + 1 })}
            disabled={page >= totalPages || loading}
            className="rounded border px-3 py-1.5 font-bold transition-all hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
          >
            NEXT
          </button>
        </div>
      </div>

      <IssueResetCodeModal
        open={modalTarget !== null}
        target={modalTarget}
        onClose={() => setModalTarget(null)}
        onSuccess={() => refresh()}
      />
    </div>
  )
}
