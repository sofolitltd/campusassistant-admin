"use client"

import { useEffect, useState } from "react"
import { BarChart3 } from "lucide-react"
import { api, SellerStats } from "@/lib/api"

const taka = (n: number) => `৳${n.toLocaleString("en-US")}`

/** Last-30-days performance of one seller, the same numbers they see in the app. */
export function SellerStatsCard({ merchantId }: { merchantId: string }) {
  const [s, setS] = useState<SellerStats | null>(null)
  useEffect(() => { api.merchants.stats(merchantId).then(setS).catch(() => {}) }, [merchantId])
  if (!s) return null

  const cells = [
    { label: "Orders", value: String(s.orders) },
    { label: "Net revenue", value: taka(s.net_revenue) },
    { label: "Avg order", value: taka(s.avg_order_value) },
    { label: "Rating", value: s.rating_count ? `${s.rating_avg.toFixed(1)} ★ (${s.rating_count})` : "—" },
    { label: "Ships in", value: s.shipped_count ? `${Math.round(s.avg_ship_hours)} hr` : "—" },
    { label: "Product views", value: String(s.views) },
  ]
  return (
    <div className="rounded-lg border bg-card shadow-xs p-6 space-y-4">
      <h3 className="text-sm font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /> Last 30 days</h3>
      <div className="grid grid-cols-2 gap-3">
        {cells.map(c => (
          <div key={c.label} className="rounded-sm border border-dashed border-border/60 bg-muted/20 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">{c.label}</p>
            <p className="text-sm font-black tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>
      {s.low_stock_products > 0 && <p className="text-xs font-medium text-warning">{s.low_stock_products} product(s) almost out of stock.</p>}
      {s.top_products.length > 0 && (
        <ul className="space-y-1 text-xs">
          {s.top_products.map(p => (
            <li key={p.product_id} className="flex justify-between gap-3"><span className="truncate">{p.title}</span><span className="font-bold tabular-nums">{taka(p.revenue)}</span></li>
          ))}
        </ul>
      )}
    </div>
  )
}
