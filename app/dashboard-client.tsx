"use client"

import { 
  Users, 
  Image as ImageIcon, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { DashboardStats } from "@/lib/api"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
  stats: DashboardStats
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const statCards = [
    { 
      title: "Total Users", 
      value: (stats.total_users || 0).toLocaleString(), 
      icon: Users, 
      trend: stats.user_trend || "+0%", 
      color: "text-blue-600", 
      bg: "bg-blue-100" 
    },
    { 
      title: "Active Banners", 
      value: (stats.active_banners || 0).toString(), 
      icon: ImageIcon, 
      trend: stats.banner_trend || "+0", 
      color: "text-purple-600", 
      bg: "bg-purple-100" 
    },
    { 
      title: "Subscriptions", 
      value: (stats.total_subscriptions || 0).toLocaleString(), 
      icon: CreditCard, 
      trend: stats.sub_trend || "+0%", 
      color: "text-emerald-600", 
      bg: "bg-emerald-100" 
    },
    { 
      title: "Revenue", 
      value: `$${(stats.total_revenue || 0).toLocaleString()}`, 
      icon: TrendingUp, 
      trend: stats.revenue_trend || "+0%", 
      color: "text-orange-600", 
      bg: "bg-orange-100" 
    },
  ]

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
              <span className={cn(
                "flex items-center text-xs font-bold",
                stat.trend.startsWith('+') ? "text-emerald-600" : "text-rose-600"
              )}>
                {stat.trend} {stat.trend.startsWith('+') ? <ArrowUpRight className="ml-1 h-3 w-3" /> : <ArrowDownRight className="ml-1 h-3 w-3" />}
              </span>
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
            {[45, 66, 52, 81, 74, 95, 88].map((v, i) => (
              <div key={i} className="group relative flex-1">
                <div 
                  className="w-full rounded-t-lg bg-primary/10 transition-all group-hover:bg-primary group-hover:opacity-100 opacity-60" 
                  style={{ height: `${v}%` }}
                ></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-primary px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-lg">
                  {v}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-black text-muted-foreground px-2 uppercase tracking-widest">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-3">
          <h3 className="text-lg font-bold">Recent Subscriptions</h3>
          <div className="mt-6 space-y-6">
            {[
              { user: "Sarah Connor", plan: "Premium", status: "Active", date: "2m ago" },
              { user: "John Doe", plan: "Basic", status: "Pending", date: "15m ago" },
              { user: "Alice Smith", plan: "Premium+ ", status: "Active", date: "1h ago" },
              { user: "Bob Williams", plan: "Basic", status: "Expired", date: "5h ago" },
            ].map((sub, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 -mx-2 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase border border-primary/20">
                    {sub.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{sub.user}</p>
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
            ))}
          </div>
          <button className="mt-8 w-full rounded-lg border py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all active:scale-[0.98]">
            View All Subscriptions
          </button>
        </div>
      </div>
    </div>
  )
}
