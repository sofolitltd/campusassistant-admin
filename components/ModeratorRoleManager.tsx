"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { api, type Moderator, type ModeratorScopeType, type Student } from "@/lib/api"
import { Modal, inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

const scopeLabels: Record<ModeratorScopeType, string> = {
  batch: "Batch moderator",
  department: "Department moderator",
  university: "University moderator",
}

function dateInputValue(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : ""
}

export function ModeratorRoleManager({ student, triggerLabel = "Manage moderator roles", dialogOpen, onDialogClose, hideTrigger = false }: {
  student: Student
  triggerLabel?: string
  dialogOpen?: boolean
  onDialogClose?: () => void
  hideTrigger?: boolean
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = dialogOpen ?? internalOpen
  const [roles, setRoles] = useState<Moderator[]>([])
  const [scope, setScope] = useState<ModeratorScopeType>("batch")
  const [termStart, setTermStart] = useState("")
  const [termEnd, setTermEnd] = useState("")
  const [note, setNote] = useState("")
  const [editingRole, setEditingRole] = useState<Moderator | null>(null)
  const [editTermStart, setEditTermStart] = useState("")
  const [editTermEnd, setEditTermEnd] = useState("")
  const [editNote, setEditNote] = useState("")
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const loading = open && !!student.user_id && loadedUserId !== student.user_id
  const visibleRoles = student.user_id && loadedUserId === student.user_id ? roles : []

  function close() {
    setLoadedUserId(null)
    setError("")
    if (onDialogClose) onDialogClose()
    else setInternalOpen(false)
  }

  useEffect(() => {
    const userId = student.user_id
    if (!open || !userId) return
    let active = true
    api.moderators.getAll(new URLSearchParams({ user_id: userId }).toString())
      .then(({ data }) => {
        if (active) {
          setRoles(data)
          setLoadedUserId(userId)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load moderator roles.")
          setLoadedUserId(userId)
        }
      })
    return () => { active = false }
  }, [open, student.user_id])

  function beginEdit(role: Moderator) {
    setEditingRole(role)
    setEditTermStart(dateInputValue(role.term_start))
    setEditTermEnd(dateInputValue(role.term_end))
    setEditNote(role.note ?? "")
    setError("")
  }

  async function assignRole(event: React.FormEvent) {
    event.preventDefault()
    if (!student.user_id) return
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
      const { data } = await api.moderators.getAll(new URLSearchParams({ user_id: student.user_id }).toString())
      setRoles(data)
      setTermStart("")
      setTermEnd("")
      setNote("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign moderator role.")
    } finally {
      setSaving(false)
    }
  }

  async function saveRole(event: React.FormEvent) {
    event.preventDefault()
    if (!editingRole) return
    if (editTermStart && editTermEnd && editTermEnd <= editTermStart) {
      setError("The end date must be after the start date.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const updated = await api.moderators.update(editingRole.id, {
        ...(editTermStart && { term_start: new Date(`${editTermStart}T00:00:00`).toISOString() }),
        ...(editTermEnd && { term_end: new Date(`${editTermEnd}T23:59:59`).toISOString() }),
        note: editNote.trim(),
      })
      setRoles((current) => current.map((role) => role.id === updated.id ? updated : role))
      setEditingRole(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update moderator role.")
    } finally {
      setSaving(false)
    }
  }

  async function revokeRole(role: Moderator) {
    if (!window.confirm(`Revoke ${scopeLabels[role.scope_type].toLowerCase()} for ${student.name}?`)) return
    setSaving(true)
    setError("")
    try {
      const updated = await api.moderators.revoke(role.id)
      setRoles((current) => current.map((item) => item.id === updated.id ? updated : item))
      if (editingRole?.id === role.id) setEditingRole(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke moderator role.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {!hideTrigger && (
        <button type="button" onClick={() => { setError(""); setLoadedUserId(null); setInternalOpen(true) }} className="rounded-sm border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />{triggerLabel}</span>
        </button>
      )}
      <Modal open={open} onClose={close} title={`Moderator roles · ${student.name}`} className="max-w-xl">
        <div className="space-y-5 p-5">
          <p className="text-xs text-muted-foreground">
            These app permissions are separate from the official CR directory. Scope is derived from the student&apos;s linked profile.
          </p>
          {!student.user_id && (
            <p className="rounded-sm border border-warning/30 bg-warning-subtle p-3 text-sm text-warning">
              This student must claim their profile and link an active account before moderator permissions can be assigned.
            </p>
          )}
          {error && <p role="alert" className="flex items-center gap-2 rounded-sm bg-destructive-subtle p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}

          <section className="space-y-3">
            <h3 className="text-sm font-bold">Current and past assignments</h3>
            {loading ? (
              <div className="py-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></div>
            ) : visibleRoles.length === 0 ? (
              <p className="rounded-sm border border-dashed p-4 text-center text-sm text-muted-foreground">No moderator roles assigned.</p>
            ) : (
              <div className="space-y-2">
                {visibleRoles.map((role) => (
                  <div key={role.id} className="rounded-sm border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{scopeLabels[role.scope_type]}</p>
                        <p className="text-xs text-muted-foreground">{role.scope_name || "Campus scope"} · {role.term_start ? new Date(role.term_start).toLocaleDateString() : "No start"} – {role.term_end ? new Date(role.term_end).toLocaleDateString() : "No end"}</p>
                        {role.note && <p className="mt-1 text-xs text-muted-foreground">{role.note}</p>}
                      </div>
                      <span className={role.is_active ? "rounded-full bg-success-subtle px-2 py-0.5 text-[10px] font-bold text-success" : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"}>
                        {role.is_active ? "Active" : "Revoked"}
                      </span>
                    </div>
                    {role.is_active && (
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => editingRole?.id === role.id ? setEditingRole(null) : beginEdit(role)} disabled={saving} className="rounded-sm border px-2.5 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                          {editingRole?.id === role.id ? "Cancel edit" : "Edit term / note"}
                        </button>
                        <button type="button" onClick={() => void revokeRole(role)} disabled={saving} className="rounded-sm border border-destructive/30 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive-subtle disabled:opacity-50">Revoke</button>
                      </div>
                    )}
                    {editingRole?.id === role.id && (
                      <form onSubmit={saveRole} className="mt-3 space-y-3 border-t pt-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="space-y-1 text-xs font-medium text-muted-foreground">Term starts<input type="date" value={editTermStart} onChange={(event) => setEditTermStart(event.target.value)} className={inputCls} /></label>
                          <label className="space-y-1 text-xs font-medium text-muted-foreground">Term ends<input type="date" value={editTermEnd} onChange={(event) => setEditTermEnd(event.target.value)} className={inputCls} /></label>
                        </div>
                        <label className="block space-y-1 text-xs font-medium text-muted-foreground">Note<input value={editNote} onChange={(event) => setEditNote(event.target.value)} className={inputCls} /></label>
                        <button type="submit" disabled={saving} className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <form onSubmit={assignRole} className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-bold">Assign a role</h3>
            <label className="block space-y-1 text-xs font-medium text-muted-foreground">Scope
              <select value={scope} onChange={(event) => {
                const value = event.target.value
                if (value === "batch" || value === "department" || value === "university") setScope(value)
              }} className={selectCls}>
                <option value="batch">Batch moderator</option>
                <option value="department">Department moderator</option>
                <option value="university">University moderator</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-medium text-muted-foreground">Term starts (optional)<input type="date" value={termStart} onChange={(event) => setTermStart(event.target.value)} className={inputCls} /></label>
              <label className="space-y-1 text-xs font-medium text-muted-foreground">Term ends (optional)<input type="date" value={termEnd} onChange={(event) => setTermEnd(event.target.value)} className={inputCls} /></label>
            </div>
            <label className="block space-y-1 text-xs font-medium text-muted-foreground">Note (optional)<input value={note} onChange={(event) => setNote(event.target.value)} className={inputCls} /></label>
            <button type="submit" disabled={!student.user_id || saving} className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? "Saving…" : "Assign moderator role"}
            </button>
          </form>
        </div>
      </Modal>
    </>
  )
}
