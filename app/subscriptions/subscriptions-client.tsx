"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CreditCard, Users, Settings2, Plus, Trash2, Pencil,
  Check, ShieldCheck, School, Calendar, ChevronRight,
  ChevronDown, X, Building2, Globe
} from "lucide-react"
import { api, UserSubscription, SubscriptionPlan, SubscriptionTarget, University, Department } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Shared UI ───────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border bg-card shadow-sm overflow-hidden", className)}>{children}</div>
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "indigo" }) {
  const cls = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    indigo: "bg-indigo-500/10 text-indigo-600",
  }[variant]
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", cls)}>{children}</span>
}

// ── Multi-Target Selector ──────────────────────────────────────────────────
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
      // Add "University" uni target and remove specific dept targets for cleanliness
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
              {expandedUni === uni.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-bold truncate max-w-[200px]">{uni.name}</span>
              <button
                type="button"
                onClick={() => toggleUniAll(uni)}
                className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border transition-all",
                  isTargeted(uni.id, "") ? "bg-primary border-primary text-white" : "text-muted-foreground hover:border-primary/50"
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
                    isTargeted(uni.id, dept.id) ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "hover:bg-muted/50 text-muted-foreground"
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
  const [index, setIndex] = useState("0")
  const [durationValue, setDurationValue] = useState("1")
  const [durationUnit, setDurationUnit] = useState<"Days"|"Months"|"Years">("Months")
  const [targets, setTargets] = useState<SubscriptionTarget[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (plan) {
        setTitle(plan.title || "");
        setPrice(plan.price?.toString() || "");
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
        setTitle(""); setPrice(""); setDurationValue("1"); setDurationUnit("Months"); setTargets([]); setIndex("0")
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
        index: parseInt(index) || 0,
        duration_days: val * multiplier,
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 1 Year Pro" className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price (BDT)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1200" className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order</label>
              <input type="number" value={index} onChange={e => setIndex(e.target.value)} placeholder="e.g. 1" className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Duration
            </label>
            <div className="flex gap-2">
              <input type="number" value={durationValue} onChange={e => setDurationValue(e.target.value)} className="flex-1 rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
              <div className="flex gap-1">
                {(["Days", "Months", "Years"] as const).map(u => (
                  <button key={u} type="button" onClick={() => setDurationUnit(u)} className={cn("px-2 py-1 text-[10px] font-bold border rounded-sm hover:bg-muted transition-all", durationUnit === u && "bg-primary border-primary text-white")}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Targets ({targets.length})</label>
            <TargetSelector universities={universities} selectedTargets={targets} onChange={setTargets} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-sm border py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Processing..." : "Finish Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function SubscriptionsClient() {
  const [activeTab, setActiveTab] = useState<"subscribers" | "plans">("subscribers")
  const [subscribers, setSubscribers] = useState<UserSubscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [universities, setUniversities] = useState<University[]>([])

  const [loading, setLoading] = useState(true)
  const [planModal, setPlanModal] = useState(false)
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [subs, allPlans, unis] = await Promise.all([
        api.subscriptions.getAll(),
        api.subscriptions.getPlans(),
        api.universities.getAll("preload=true")
      ])
      setSubscribers(subs)
      setPlans(allPlans)
      setUniversities(unis)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3"><CreditCard className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">Manage multi-target Pro plans and automated lifecycle.</p>
          </div>
        </div>
        {activeTab === "plans" && (
          <button
            onClick={() => { setEditPlan(null); setPlanModal(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md"
          >
            <Plus className="h-4 w-4" /> Create Custom Plan
          </button>
        )}

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Pro Users</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black">{subscribers.filter(s => new Date(s.end_date) > new Date()).length}</span>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-indigo-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Plans</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black">{plans.length}</span>
            <Badge variant="indigo">Tiered</Badge>
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
      </div>

      {activeTab === "subscribers" ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">User Profile</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Package</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Time Remaining</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pro Status</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscribers.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground italic">No subscription history available.</td></tr>
                ) : (
                  subscribers.map(sub => {
                    const isExpired = new Date(sub.end_date) < new Date()
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
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{new Date(sub.end_date).toLocaleDateString()}</span>
                            <span className="text-[10px] text-muted-foreground italic">Expires at midnight</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {isExpired ? <Badge variant="warning">Expired</Badge> : <Badge variant="success">Active Pro</Badge>}
                        </td>
                        <td className="px-4 py-4 text-right pr-6">
                          <button onClick={async () => { if (confirm("Revoke this subscription? User status will be updated.")) { await api.subscriptions.delete(sub.id); loadData() } }} className="rounded-full p-2 hover:bg-red-50 hover:text-red-500 transition-all text-muted-foreground">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
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
                  <button onClick={async () => { if (confirm("Delete this elite plan?")) { await api.subscriptions.deletePlan(plan.id); loadData() } }} className="p-1.5 hover:bg-red-50 rounded-sm transition-all text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
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
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
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
        onSuccess={loadData}
      />
    </div>
  )
}
