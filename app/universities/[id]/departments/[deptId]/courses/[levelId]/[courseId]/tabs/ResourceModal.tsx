"use client"

import React, { useState, useEffect, useRef } from "react"
import { api, Resource, ResourceType, Batch } from "@/lib/api"
import { 
  X, Plus, Users, HardDrive, FilePlus2, BookOpen, Loader2, AlertTriangle 
} from "lucide-react"
import { BatchSelectionModal } from "@/components/BatchSelectionModal"
import { uploadFile, deleteFile } from "./resource-utils"
import { cn } from "@/lib/utils"

const TYPE_LABELS: Record<ResourceType, string> = {
  book: "Book",
  question: "Question Paper",
  syllabus: "Syllabus",
  note: "Note",
  video: "Video Lecture",
  research: "Research Paper",
}

function fmtBytes(b: number) {
  if (!b) return ""
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export function ResourceModal({ open, onClose, resource, type, courseCode, universityId, departmentId, lessonNo, batches, onSuccess }: {
  open: boolean; onClose: () => void
  resource?: Resource | null
  type: ResourceType; courseCode: string; universityId: string; departmentId: string; lessonNo?: number
  batches: Batch[]; onSuccess: () => void
}) {
  const isEdit = !!resource
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fileUrl, setFileUrl] = useState("")      
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [accessLevel, setAccessLevel] = useState<"basic" | "pro">("basic")
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])
  const [tags, setTags] = useState("")
  const [metaAuthor, setMetaAuthor] = useState("")
  const [metaPublisher, setMetaPublisher] = useState("")
  const [metaEdition, setMetaEdition] = useState("")
  const [metaExamType, setMetaExamType] = useState("")
  const [metaYear, setMetaYear] = useState("")
  const [metaAcadYear, setMetaAcadYear] = useState("")
  const [metaDuration, setMetaDuration] = useState("")
  const [metaPages, setMetaPages] = useState("")
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setError("")
      const meta = (resource?.metadata ?? {}) as Record<string, any>
      setTitle(resource?.title ?? "")
      setDescription(resource?.description ?? "")
      setFileUrl(resource?.file_url ?? "")
      setPickedFile(null)
      setThumbnailUrl(resource?.thumbnail_url ?? "")
      setAccessLevel(resource?.access_level ?? "basic")
      setSelectedBatchIds(resource?.batches?.map((b) => b.id) ?? [])
      setTags((resource?.tags ?? []).join(", "))
      setMetaAuthor(meta.author ?? "")
      setMetaPublisher(meta.publisher ?? "")
      setMetaEdition(meta.edition ?? "")
      setMetaExamType(meta.exam_type ?? "")
      setMetaYear(meta.year ? String(meta.year) : "")
      setMetaAcadYear(meta.academic_year ?? "")
      setMetaDuration(meta.duration ?? "")
      setMetaPages(meta.pages ? String(meta.pages) : "")
      setThumbnailBlob(null)
    }
  }, [open, resource])

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      let finalTitle = title.trim()
      let finalUrl = fileUrl
      let finalThumbUrl = thumbnailUrl

      if (type === "video" && !finalTitle && finalUrl) {
        try {
          const res = await fetch(`https://www.youtube.com/oembed?url=${finalUrl}&format=json`)
          const data = await res.json()
          if (data.title) finalTitle = data.title
        } catch (err) {}
      }

      if (type !== "video" && !finalTitle) {
        setError("Title is required")
        setLoading(false)
        return
      }

      setUploading(true)
      if (isEdit && pickedFile && fileUrl) await deleteFile(fileUrl)
      if (isEdit && thumbnailBlob && thumbnailUrl) await deleteFile(thumbnailUrl)

      if (pickedFile) {
        finalUrl = await uploadFile(pickedFile, "resources")
      }
      if (thumbnailBlob) {
        finalThumbUrl = await uploadFile(thumbnailBlob, "thumbnails", "thumb.webp")
      }
      setUploading(false)

      const meta: Record<string, any> = (resource?.metadata ?? {})
      if (type === "book") { if (metaAuthor) meta.author = metaAuthor; if (metaPublisher) meta.publisher = metaPublisher; if (metaEdition) meta.edition = metaEdition }
      if (type === "question") { if (metaExamType) meta.exam_type = metaExamType; if (metaYear) meta.year = parseInt(metaYear) }
      if (type === "syllabus") { if (metaAcadYear) meta.academic_year = metaAcadYear }
      if (type === "video") { if (metaDuration) meta.duration = metaDuration }
      if (metaPages) meta.pages = parseInt(metaPages)

      const payload: Partial<Resource> & { batch_ids?: string[]; file_size_bytes?: number; lesson_no?: number } = {
        type, title: finalTitle || "Untitled Video", description: description.trim(),
        course_code: courseCode,
        file_url: finalUrl,
        thumbnail_url: finalThumbUrl.trim(),
        access_level: accessLevel,
        university_id: universityId,
        department_id: departmentId,
        status: "published",
        lesson_no: lessonNo,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        metadata: { ...meta, is_edited: isEdit ? true : meta.is_edited },
        batch_ids: selectedBatchIds,
        file_size_bytes: pickedFile?.size ?? undefined,
      }
      if (isEdit) { await api.resources.update(resource!.id, payload) }
      else { await api.resources.create(payload) }
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPickedFile(file)
    setThumbnailBlob(null)
    
    if (file.type === "application/pdf") {
      try {
        const { generatePdfMetadata } = await import("@/lib/pdf-helper")
        const { thumbnail, pageCount } = await generatePdfMetadata(file)
        setThumbnailBlob(thumbnail)
        if (pageCount) setMetaPages(String(pageCount))
      } catch (err) {
        console.error("PDF Preview failed:", err)
      }
    }
  }

  if (!open) return null

  const inputCls = "w-full rounded-sm border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-all"
  const labelCls = "text-xs font-black uppercase tracking-widest text-muted-foreground/60"
  const selectCls = "w-full rounded-sm border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex h-full w-full max-w-md flex-col bg-background shadow-2xl animate-in slide-in-from-right duration-500 border-l">
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="rounded-sm bg-primary/10 p-2"><FilePlus2 className="h-5 w-5 text-primary" /></div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">{isEdit ? "Edit" : "Add"} {TYPE_LABELS[type]}</h2>
              <p className="text-[10px] text-muted-foreground font-medium">COURSE: {courseCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-all text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-4">
            <div className="rounded-sm border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-1 transition-all hover:border-primary/40 group overflow-hidden">
              {pickedFile || fileUrl ? (
                <div className="relative flex items-center gap-4 p-3 bg-background rounded-sm shadow-sm border animate-in zoom-in-95">
                  <div className="w-16 h-20 bg-muted shrink-0 rounded-sm overflow-hidden border shadow-inner flex items-center justify-center relative">
                    {thumbnailBlob ? (
                      <img src={URL.createObjectURL(thumbnailBlob)} className="h-full w-full object-cover" />
                    ) : thumbnailUrl ? (
                      <img src={thumbnailUrl} className="h-full w-full object-cover" />
                    ) : (
                      <HardDrive className="h-6 w-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate pr-8">{pickedFile?.name || (fileUrl ? "Current Attached File" : "No File")}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {pickedFile && <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">{fmtBytes(pickedFile.size)}</span>}
                      {metaPages && <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><BookOpen className="h-3 w-3" /> {metaPages} Pages</span>}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setPickedFile(null); setFileUrl(""); setThumbnailBlob(null); setThumbnailUrl("") }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center py-10 gap-3 group/btn"
                >
                  <div className="rounded-full bg-primary/10 p-4 group-hover/btn:scale-110 transition-transform shadow-sm">
                    <HardDrive className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">Choose Resource File</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">PDF, DOCX, ZIP or IMAGE</p>
                  </div>
                </button>
              )}
              <input ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden" />
            </div>

            {type === "video" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className={labelCls}>YouTube URL</label>
                <div className="relative">
                  <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={cn(inputCls, "pl-10")} />
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-1.5">
              <label className={labelCls}>Resource Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a descriptive title..." className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Brief Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's inside this resource?" className={cn(inputCls, "min-h-[80px] resize-none")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {type === "book" && (
              <>
                <div className="space-y-1.5">
                  <label className={labelCls}>Author</label>
                  <input value={metaAuthor} onChange={(e) => setMetaAuthor(e.target.value)} placeholder="Writer name" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Edition</label>
                  <input value={metaEdition} onChange={(e) => setMetaEdition(e.target.value)} placeholder="e.g. 5th" className={inputCls} />
                </div>
              </>
            )}
            {type === "question" && (
              <div className="space-y-1.5">
                <label className={labelCls}>Exam Type</label>
                <select value={metaExamType} onChange={(e) => setMetaExamType(e.target.value)} className={selectCls}>
                  <option value="">Select...</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="ct">Class Test</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Access Level</label>
            <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as any)} className={selectCls}>
              <option value="basic">Basic (Free)</option>
              <option value="pro">Pro (Subscribers only)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Tags <span className="text-[10px] text-muted-foreground font-normal">(comma-separated)</span></label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. midterm, important, 2023" className={inputCls} />
          </div>

          <div className="space-y-1.5 pt-4 border-t">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              <span>Assign to Batches</span>
              <span className="text-[10px] font-black text-primary/60">{selectedBatchIds.length} Selected</span>
            </label>
            
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
              </div>
            )}
          </div>

          {error && <p className="rounded-sm bg-red-50 dark:bg-red-900/20 p-3 text-xs font-bold text-red-500 border border-red-100 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>}
        </form>

        <div className="mt-auto border-t p-5 flex items-center justify-end gap-3 shrink-0 bg-muted/5">
          <button type="button" onClick={onClose} className="rounded-sm px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || uploading} className="flex items-center gap-2 rounded-sm bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md active:scale-95">
            {(loading || uploading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Update Resource" : "Add Resource"}
          </button>
        </div>
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
