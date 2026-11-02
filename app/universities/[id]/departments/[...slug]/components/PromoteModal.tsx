"use client"

import { useEffect, useMemo, useState } from "react"
import { api, Batch, Student } from "@/lib/api"
import { Modal, Field, selectCls, inputCls } from "./SharedUI"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoteModalProps {
  open: boolean
  onClose: () => void
  target: Batch | null
  batches: Batch[]
  onSuccess: (count: number) => void
}

const batchNumber = (b: Batch) => b.name.match(/\d+/)?.[0] ?? ""

// Brings students of an Honors batch into a Masters batch. Everyone starts
// ticked (most of the batch continues); untick whoever didn't enroll. The new
// roll is prefilled with the current one — edit it where the university
// issues new Masters rolls.
export function PromoteModal({ open, onClose, target, batches, onSuccess }: PromoteModalProps) {
  const sources = useMemo(
    () => batches.filter((b) => b.id !== target?.id && (b.program ?? "honours") !== target?.program),
    [batches, target],
  )
  const [sourceId, setSourceId] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [rolls, setRolls] = useState<Record<string, string>>({})
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !target) return
    // Default to the Honors batch with the same number ("Batch 10" for "Masters Batch 10").
    const match = sources.find((b) => batchNumber(b) === batchNumber(target))
    setSourceId(match?.id ?? "")
    setSessionId(target.sessions?.length === 1 ? target.sessions[0].id : "")
    setError("")
  }, [open, target, sources])

  useEffect(() => {
    if (!open || !sourceId) { setStudents([]); return }
    let cancelled = false
    setLoadingStudents(true)
    api.students.getAll(`batch_id=${sourceId}`)
      .then((list) => {
        if (cancelled) return
        setStudents(list)
        setSelected(new Set(list.map((s) => s.id)))
        setRolls(Object.fromEntries(list.map((s) => [s.id, s.student_id ?? ""])))
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoadingStudents(false))
    return () => { cancelled = true }
  }, [open, sourceId])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    if (!target) return
    if (!sessionId) { setError("Choose the Masters session"); return }
    if (!selected.size) { setError("Select at least one student"); return }
    setSaving(true); setError("")
    try {
      const res = await api.batches.promote(target.id, {
        session_id: sessionId,
        students: students.filter((s) => selected.has(s.id)).map((s) => ({ id: s.id, roll: rolls[s.id]?.trim() })),
      })
      onSuccess(res.promoted); onClose()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (!target) return null
  const allTicked = students.length > 0 && selected.size === students.length

  return (
    <Modal open={open} onClose={onClose} title={`Import into ${target.name}`} className="sm:max-w-2xl">
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="From batch" required>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={selectCls}>
              <option value="">Select…</option>
              {sources.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label={`${target.name} session`} required>
            <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={selectCls}>
              <option value="">Select…</option>
              {target.sessions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        {!target.sessions?.length && (
          <p className="text-xs text-warning rounded-sm bg-warning-subtle p-2">This batch has no sessions yet. Edit the batch and add its session first.</p>
        )}

        {loadingStudents ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : sourceId && !students.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No students in this batch.</p>
        ) : students.length ? (
          <div className="rounded-sm border">
            <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs font-bold text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={allTicked} onChange={() => setSelected(allTicked ? new Set() : new Set(students.map((s) => s.id)))} />
                {selected.size} of {students.length} selected
              </label>
              <span>New roll</span>
            </div>
            <div className="max-h-[45vh] overflow-y-auto divide-y">
              {students.map((s) => (
                <div key={s.id} className={cn("flex items-center gap-3 px-3 py-2", !selected.has(s.id) && "opacity-50")}>
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name || "—"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{s.student_id}</p>
                  </div>
                  <input
                    value={rolls[s.id] ?? ""}
                    onChange={(e) => setRolls((r) => ({ ...r, [s.id]: e.target.value }))}
                    disabled={!selected.has(s.id)}
                    className={cn(inputCls, "w-36 h-8 font-mono text-xs")}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-[11px] text-muted-foreground">
          Their current batch is kept in their history and stays visible to them in Study. Batch moderator roles in the old batch end. A promote can be reverted per student from their profile.
        </p>
        {error && <p className="text-sm text-destructive rounded-sm bg-destructive-subtle p-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || !selected.size || !sessionId} className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Import {selected.size} student{selected.size === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
