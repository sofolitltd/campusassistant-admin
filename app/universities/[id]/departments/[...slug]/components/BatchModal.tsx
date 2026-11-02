"use client"

import { useState, useEffect, useRef } from "react"
import { api, Batch, BatchProgram, BATCH_PROGRAM_LABEL, Session, getFullImageUrl } from "@/lib/api"
import { Modal, Field, inputCls, Badge } from "./SharedUI"
import { Loader2, ToggleLeft, ToggleRight, X, Search, CheckCircle2, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { compressBatchCover } from "@/lib/image-helper"
import { uploadFile, deleteFile } from "@/lib/upload-utils"

interface SessionSelectorTriggerProps {
  allSessions: Session[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  loading: boolean
}

function SessionSelectorTrigger({ allSessions, selectedIds, onToggle, loading }: SessionSelectorTriggerProps) {
  const [open, setOpen] = useState(false)
  const selectedList = allSessions.filter(s => selectedIds.has(s.id))

  return (
    <>
      <div 
        onClick={() => !loading && setOpen(true)}
        className={cn(inputCls, "min-h-[42px] h-auto flex flex-wrap gap-1.5 cursor-pointer py-2 px-3 hover:bg-accent/50 transition-colors", loading && "opacity-50 cursor-wait")}
      >
        {loading ? (
          <span className="text-muted-foreground animate-pulse text-xs">Fetching sessions...</span>
        ) : selectedList.length === 0 ? (
          <span className="text-muted-foreground text-sm">Select sessions...</span>
        ) : (
          selectedList.map(s => (
            <span key={s.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1 border border-primary/20">
              {s.name}
              <button key={`rem-${s.id}`} onClick={(e) => { e.stopPropagation(); onToggle(s.id) }} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Choose Academic Sessions"> 
        <div className="space-y-4 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              autoFocus
              type="text" 
              placeholder="Search by year..." 
              className={cn(inputCls, "pl-10")} 
              onChange={(e) => {
                const q = e.target.value.toLowerCase()
                document.querySelectorAll(".bulk-session-item").forEach((el: any) => {
                  el.style.display = el.textContent.toLowerCase().includes(q) ? "flex" : "none"
                })
              }}
            />
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 pr-1 scrollbar-hide">
            {allSessions.length === 0 && !loading && (
              <div className="col-span-full py-10 text-center text-muted-foreground text-sm">No sessions available.</div>
            )}
            {allSessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                className={cn(
                  "bulk-session-item flex items-center justify-between rounded-sm border p-3 text-sm font-medium transition-all text-left",
                  selectedIds.has(s.id) 
                    ? "border-primary bg-primary/5 text-primary shadow-sm" 
                    : "hover:bg-muted border-border"
                )}
              >
                <span>{s.name}</span>
                {selectedIds.has(s.id) && <CheckCircle2 className="h-4 w-4" />}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
              Done ({selectedIds.size})
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// "Batch 10" / "Masters Batch 10" and "batch-10" / "masters-batch-10" — the
// slug must differ because it's unique per department.
const NAME_PREFIX: Record<BatchProgram, string> = { honours: "Batch", masters: "Masters Batch" }
const SLUG_PREFIX: Record<BatchProgram, string> = { honours: "batch", masters: "masters-batch" }
const stripPrefix = (name?: string) => (name ?? "").replace(/^(Masters )?Batch /, "")
const slugify = (val: string) => val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

interface BatchModalProps {
  open: boolean
  onClose: () => void
  universityId: string
  departmentId: string
  batch?: Batch | null
  onSuccess: () => void
}

export function BatchModal({
  open, onClose, universityId, departmentId, batch, onSuccess,
}: BatchModalProps) {
  const isEdit = !!batch
  const [program, setProgram] = useState<BatchProgram>(batch?.program ?? "honours")
  const [batchNumber, setBatchNumber] = useState(stripPrefix(batch?.name))
  const [slug, setSlug] = useState(batch?.slug ?? "")
  const [isStudying, setIsStudying] = useState(batch?.is_studying ?? true)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    new Set(batch?.sessions?.map((s) => s.id) ?? [])
  )
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // Cover photo: the saved URL, or a freshly compressed blob waiting to be
  // uploaded on submit. Nothing reaches R2 until the form is saved.
  const [imageUrl, setImageUrl] = useState(batch?.image_url ?? "")
  const [picked, setPicked] = useState<{ blob: Blob; previewUrl: string } | null>(null)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Release the preview's object URL when it's replaced or the modal unmounts.
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.previewUrl) }, [picked])

  useEffect(() => {
    if (open) {
      setProgram(batch?.program ?? "honours")
      setBatchNumber(stripPrefix(batch?.name))
      setSlug(batch?.slug ?? "")
      setIsStudying(batch?.is_studying ?? true)
      setSelectedSessionIds(new Set(batch?.sessions?.map((s) => s.id) ?? []))
      setImageUrl(batch?.image_url ?? "")
      setPicked(null)
      setError("")
      
      setSessionsLoading(true)
      api.sessions.getAll()
        .then(setAllSessions)
        .catch(() => { })
        .finally(() => setSessionsLoading(false))
    }
  }, [open, batch])

  // The slug follows the program and number, in edit too — switching a
  // batch from Honors to Masters must also move it to "masters-batch-N".
  function handleNumberChange(val: string) {
    setBatchNumber(val)
    setSlug(val ? `${SLUG_PREFIX[program]}-${slugify(val)}` : "")
  }

  function handleProgramChange(p: BatchProgram) {
    setProgram(p)
    setSlug(batchNumber ? `${SLUG_PREFIX[p]}-${slugify(batchNumber)}` : "")
  }

  function toggleSession(id: string) {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // so picking the same file again still fires
    if (!file) return
    if (!file.type.startsWith("image/")) { setError("Please choose an image file"); return }
    setCompressing(true); setError("")
    try {
      const blob = await compressBatchCover(file)
      setPicked({ blob, previewUrl: URL.createObjectURL(blob) })
    }
    catch (err: any) { setError(err.message) }
    finally { setCompressing(false) }
  }

  function handleImageRemove() {
    setPicked(null)
    setImageUrl("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    let uploadedUrl = ""
    try {
      if (!batchNumber.trim()) throw new Error("Batch number is required")
      if (picked) uploadedUrl = await uploadFile(picked.blob, "batches", "cover.webp")
      const finalImageUrl = uploadedUrl || imageUrl
      const payload = {
        name: `${NAME_PREFIX[program]} ${stripPrefix(batchNumber)}`, slug: slug.trim(), is_studying: isStudying, program,
        image_url: finalImageUrl,
        university_id: universityId, department_id: departmentId,
        session_ids: Array.from(selectedSessionIds),
      }
      if (isEdit) await api.batches.update(batch!.id, payload)
      else await api.batches.create(payload)
      // Replaced or removed: drop the old file so R2 doesn't keep orphans.
      if (batch?.image_url && batch.image_url !== finalImageUrl) await deleteFile(batch.image_url)
      onSuccess(); onClose()
    } catch (err: any) {
      // The save failed after the upload — the new file belongs to nothing.
      if (uploadedUrl) await deleteFile(uploadedUrl)
      setError(err.message)
    }
    finally { setLoading(false) }
  }

  const shownImage = picked?.previewUrl || getFullImageUrl(imageUrl)

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Batch" : "Add Batch"}>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <Field label="Program">
          <div className="flex bg-muted p-1 rounded-sm">
            {(Object.keys(BATCH_PROGRAM_LABEL) as BatchProgram[]).map((p) => (
              <button key={p} type="button" onClick={() => handleProgramChange(p)} className={cn("flex-1 text-sm py-1.5 rounded-sm font-bold transition-all", program === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {BATCH_PROGRAM_LABEL[p]}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-4">
          <div className="flex-1">
            <Field label="Prefix">
              <input value={NAME_PREFIX[program]} disabled className={cn(inputCls, "bg-muted cursor-not-allowed text-foreground/70")} />
            </Field>
          </div>
          <div className="flex-[2]">
            <Field label="Batch Number" required>
              <input value={batchNumber} onChange={(e) => handleNumberChange(e.target.value)} placeholder="e.g. 21" className={inputCls} />
            </Field>
          </div>
        </div>
        <Field label="Cover photo">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
          {shownImage ? (
            <div className="relative aspect-video overflow-hidden rounded-sm border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shownImage} alt="" className="h-full w-full object-cover" />
              <div className="absolute right-2 top-2 flex gap-1.5">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={compressing}
                  className="rounded-sm bg-background/90 px-2 py-1 text-xs font-medium shadow-sm hover:bg-background">
                  Change
                </button>
                <button type="button" onClick={handleImageRemove} disabled={compressing}
                  className="rounded-sm bg-background/90 p-1 text-destructive shadow-sm hover:bg-background" title="Remove">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {picked && (
                <span className="absolute bottom-2 left-2 rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  WebP · {Math.round(picked.blob.size / 1024)} KB
                </span>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={compressing}
              className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed bg-muted/30 text-muted-foreground hover:bg-muted/60 transition-colors">
              {compressing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <span className="text-xs font-medium">{compressing ? "Compressing…" : "Add a batch photo"}</span>
              <span className="text-[10px]">Cropped to 16:9 and compressed to WebP</span>
            </button>
          )}
        </Field>
        <Field label="Slug">
          <input value={slug} readOnly className={cn(inputCls, "bg-muted cursor-not-allowed")} />
        </Field>
        <Field label="Sessions">
          <SessionSelectorTrigger 
            allSessions={allSessions}
            selectedIds={selectedSessionIds}
            onToggle={toggleSession}
            loading={sessionsLoading}
          />
        </Field>
        <div className="flex items-center justify-between rounded-sm border p-3">
          <div>
            <span className="text-sm font-medium block">On campus</span>
            <span className="text-[10px] text-muted-foreground">Off = the whole batch has graduated. Their study content stays visible in the app.</span>
          </div>
          <button type="button" onClick={() => setIsStudying(!isStudying)} className="transition-all">
            {isStudying ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
          </button>
        </div>
        {error && <p className="text-sm text-destructive rounded-sm bg-destructive-subtle p-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="submit" disabled={loading || compressing} className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? "Update" : "Add Batch"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
