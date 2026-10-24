"use client"

import { useState, useEffect } from "react"
import { api, Level, Batch, sortBatches } from "@/lib/api"
import { Modal, Field, inputCls, selectCls } from "./SharedUI"
import { Loader2, Plus, Users, X } from "lucide-react"
import { BatchSelectionModal } from "@/components/BatchSelectionModal"

const STATUSES = ["active", "draft", "archived"] as const

interface LevelModalProps {
  open: boolean
  onClose: () => void
  universityId: string
  departmentId: string
  level?: Level | null
  onSuccess: () => void
  batches: Batch[]
}

export function LevelModal({
  open, onClose, universityId, departmentId, level, onSuccess, batches,
}: LevelModalProps) {
  const isEdit = !!level

  const [name, setName] = useState("")
  const [order, setOrder] = useState("0")
  const [status, setStatus] = useState<typeof STATUSES[number]>("active")
  const [totalCourses, setTotalCourses] = useState("0")
  const [totalCredits, setTotalCredits] = useState("0")
  const [totalMarks, setTotalMarks] = useState("0")
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [batchModalOpen, setBatchModalOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setName(level?.name ?? "")
      setOrder(level?.order?.toString() ?? "0")
      setStatus((level?.status as typeof STATUSES[number]) ?? "active")
      setTotalCourses(level?.total_courses?.toString() ?? "0")
      setTotalCredits(level?.total_credits?.toString() ?? "0")
      setTotalMarks(level?.total_marks?.toString() ?? "0")
      setSelectedBatchIds(level?.batches?.map((b: any) => b.id ?? b) ?? [])
      setError("")
    }
  }, [open, level])

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("Level name is required"); return }
    setLoading(true); setError("")

    try {
      const payload: Partial<Level> & { batch_ids?: string[] } = {
        name: name.trim(),
        order: parseInt(order) || 0,
        status,
        total_courses: parseInt(totalCourses) || 0,
        total_credits: parseFloat(totalCredits) || 0,
        total_marks: parseInt(totalMarks) || 0,
        university_id: universityId,
        department_id: departmentId,
        batch_ids: selectedBatchIds,
      }

      if (isEdit) {
        await api.levels.update(level!.id, payload)
      } else {
        await api.levels.create(payload)
      }
      onSuccess(); onClose()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Level" : "Add Level"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">

        {/* Name */}
        <Field label="Level Name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 1st Year or Master's"
            className={inputCls}
          />
        </Field>

        {/* Order + Status */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order">
            <input
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0, 1, 2…"
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Courses / Credits / Marks */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Total Courses">
            <input
              type="number" min={0}
              value={totalCourses}
              onChange={(e) => setTotalCourses(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Total Credits">
            <input
              type="number" min={0} step={0.5}
              value={totalCredits}
              onChange={(e) => setTotalCredits(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Total Marks">
            <input
              type="number" min={0}
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Batch assignment */}
        {batches.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Assign to Batches</span>
              <span className="text-[10px] font-black text-primary/60">{selectedBatchIds.length} Selected</span>
            </label>

            <button
              type="button"
              onClick={() => setBatchModalOpen(true)}
              className="w-full flex items-center justify-between rounded-sm border border-dashed border-muted-foreground/20 bg-muted/5 px-4 py-3 text-sm font-bold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span>Select Batches</span>
              </div>
              <Plus className="h-4 w-4 opacity-40" />
            </button>

            {selectedBatchIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sortBatches(batches.filter(b => selectedBatchIds.includes(b.id))).map(b => (
                  <span key={b.id} className="inline-flex items-center gap-1 rounded-sm bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/10">
                    {b.name}
                    <button type="button" onClick={() => toggleBatch(b.id)} className="hover:text-destructive transition-all"><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="rounded-sm bg-destructive-subtle p-2 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button" onClick={onClose}
            className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Update Level" : "Save Level"}
          </button>
        </div>
      </form>
    </Modal>

    {/* Outside <Modal>: its zoom transform would trap a fixed overlay. */}
    <BatchSelectionModal
      open={open && batchModalOpen}
      onClose={() => setBatchModalOpen(false)}
      batches={batches}
      selectedIds={selectedBatchIds}
      onToggle={toggleBatch}
    />
    </>
  )
}
