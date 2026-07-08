"use client"

import { useState, useEffect } from "react"
import { api, Course, CourseCategory, CoursePrefix, Semester, Batch } from "@/lib/api"
import { Loader2, Plus, Users, X, HardDrive, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadFile, deleteFile } from "@/lib/upload-utils"
import { BatchSelectionModal } from "@/components/BatchSelectionModal"
import { optimizeImage } from "@/lib/image-helper"
import React from "react"

// ─── Inline SharedUI primitives (modal is in a different route directory) ───────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full sm:max-w-xl rounded-sm border bg-card shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-all text-muted-foreground">✕</button>
        </div>
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}
const inputCls = "w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
const selectCls = "w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

interface CourseModalProps {
  open: boolean
  onClose: () => void
  universityId: string
  departmentId: string
  semesterId: string
  course?: Course | null
  categories: CourseCategory[]
  prefixes: CoursePrefix[]
  semesters: Semester[]
  batches: Batch[]
  onSuccess: () => void
}

export function CourseModal({
  open, onClose, universityId, departmentId, semesterId,
  course, categories, prefixes, semesters, batches, onSuccess,
}: CourseModalProps) {
  const isEdit = !!course

  const [selectedPrefix, setSelectedPrefix] = useState("")
  const [codeNumber, setCodeNumber] = useState("")
  const [title, setTitle] = useState("")
  const [credits, setCredits] = useState("")
  const [marks, setMarks] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [semId, setSemId] = useState(semesterId)
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [urlToDelete, setUrlToDelete] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setError("")
      if (course) {
        // Split existing code into prefix + number if it contains "-"
        const parts = course.course_code.split("-")
        if (parts.length >= 2 && prefixes.some((p) => p.prefix === parts[0])) {
          setSelectedPrefix(parts[0])
          setCodeNumber(parts.slice(1).join("-"))
        } else {
          setSelectedPrefix("")
          setCodeNumber(course.course_code)
        }
        setTitle(course.course_title)
        setCredits(course.total_credits?.toString() ?? "")
        setMarks(course.total_marks?.toString() ?? "")
        setCategoryId(course.course_category_id ?? "")
        setSemId(course.semester_id ?? semesterId)
        setSelectedBatchIds(course.batches?.map((b) => b.id) ?? [])
        setThumbnailUrl(course.thumbnail_url ?? "")
        setPickedFile(null)
        setThumbnailBlob(null)
        setUrlToDelete(null)
      } else {
        setSelectedPrefix(prefixes.length > 0 ? prefixes[0].prefix : "")
        setCodeNumber(""); setTitle(""); setCredits(""); setMarks("")
        setCategoryId(categories.length > 0 ? categories[0].id : "")
        setSemId(semesterId); setSelectedBatchIds([]); setThumbnailUrl("")
        setPickedFile(null)
        setThumbnailBlob(null)
        setUrlToDelete(null)
      }
    }
  }, [open, course, prefixes, categories, semesterId])

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Course title is required"); return }
    if (!codeNumber.trim()) { setError("Course code/number is required"); return }
    if (!categoryId) { setError("Please select a category"); return }
    if (!semId) { setError("Please select a semester"); return }

      setLoading(true); setError("")
      try {
        let finalUrl = thumbnailUrl

        if (thumbnailBlob) {
          setUploading(true)
          // Use the original URL for deletion if we're replacing it
          const targetDelete = urlToDelete || (isEdit ? thumbnailUrl : null)
          if (targetDelete) {
            await deleteFile(targetDelete).catch(console.error)
          }
          finalUrl = await uploadFile(thumbnailBlob, "courses", "thumb.webp")
          setUploading(false)
        } else if (urlToDelete) {
          // Case where user removed image but didn't pick a new one
          await deleteFile(urlToDelete).catch(console.error)
          finalUrl = ""
        }

        let finalCode = codeNumber.trim().toUpperCase()
        if (selectedPrefix && !finalCode.startsWith(`${selectedPrefix}-`)) {
          finalCode = `${selectedPrefix}-${finalCode}`
        }

        const payload: Partial<Course> & { batch_ids?: string[] } = {
          course_code: finalCode,
          course_title: title.trim(),
          university_id: universityId,
          department_id: departmentId,
          total_credits: parseFloat(credits) || 0,
          total_marks: parseInt(marks) || 0,
          course_category_id: categoryId || undefined,
          semester_id: semId || undefined,
          thumbnail_url: finalUrl,
          batch_ids: selectedBatchIds,
        }

      console.log("[CourseModal] Update payload:", JSON.stringify(payload, null, 2))
      if (isEdit) {
        await api.courses.update(course!.id, payload)
      } else {
        await api.courses.create(payload)
      }
      onSuccess(); onClose()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setUploading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPickedFile(file)
    try {
      const optimized = await optimizeImage(file)
      setThumbnailBlob(optimized)
    } catch (err) {
      console.error("Optimization failed:", err)
      // Fallback to original if optimization fails for some reason
      setThumbnailBlob(file)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Course" : "Add Course"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">

        {/* Code row: prefix + number */}
        <div className={cn("grid gap-3", prefixes.length > 0 ? "grid-cols-[1fr_2fr]" : "grid-cols-1")}>
          {prefixes.length > 0 && (
            <Field label="Prefix">
              <select value={selectedPrefix} onChange={(e) => setSelectedPrefix(e.target.value)} className={selectCls}>
                <option value="">No prefix</option>
                {prefixes.map((p) => <option key={p.id} value={p.prefix}>{p.prefix}</option>)}
              </select>
            </Field>
          )}
          <Field label="Code / Number" required>
            <input
              value={codeNumber}
              onChange={(e) => setCodeNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 101"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Title */}
        <Field label="Course Title" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to Programming" className={inputCls} />
        </Field>

        {/* Credits + Marks */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Credits">
            <input type="number" min={0} step={0.5} value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="0.0" className={inputCls} />
          </Field>
          <Field label="Total Marks">
            <input type="number" min={0} value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="0" className={inputCls} />
          </Field>
        </div>

        {/* Category & Semester in a Row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" required>
            {categories.length === 0 ? (
              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-sm p-2">No categories yet.</p>
            ) : (
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </Field>

          <Field label="Semester" required>
            <select value={semId} onChange={(e) => setSemId(e.target.value)} className={selectCls}>
              <option value="">Select semester…</option>
              {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>

        {/* Thumbnail Upload */}
        <Field label="Course Thumbnail">
          <div className="rounded-sm border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-1 hover:border-primary/40 transition-all overflow-hidden">
            {pickedFile || thumbnailUrl ? (
              <div className="relative flex items-center gap-4 p-3 bg-background rounded-sm shadow-sm border">
                <div className="w-16 h-20 bg-muted shrink-0 rounded-sm overflow-hidden border shadow-inner flex items-center justify-center relative">
                  {thumbnailBlob ? (
                    <img src={URL.createObjectURL(thumbnailBlob)} className="h-full w-full object-cover" />
                  ) : thumbnailUrl ? (
                    <img src={thumbnailUrl} className="h-full w-full object-cover" />
                  ) : pickedFile ? (
                    <img src={URL.createObjectURL(pickedFile)} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate pr-8">{pickedFile?.name || "Current Thumbnail"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                    {thumbnailBlob ? "Optimized WebP" : "Original Image"}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { 
                    if (thumbnailUrl) setUrlToDelete(thumbnailUrl)
                    setPickedFile(null); setThumbnailUrl(""); setThumbnailBlob(null) 
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-6 gap-2 group/btn"
              >
                <div className="rounded-full bg-primary/10 p-3 group-hover/btn:scale-110 transition-transform">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold">Upload Thumbnail</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">JPG or PNG preferred</p>
                </div>
              </button>
            )}
            <input ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden" accept="image/*" />
          </div>
        </Field>

        {/* Batches Selection (Enhanced UI) */}
        <Field label="Assign to Batches">
          <button 
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="w-full flex items-center justify-between rounded-sm border border-dashed border-muted-foreground/20 bg-muted/5 px-4 py-3 text-sm font-bold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all group"
          >
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <span>Select Batches</span>
            </div>
            <Plus className="h-4 w-4 opacity-40" />
          </button>

          {selectedBatchIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedBatchIds.map(id => {
                const b = batches.find(x => x.id === id)
                if (!b) return null
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-sm bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/10">
                    {b.name}
                    <button type="button" onClick={() => toggleBatch(id)} className="hover:text-red-500 transition-all"><X className="h-2.5 w-2.5" /></button>
                  </span>
                )
              })}
            </div>
          )}
        </Field>

        {error && <p className="rounded-sm bg-red-50 dark:bg-red-900/20 p-2 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="submit" disabled={loading || uploading}
            className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
            {(loading || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Update Course" : "Save Course"}
          </button>
        </div>
      </form>

      <BatchSelectionModal 
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        batches={batches}
        selectedIds={selectedBatchIds}
        onToggle={toggleBatch}
      />
    </Modal>
  )
}
