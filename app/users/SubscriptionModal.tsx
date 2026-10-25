"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Crown, Infinity as InfinityIcon, Loader2, X } from "lucide-react"
import { api, User, UserSubscription } from "@/lib/api"

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"

interface SubscriptionModalProps {
  user: User
  onClose: () => void
  onSuccess: () => void
}

function toDateInputValue(iso: string | null | undefined) {
  if (!iso) return ""
  return new Date(iso).toISOString().split("T")[0]
}

export function SubscriptionModal({ user, onClose, onSuccess }: SubscriptionModalProps) {
  const [sub, setSub] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [endDate, setEndDate] = useState("")
  const [isLifetime, setIsLifetime] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.subscriptions.getForUser(user.id)
      .then((result) => {
        if (cancelled) return
        setSub(result)
        setIsLifetime(!!result && result.end_date === null)
        setEndDate(toDateInputValue(result?.end_date))
      })
      .catch((e: any) => !cancelled && setLoadError(e.message || "Failed to load subscription"))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [user.id])

  // Quick +/- buttons work off whatever date is currently in the field (or
  // today, if the plan is set to lifetime / has no date yet) rather than
  // the original end_date, so repeated clicks stack as expected.
  function adjustDays(days: number) {
    const base = endDate ? new Date(endDate) : new Date()
    base.setDate(base.getDate() + days)
    setEndDate(base.toISOString().split("T")[0])
    setIsLifetime(false)
  }

  async function handleSave() {
    if (!isLifetime && !endDate) return setError("Pick a new expiry date, or mark it Lifetime")
    setSaving(true); setError(""); setSaved(false)
    try {
      const newEndDate = isLifetime ? null : new Date(`${endDate}T23:59:59`).toISOString()
      const updated = await api.subscriptions.setExpiry(user.id, newEndDate)
      setSub(updated)
      setSaved(true)
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to update subscription")
    } finally {
      setSaving(false)
    }
  }

  const expired = sub?.end_date ? new Date(sub.end_date) < new Date() : false

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-sm border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Crown className="h-4 w-4 text-primary" /> Subscription — {user.first_name} {user.last_name}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive rounded-sm bg-destructive-subtle p-2">{loadError}</p>
          ) : !sub ? (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
              This user is marked Pro, but has no subscription record on file — nothing here to adjust.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Plan</p>
                  <p className="font-bold">{sub.plan}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Granted via</p>
                  <p className="font-bold capitalize">{(sub.grant_reason ?? "payment").replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Started</p>
                  <p className="font-bold">{new Date(sub.start_date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Current expiry</p>
                  <p className={`font-bold ${expired ? "text-destructive" : ""}`}>
                    {sub.end_date
                      ? new Date(sub.end_date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
                      : "Lifetime"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adjust expiry</p>

                <label className="flex items-center justify-between rounded-md border p-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <InfinityIcon className="h-4 w-4 text-muted-foreground" /> Lifetime (never expires)
                  </span>
                  <input
                    type="checkbox"
                    checked={isLifetime}
                    onChange={(e) => setIsLifetime(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                {!isLifetime && (
                  <>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                    <div className="flex gap-2">
                      {[-30, -7, 7, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => adjustDays(d)}
                          className="flex-1 rounded-md border px-2 py-1.5 text-xs font-bold hover:bg-accent transition-colors"
                        >
                          {d > 0 ? `+${d}d` : `${d}d`}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {error && (
                  <p className="flex items-center gap-2 text-sm text-destructive rounded-sm bg-destructive-subtle p-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
                  </p>
                )}
                {saved && !error && (
                  <p className="text-sm text-success rounded-sm bg-success-subtle p-2">Subscription updated.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t p-4">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">
            Close
          </button>
          {sub && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
