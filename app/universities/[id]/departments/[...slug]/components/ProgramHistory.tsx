"use client"

import { useEffect, useState } from "react"
import { api, BATCH_PROGRAM_LABEL, StudentEnrollment } from "@/lib/api"
import { Loader2, Undo2 } from "lucide-react"

// Earlier programs of a student (e.g. the Honors batch before Masters).
// Renders nothing for students who were never promoted. Only the newest row
// can be reverted — that's the promote most likely to be a mistake.
export function ProgramHistory({ studentId, onReverted, onToast }: {
  studentId: string
  onReverted?: () => void
  onToast?: (msg: string) => void
}) {
  const [rows, setRows] = useState<StudentEnrollment[]>([])
  const [confirming, setConfirming] = useState(false)
  const [reverting, setReverting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setRows([]); setConfirming(false)
    api.students.getEnrollments(studentId).then((r) => !cancelled && setRows(r)).catch(() => { })
    return () => { cancelled = true }
  }, [studentId])

  if (!rows.length) return null

  async function handleRevert() {
    setReverting(true)
    try {
      await api.students.revertEnrollment(studentId, rows[0].id)
      onToast?.(`Moved back to ${rows[0].batch?.name ?? "previous batch"}`)
      setRows((r) => r.slice(1))
      onReverted?.()
    } catch (e: any) {
      onToast?.(e.message || "Failed to revert")
    } finally {
      setReverting(false); setConfirming(false)
    }
  }

  return (
    <div className="rounded-sm border bg-muted/10 p-3 mb-2">
      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Previous programs</p>
      <div className="space-y-2">
        {rows.map((e, i) => (
          <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="font-bold truncate">
                {BATCH_PROGRAM_LABEL[e.program] ?? e.program} · {e.batch?.name ?? "Deleted batch"}
              </p>
              <p className="text-muted-foreground font-mono text-[11px]">
                {e.roll || "—"}{e.session?.name ? ` · ${e.session.name}` : ""}{e.is_cr ? " · CR" : ""}
              </p>
            </div>
            {i === 0 && (
              confirming ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setConfirming(false)} className="rounded-sm border px-2 py-1 text-[11px] hover:bg-muted">Cancel</button>
                  <button onClick={handleRevert} disabled={reverting} className="rounded-sm bg-destructive px-2 py-1 text-[11px] font-bold text-destructive-foreground disabled:opacity-50 flex items-center gap-1">
                    {reverting && <Loader2 className="h-3 w-3 animate-spin" />}Move back
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirming(true)} title="Undo this promotion" className="shrink-0 rounded-sm border px-2 py-1 text-[11px] hover:bg-muted flex items-center gap-1 text-muted-foreground">
                  <Undo2 className="h-3 w-3" /> Revert
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
