"use client"

import { useState } from "react"
import { api, CR, Student, Batch, getFullImageUrl } from "@/lib/api"
import { Modal, Field, Avatar, inputCls } from "./SharedUI"
import { AlertCircle, Loader2 } from "lucide-react"

// A CR counts as current only while flagged so AND inside their term — the
// same rule the API uses (domain.ActiveCR), so this list never disagrees with
// who can actually post.
export function isActiveCR(cr: CR) {
  return cr.is_current && (!cr.term_end || new Date(cr.term_end).getTime() > Date.now())
}

const endOfDay = (v: string) => new Date(`${v}T23:59:59`).toISOString()

// ─── Make CR ─────────────────────────────────────────────────────────────────

export function MakeCRModal({ student, batches, activeCRs, universityId, departmentId, onClose, onDone }: {
  student: Student
  batches: Batch[]
  activeCRs: CR[]
  universityId: string
  departmentId: string
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const batch = batches.find(b => b.id === student.batch_id)
  // A batch normally has one CR; offer to hand over from whoever holds it now.
  const predecessors = activeCRs.filter(c => c.batch_id === student.batch_id && c.target_student_id !== student.id)
  const [termEnd, setTermEnd] = useState("")
  const [retire, setRetire] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.crs.create({
        university_id: universityId,
        department_id: departmentId,
        target_student_id: student.id,
        // Unclaimed students have no account yet; the link is made through
        // target_student_id and starts working as soon as they claim it.
        user_id: student.user_id,
        name: student.name,
        student_id: student.student_id,
        email: student.email,
        phone: student.phone,
        image_url: student.user?.avatar_url ?? "",
        batch_id: student.batch_id,
        batch: batch?.name ?? "",
        is_current: true,
        term_start: new Date().toISOString(),
        term_end: termEnd ? endOfDay(termEnd) : undefined,
      })
      if (retire) {
        const now = new Date().toISOString()
        await Promise.all(predecessors.map(c => api.crs.update(c.id, { is_current: false, term_end: now })))
      }
      onDone(`${student.name} is now CR${batch ? ` of ${batch.name}` : ""}`)
    } catch (err: any) {
      setError(err.message || "Failed to assign CR")
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Make CR" className="max-w-md">
      <form onSubmit={submit}>
        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm border border-destructive/30">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Avatar name={student.name} imageUrl={student.user?.avatar_url ? getFullImageUrl(student.user.avatar_url) : undefined} size="md" />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{student.name}</p>
              <p className="text-xs text-muted-foreground">ID {student.student_id} · {batch?.name ?? "No batch"}</p>
            </div>
          </div>
          {!student.batch_id && (
            <p className="text-xs text-destructive">This student has no batch, so they cannot be made CR.</p>
          )}
          {!student.is_claimed && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-sm p-2.5">
              This student hasn&apos;t claimed their profile in the app yet. CR access turns on automatically once they do.
            </p>
          )}
          <Field label="Term ends (optional)">
            <input type="date" value={termEnd} min={new Date().toISOString().slice(0, 10)} onChange={e => setTermEnd(e.target.value)} className={inputCls} />
          </Field>
          {predecessors.length > 0 && (
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={retire} onChange={e => setRetire(e.target.checked)} className="mt-0.5" />
              <span>End the term of the current CR of this batch ({predecessors.map(c => c.name).join(", ")})</span>
            </label>
          )}
        </div>
        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={loading || !student.batch_id} className="px-4 py-2 text-sm font-bold rounded-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Make CR
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── End CR term ─────────────────────────────────────────────────────────────

export function EndCRModal({ cr, onClose, onDone }: { cr: CR; onClose: () => void; onDone: (msg: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function confirm() {
    setLoading(true)
    setError("")
    try {
      // Kept as history rather than deleted; they just stop being a current CR.
      await api.crs.update(cr.id, { is_current: false, term_end: new Date().toISOString() })
      onDone(`${cr.name} is no longer CR`)
    } catch (err: any) {
      setError(err.message || "Failed to end CR term")
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="End CR term" className="max-w-sm">
      <div className="px-6 py-4 space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-sm">
          <strong>{cr.name}</strong> will immediately lose the ability to post class notices. The record stays in the CR history.
        </p>
      </div>
      <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">Cancel</button>
        <button onClick={confirm} disabled={loading} className="px-4 py-2 text-sm font-bold rounded-sm bg-destructive text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} End term
        </button>
      </div>
    </Modal>
  )
}
