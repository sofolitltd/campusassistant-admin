"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Loader2, Save } from "lucide-react"
import { api, PlanEntitlement, SubscriptionPlan } from "@/lib/api"
import { Card, ErrorBanner, Spinner, ghostBtn, primaryBtn } from "../billing-ui"
import { inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

const KNOWN_FEATURES = ["ad_free", "unlimited_downloads", "premium_content"]

export function EntitlementsClient() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null)
  const [planId, setPlanId] = useState("")
  const [rows, setRows] = useState<PlanEntitlement[]>([])
  const [defaults, setDefaults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.subscriptions.getPlans().then(p => { setPlans(p); if (p[0]) setPlanId(p[0].id) }).catch(e => { setError(String(e.message ?? e)); setPlans([]) })
  }, [])

  useEffect(() => {
    if (!planId) return
    setLoading(true); setSaved(false); setError("")
    api.planEntitlements.get(planId)
      .then(r => { setRows(r.entitlements ?? []); setDefaults(r.default_when_empty ?? []) })
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [planId])

  const update = (i: number, patch: Partial<PlanEntitlement>) => { setSaved(false); setRows(rs => rs.map((r, k) => k === i ? { ...r, ...patch } : r)) }

  async function save() {
    setSaving(true); setError(""); setSaved(false)
    try {
      const r = await api.planEntitlements.set(planId, rows)
      setRows(r.entitlements ?? []); setSaved(true)
    } catch (e) { setError(String((e as Error).message ?? e)) }
    finally { setSaving(false) }
  }

  if (plans === null) return <Spinner label="Loading Plans..." />
  if (plans.length === 0) return <ErrorBanner message={error || "Create a subscription plan first."} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={planId} onChange={e => setPlanId(e.target.value)} className={`${selectCls} !w-auto`}>
          {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        A plan with <b>no rows</b> gives its subscribers every default feature ({defaults.join(", ") || "ad_free, unlimited_downloads, premium_content"}), unlimited — exactly how plans
        behaved before this screen existed. Add rows only to restrict or cap a plan; then <b>only the listed features</b> are included.
      </p>
      <ErrorBanner message={error} />
      {loading ? <Spinner label="Loading Entitlements..." /> : (
        <Card className="p-4 space-y-3">
          {rows.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Default: all features, unlimited.</p>}
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <input list="known-features" className={`${inputCls} col-span-12 sm:col-span-5`} value={r.feature} placeholder="feature, e.g. unlimited_downloads"
                onChange={e => update(i, { feature: e.target.value.trim() })} />
              <select className={`${selectCls} col-span-6 sm:col-span-3`} value={r.limit === -1 ? "unlimited" : "capped"}
                onChange={e => update(i, e.target.value === "unlimited" ? { limit: -1, period: "none" } : { limit: 10, period: "daily" })}>
                <option value="unlimited">Unlimited</option>
                <option value="capped">Capped</option>
              </select>
              {r.limit !== -1 ? (
                <>
                  <input type="number" min={0} className={`${inputCls} col-span-3 sm:col-span-1`} value={r.limit} onChange={e => update(i, { limit: Math.max(0, parseInt(e.target.value) || 0) })} />
                  <select className={`${selectCls} col-span-3 sm:col-span-2`} value={r.period} onChange={e => update(i, { period: e.target.value as PlanEntitlement["period"] })}>
                    <option value="daily">per day</option>
                    <option value="month">per month</option>
                    <option value="none">lifetime</option>
                  </select>
                </>
              ) : <span className="col-span-3 sm:col-span-3" />}
              <button type="button" aria-label="Remove" className="col-span-12 sm:col-span-1 justify-self-end rounded-sm p-2 text-destructive hover:bg-destructive-subtle" onClick={() => { setSaved(false); setRows(rs => rs.filter((_, k) => k !== i)) }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <datalist id="known-features">{KNOWN_FEATURES.map(f => <option key={f} value={f} />)}</datalist>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <div className="flex gap-2">
              <button type="button" className={ghostBtn} onClick={() => { setSaved(false); setRows(rs => [...rs, { feature: "", limit: -1, period: "none" }]) }}><Plus className="h-3.5 w-3.5" /> Add feature</button>
              {rows.length > 0 && <button type="button" className={ghostBtn} onClick={() => { setSaved(false); setRows([]) }}>Reset to default</button>}
            </div>
            <div className="flex items-center gap-3">
              {saved && <span className="text-xs font-bold text-success">Saved</span>}
              <button type="button" disabled={saving} onClick={save} className={primaryBtn}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
