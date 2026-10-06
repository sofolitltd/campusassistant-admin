"use client"

import { useEffect, useState } from "react"
import { Loader2, Check } from "lucide-react"
import { api, CommissionPolicy } from "@/lib/api"
import { Field, inputCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { Card, ErrorBanner, Spinner, primaryBtn } from "../billing-ui"

export function CommissionClient() {
  const [policy, setPolicy] = useState<CommissionPolicy | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.billing.commissionPolicy().then(setPolicy).catch(e => setError(String(e.message ?? e)))
  }, [])

  if (!policy) return error ? <ErrorBanner message={error} /> : <Spinner label="Loading Policy..." />

  const set = (patch: Partial<CommissionPolicy>) => { setSaved(false); setPolicy({ ...policy, ...patch }) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!policy) return
    setBusy(true); setError("")
    try { setPolicy(await api.billing.setCommissionPolicy(policy)); setSaved(true) }
    catch (err) { setError(String((err as Error).message ?? err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <ErrorBanner message={error} />
      <Card>
        <form onSubmit={save} className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">New-seller promotion</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sellers pay a reduced commission for a limited time after their application is approved, then their own commission rate applies.
              A promo only ever lowers a seller&apos;s fee, and the rate in force is recorded on each order when it is placed.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-sm border bg-muted/20 p-3">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={policy.promo_active} onChange={e => set({ promo_active: e.target.checked })} />
            <span className="text-sm font-bold">Promotion is running</span>
            <span className="text-xs text-muted-foreground">Also shown to prospective sellers in the app.</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Promo commission (%)">
              <input type="number" min={0} max={100} step="0.1" className={inputCls} value={policy.promo_rate}
                onChange={e => set({ promo_rate: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Lasts (days after approval)">
              <input type="number" min={1} max={730} className={inputCls} value={policy.promo_days}
                onChange={e => set({ promo_days: parseInt(e.target.value) || 1 })} />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="flex items-center gap-1 text-xs font-bold text-success"><Check className="h-3.5 w-3.5" /> Saved</span>}
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save policy
            </button>
          </div>
        </form>
      </Card>
      <p className="text-xs text-muted-foreground">
        Changing the policy affects orders placed from now on. Orders already placed keep the rate they were placed with.
      </p>
    </div>
  )
}
