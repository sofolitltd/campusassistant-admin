"use client"

import { useState, useEffect, useCallback } from "react"
import { api, Chapter, Batch } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Plus, Trash2, Pencil, Loader2, AlertTriangle,
  Hash, BookMarked, GripVertical, X, Users, Search, Check
} from "lucide-react"
import { BatchSelectionModal } from "@/components/BatchSelectionModal"

// ── Inline small modal ────────────────────────────────────────────────────────
function ChapterModal({ open, onClose, chapter, courseCode, universityId, departmentId, batches, onSuccess }: {
  open: boolean; onClose: () => void
  chapter?: Chapter | null
  courseCode: string; universityId: string; departmentId: string
  batches: Batch[]; onSuccess: () => void
}) {
  const isEdit = !!chapter
  const [number, setNumber] = useState("")
  const [title, setTitle] = useState("")
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [batchModalOpen, setBatchModalOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setError("")
      setNumber(chapter?.chapter_no?.toString() ?? "")
      setTitle(chapter?.chapter_title ?? "")
      setSelectedBatchIds(chapter?.batches?.map((b) => b.id) ?? [])
    }
  }, [open, chapter])

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Chapter title is required"); return }
    if (!number.trim()) { setError("Chapter number is required"); return }
    setLoading(true); setError("")
    try {
      const payload: Partial<Chapter> = {
        course_code: courseCode,
        chapter_no: parseInt(number) || 0,
        chapter_title: title.trim(),
        university_id: universityId,
        department_id: departmentId,
        batches: selectedBatchIds.map(id => ({ id }) as Batch),
      }
      if (isEdit) {
        await api.chapters.update(chapter!.id, payload)
      } else {
        await api.chapters.create(payload)
      }
      onSuccess(); onClose()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-sm border bg-card shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
          <h2 className="text-base font-bold">{isEdit ? "Edit Chapter" : "Add Chapter"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-all text-muted-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="mx-5 mt-5 rounded-sm border border-red-200 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="px-5 space-y-4">
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">No. <span className="text-red-500">*</span></label>
                <input type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1"
                  className="w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction"
                  className="w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
            </div>

            {/* Batches */}
            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>Assign to Batches</span>
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{selectedBatchIds.length} Selected</span>
              </label>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(true)}
                  className="w-full flex items-center justify-between rounded-sm border-2 border-dashed border-muted-foreground/20 bg-muted/10 px-4 py-3 text-sm font-bold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-background p-1.5 shadow-sm group-hover:scale-110 transition-transform">
                      <Users className="h-4 w-4" />
                    </div>
                    <span>Select Targeted Batches</span>
                  </div>
                  <Plus className="h-4 w-4 opacity-40" />
                </button>

                {/* Selected batches preview */}
                {selectedBatchIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedBatchIds.slice(0, 5).map(id => {
                      const b = batches.find(x => x.id === id)
                      if (!b) return null
                      return (
                        <span key={id} className="inline-flex items-center gap-1 rounded-sm bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/10">
                          {b.name}
                          <button type="button" onClick={() => toggleBatch(id)} className="hover:text-red-500 transition-all"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      )
                    })}
                    {selectedBatchIds.length > 5 && (
                      <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5">+ {selectedBatchIds.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto border-t p-5 flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="rounded-sm px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-sm bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Update Changes" : "Save Chapter"}
            </button>
          </div>
        </form>
      </div>

      <BatchSelectionModal 
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        batches={batches}
        selectedIds={selectedBatchIds}
        onToggle={toggleBatch}
      />
    </div>
  )
}

function ConfirmDelete({ open, label, onClose, onConfirm, loading }: { open: boolean; label: string; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          <h3 className="text-lg font-bold">Delete {label}?</h3>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete
          </button>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link"

interface ChaptersTabProps {
  courseCode: string
  universityId: string
  departmentId: string
  semesterId: string
  courseId: string
  batches: Batch[]
}

export default function ChaptersTab({ courseCode, universityId, departmentId, semesterId, courseId, batches }: ChaptersTabProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Chapter | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await api.chapters.getAllByCourse(courseCode)
      setChapters(data.sort((a, b) => a.chapter_no - b.chapter_no))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [courseCode])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await api.chapters.delete(deleteTarget.id); await load() }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">{chapters.length} Chapter{chapters.length !== 1 ? "s" : ""}</span>
        </div>
        <button
          onClick={() => { setEditTarget(null); setModal(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all">
          <Plus className="h-3.5 w-3.5" /> Add Chapter
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary opacity-30" />
        </div>
      ) : error ? (
        <p className="rounded-sm border border-red-200 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-500">{error}</p>
      ) : chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-sm border border-dashed bg-muted/20">
          <div className="rounded-full bg-muted p-5 mb-3"><BookMarked className="h-8 w-8 text-muted-foreground/40" /></div>
          <p className="font-bold">No chapters yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add the first chapter to get started.</p>
          <button onClick={() => { setEditTarget(null); setModal(true) }}
            className="mt-5 flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> Add Chapter
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/universities/${universityId}/departments/${departmentId}/courses/${semesterId}/${courseId}/chapters/${ch.id}?chapterNo=${ch.chapter_no}&chapterTitle=${encodeURIComponent(ch.chapter_title)}`}
              className="group flex items-center gap-3 rounded-sm border bg-card px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary text-xs font-black">
                {ch.chapter_no}
              </div>
              <p className="flex-1 text-sm font-medium">{ch.chapter_title}</p>
              {ch.batches && ch.batches.length > 0 && (
                <div className="hidden sm:flex gap-1 flex-wrap">
                  {ch.batches.slice(0, 3).map((b) => (
                    <span key={b.id} className="text-[10px] font-bold bg-muted rounded-sm px-1.5 py-0.5 text-muted-foreground">{b.name}</span>
                  ))}
                  {ch.batches.length > 3 && <span className="text-[10px] font-bold text-muted-foreground">+{ch.batches.length - 3}</span>}
                </div>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => { e.preventDefault(); setEditTarget(ch); setModal(true) }}
                  className="rounded-full p-1.5 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20 transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setDeleteTarget(ch) }}
                  className="rounded-full p-1.5 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ChapterModal
        open={modal}
        onClose={() => setModal(false)}
        chapter={editTarget}
        courseCode={courseCode}
        universityId={universityId}
        departmentId={departmentId}
        batches={batches}
        onSuccess={() => { setModal(false); load() }}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget ? `Chapter ${deleteTarget.chapter_no}: "${deleteTarget.chapter_title}"` : ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
