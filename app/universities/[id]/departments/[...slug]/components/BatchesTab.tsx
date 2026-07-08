"use client"

import { useState, useCallback } from "react"
import { api, Batch } from "@/lib/api"
import { Badge, ConfirmDelete, inputCls } from "./SharedUI"
import { BatchModal } from "./BatchModal"
import { Layers, Plus, Pencil, Trash2, Search, Clock } from "lucide-react"
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

  const handleDelete = useCallback(async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try { await api.batches.delete(deleting.id); onRefresh() }
    catch (e) { console.error(e) }
    finally { setDeleteLoading(false); setDeleting(null) }
  }, [deleting, onRefresh])

  const filtered = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase())
  )
  const sorted = [...filtered].sort((a, b) => b.name.localeCompare(a.name))

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
      
      <ConfirmDelete 
        open={!!deleting} 
        label={`"${deleting?.name}"`}
        onClose={() => setDeleting(null)} 
        onConfirm={handleDelete} 
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
            className="flex items-center gap-2 rounded-sm bg-primary px-3 md:px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all shadow-sm h-10 shrink-0"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Batch</span>
          </button>
        </div>
      </div>

      {!sorted.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-sm border border-dashed bg-muted/30">
          <Layers className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">{search ? "No matches found" : "No batches added yet"}</p>
          {!search && (
            <button onClick={() => setModalOpen(true)} className="mt-4 text-sm font-bold text-primary hover:underline">Add First Batch</button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((b) => (
            <div key={b.id} className={cn("relative rounded-sm border p-3 hover:shadow-md transition-all group bg-card")}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="font-bold truncate text-sm">{b.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => { setEditing(b); setModalOpen(true) }} 
                    className="p-1.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs" 
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeleting(b)} 
                    className="p-1.5 rounded-sm border bg-background hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all shadow-xs" 
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded-xs tracking-tighter">{b.slug}</p>
                <Badge variant={b.is_studying ? "success" : "danger"} className="text-[9px] px-2 py-1 leading-tight">
                  {b.is_studying ? "Studying" : "Completed"}
                </Badge>
              </div>

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
