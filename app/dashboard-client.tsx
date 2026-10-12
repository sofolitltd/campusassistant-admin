"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Users, 
  Image as ImageIcon, 
  CreditCard, 
  TrendingUp,
  Loader2,
} from "lucide-react"
import { api, DashboardStats, UserGrowth, UserGrowthRange } from "@/lib/api"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
  stats: DashboardStats
}

const GROWTH_RANGES: { value: UserGrowthRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "lifetime", label: "Lifetime" },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Bucket keys are already in Bangladesh time, so parse the parts by hand
// instead of via Date (which would shift them into the viewer's zone).
function bucketLabel(key: string, granularity: UserGrowth["granularity"], range: UserGrowthRange, full = false): string {
  const [datePart, hourPart] = key.split("T")
  const [y, m, d] = datePart.split("-").map(Number)
  switch (granularity) {
    case "hour": {
      const h = Number(hourPart)
      const label = `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`
      return full ? `${label} – ${(h + 1) % 12 || 12} ${h + 1 < 12 || h + 1 === 24 ? "AM" : "PM"}` : label
    }
    case "day": {
      const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
      if (full) return `${weekday}, ${d} ${MONTHS[m - 1]}`
      return range === "7d" ? weekday : `${d} ${MONTHS[m - 1]}`
    }
    case "month":
      return full || range === "lifetime" ? `${MONTHS[m - 1]} ${String(y).slice(2)}` : MONTHS[m - 1]
    default:
      return String(y)
  }
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const statCards = [
    { 
      title: "Total Users", 
      value: (stats.total_users || 0).toLocaleString(), 
      icon: Users, 
      color: "text-info", 
      bg: "bg-info-subtle" 
    },
    { 
      title: "Active Banners", 
      value: (stats.active_banners || 0).toString(), 
      icon: ImageIcon, 
      color: "text-info", 
      bg: "bg-info-subtle" 
    },
    { 
      title: "Subscriptions", 
      value: (stats.total_subscriptions || 0).toLocaleString(), 
      icon: CreditCard, 
      color: "text-success", 
      bg: "bg-success-subtle" 
    },
    { 
      title: "Revenue", 
      value: `${(stats.total_revenue || 0).toLocaleString()} TK`, 
      icon: TrendingUp, 
      color: "text-warning", 
      bg: "bg-warning-subtle" 
    },
  ]

  const initialPoints = stats.user_growth ?? []
  const [range, setRange] = useState<UserGrowthRange>("7d")
  const [growthData, setGrowthData] = useState<UserGrowth>({
    range: "7d",
    granularity: "day",
    total: initialPoints.reduce((sum, d) => sum + d.count, 0),
    points: initialPoints,
  })
  const [growthLoading, setGrowthLoading] = useState(false)
  const [growthError, setGrowthError] = useState("")

  async function changeRange(next: UserGrowthRange) {
    setRange(next)
    setGrowthLoading(true)
    setGrowthError("")
    try {
      setGrowthData(await api.stats.getUserGrowth(next))
    } catch (e) {
      setGrowthError(e instanceof Error ? e.message : "Failed to load user growth")
    } finally {
      setGrowthLoading(false)
    }
  }

  const growth = growthData.points
  const maxVal = growth.reduce((m, d) => Math.max(m, d.count), 0) || 1
  // Long series (today's 24 hours, 30 days, long lifetimes) would crowd the
  // axis, so only every Nth label is shown; the tooltip always has the full one.
  const labelEvery = Math.max(1, Math.ceil(growth.length / 8))
  const subs = stats.recent_subscriptions ?? []

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back to the Campus Assistant administrative portal.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">{stat.title}</p>
              <h2 className="text-3xl font-black mt-1 tracking-tight">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold">User Growth</h3>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">+{growthData.total.toLocaleString()}</strong> new user{growthData.total !== 1 ? "s" : ""}{" "}
                {range === "today" ? "today" : range === "lifetime" ? "all time" : `in the ${GROWTH_RANGES.find((r) => r.value === range)?.label.toLowerCase()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {growthLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <select
                value={range}
                onChange={(e) => changeRange(e.target.value as UserGrowthRange)}
                className="rounded-md border bg-background px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
              >
                {GROWTH_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          {growthError && <p className="mt-3 rounded-sm bg-destructive-subtle p-2 text-xs text-destructive">{growthError}</p>}
          <div className={cn("mt-8 flex h-64 items-end justify-between", growth.length > 31 ? "gap-px" : growth.length > 12 ? "gap-1" : "gap-2", growthLoading && "opacity-50")}>
            {growth.length > 0 ? growth.map((d, i) => (
              <div key={d.date} className="group relative flex h-full flex-1 items-end">
                <div 
                  className="w-full rounded-t-lg bg-primary/10 transition-all group-hover:bg-primary group-hover:opacity-100 opacity-60" 
                  style={{ height: `${Math.max((d.count / maxVal) * 100, d.count > 0 ? 2 : 0)}%` }}
                ></div>
                <div className={cn(
                  "pointer-events-none absolute -top-10 z-10 rounded bg-primary-gradient px-2 py-1 text-[10px] font-bold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 shadow-lg whitespace-nowrap",
                  i < growth.length / 4 ? "left-0" : i > (growth.length * 3) / 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                )}>
                  <span className="block font-medium opacity-80">{bucketLabel(d.date, growthData.granularity, range, true)}</span>
                  {d.count} user{d.count !== 1 ? "s" : ""}
                </div>
              </div>
            )) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </div>
          {growth.length > 0 && (
            <div className={cn("mt-4 flex text-[10px] font-black text-muted-foreground uppercase tracking-widest", growth.length > 31 ? "gap-px" : growth.length > 12 ? "gap-1" : "gap-2")}>
              {growth.map((d, i) => (
                <span key={d.date} className="flex-1 overflow-visible whitespace-nowrap text-center">
                  {i % labelEvery === 0 ? bucketLabel(d.date, growthData.granularity, range) : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-3">
          <h3 className="text-base font-bold">Recent Subscriptions</h3>
          <div className="mt-4 space-y-0.5">
            {subs.length > 0 ? subs.map((sub, i) => (
              <div key={sub.user_id} className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 -mx-2 p-1.5 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] uppercase border border-primary/20">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{sub.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{sub.plan} Plan — {sub.price.toLocaleString()} TK</p>
                  </div>
                </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase",
                      sub.status === "Active" ? "bg-success-subtle text-success" : 
                      sub.status === "Pending" ? "bg-warning-subtle text-warning" : "bg-destructive-subtle text-destructive"
                    )}>
                      {sub.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-medium">{sub.date}</p>
                  </div>
              </div>
            )) : (
              <div className="py-12 text-center text-sm text-muted-foreground">No recent subscriptions</div>
            )}
          </div>
          <Link href="/subscriptions" className="mt-4 w-full rounded-lg border py-2 text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all active:scale-[0.98] block text-center">
            View All Subscriptions
          </Link>
        </div>
      </div>
    </div>
  )
}