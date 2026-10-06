"use client"

import { useEffect, useState } from "react"
import { api, BillingSummary, MarketplaceMetrics } from "@/lib/api"
import { Card, ErrorBanner, Spinner, taka } from "./billing-ui"

function Stat({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: "success" | "warning" }) {
  return (
    <Card className="p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-black tabular-nums ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""}`}>{taka(value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  )
}

const pct = (n: number) => `${n.toFixed(n % 1 === 0 ? 0 : 1)}%`

export function OverviewClient() {
  const [s, setS] = useState<BillingSummary | null>(null)
  const [m, setM] = useState<MarketplaceMetrics | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api.billing.summary().then(setS).catch(e => setError(String(e.message ?? e)))
    api.billing.marketplaceMetrics().then(setM).catch(() => {})
  }, [])

  if (error) return <ErrorBanner message={error} />
  if (!s) return <Spinner label="Loading Billing..." />

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Revenue (since the ledger started)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total revenue" value={s.total_revenue} hint="Subscriptions + commission + own sales" tone="success" />
          <Stat label="Subscriptions" value={s.subscription_revenue} hint="Pro plans, net of refunds" />
          <Stat label="Commission" value={s.commission_revenue} hint="From delivered marketplace orders" />
          <Stat label="Platform sales" value={s.platform_sales} hint="Campus Assistant's own products" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">What we owe</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Merchant balances" value={s.merchant_payable} hint="Earned by merchants, not yet requested" tone="warning" />
          <Stat label="Payouts to send" value={s.payouts_pending} hint="Requested, awaiting your transfer" tone="warning" />
          <Stat label="Held for orders" value={s.orders_escrow} hint="Paid orders not yet delivered" />
          <Stat label="Paid out" value={s.paid_out} hint="Transferred to merchants, all time" />
        </div>
      </section>

      {m && (
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Marketplace health (last 30 days)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Active sellers" value={String(m.active_sellers)} hint={`${m.sellers_with_sales_30d} made a sale · ${m.listed_products} products listed`} />
            <Metric label="Buyers" value={String(m.buyers_30d)} hint={`${pct(m.repeat_buyer_rate)} of all buyers have ordered more than once`} />
            <Metric label="Orders" value={String(m.orders_30d)} hint={`${taka(m.gmv_30d)} in sales`} />
            <Metric label="Delivered smoothly" value={m.delivered_30d + m.cancelled_30d === 0 ? "—" : pct(m.smooth_delivery_rate)} hint={`${m.delivered_30d} delivered · ${m.cancelled_30d} cancelled · ${m.refunded_30d} refunded`} />
          </div>
          <p className="text-xs text-muted-foreground">
            {m.review_count} review{m.review_count === 1 ? "" : "s"}{m.review_count > 0 ? ` averaging ${m.avg_rating.toFixed(1)} ★` : ""}.
          </p>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Received through bKash: <span className="font-bold tabular-nums text-foreground">{taka(s.gateway_held)}</span>. Figures come from the ledger and
        only include payments completed after it went live; older orders are added when they are delivered.
      </p>
    </div>
  )
}
