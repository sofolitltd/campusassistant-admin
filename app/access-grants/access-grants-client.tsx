"use client"

import { useState, useEffect, useCallback } from "react"
import {
  PartyPopper, Plus, Pencil, Trash2, CircleStop, Globe, School, Building2, Users, User as UserIcon,
  EyeOff, Coins, Infinity, Search,
} from "lucide-react"
import {
  api, AccessGrant, AccessGrantInput, AccessGrantScope, University, Department, Batch, User,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { selectCls, inputCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border bg-card shadow-sm overflow-hidden", className)}>{children}</div>
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "info" | "danger" }) {
  const cls = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    info: "bg-info-subtle text-info",
    danger: "bg-destructive-subtle text-destructive",
  }[variant]
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", cls)}>{children}</span>
}

const SCOPES: { value: AccessGrantScope; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Everyone", icon: Globe },
  { value: "university", label: "University", icon: School },
  { value: "department", label: "Department", icon: Building2 },
  { value: "batch", label: "Batch", icon: Users },
  { value: "user", label: "User", icon: UserIcon },
]

// One-click starting points for the common cases; everything stays editable.
const PRESETS: { label: string; apply: Partial<FormState> }[] = [
  { label: "New user welcome", apply: { label: "New user welcome", scopeType: "all", adFree: true, coinFree: true, newUserDays: "7", endsAt: "" } },
  { label: "Campus launch", apply: { label: "Campus launch", scopeType: "university", adFree: true, coinFree: true, newUserDays: "0" } },
  { label: "Exam season", apply: { label: "Exam season", scopeType: "batch", adFree: false, coinFree: true, newUserDays: "0" } },
  { label: "Ambassador", apply: { label: "Ambassador", scopeType: "user", adFree: true, coinFree: true, newUserDays: "0", endsAt: "" } },
]

interface FormState {
  label: string
  scopeType: AccessGrantScope
  adFree: boolean
  coinFree: boolean
  startsAt: string
  endsAt: string
  newUserDays: string
}

