"use client"

import Link from "next/link"
import { 
  Users, 
  Image as ImageIcon, 
  CreditCard, 
  TrendingUp,
} from "lucide-react"
import { DashboardStats } from "@/lib/api"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
  stats: DashboardStats
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { weekday: "short" })
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const statCards = [
    { 
      title: "Total Users", 
      value: (stats.total_users || 0).toLocaleString(), 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-100" 
    },
    { 
      title: "Active Banners", 
      value: (stats.active_banners || 0).toString(), 
      icon: ImageIcon, 
      color: "text-purple-600", 
      bg: "bg-purple-100" 
    },
    { 
      title: "Subscriptions", 
      value: (stats.total_subscriptions || 0).toLocaleString(), 
      icon: CreditCard, 
      color: "text-emerald-600", 
      bg: "bg-emerald-100" 
    },
    { 
      title: "Revenue", 
      value: `${(stats.total_revenue || 0).toLocaleString()} TK`, 
      icon: TrendingUp, 
      color: "text-orange-600", 
      bg: "bg-orange-100" 
    },
  ]

  const growth = stats.user_growth ?? []
  const maxVal = growth.reduce((m, d) => Math.max(m, d.count), 0) || 1
  const subs = stats.recent_subscriptions ?? []

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to the Campus Assistant administrative portal.</p>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">User Growth</h3>
            <select className="rounded-md border bg-background px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 12 months</option>
            </select>
          </div>
          <div className="mt-8 flex h-64 items-end justify-between gap-2">
            {growth.length > 0 ? growth.map((d, i) => (
              <div key={i} className="group relative flex-1">
                <div 
                  className="w-full rounded-t-lg bg-primary/10 transition-all group-hover:bg-primary group-hover:opacity-100 opacity-60" 
                  style={{ height: `${(d.count / maxVal) * 100}%` }}
                ></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-primary px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-lg whitespace-nowrap">
                  {d.count} user{d.count !== 1 ? "s" : ""}
                </div>
              </div>
            )) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-black text-muted-foreground px-2 uppercase tracking-widest">
            {growth.length > 0 ? growth.map((d, i) => (
              <span key={i}>{dayLabel(d.date)}</span>
            )) : (
              <>
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-3">
          <h3 className="text-lg font-bold">Recent Subscriptions</h3>
          <div className="mt-6 space-y-6">
            {subs.length > 0 ? subs.map((sub, i) => (
              <div key={sub.user_id} className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 -mx-2 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase border border-primary/20">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{sub.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{sub.plan} Plan</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                    sub.status === "Active" ? "bg-emerald-100 text-emerald-700" : 
                    sub.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {sub.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">{sub.date}</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-sm text-muted-foreground">No recent subscriptions</div>
            )}
          </div>
          <Link href="/subscriptions" className="mt-8 w-full rounded-lg border py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all active:scale-[0.98] block text-center">
            View All Subscriptions
          </Link>
        </div>
      </div>
    </div>
  )
}