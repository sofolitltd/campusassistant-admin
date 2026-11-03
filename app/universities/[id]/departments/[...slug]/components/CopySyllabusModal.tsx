"use client"

import { useEffect, useMemo, useState } from "react"
import { api, Batch } from "@/lib/api"
import { Modal, Field, selectCls } from "./SharedUI"
import { Loader2 } from "lucide-react"

interface CopySyllabusModalProps {
  open: boolean
  onClose: () => void
  target: Batch | null
  batches: Batch[]
  onSuccess: (message: string) => void
}

const batchNumber = (b: Batch) => parseInt(b.name.match(/\d+/)?.[0] ?? "0", 10)

// Gives a batch the levels, courses and chapters of an earlier batch of the
// same program. Notes aren't copied: every batch already sees them.
export function CopySyllabusModal({ open, onClose, target, batches, onSuccess }: CopySyllabusModalProps) {
  const sources = useMemo(
    () => batches
      .filter((b) => b.id !== target?.id && (b.program ?? "honours") === (target?.program ?? "honours"))
      .sort((a, b) => batchNumber(b) - batchNumber(a)),
    [batches, target],
  )
  const [sourceId, setSourceId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Default to the newest other batch: usually the one just before.
  useEffect(() => {
    if (open) { setSourceId(sources[0]?.id ?? ""); setError("") }
  }, [open, sources])

  async function handleSubmit() {
    if (!target || !sourceId) return
    setSaving(true); setError("")
    try {
      const { added } = await api.batches.copySyllabus(target.id, sourceId)
      const from = sources.find((b) => b.id === sourceId)?.name
      onSuccess(`${target.name} now follows ${from}'s syllabus: ${added.levels ?? 0} levels, ${added.courses ?? 0} courses, ${added.chapters ?? 0} chapters added`)
      onClose()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (!target) return null

  return (
    <Modal open={open} onClose={onClose} title={`Syllabus for ${target.name}`}>
      <div className="space-y-4 p-6">
        <Field label="Copy from batch" required>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={selectCls}>
            {!sources.length && <option value="">No other batch</option>}
            {sources.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <p className="text-sm text-muted-foreground">
          {target.name} is added to the same levels, courses and chapters. Nothing is removed, and running it again is harmless.
          Edit afterwards only what changed in the new syllabus.
        </p>
        {error && <p className="text-sm text-destructive rounded-sm bg-destructive-subtle p-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || !sourceId} className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Copy syllabus
          </button>
        </div>
      </div>
    </Modal>
  )
}
