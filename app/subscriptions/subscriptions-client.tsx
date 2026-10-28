"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  CreditCard, Users, Settings2, Plus, Trash2, Pencil,
  Check, Calendar, ChevronRight as ChevronRightIcon,
  ChevronDown, X, Building2, Globe, ChevronLeft, Gift, Search,
  BarChart3, Loader2, LineChart as LineChartIcon
} from "lucide-react"
import { api, UserSubscription, SubscriptionPlan, SubscriptionTarget, University, User, SubscriptionAnalytics, UserGrowthRange } from "@/lib/api"
import { cn, computeSubStatus } from "@/lib/utils"

const PAGE_SIZE = 20

const ANALYTICS_RANGES: { value: UserGrowthRange; label: string }[] = [
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
function bucketLabel(key: string, granularity: SubscriptionAnalytics["granularity"], range: UserGrowthRange, full = false): string {
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

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("...")
  if (total > 1) pages.push(total)
  return pages
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border bg-card shadow-sm overflow-hidden", className)}>{children}</div>
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "indigo" }) {
  const cls = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    indigo: "bg-info-subtle text-info",
  }[variant]
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", cls)}>{children}</span>
}

function TargetSelector({
  universities,
  selectedTargets,
  onChange
}: {
  universities: University[];
  selectedTargets: SubscriptionTarget[];
  onChange: (targets: SubscriptionTarget[]) => void
}) {
  const [expandedUni, setExpandedUni] = useState<string | null>(null)

  const toggleTarget = (uniId: string, deptId: string) => {
    const exists = selectedTargets.find(t => t.university_id === uniId && t.department_id === deptId)
    if (exists) {
      onChange(selectedTargets.filter(t => t !== exists))
    } else {
      onChange([...selectedTargets, { university_id: uniId, department_id: deptId } as SubscriptionTarget])
    }
  }

  const isTargeted = (uniId: string, deptId: string) =>
    selectedTargets.some(t => t.university_id === uniId && t.department_id === deptId)

  const isUniFullyTargeted = (uni: University) => {
    if (!uni.departments || uni.departments.length === 0) return isTargeted(uni.id, "")
    return uni.departments.every(d => isTargeted(uni.id, d.id))
  }

  const toggleUniAll = (uni: University) => {
    const fullUniTarget = { university_id: uni.id, department_id: "" }
    const currentlyTargeted = isTargeted(uni.id, "")

    if (currentlyTargeted) {
      onChange(selectedTargets.filter(t => t.university_id !== uni.id))
    } else {
      onChange([...selectedTargets.filter(t => t.university_id !== uni.id), fullUniTarget as SubscriptionTarget])
    }
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-sm p-2 bg-muted/5">
      {universities.map(uni => (
        <div key={uni.id} className="space-y-1">
          <div className="flex items-center gap-2 group p-1.5 hover:bg-muted/30 rounded-sm transition-colors">
            <button
              type="button"
              onClick={() => setExpandedUni(expandedUni === uni.id ? null : uni.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expandedUni === uni.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </button>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-bold truncate max-w-[200px]">{uni.name}</span>
              <button
                type="button"
                onClick={() => toggleUniAll(uni)}
                className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border transition-all",
                  isTargeted(uni.id, "") ? "bg-primary-gradient border-primary text-white" : "text-muted-foreground hover:border-primary/50"
                )}
              >
                {isTargeted(uni.id, "") ? "University Active" : "Set University"}
              </button>
            </div>
          </div>

          {expandedUni === uni.id && (
            <div className="ml-6 space-y-1 border-l pl-3 py-1">
              {uni.departments?.map(dept => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => toggleTarget(uni.id, dept.id)}
                  className={cn("w-full flex items-center justify-between p-1.5 rounded-sm text-left transition-all",
                    isTargeted(uni.id, dept.id) ? "bg-info-subtle text-info" : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-medium">{dept.name}</span>
                  {isTargeted(uni.id, dept.id) && <Check className="h-3 w-3" />}
                </button>
              ))}
              {(!uni.departments || uni.departments.length === 0) && (
                <p className="text-[10px] text-muted-foreground italic py-1">No departments found.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Plan Modal ─────────────────────────────────────────────────────────────
function PlanModal({
  open, onClose, plan, universities, onSuccess
}: {
  open: boolean; onClose: () => void; plan?: SubscriptionPlan | null; universities: University[]; onSuccess: () => void
}) {
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [discount, setDiscount] = useState("0")
  const [index, setIndex] = useState("0")
  const [isLifetime, setIsLifetime] = useState(false)
  const [durationValue, setDurationValue] = useState("1")
  const [durationUnit, setDurationUnit] = useState<"Days"|"Months"|"Years">("Months")
  const [targets, setTargets] = useState<SubscriptionTarget[]>([])
  const [loading, setLoading] = useState(false)

  // A large sentinel so any other code path that reads duration_days before
  // checking is_lifetime still gets a sane, non-zero value.
  const LIFETIME_DURATION_DAYS = 36500

  useEffect(() => {
    if (open) {
      if (plan) {
        setTitle(plan.title || "");
        setPrice(plan.price?.toString() || "");
        setDiscount(plan.discount?.toString() || "0");
        setIsLifetime(plan.is_lifetime || false);
        const d = plan.duration_days || 30;
        if (d % 365 === 0 && d >= 365) {
          setDurationValue((d / 365).toString());
          setDurationUnit("Years");
        } else if (d % 30 === 0 && d >= 30) {
          setDurationValue((d / 30).toString());
          setDurationUnit("Months");
        } else {
          setDurationValue(d.toString());
          setDurationUnit("Days");
        }
        setTargets(plan.targets || [])
        setIndex(plan.index?.toString() || "0")
      } else {
        setTitle(""); setPrice(""); setDiscount("0"); setIsLifetime(false); setDurationValue("1"); setDurationUnit("Months"); setTargets([]); setIndex("0")
      }
    }
  }, [open, plan])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (targets.length === 0) return alert("Please select at least one target university or department.")
    setLoading(true)
    try {
      const val = parseInt(durationValue) || 1;
      const multiplier = durationUnit === "Years" ? 365 : durationUnit === "Months" ? 30 : 1;

      const payload: Partial<SubscriptionPlan> = {
        title,
        price: parseInt(price) || 0,
        discount: parseInt(discount) || 0,
        index: parseInt(index) || 0,
        is_lifetime: isLifetime,
        duration_days: isLifetime ? LIFETIME_DURATION_DAYS : val * multiplier,
        targets: targets
      }
      if (plan) {
        await api.subscriptions.updatePlan(plan.id, payload)
      } else {
        await api.subscriptions.createPlan(payload)
      }
      onSuccess(); onClose()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" /> {plan ? "Edit Elite Plan" : "Create Elite Plan"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 1 Year Pro" className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price (BDT)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1200" className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount (%)</label>
              <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 20" className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order</label>
              <input type="number" value={index} onChange={e => setIndex(e.target.value)} placeholder="e.g. 1" className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Duration
              </label>
              <button
                type="button"
                onClick={() => setIsLifetime(!isLifetime)}
                className={cn("flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-widest border rounded-sm transition-all",
                  isLifetime ? "bg-primary-gradient border-primary text-white" : "text-muted-foreground hover:border-primary/50"
                )}
              >
                {isLifetime && <Check className="h-3 w-3" />} Lifetime
              </button>
            </div>
            {isLifetime ? (
              <p className="text-xs text-muted-foreground italic px-1 py-2">This plan never expires — duration doesn&apos;t apply.</p>
            ) : (
              <div className="flex gap-2">
                <input type="number" value={durationValue} onChange={e => setDurationValue(e.target.value)} className="flex-1 rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                <div className="flex gap-1">
                  {(["Days", "Months", "Years"] as const).map(u => (
                    <button key={u} type="button" onClick={() => setDurationUnit(u)} className={cn("px-2 py-1 text-[10px] font-bold border rounded-sm hover:bg-muted transition-all", durationUnit === u && "bg-primary-gradient border-primary text-white")}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Targets ({targets.length})</label>
            <TargetSelector universities={universities} selectedTargets={targets} onChange={setTargets} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-sm border py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary-gradient py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Processing..." : "Finish Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Grant Pro Modal ──────────────────────────────────────────────────────────
// For giving free Pro access (moderators, staff, contributors, etc.) without
// a coupon or payment — hits POST /subscriptions/admin-grant, which forces
// price to 0 and tags the grant as "admin_grant" server-side.
function GrantProModal({
  open, onClose, plans, onSuccess
}: {
  open: boolean; onClose: () => void; plans: SubscriptionPlan[]; onSuccess: () => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [planId, setPlanId] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setQuery(""); setResults([]); setSelectedUser(null)
      setPlanId(plans[0]?.id || ""); setNote(""); setError("")
    }
  }, [open, plans])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || selectedUser) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try { setResults(await api.users.getAll(query.trim())) }
      catch (err) { console.error(err) }
      finally { setSearching(false) }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedUser])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser || !planId) return
    setLoading(true); setError("")
    try {
      await api.subscriptions.adminGrant({ user_id: selectedUser.id, plan_id: planId, note: note.trim() || undefined })
      onSuccess(); onClose()
    } catch (err) {
      console.error(err)
      setError("Failed to grant Pro access. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" /> Grant Free Pro Access
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-sm border bg-muted/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">{selectedUser.email}</p>
                </div>
                <button type="button" onClick={() => { setSelectedUser(null); setQuery("") }} className="rounded-full p-1 hover:bg-muted text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name or email"
                  autoFocus
                  className="w-full rounded-sm border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {(searching || results.length > 0) && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-sm border bg-card shadow-lg">
                    {searching ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground italic">Searching...</p>
                    ) : results.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground italic">No users found.</p>
                    ) : results.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setSelectedUser(u); setResults([]) }}
                        className="w-full flex flex-col items-start px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-sm font-bold">{u.first_name} {u.last_name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan</label>
            <select
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              {plans.length === 0 && <option value="">No plans available</option>}
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.title} — {p.is_lifetime ? "Lifetime" : `${p.duration_days} days`}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Note (optional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Moderator — free access"
              className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-sm border py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={loading || !selectedUser || !planId} className="flex-1 rounded-sm bg-primary-gradient py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Granting..." : "Grant Pro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Point (line) chart ───────────────────────────────────────────────────────
// Dots sit at the center of equal-width flex slots, and the SVG line/area use
// the same x-centers, so the two overlays line up exactly.
function PointChart({
  points, metric, maxVal, loading, granularity, range
}: {
  points: { date: string; revenue: number; count: number }[]
  metric: "revenue" | "count"
  maxVal: number
  loading: boolean
  granularity: SubscriptionAnalytics["granularity"]
  range: UserGrowthRange
}) {
  const n = points.length
  const xAt = (i: number) => ((i + 0.5) / n) * 100
  const yAt = (val: number) => 100 - Math.min((val / maxVal) * 100, 100)

  const linePath = points.map((p, i) => {
    const val = metric === "revenue" ? p.revenue : p.count
    return `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(val)}`
  }).join(" ")
  const areaPath = `${linePath} L ${xAt(n - 1)} 100 L ${xAt(0)} 100 Z`

  return (
    <div className={cn("relative mt-8 h-64 w-full", loading && "opacity-50")}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={areaPath} fill="var(--primary)" fillOpacity="0.08" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex">
        {points.map((p, i) => {
          const val = metric === "revenue" ? p.revenue : p.count
          const topPct = yAt(val)
          return (
            <div key={p.date} className="group relative h-full flex-1">
              <div
                className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary border-2 border-card transition-transform group-hover:scale-125 shadow-sm"
                style={{ top: `${topPct}%` }}
              />
              <div
                className={cn(
                  "pointer-events-none absolute z-10 rounded bg-primary-gradient px-2 py-1 text-[10px] font-bold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 shadow-lg whitespace-nowrap",
                  i < n / 4 ? "left-0" : i > (n * 3) / 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                )}
                style={{ top: `calc(${topPct}% - 2.75rem)` }}
              >
                <span className="block font-medium opacity-80">{bucketLabel(p.date, granularity, range, true)}</span>
                {metric === "revenue" ? `${p.revenue.toLocaleString()} TK` : `${p.count} sub${p.count !== 1 ? "s" : ""}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Analytics Tab ────────────────────────────────────────────────────────────
// YouTube-Studio-style revenue/subscriber-count chart over a selectable
// range, plus a per-plan breakdown for that same window.
function AnalyticsTab() {
  const [range, setRange] = useState<UserGrowthRange>("30d")
  const [metric, setMetric] = useState<"revenue" | "count">("revenue")
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [data, setData] = useState<SubscriptionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (r: UserGrowthRange) => {
    setLoading(true); setError("")
    try { setData(await api.stats.getSubscriptionAnalytics(r)) }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load analytics") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(range) }, [range, load])

  const points = data?.points ?? []
  const maxVal = points.reduce((m, p) => Math.max(m, metric === "revenue" ? p.revenue : p.count), 0) || 1
  const labelEvery = Math.max(1, Math.ceil(points.length / 8))
  const breakdown = data?.plan_breakdown ?? []
  const maxBreakdown = breakdown.reduce((m, b) => Math.max(m, b.revenue), 0) || 1
  const rangeLabel = ANALYTICS_RANGES.find(r => r.value === range)?.label.toLowerCase() || ""

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Revenue & Subscribers Over Time</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <strong className="text-foreground">
                {metric === "revenue" ? `${(data?.total_revenue || 0).toLocaleString()} TK` : (data?.total_count || 0).toLocaleString()}
              </strong>{" "}
              {metric === "revenue" ? "collected" : "subscriptions"} {range === "today" ? "today" : range === "lifetime" ? "all time" : `in the ${rangeLabel}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <div className="flex gap-1 rounded-sm border bg-muted/20 p-1">
              {(["line", "bar"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  title={t === "line" ? "Point chart" : "Bar chart"}
                  className={cn("p-1.5 rounded-sm transition-all",
                    chartType === t ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "line" ? <LineChartIcon className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-sm border bg-muted/20 p-1">
              {(["revenue", "count"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn("px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all",
                    metric === m ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "revenue" ? "Revenue" : "Subscribers"}
                </button>
              ))}
            </div>
            <select
              value={range}
              onChange={e => setRange(e.target.value as UserGrowthRange)}
              className="rounded-sm border bg-background px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              {ANALYTICS_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="mt-3 rounded-sm bg-destructive-subtle p-2 text-xs text-destructive">{error}</p>}

        {points.length === 0 ? (
          <div className="mt-8 flex h-64 w-full items-center justify-center text-sm text-muted-foreground">No data</div>
        ) : chartType === "line" ? (
          <PointChart points={points} metric={metric} maxVal={maxVal} loading={loading} granularity={data!.granularity} range={range} />
        ) : (
          <div className={cn("mt-8 flex h-64 items-end justify-between", points.length > 31 ? "gap-px" : points.length > 12 ? "gap-1" : "gap-2", loading && "opacity-50")}>
            {points.map((p, i) => {
              const val = metric === "revenue" ? p.revenue : p.count
              return (
                <div key={p.date} className="group relative flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-primary/10 transition-all group-hover:bg-primary group-hover:opacity-100 opacity-60"
                    style={{ height: `${Math.max((val / maxVal) * 100, val > 0 ? 2 : 0)}%` }}
                  ></div>
                  <div className={cn(
                    "pointer-events-none absolute -top-10 z-10 rounded bg-primary-gradient px-2 py-1 text-[10px] font-bold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 shadow-lg whitespace-nowrap",
                    i < points.length / 4 ? "left-0" : i > (points.length * 3) / 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                  )}>
                    <span className="block font-medium opacity-80">{bucketLabel(p.date, data!.granularity, range, true)}</span>
                    {metric === "revenue" ? `${p.revenue.toLocaleString()} TK` : `${p.count} sub${p.count !== 1 ? "s" : ""}`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {points.length > 0 && (
          <div className={cn("mt-4 flex text-[10px] font-black text-muted-foreground uppercase tracking-widest", points.length > 31 ? "gap-px" : points.length > 12 ? "gap-1" : "gap-2")}>
            {points.map((p, i) => (
              <span key={p.date} className="flex-1 overflow-visible whitespace-nowrap text-center">
                {i % labelEvery === 0 ? bucketLabel(p.date, data!.granularity, range) : ""}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-base font-bold">Plan Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Revenue share by plan {range === "today" ? "today" : range === "lifetime" ? "all time" : `in the ${rangeLabel}`}.</p>
        <div className="mt-4 space-y-3">
          {breakdown.length > 0 ? breakdown.map(b => (
            <div key={b.plan}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold truncate">{b.plan}</span>
                <span className="text-muted-foreground font-medium">{b.revenue.toLocaleString()} TK · {b.count} sub{b.count !== 1 ? "s" : ""}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary-gradient transition-all" style={{ width: `${Math.max((b.revenue / maxBreakdown) * 100, b.revenue > 0 ? 2 : 0)}%` }} />
              </div>
            </div>
          )) : (
            <p className="py-8 text-center text-sm text-muted-foreground italic">No subscriptions in this range.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

// The "who's getting free Pro" shortlist — every admin_grant row, so it
// doesn't quietly become impossible to audit as it grows.
function GrantedTab() {
  const [rows, setRows] = useState<UserSubscription[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const load = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const res = await api.subscriptions.getGranted(newOffset, PAGE_SIZE)
      setRows(res.data)
      setTotalCount(res.count)
      setOffset(newOffset)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(0) }, [load])

  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">User</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Plan</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Note</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Granted By</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground italic">No free Pro grants yet.</td></tr>
            ) : (
              rows.map(row => {
                const status = computeSubStatus(row)
                return (
                  <tr key={row.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold truncate text-sm">{row.user?.first_name} {row.user?.last_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">{row.user?.email}</p>
                    </td>
                    <td className="px-4 py-4"><Badge variant="indigo">{row.plan}</Badge></td>
                    <td className="px-4 py-4 max-w-[220px]">
                      <p className="text-xs text-muted-foreground truncate" title={row.note || ""}>{row.note || "—"}</p>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium">{row.granted_by_admin?.name || "—"}</td>
                    <td className="px-4 py-4 text-xs font-medium">{new Date(row.start_date).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-4">
                      {status === "expired" && <Badge variant="warning">Expired</Badge>}
                      {status === "grace" && <Badge variant="indigo">Grace period</Badge>}
                      {status === "refunded" && <Badge variant="warning">Refunded</Badge>}
                      {status === "active" && <Badge variant="success">Active Pro</Badge>}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t">
          <button
            onClick={() => load((currentPage - 2) * PAGE_SIZE)}
            disabled={currentPage <= 1}
            className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {getPageNumbers(currentPage, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground/40 text-sm">...</span>
            ) : (
              <button
                key={p}
                onClick={() => load(((p as number) - 1) * PAGE_SIZE)}
                className={`min-w-[36px] h-9 rounded-sm text-sm font-bold transition-all ${
                  p === currentPage ? "bg-primary-gradient text-primary-foreground shadow-sm" : "border hover:bg-accent"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => load(currentPage * PAGE_SIZE)}
            disabled={currentPage >= totalPages}
            className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </Card>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function SubscriptionsClient() {
  const [activeTab, setActiveTab] = useState<"subscribers" | "plans" | "analytics" | "granted">("subscribers")
  const [subscribers, setSubscribers] = useState<UserSubscription[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [offset, setOffset] = useState(0)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [universities, setUniversities] = useState<University[]>([])

  const [loading, setLoading] = useState(true)
  const [planModal, setPlanModal] = useState(false)
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null)
  const [grantModal, setGrantModal] = useState(false)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const loadData = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const [subRes, allPlans, unis] = await Promise.all([
        api.subscriptions.getAllPaginated(newOffset, PAGE_SIZE),
        api.subscriptions.getPlans(),
        api.universities.getAll("preload=true")
      ])
      setSubscribers(subRes.data)
      setTotalCount(subRes.count)
      setTotalRevenue(subRes.total_revenue || 0)
      setOffset(newOffset)
      setPlans(allPlans)
      setUniversities(unis)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData(0) }, [loadData])

  const goToPage = (page: number) => {
    loadData((page - 1) * PAGE_SIZE)
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3"><CreditCard className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">Manage multi-target Pro plans and automated lifecycle.</p>
          </div>
        </div>
        {activeTab === "plans" ? (
          <button
            onClick={() => { setEditPlan(null); setPlanModal(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md"
          >
            <Plus className="h-4 w-4" /> Create Custom Plan
          </button>
        ) : (
          <button
            onClick={() => setGrantModal(true)}
            className="flex items-center gap-2 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md"
          >
            <Gift className="h-4 w-4" /> Grant Free Pro
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Subscriptions</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black">{totalCount.toLocaleString()}</span>
            <Badge variant="success">All Time</Badge>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-info/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Plans</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black">{plans.length}</span>
            <Badge variant="indigo">Tiered</Badge>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-warning/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black">{totalRevenue.toLocaleString()} TK</span>
            <Badge variant="success">Collected</Badge>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
        <button
          onClick={() => setActiveTab("subscribers")}
          className={cn("flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-sm",
            activeTab === "subscribers" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4" /> Subscribers
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={cn("flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-sm",
            activeTab === "plans" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings2 className="h-4 w-4" /> Plan Configuration
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={cn("flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-sm",
            activeTab === "analytics" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="h-4 w-4" /> Analytics
        </button>
        <button
          onClick={() => setActiveTab("granted")}
          className={cn("flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-sm",
            activeTab === "granted" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Gift className="h-4 w-4" /> Granted Pro
        </button>
      </div>

      {activeTab === "analytics" ? (
        <AnalyticsTab />
      ) : activeTab === "granted" ? (
        <GrantedTab />
      ) : activeTab === "subscribers" ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">User Profile</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Package</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Buy Date</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Time Remaining</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pro Status</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscribers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground italic">No subscription history available.</td></tr>
                ) : (
                  subscribers.map(sub => {
                    const status = computeSubStatus(sub)
                    return (
                      <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xs uppercase">
                              {sub.user?.first_name?.[0] || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate text-sm">{sub.user?.first_name} {sub.user?.last_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">{sub.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="indigo">{sub.plan}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold">{(sub.price || 0).toLocaleString()} TK</span>
                            {sub.grant_reason === "admin_grant" && <Badge variant="indigo">Free Grant</Badge>}
                            {sub.grant_reason === "coupon" && <Badge variant="warning">Coupon</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium">{new Date(sub.start_date).toLocaleDateString("en-GB")}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            {sub.end_date === null ? (
                              <Badge variant="indigo">Lifetime</Badge>
                            ) : (
                              <>
                                <span className="text-xs font-bold">{new Date(sub.end_date).toLocaleDateString("en-GB")}</span>
                                <span className="text-[10px] text-muted-foreground italic">Expires at midnight</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {status === "expired" && <Badge variant="warning">Expired</Badge>}
                          {status === "grace" && <Badge variant="indigo">Grace period</Badge>}
                          {status === "refunded" && <Badge variant="warning">Refunded</Badge>}
                          {status === "active" && <Badge variant="success">Active Pro</Badge>}
                        </td>
                        <td className="px-4 py-4 text-right pr-6">
                          <button onClick={() => {}} className="rounded-full p-2 hover:bg-info-subtle hover:text-info transition-all text-muted-foreground">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground/40 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`min-w-[36px] h-9 rounded-sm text-sm font-bold transition-all ${
                      p === currentPage
                        ? "bg-primary-gradient text-primary-foreground shadow-sm"
                        : "border hover:bg-accent"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </Card>

      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.id} className="relative group p-6 flex flex-col hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Badge variant="indigo">{plan.duration_days} Days</Badge>
                  <Badge variant="default">Order: {plan.index || 0}</Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setEditPlan(plan); setPlanModal(true) }} className="p-1.5 hover:bg-muted rounded-sm transition-all text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={async () => { if (confirm("Delete this elite plan?")) { await api.subscriptions.deletePlan(plan.id); loadData(0) } }} className="p-1.5 hover:bg-destructive-subtle rounded-sm transition-all text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              <h3 className="text-lg font-black tracking-tight">{plan.title}</h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-primary">{plan.price}</span>
                <span className="text-[10px] font-black uppercase text-muted-foreground">BDT Total</span>
              </div>

              <div className="mt-6 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> Target Reach ({plan.targets?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.targets?.slice(0, 4).map(t => (
                    <Badge key={t.id} variant="default">
                      {t.department_id === "" || !t.department_id ? "University" : "Department"}
                    </Badge>
                  ))}
                  {(plan.targets?.length || 0) > 4 && <Badge>+{(plan.targets?.length || 0) - 4} more</Badge>}
                  {(!plan.targets || plan.targets.length === 0) && <p className="text-[10px] text-muted-foreground italic">No targets defined.</p>}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-success">
                  <Check className="h-3 w-3" /> Production Active
                </div>
                <div className="text-[10px] font-bold text-muted-foreground italic">
                  ID: {plan.id.slice(0, 8)}
                </div>
              </div>
            </Card>
          ))}

          <button
            onClick={() => { setEditPlan(null); setPlanModal(true) }}
            className="border-2 border-dashed border-muted hover:border-primary/40 rounded-sm p-8 flex flex-col items-center justify-center gap-4 group transition-all min-h-[250px]"
          >
            <div className="rounded-full bg-muted p-4 group-hover:bg-primary/10 transition-all">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-all" />
            </div>
            <div className="text-center">
              <p className="font-bold text-muted-foreground group-hover:text-foreground">New Custom Plan</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">Multi-targetable</p>
            </div>
          </button>
        </div>
      )}

      <PlanModal
        open={planModal}
        onClose={() => setPlanModal(false)}
        universities={universities}
        plan={editPlan}
        onSuccess={() => loadData(0)}
      />
      <GrantProModal
        open={grantModal}
        onClose={() => setGrantModal(false)}
        plans={plans}
        onSuccess={() => loadData(0)}
      />
    </div>
  )
}