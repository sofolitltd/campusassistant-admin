"use client"

import { useState, useCallback, useEffect } from "react"
import { api, Batch, BatchProgram, BATCH_PROGRAM_LABEL, Level, getFullImageUrl } from "@/lib/api"
import { Badge, ConfirmDelete, inputCls } from "./SharedUI"
import { BatchModal } from "./BatchModal"
import { PromoteModal } from "./PromoteModal"
import { CopySyllabusModal } from "./CopySyllabusModal"
import { Layers, Plus, Pencil, Trash2, Search, Clock, UserPlus, BookOpen, CopyPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface BatchesTabProps {
  batches: Batch[]
  universityId: string
  departmentId: string
  onRefresh: () => void
}

export function BatchesTab({ batches, universityId, departmentId, onRefresh }: BatchesTabProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [deleting, setDeleting] = useState<Batch | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [promoting, setPromoting] = useState<Batch | null>(null)
  const [copyingSyllabus, setCopyingSyllabus] = useState<Batch | null>(null)
  const [notice, setNotice] = useState("")
  const [programTab, setProgramTab] = useState<BatchProgram>("honours")
  // Study content per batch = the levels linked to it. The app's Study
  // picker shows exactly these batches; "On campus" doesn't affect it.
  const [levels, setLevels] = useState<Level[] | null>(null)

  useEffect(() => {
    let cancelled = false
    api.levels.getAllByDepartment(departmentId)
      .then((l) => !cancelled && setLevels(l))
      .catch(() => !cancelled && setLevels(null))
    return () => { cancelled = true }
  }, [departmentId, batches])

  const levelsOf = (batchId: string) =>
    (levels ?? []).filter((l) => l.batches?.some((b) => b.id === batchId)).sort((a, b) => a.order - b.order)

  const handleDelete = useCallback(async (permanent = false) => {
    if (!deleting) return
    setDeleteLoading(true)
    try { await api.batches.delete(deleting.id); if (permanent) await api.trash.purgeDeleted("batches", deleting.id); onRefresh() }
    catch (e) { console.error(e) }
    finally { setDeleteLoading(false); setDeleting(null) }
  }, [deleting, onRefresh])

  const filtered = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase())
  )
  const batchNumber = (b: Batch) => parseInt(b.name.match(/\d+/)?.[0] ?? b.slug.match(/\d+/)?.[0] ?? "0", 10)
  const sorted = [...filtered].sort((a, b) => batchNumber(b) - batchNumber(a))
  // Honors | Masters tabs, shown only once the department has more than one
  // program, so Honors-only departments look unchanged. Counts ignore the
  // search so a tab doesn't vanish while typing.
  const programOf = (b: Batch): BatchProgram => b.program ?? "honours"
  const programs = (Object.keys(BATCH_PROGRAM_LABEL) as BatchProgram[])
    .filter((p) => batches.some((b) => programOf(b) === p))
  const program = programs.includes(programTab) ? programTab : (programs[0] ?? "honours")
  const items = sorted.filter((b) => programOf(b) === program)

  return (
    <>
      <BatchModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditing(null) }}
        universityId={universityId} 
        departmentId={departmentId} 
        batch={editing} 
        onSuccess={onRefresh} 
      />
      
      <PromoteModal
        open={!!promoting}
        onClose={() => setPromoting(null)}
        target={promoting}
        batches={batches}
        onSuccess={(n) => { setNotice(`${n} student${n === 1 ? "" : "s"} moved into ${promoting?.name}`); onRefresh() }}
      />

      <CopySyllabusModal
        open={!!copyingSyllabus}
        onClose={() => setCopyingSyllabus(null)}
        target={copyingSyllabus}
        batches={batches}
        onSuccess={(msg) => { setNotice(msg); onRefresh() }}
      />

      <ConfirmDelete 
        open={!!deleting} 
        label={`"${deleting?.name}"`}
        onClose={() => setDeleting(null)} 
        trashType="batches" onConfirm={handleDelete} 
        loading={deleteLoading} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold">Academic Batches</h3>
          <p className="text-sm text-muted-foreground">Manage and organize batches</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputCls, "pl-10 w-full h-10")}
            />
          </div>
          <button 
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary-gradient px-3 md:px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all shadow-sm h-10 shrink-0"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Batch</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-sm bg-success-subtle px-3 py-2 text-sm text-success">
          {notice}
          <button onClick={() => setNotice("")} className="text-xs font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {programs.length > 1 && (
        <div className="mb-4 flex w-fit bg-muted p-1 rounded-sm">
          {programs.map((p) => (
            <button key={p} type="button" onClick={() => setProgramTab(p)}
              className={cn("px-4 text-sm py-1.5 rounded-sm font-bold transition-all", program === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {BATCH_PROGRAM_LABEL[p]}
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">{batches.filter((b) => programOf(b) === p).length}</span>
            </button>
          ))}
        </div>
      )}

      {!items.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-sm border border-dashed bg-muted/30">
          <Layers className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">{search ? "No matches found" : "No batches added yet"}</p>
          {!search && (
            <button onClick={() => setModalOpen(true)} className="mt-4 text-sm font-bold text-primary hover:underline">Add First Batch</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => (
            <div key={b.id} className={cn("relative rounded-sm border p-3 hover:shadow-md transition-all group bg-card")}>
              <div className="-mx-3 -mt-3 mb-3 aspect-video overflow-hidden rounded-t-sm border-b bg-primary-subtle">
                {b.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getFullImageUrl(b.image_url)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-black text-primary/40">
                    {batchNumber(b) || "—"}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="font-bold truncate text-sm">{b.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {program === "masters" && (
                    <button onClick={() => setPromoting(b)}
                      className="p-1.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs"
                      title="Import students from Honors"
                    >
                      <UserPlus className="h-3 w-3" />
                    </button>
                  )}
                  <button onClick={() => setCopyingSyllabus(b)}
                    className="p-1.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs"
                    title="Copy syllabus from another batch"
                  >
                    <CopyPlus className="h-3 w-3" />
                  </button>
                  <button onClick={() => { setEditing(b); setModalOpen(true) }} 
                    className="p-1.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs" 
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeleting(b)} 
                    className="p-1.5 rounded-sm border bg-background hover:bg-destructive-subtle text-muted-foreground hover:text-destructive transition-all shadow-xs" 
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded-xs tracking-tighter">{b.slug}</p>
                <Badge variant={b.is_studying ? "success" : "danger"} className="text-[9px] px-2 py-1 leading-tight">
                  {b.is_studying ? "On campus" : "Graduated"}
                </Badge>
              </div>

              {levels && (() => {
                const own = levelsOf(b.id)
                return (
                  <p className={cn("mt-2 text-[10px] line-clamp-1 flex items-center gap-1", own.length ? "text-muted-foreground" : "text-warning")}>
                    <BookOpen className="h-3 w-3 opacity-60 shrink-0" />
                    {own.length ? own.map((l) => l.name).join(" · ") : "No study content — hidden in app Study"}
                  </p>
                )
              })()}

              {b.sessions?.length ? (
                <div className="mt-3 pt-2 border-t border-dashed border-muted-foreground/20">
                  <p className="text-[10px] text-muted-foreground line-clamp-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 opacity-50" />
                    {b.sessions.map((s) => s.name).join(" · ")}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
