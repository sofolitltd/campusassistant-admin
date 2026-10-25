"use client"

// Make a user Pro without payment — hits POST /subscriptions/admin-grant
// (price forced to 0, grant_reason "admin_grant" server-side). Used from both
// the Users section and the department StudentsTab, so it takes a minimal
// { id, name, email } shape instead of the full User model.
import { useEffect, useState } from "react"
import { Crown, Loader2, X } from "lucide-react"
import { api, SubscriptionPlan, UserSubscription } from "@/lib/api"

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"

export interface GrantProTarget {
  id: string
  name: string
  email?: string | null
}

interface GrantProModalProps {
  open: boolean
  target: GrantProTarget | null
  onClose: () => void
  onSuccess: () => void
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "Lifetime"
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

export function GrantProModal({ open, target, onClose, onSuccess }: GrantProModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [current, setCurrent] = useState<UserSubscription | null>(null)
  const [planId, setPlanId] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [granting, setGranting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !target) return
    let cancelled = false
    setPlans([]); setCurrent(null); setPlanId(""); setNote(""); setError(""); setLoading(true)
    Promise.all([
      api.subscriptions.getPlans(),
      api.subscriptions.getForUser(target.id).catch(() => null),
    ])
      .then(([p, sub]) => {
        if (cancelled) return
        setPlans(p)
        setCurrent(sub)
        if (p[0]) setPlanId(p[0].id)
      })
      .catch(() => !cancelled && setError("Failed to load subscription plans"))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [open, target])

  if (!open || !target) return null

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault()
    if (!target || !planId) return setError("Pick a Pro plan first")
    setGranting(true); setError("")
    try {
      await api.subscriptions.adminGrant({ user_id: target.id, plan_id: planId, note: note.trim() || undefined })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to grant Pro — try again")
    } finally {
      setGranting(false)
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
            <Crown className="h-4 w-4 text-primary" /> Make User Pro — {target.name}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleGrant} className="space-y-4 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Current status</p>
                <p className="mt-0.5 font-bold">
                  {current
                    ? `${current.plan} — expires ${fmtDate(current.end_date)}${current.grant_reason ? ` (${current.grant_reason.replace("_", " ")})` : ""}`
                    : "Basic — no subscription on file"}
                </p>
                {target.email && (
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{target.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plan</label>
                <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputCls}>
                  {plans.length === 0 && <option value="">No plans available</option>}
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.is_lifetime ? "Lifetime" : `${p.duration_days} days`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Moderator access, CR reward…"
                  className={inputCls + " resize-none"}
                />
              </div>

              {error && <p className="rounded-sm bg-destructive-subtle p-2 text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting || loading || !planId}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  Grant Pro
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