// datetime-local wants local wall-clock time, not the UTC an ISO string holds.
function toLocalInput(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

const labelCls = "text-[10px] font-black uppercase tracking-widest text-muted-foreground"

// ── Scope picker ─────────────────────────────────────────────────────────────
// Cascades university → department → batch as deep as the scope needs, or
// searches users for the user scope. Reports the chosen id (or "").
function ScopePicker({ scopeType, onChange }: { scopeType: AccessGrantScope; onChange: (id: string) => void }) {
  const [universities, setUniversities] = useState<University[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [universityId, setUniversityId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [userId, setUserId] = useState("")

  useEffect(() => {
    if (scopeType !== "all" && scopeType !== "user" && universities.length === 0) {
      api.universities.getAll().then(setUniversities).catch(console.error)
    }
  }, [scopeType, universities.length])

  useEffect(() => {
    if (universityId && scopeType !== "university") {
      api.departments.getAllByUniversity(universityId).then(setDepartments).catch(console.error)
    }
  }, [universityId, scopeType])

  useEffect(() => {
    if (departmentId && scopeType === "batch") {
      api.batches.getAllByDepartment(departmentId).then(setBatches).catch(console.error)
    }
  }, [departmentId, scopeType])

  useEffect(() => {
    if (scopeType !== "user" || query.trim().length < 2) { setUsers([]); return }
    const t = setTimeout(() => {
      api.users.getAll(query.trim()).then(u => setUsers(u.slice(0, 8))).catch(console.error)
    }, 300)
    return () => clearTimeout(t)
  }, [query, scopeType])

  // Report whichever id matches the scope's depth; "" until it's chosen.
  useEffect(() => {
    const id = { all: "", university: universityId, department: departmentId, batch: batchId, user: userId }[scopeType]
    onChange(id)
  }, [scopeType, universityId, departmentId, batchId, userId, onChange])

  if (scopeType === "all") {
    return <p className="text-xs text-muted-foreground">Applies to every account.</p>
  }

  if (scopeType === "user") {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={e => { setQuery(e.target.value); setUserId("") }}
            placeholder="Search name or email…" className={cn(inputCls, "pl-9")} />
        </div>
        {users.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-sm border divide-y">
            {users.map(u => (
              <button key={u.id} type="button" onClick={() => setUserId(u.id)}
                className={cn("w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors", userId === u.id && "bg-primary/10")}>
                <span className="font-semibold">{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email}</span>
                <span className="ml-2 text-xs text-muted-foreground">{u.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <select value={universityId} onChange={e => { setUniversityId(e.target.value); setDepartmentId(""); setBatchId(""); setDepartments([]); setBatches([]) }} className={selectCls}>
        <option value="">Select university…</option>
        {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      {scopeType !== "university" && universityId && (
        <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setBatchId(""); setBatches([]) }} className={selectCls}>
          <option value="">Select department…</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      )}
      {scopeType === "batch" && departmentId && (
        <select value={batchId} onChange={e => setBatchId(e.target.value)} className={selectCls}>
          <option value="">Select batch…</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
    </div>
  )
}

// ── Grant modal ──────────────────────────────────────────────────────────────
function GrantModal({ open, onClose, grant, onSuccess }: {
  open: boolean; onClose: () => void; grant?: AccessGrant | null; onSuccess: () => void
}) {
  const [form, setForm] = useState<FormState>({
    label: "", scopeType: "university", adFree: true, coinFree: true, startsAt: "", endsAt: "", newUserDays: "0",
  })
  const [scopeId, setScopeId] = useState("")
  // When editing, keep the saved scope until the admin chooses to change it.
  const [changingScope, setChangingScope] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setError("")
    if (grant) {
      setForm({
        label: grant.label, scopeType: grant.scope_type, adFree: grant.ad_free, coinFree: grant.coin_free,
        startsAt: toLocalInput(grant.starts_at), endsAt: toLocalInput(grant.ends_at), newUserDays: String(grant.new_user_days),
      })
      setScopeId(grant.scope_id ?? "")
      setChangingScope(false)
    } else {
      setForm({ label: "", scopeType: "university", adFree: true, coinFree: true, startsAt: "", endsAt: "", newUserDays: "0" })
      setScopeId("")
      setChangingScope(true)
    }
  }, [open, grant])

  const handleScopeId = useCallback((id: string) => setScopeId(id), [])

  if (!open) return null

  const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) { setError("Label is required"); return }
    if (!form.adFree && !form.coinFree) { setError("Pick at least one perk"); return }
    if (form.scopeType !== "all" && !scopeId) { setError("Choose who this grant is for"); return }
    const days = parseInt(form.newUserDays) || 0
    if (days < 0) { setError("New-user days can't be negative"); return }

    const payload: AccessGrantInput = {
      label: form.label.trim(),
      scope_type: form.scopeType,
      scope_id: form.scopeType === "all" ? undefined : scopeId,
      ad_free: form.adFree,
      coin_free: form.coinFree,
      new_user_days: days,
      ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    }
    if (form.startsAt) payload.starts_at = new Date(form.startsAt).toISOString()

    setLoading(true)
    try {
      if (grant) await api.accessGrants.update(grant.id, payload)
      else await api.accessGrants.create(payload)
      onSuccess(); onClose()
    } catch (err) { setError(String(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-primary" /> {grant ? "Edit Grant" : "New Grant"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1">
          {error && (
            <div className="rounded-sm bg-destructive-subtle border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive">{error}</div>
          )}

          {!grant && (
            <div className="space-y-1">
              <label className={labelCls}>Start from</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(p => (
                  <button key={p.label} type="button" onClick={() => set(p.apply)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold hover:bg-muted transition-all">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className={labelCls}>Label</label>
            <input value={form.label} onChange={e => set({ label: e.target.value })} maxLength={120}
              placeholder="e.g. DU CSE launch" className={inputCls} required />
            <p className="text-[11px] text-muted-foreground">Shown to users on the app&apos;s offer badge.</p>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Who gets it</label>
            {grant && !changingScope ? (
              <div className="flex items-center justify-between rounded-sm border px-3 py-2.5 text-sm">
                <span><span className="font-semibold capitalize">{grant.scope_type}</span> · {grant.scope_name}</span>
                <button type="button" onClick={() => { setChangingScope(true); setScopeId("") }} className="text-xs font-bold text-primary hover:underline">Change</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-1">
                  {SCOPES.map(s => (
                    <button key={s.value} type="button" onClick={() => { set({ scopeType: s.value }); setScopeId("") }}
                      className={cn("flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-bold border rounded-sm hover:bg-muted transition-all",
                        form.scopeType === s.value && "bg-primary-gradient border-primary text-primary-foreground")}>
                      <s.icon className="h-4 w-4" /> {s.label}
                    </button>
                  ))}
                </div>
                <ScopePicker key={form.scopeType} scopeType={form.scopeType} onChange={handleScopeId} />
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Perks</label>
            <label className="flex items-start gap-3 rounded-sm border px-3 py-2.5 cursor-pointer hover:bg-muted/40">
              <input type="checkbox" checked={form.adFree} onChange={e => set({ adFree: e.target.checked })} className="mt-0.5" />
              <span className="text-sm"><span className="font-semibold">Ad-free</span><span className="block text-xs text-muted-foreground">No banner, interstitial or video ads.</span></span>
            </label>
            <label className="flex items-start gap-3 rounded-sm border px-3 py-2.5 cursor-pointer hover:bg-muted/40">
              <input type="checkbox" checked={form.coinFree} onChange={e => set({ coinFree: e.target.checked })} className="mt-0.5" />
              <span className="text-sm"><span className="font-semibold">Coin-free downloads</span><span className="block text-xs text-muted-foreground">Downloads cost no coins and never show the out-of-coins ad.</span></span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Starts</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => set({ startsAt: e.target.value })} className={inputCls} />
              <p className="text-[11px] text-muted-foreground">Empty = now</p>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Ends</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => set({ endsAt: e.target.value })} className={inputCls} />
              <p className="text-[11px] text-muted-foreground">Empty = no end</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Only new accounts (days)</label>
            <input type="number" min="0" value={form.newUserDays} onChange={e => set({ newUserDays: e.target.value })} className={inputCls} />
            <p className="text-[11px] text-muted-foreground">
              0 = everyone in scope. 7 = each account gets it for its first 7 days after signing up.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-sm border py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary-gradient py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Saving..." : grant ? "Update Grant" : "Create Grant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
const th = "px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground"

export default function AccessGrantsClient() {
  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editGrant, setEditGrant] = useState<AccessGrant | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try { setGrants(await api.accessGrants.getAll()) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function endNow(g: AccessGrant) {
    if (!confirm(`End "${g.label}" now? Users lose the perks immediately.`)) return
    setBusyId(g.id)
    try { await api.accessGrants.end(g.id); await loadData() }
    catch (err) { alert(String(err)) }
    finally { setBusyId(null) }
  }

  async function remove(g: AccessGrant) {
    if (!confirm(`Delete "${g.label}"? This removes it from history too.`)) return
    setBusyId(g.id)
    try { await api.accessGrants.delete(g.id); setGrants(prev => prev.filter(x => x.id !== g.id)) }
    catch (err) { alert(String(err)) }
    finally { setBusyId(null) }
  }

  const now = new Date()

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3"><PartyPopper className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Access Grants</h1>
            <p className="text-sm text-muted-foreground">
              Free ad-free or coin-free time for a campus, department, batch or person — launch offers, partnerships, ambassadors.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditGrant(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md"
        >
          <Plus className="h-4 w-4" /> New Grant
        </button>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className={th}>Label</th>
                  <th className={th}>Who</th>
                  <th className={th}>Perks</th>
                  <th className={th}>When</th>
                  <th className={th}>Users</th>
                  <th className={th}>Status</th>
                  <th className={cn(th, "text-right pr-6")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grants.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground italic">No grants yet. Start with a &quot;New user welcome&quot; or a campus launch.</td></tr>
                ) : grants.map(g => {
                  const scope = SCOPES.find(s => s.value === g.scope_type)
                  const upcoming = new Date(g.starts_at) > now
                  return (
                    <tr key={g.id} className={cn("hover:bg-muted/10 transition-colors", !g.is_active && !upcoming && "opacity-50")}>
                      <td className="px-4 py-4 font-semibold">{g.label}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {scope && <scope.icon className="h-4 w-4 text-primary shrink-0" />}
                          <div>
                            <div className="text-xs font-medium">{g.scope_name || "—"}</div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{scope?.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {g.ad_free && <Badge variant="info"><EyeOff className="h-3 w-3" />Ad-free</Badge>}
                          {g.coin_free && <Badge variant="success"><Coins className="h-3 w-3" />Coin-free</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="flex items-center gap-1">
                          {fmtDate(g.starts_at)} →{" "}
                          {g.ends_at ? fmtDate(g.ends_at) : <Infinity className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        {g.new_user_days > 0 && (
                          <div className="text-[11px] text-muted-foreground">First {g.new_user_days} days of each new account</div>
                        )}
                      </td>
                      <td className="px-4 py-4 tabular-nums font-bold">{g.users_in_scope.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        {g.is_active ? <Badge variant="success">Active</Badge>
                          : upcoming ? <Badge variant="info">Scheduled</Badge>
                          : <Badge>Ended</Badge>}
                      </td>
                      <td className="px-4 py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditGrant(g); setModalOpen(true) }} title="Edit"
                            className="rounded-full p-2 hover:bg-info-subtle hover:text-info transition-all text-muted-foreground">
                            <Pencil className="h-4 w-4" />
                          </button>
                          {(g.is_active || upcoming) && (
                            <button onClick={() => endNow(g)} disabled={busyId === g.id} title="End now"
                              className="rounded-full p-2 hover:bg-warning-subtle hover:text-warning transition-all text-muted-foreground disabled:opacity-50">
                              <CircleStop className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => remove(g)} disabled={busyId === g.id} title="Delete"
                            className="rounded-full p-2 hover:bg-destructive-subtle hover:text-destructive transition-all text-muted-foreground disabled:opacity-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <GrantModal open={modalOpen} onClose={() => setModalOpen(false)} grant={editGrant} onSuccess={loadData} />
    </div>
  )
}
