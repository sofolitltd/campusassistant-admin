"use client"

import { useState, useEffect } from "react"
import { api, Batch, Session } from "@/lib/api"
import { Modal, Field, inputCls, Badge } from "./SharedUI"
import { Loader2, ToggleLeft, ToggleRight, X, Search, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
              <button key={`rem-${s.id}`} onClick={(e) => { e.stopPropagation(); onToggle(s.id) }} className="hover:text-red-500">
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
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
              Done ({selectedIds.size})
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

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
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [batchNumber, setBatchNumber] = useState(batch?.name?.replace("Batch ", "") ?? "")
  const [bulkStart, setBulkStart] = useState("")
  const [bulkEnd, setBulkEnd] = useState("")
  const [slug, setSlug] = useState(batch?.slug ?? "")
  const [isStudying, setIsStudying] = useState(batch?.is_studying ?? true)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    new Set(batch?.sessions?.map((s) => s.id) ?? [])
  )
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setBatchNumber(batch?.name?.replace("Batch ", "") ?? "")
      setSlug(batch?.slug ?? "")
      setIsStudying(batch?.is_studying ?? true)
      setSelectedSessionIds(new Set(batch?.sessions?.map((s) => s.id) ?? []))
      setBulkStart(""); setBulkEnd(""); setMode("single"); setError("")
      
      setSessionsLoading(true)
      api.sessions.getAllByUniversity(universityId)
        .then((data) => setAllSessions([...data].sort((a, b) => b.name.localeCompare(a.name))))
        .catch(() => { })
        .finally(() => setSessionsLoading(false))
    }
  }, [open, batch, universityId])

  function handleNumberChange(val: string) {
    setBatchNumber(val)
    if (!isEdit) setSlug(`batch-${val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`)
  }

  function toggleSession(id: string) {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      if (mode === "single") {
        if (!batchNumber.trim()) throw new Error("Batch number is required")
        const finalName = batchNumber.startsWith("Batch ") ? batchNumber : `Batch ${batchNumber}`
        const payload = {
          name: finalName, slug: slug.trim(), is_studying: isStudying,
          university_id: universityId, department_id: departmentId,
          session_ids: Array.from(selectedSessionIds),
        }
        if (isEdit) await api.batches.update(batch!.id, payload)
        else await api.batches.create(payload)
      } else {
        const start = parseInt(bulkStart)
        const end = parseInt(bulkEnd)
        if (isNaN(start) || isNaN(end)) throw new Error("Please enter valid numbers")
        if (start > end) throw new Error("Start must be smaller than end")
        
        const promises = []
        for (let i = start; i <= end; i++) {
          promises.push(api.batches.create({
            name: `Batch ${i}`,
            slug: `batch-${i}`,
            is_studying: isStudying,
            university_id: universityId,
            department_id: departmentId,
            session_ids: Array.from(selectedSessionIds),
          }))
        }
        await Promise.all(promises)
      }
      onSuccess(); onClose()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Batch" : "Add Batch"}>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        {!isEdit && (
          <div className="flex bg-muted p-1 rounded-sm mb-4">
            <button type="button" onClick={() => setMode("single")} className={cn("flex-1 text-sm py-1.5 rounded-sm font-bold transition-all", mode === "single" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Single Add</button>
            <button type="button" onClick={() => setMode("bulk")} className={cn("flex-1 text-sm py-1.5 rounded-sm font-bold transition-all", mode === "bulk" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Bulk Auto-Generate</button>
          </div>
        )}

        {mode === "single" ? (
          <>
            <div className="flex gap-4">
              <div className="flex-1">
                <Field label="Prefix">
                  <input value="Batch" disabled className={cn(inputCls, "bg-muted cursor-not-allowed text-foreground/70")} />
                </Field>
              </div>
              <div className="flex-[2]">
                <Field label="Batch Number" required>
                  <input value={batchNumber} onChange={(e) => handleNumberChange(e.target.value)} placeholder="e.g. 21" className={inputCls} />
                </Field>
              </div>
            </div>
            <Field label="Slug">
              <input value={slug} readOnly className={cn(inputCls, "bg-muted cursor-not-allowed")} />
            </Field>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
             <Field label="Start Batch (Number)" required>
                <input type="text" inputMode="numeric" value={bulkStart} onChange={(e) => setBulkStart(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 18" className={inputCls} />
             </Field>
             <Field label="End Batch (Number)" required>
                <input type="text" inputMode="numeric" value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 24" className={inputCls} />
             </Field>
          </div>
        )}
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
            <span className="text-sm font-medium block">Is Studying</span>
            <span className="text-[10px] text-muted-foreground">Is this batch currently active?</span>
          </div>
          <button type="button" onClick={() => setIsStudying(!isStudying)} className="transition-all">
            {isStudying ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 rounded-sm bg-red-50 dark:bg-red-900/20 p-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? "Update" : mode === "bulk" ? "Generate Batches" : "Add Batch"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
