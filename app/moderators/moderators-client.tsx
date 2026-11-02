"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, RefreshCcw, Search, ShieldCheck } from "lucide-react"
import {
  api,
  type Batch,
  type Department,
  type Moderator,
  type ModeratorScopeType,
  type Student,
  type University,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const selectCls = "rounded-sm border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
const inputCls = "w-full rounded-sm border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"

function fullName(user?: Student["user"]) {
  if (!user) return ""
  return `${user.first_name} ${user.last_name}`.trim() || user.email
}

function roleStatus(role: Moderator) {
  if (!role.is_active) return "Revoked"
  const now = Date.now()
  if (role.term_start && new Date(role.term_start).getTime() > now) return "Scheduled"
  if (role.term_end && new Date(role.term_end).getTime() <= now) return "Expired"
  return "Active"
}

function scopeLabel(role: Moderator) {
  return role.scope_name || role.batch?.name || role.department?.name || role.university?.acronym ||
    role.university?.name || `${role.scope_type} · ${role.scope_id.slice(0, 8)}`
}

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "—"
}

function grantedByLabel(role: Moderator) {
  return role.granted_by_admin?.name || role.granted_by_admin?.email ||
    (role.granted_by ? role.granted_by.slice(0, 8) : "—")
}

export default function ModeratorsClient({
  initialModerators,
  initialCount,
}: {
  initialModerators: Moderator[]
  initialCount: number
}) {
  const [moderators, setModerators] = useState(initialModerators)
  const [count, setCount] = useState(initialCount)
  const [universities, setUniversities] = useState<University[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [universityId, setUniversityId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [scopeType, setScopeType] = useState<"" | ModeratorScopeType>("")
  const [active, setActive] = useState<"" | "true" | "false">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [assignOpen, setAssignOpen] = useState(false)
  const [rotatingCodes, setRotatingCodes] = useState(false)
  const [codeRotationMessage, setCodeRotationMessage] = useState("")

  useEffect(() => {
    api.universities.getAll("limit=200").then(setUniversities).catch(() => {})
  }, [])

  useEffect(() => {
    if (!universityId) return
    api.departments.getAllByUniversity(universityId).then(setDepartments).catch(() => {})
    api.batches.getAll("limit=100").then((items) => {
      setBatches(items.filter((item) => item.university_id === universityId))
    }).catch(() => {})
  }, [universityId])

  useEffect(() => {
    if (!departmentId) return
    api.batches.getAllByDepartment(departmentId).then(setBatches).catch(() => {})
  }, [departmentId])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    if (universityId) params.set("university_id", universityId)
    if (departmentId) params.set("department_id", departmentId)
    if (batchId) params.set("batch_id", batchId)
    if (scopeType) params.set("scope_type", scopeType)
    if (active) params.set("active", active)
    try {
      const result = await api.moderators.getAll(params.toString())
      setModerators(result.data)
      setCount(result.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load moderators.")
    } finally {
      setLoading(false)
    }
  }, [universityId, departmentId, batchId, scopeType, active])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  function changeUniversity(value: string) {
    setUniversityId(value)
    setDepartments([])
    setBatches([])
    setDepartmentId("")
    setBatchId("")
  }

  function changeDepartment(value: string) {
    setDepartmentId(value)
    setBatchId("")
    if (value) setBatches([])
  }

  async function revoke(role: Moderator) {
    if (!window.confirm(`Revoke ${fullName(role.user?.student?.user) || role.user?.email || "this moderator"}'s ${role.scope_type} role?`)) return
    setError("")
    try {
      await api.moderators.revoke(role.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke moderator role.")
    }
  }

  async function rotateUnclaimedCodes() {
    const confirmed = window.confirm(
      "Rotate claim codes for every unclaimed, unlinked student profile? All previously shared codes will stop working. This cannot be undone.",
    )
    if (!confirmed) return

    setRotatingCodes(true)
    setError("")
    setCodeRotationMessage("")
    try {
      const result = await api.students.rotateUnclaimedCodes()
      setCodeRotationMessage(`${result.rotated_count} unclaimed profile code${result.rotated_count === 1 ? "" : "s"} rotated.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rotate unclaimed profile codes.")
    } finally {
      setRotatingCodes(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3"><ShieldCheck className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Moderators</h1>
            <p className="text-sm text-muted-foreground">Assign and manage student moderator roles by campus scope.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={rotateUnclaimedCodes} disabled={rotatingCodes} className="inline-flex items-center justify-center gap-2 rounded-sm border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50">
            {rotatingCodes ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Rotate unclaimed codes
          </button>
          <button onClick={() => setAssignOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Assign moderator
          </button>
        </div>
      </div>

      {codeRotationMessage && <p role="status" className="rounded-sm bg-success-subtle p-3 text-sm text-success">{codeRotationMessage}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <select value={universityId} onChange={(e) => changeUniversity(e.target.value)} className={selectCls}>
          <option value="">All universities</option>
          {universities.map((university) => <option key={university.id} value={university.id}>{university.acronym || university.name}</option>)}
        </select>
        <select value={departmentId} onChange={(e) => changeDepartment(e.target.value)} disabled={!universityId} className={cn(selectCls, "disabled:opacity-50")}>
          <option value="">All departments</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.acronym || department.name}</option>)}
        </select>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)} disabled={!universityId} className={cn(selectCls, "disabled:opacity-50")}>
          <option value="">All batches</option>
          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
        </select>
        <select value={scopeType} onChange={(e) => setScopeType(e.target.value as "" | ModeratorScopeType)} className={selectCls}>
          <option value="">All scopes</option>
          <option value="batch">Batch</option>
          <option value="department">Department</option>
          <option value="university">University</option>
        </select>
        <select value={active} onChange={(e) => setActive(e.target.value as "" | "true" | "false")} className={selectCls}>
          <option value="">Active and history</option>
          <option value="true">Active / scheduled</option>
          <option value="false">Inactive / expired</option>
        </select>
        <button onClick={() => load()} disabled={loading} className="rounded-sm border p-2 hover:bg-muted disabled:opacity-50" title="Refresh">
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
        <span className="ml-auto text-sm text-muted-foreground">{count} roles</span>
      </div>

      {error && <p role="alert" className="rounded-sm bg-destructive-subtle p-3 text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-sm border bg-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3">Granted by</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
            ) : moderators.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">No moderator roles match these filters.</td></tr>
            ) : moderators.map((role) => {
              const status = roleStatus(role)
              const studentName = role.user?.student?.name || fullName(role.user?.student?.user) ||
                `${role.user?.first_name ?? ""} ${role.user?.last_name ?? ""}`.trim()
              return (
                <tr key={role.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{studentName || role.user?.email || role.user_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{role.user?.email || role.user_id}</p>
                    {role.user?.student?.student_id && <p className="font-mono text-[11px] text-muted-foreground">{role.user.student.student_id}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold capitalize">{role.scope_type}</p>
                    <p className="text-xs text-muted-foreground">{scopeLabel(role)}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {dateLabel(role.term_start)} – {dateLabel(role.term_end)}
                  </td>
                  <td className="px-4 py-3 text-xs">{grantedByLabel(role)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                      status === "Active" ? "bg-success-subtle text-success" :
                        status === "Scheduled" ? "bg-info-subtle text-info" :
                          "bg-muted text-muted-foreground"
                    )}>{status}</span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground" title={role.note}>{role.note || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {role.is_active && <button onClick={() => revoke(role)} className="text-xs font-semibold text-destructive hover:underline">Revoke</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {assignOpen && (
        <AssignModeratorModal
          universities={universities}
          onClose={() => setAssignOpen(false)}
          onAssigned={() => { setAssignOpen(false); load() }}
        />
      )}
    </div>
  )
}

function AssignModeratorModal({
  universities,
  onClose,
  onAssigned,
}: {
  universities: University[]
  onClose: () => void
  onAssigned: () => void
}) {
  const [universityId, setUniversityId] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [student, setStudent] = useState<Student | null>(null)
  const [search, setSearch] = useState("")
  const [scope, setScope] = useState<ModeratorScopeType>("batch")
  const [termStart, setTermStart] = useState("")
  const [termEnd, setTermEnd] = useState("")
  const [note, setNote] = useState("")
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!universityId) return
    let active = true
    setLoadingStudents(true)
    const params = new URLSearchParams({ university_id: universityId, preload: "true" })
    api.students.getAll(params.toString())
      .then((result) => { if (active) setStudents(result.filter((item) => !!item.user_id)) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not find students.") })
      .finally(() => { if (active) setLoadingStudents(false) })
    return () => { active = false }
  }, [universityId])

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const claimed = students.filter((item) => !!item.user_id)
    if (!needle) return claimed.slice(0, 30)
    return claimed.filter((item) =>
      [item.name, item.student_id, item.email, item.user?.email]
        .some((value) => value?.toLowerCase().includes(needle))
    ).slice(0, 30)
  }, [students, search])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!student?.user_id) {
      setError("Select a student with a linked account.")
      return
    }
    if (termStart && termEnd && termEnd <= termStart) {
      setError("The end date must be after the start date.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await api.moderators.create({
        user_id: student.user_id,
        scope_type: scope,
        ...(termStart && { term_start: new Date(`${termStart}T00:00:00`).toISOString() }),
        ...(termEnd && { term_end: new Date(`${termEnd}T23:59:59`).toISOString() }),
        ...(note.trim() && { note: note.trim() }),
      })
      onAssigned()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign moderator.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4">
      <button aria-label="Close dialog" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 my-8 w-full max-w-xl space-y-4 rounded-sm border bg-card p-6 shadow-2xl">
        <div>
          <h2 className="text-lg font-bold">Assign moderator</h2>
          <p className="text-sm text-muted-foreground">Only linked student accounts can be assigned. The server derives the student&apos;s scope IDs.</p>
        </div>
        <label className="block space-y-1.5 text-sm font-medium">
          University
          <select required value={universityId} onChange={(e) => {
            setUniversityId(e.target.value)
            setStudents([])
            setStudent(null)
            setSearch("")
          }} className={inputCls}>
            <option value="">Select university</option>
            {universities.map((university) => <option key={university.id} value={university.id}>{university.acronym || university.name}</option>)}
          </select>
        </label>
        <div className="space-y-2">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} disabled={!universityId} placeholder="Search name, roll, or email" className={cn(inputCls, "pl-9")} />
          </label>
          <div className="max-h-44 overflow-y-auto rounded-sm border">
            {loadingStudents ? (
              <p className="p-3 text-sm text-muted-foreground">Loading students…</p>
            ) : matches.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">{universityId ? "No linked student accounts match." : "Choose a university to search students."}</p>
            ) : matches.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setStudent(item)}
                className={cn("block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-muted/50", student?.id === item.id && "bg-primary/10")}
              >
                <span className="block text-sm font-semibold">{item.name}</span>
                <span className="block text-xs text-muted-foreground">{item.student_id} · {item.user?.email || item.email || "linked account"}</span>
              </button>
            ))}
          </div>
          {student && <p className="text-xs text-success">Selected: {student.name} · {student.batch?.name || "Batch scope will be resolved by the server"}</p>}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Moderator scope</legend>
          <div className="flex flex-wrap gap-4">
            {(["batch", "department", "university"] as ModeratorScopeType[]).map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm capitalize">
                <input type="radio" name="scope_type" checked={scope === value} onChange={() => setScope(value)} />
                {value}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Role scope is limited to the selected student&apos;s own batch, department, or university.</p>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">Term starts<input type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} className={inputCls} /></label>
          <label className="space-y-1.5 text-sm font-medium">Term ends<input type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} className={inputCls} /></label>
        </div>
        <label className="block space-y-1.5 text-sm font-medium">Note<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional term or context" className={inputCls} /></label>
        {error && <p role="alert" className="rounded-sm bg-destructive-subtle p-2 text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-sm border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button type="submit" disabled={saving || !student} className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Assign role
          </button>
        </div>
      </form>
    </div>
  )
}
