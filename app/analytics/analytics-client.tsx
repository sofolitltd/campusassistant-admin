"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Activity, AlertTriangle, ArrowUpRight, BookOpen, Download, Loader2,
  RefreshCw, Search, Target, Users,
} from "lucide-react"
import {
  api, AnalyticsRange, Department, University, UsageAnalyticsDashboard,
  UsageAnalyticsTrend,
} from "@/lib/api"
import { cn } from "@/lib/utils"

type Props = {
  universities: University[]
  departments: Department[]
}

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
]

const TREND_METRICS = [
  { key: "active_users", label: "Active users", icon: Users },
  { key: "resource_opens", label: "Resource opens", icon: BookOpen },
  { key: "downloads", label: "Successful downloads", icon: Download },
  { key: "searches", label: "Searches", icon: Search },
] as const

type TrendKey = (typeof TREND_METRICS)[number]["key"]

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  detail: string
  icon: React.ElementType
  tone: "primary" | "success" | "warning" | "info"
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    info: "bg-info-subtle text-info",
  }[tone]

  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-lg p-2.5", toneClass)}><Icon className="h-5 w-5" /></div>
        <span className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  )
}

function Panel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="border-b p-5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">{title}</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function TrendChart({ trends, metric }: { trends: UsageAnalyticsTrend[]; metric: TrendKey }) {
  const selectedMetric = TREND_METRICS.find((item) => item.key === metric)!
  const values = trends.map((item) => item[metric])
  const max = Math.max(1, ...values)
  const points = values.map((value, index) => {
    const x = values.length < 2 ? 500 : (index / (values.length - 1)) * 1000
    const y = 172 - (value / max) * 150
    return `${x},${y}`
  }).join(" ")
  const labels = trends.length
    ? [trends[0], trends[Math.floor((trends.length - 1) / 2)], trends.at(-1)!]
    : []

  return (
    <div>
      {trends.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No activity recorded for this period yet.</p>
      ) : (
        <>
          <div className="h-52 w-full overflow-hidden">
            <svg viewBox="0 0 1000 200" role="img" aria-label={`${selectedMetric.label} trend`} className="h-full w-full overflow-visible">
              {[30, 80, 130, 180].map((y) => (
                <line key={y} x1="0" x2="1000" y1={y} y2={y} className="stroke-border" strokeWidth="1" />
              ))}
              <polyline points={points} fill="none" className="stroke-primary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {values.map((value, index) => {
                if (values.length > 30 && index % Math.ceil(values.length / 30) !== 0 && index !== values.length - 1) return null
                const x = values.length < 2 ? 500 : (index / (values.length - 1)) * 1000
                const y = 172 - (value / max) * 150
                return <circle key={trends[index].date} cx={x} cy={y} r="4" className="fill-primary stroke-card" strokeWidth="3" />
              })}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {labels.map((point, index) => (
              <span key={`${point.date}-${index}`}>{new Date(`${point.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function formatNumber(value: number) {
  return value.toLocaleString()
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return "—"
  return `${Math.round((numerator / denominator) * 100)}%`
}

export default function AnalyticsClient({ universities, departments }: Props) {
  const [range, setRange] = useState<AnalyticsRange>("30d")
  const [universityId, setUniversityId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [trendMetric, setTrendMetric] = useState<TrendKey>("active_users")
  const [data, setData] = useState<UsageAnalyticsDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const requestId = useRef(0)

  const filteredDepartments = useMemo(
    () => departments.filter((department) => !universityId || department.university_id === universityId),
    [departments, universityId],
  )

  const loadData = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError("")
    try {
      const result = await api.analytics.getDashboard(range, universityId || undefined, departmentId || undefined)
      if (currentRequest === requestId.current) setData(result)
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(cause instanceof Error ? cause.message : "Could not load usage analytics.")
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [range, universityId, departmentId])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const summary = data?.summary
  const firstActionRate = summary ? percent(summary.users_with_first_action, summary.new_users) : "—"
  const downloadRate = summary ? percent(summary.download_successes, summary.download_attempts) : "—"

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">Product insights</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Usage Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Understand what students use, where they get stuck, and whether they come back.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="University filter"
            value={universityId}
            onChange={(event) => { setUniversityId(event.target.value); setDepartmentId("") }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">All universities</option>
            {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
          </select>
          <select
            aria-label="Department filter"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            disabled={!filteredDepartments.length}
            className="rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">All departments</option>
            {filteredDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <div className="flex rounded-md border bg-muted/30 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                aria-pressed={range === option.value}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-bold transition-colors",
                  range === option.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => void loadData()}
            disabled={loading}
            aria-label="Refresh analytics"
            className="rounded-md border bg-background p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive-subtle p-4 text-sm text-destructive">
          <span>{error}</span>
          <button onClick={() => void loadData()} className="font-bold underline">Retry</button>
        </div>
      )}

      {loading && !data ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Active users" value={formatNumber(data.summary.active_users)} detail={`Unique users active in ${data.range}`} icon={Users} tone="success" />
            <MetricCard title="Resource opens" value={formatNumber(data.summary.resource_opens)} detail={`${formatNumber(data.summary.download_successes)} successful downloads`} icon={BookOpen} tone="primary" />
            <MetricCard title="Searches" value={formatNumber(data.summary.searches)} detail={`${formatNumber(data.summary.zero_result_searches)} returned no results`} icon={Search} tone="info" />
            <MetricCard title="Day-7 retention" value={data.summary.cohort_users ? `${Math.round(data.summary.retention_rate)}%` : "—"} detail={`${formatNumber(data.summary.retained_users)} of ${formatNumber(data.summary.cohort_users)} eligible signups`} icon={Activity} tone="warning" />
          </div>

          <Panel title="Usage trend" description="Daily active users, resource opens, downloads, or searches." icon={Activity}>
            <div className="mb-4 flex flex-wrap gap-2">
              {TREND_METRICS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTrendMetric(key)}
                  aria-pressed={trendMetric === key}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold",
                    trendMetric === key ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {loading ? <div className="flex h-52 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : <TrendChart trends={data.trends} metric={trendMetric} />}
          </Panel>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Resource usage" description={`Most-used resources and user activity in the last ${data.range}.`} icon={BookOpen}>
              <div className="mb-5 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3"><p className="text-xl font-black">{formatNumber(data.summary.download_attempts)}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attempts</p></div>
                <div className="rounded-lg bg-success-subtle p-3 text-success"><p className="text-xl font-black">{formatNumber(data.summary.download_successes)}</p><p className="text-[10px] font-bold uppercase tracking-wider">Succeeded</p></div>
                <div className="rounded-lg bg-warning-subtle p-3 text-warning"><p className="text-xl font-black">{downloadRate}</p><p className="text-[10px] font-bold uppercase tracking-wider">Success rate</p></div>
              </div>
              <div className="space-y-2">
                {data.top_resources.length ? data.top_resources.map((resource, index) => (
                  <div key={resource.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                      <div className="min-w-0"><p className="truncate text-sm font-bold">{resource.title || "Deleted resource"}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{resource.type}</p></div>
                    </div>
                    <div className="shrink-0 text-right text-xs"><p className="font-bold">{formatNumber(resource.downloads)} downloads</p><p className="text-muted-foreground">{formatNumber(resource.opens)} opens</p></div>
                  </div>
                )) : <p className="py-6 text-center text-sm text-muted-foreground">No resource activity recorded yet.</p>}
              </div>
              {data.summary.download_failures + data.summary.download_blocked > 0 && (
                <p className="mt-3 flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {formatNumber(data.summary.download_failures)} failures · {formatNumber(data.summary.download_blocked)} blocked by access rules
                </p>
              )}
              <div className="mt-5 border-t pt-4">
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Most active users</h3>
                {data.top_users.length ? data.top_users.slice(0, 5).map((user) => (
                  <Link key={user.id} href={`/users?search=${encodeURIComponent(user.email)}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/40">
                    <span className="min-w-0 truncate text-xs font-bold">{user.name || user.email}<span className="ml-2 font-normal text-muted-foreground">{user.role}</span></span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">{formatNumber(user.downloads)} downloads <ArrowUpRight className="h-3 w-3" /></span>
                  </Link>
                )) : <p className="text-xs text-muted-foreground">No user activity recorded yet.</p>}
              </div>
            </Panel>

            <Panel title="Search quality" description="Searches grouped by selected category; query text is not collected." icon={Search}>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3"><p className="text-xl font-black">{formatNumber(data.summary.searches)}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Searches</p></div>
                <div className="rounded-lg bg-warning-subtle p-3 text-warning"><p className="text-xl font-black">{percent(data.summary.zero_result_searches, data.summary.searches)}</p><p className="text-[10px] font-bold uppercase tracking-wider">Zero results</p></div>
                <div className="rounded-lg bg-info-subtle p-3 text-info"><p className="text-xl font-black">{formatNumber(data.summary.search_result_opens)}</p><p className="text-[10px] font-bold uppercase tracking-wider">Resource result opens</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead><tr className="border-b text-[10px] font-black uppercase tracking-widest text-muted-foreground"><th className="py-2">Category</th><th className="py-2 text-right">Searches</th><th className="py-2 text-right">No results</th><th className="py-2 text-right">Resource opens</th></tr></thead>
                  <tbody className="divide-y">
                    {data.search_categories.length ? data.search_categories.map((item) => (
                      <tr key={item.category}><td className="py-3 font-bold capitalize">{item.category || "Unfiltered"}</td><td className="py-3 text-right">{formatNumber(item.searches)}</td><td className="py-3 text-right">{formatNumber(item.zero_results)}</td><td className="py-3 text-right">{formatNumber(item.result_opens)}</td></tr>
                    )) : <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No searches recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Retention" description="App activity recorded once per user per UTC day from the foreground heartbeat." icon={Users}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Day-7 retention</p>
                  <p className="mt-2 text-3xl font-black">{data.summary.cohort_users ? `${Math.round(data.summary.retention_rate)}%` : "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNumber(data.summary.retained_users)} users returned after signup, from {formatNumber(data.summary.cohort_users)} eligible accounts.</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active this period</p>
                  <p className="mt-2 text-3xl font-black">{formatNumber(data.summary.active_users)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Unique users with at least one active app day.</p>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">Day-7 retention counts eligible signups active between 6 and 7 days after signup. Accounts younger than 7 days are excluded.</p>
            </Panel>

            <Panel title="Signup to first action" description="New accounts that opened or successfully downloaded a resource." icon={Target}>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New users</p><p className="mt-1 text-3xl font-black">{formatNumber(data.summary.new_users)}</p></div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-right"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First resource action</p><p className="mt-1 text-3xl font-black">{formatNumber(data.summary.users_with_first_action)}</p></div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, data.summary.new_users ? data.summary.users_with_first_action / data.summary.new_users * 100 : 0)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Signup → first action conversion</span><strong>{firstActionRate}</strong></div>
                <p className="text-[11px] text-muted-foreground">First action means opening a resource or completing its download. Search-only activity is excluded.</p>
              </div>
            </Panel>
          </div>
          <p className="text-right text-[10px] text-muted-foreground">
            Window starts {new Date(data.from).toLocaleString("en-GB")} · Raw search text is not stored.
          </p>
        </>
      ) : !error ? (
        <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">No analytics data is available.</div>
      ) : null}
    </div>
  )
}
