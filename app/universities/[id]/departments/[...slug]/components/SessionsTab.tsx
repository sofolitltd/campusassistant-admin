"use client"

import { useState, useCallback } from "react"
import { api, Session, Batch } from "@/lib/api"
import { Badge, ConfirmDelete, Modal, inputCls } from "./SharedUI"
import { SessionModal } from "./SessionModal"
import { Search, Plus, Clock, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SessionsTabProps {
  sessions: Session[]
  batches?: Batch[]
  universityId: string
  departmentId: string
  onRefresh: () => void
}

export function SessionsTab({ sessions, batches = [], universityId, departmentId, onRefresh }: SessionsTabProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState<Session | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [search, setSearch] = useState("")

  const handleDelete = useCallback(async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try { await api.sessions.delete(deleting.id); onRefresh() }
    catch (e) { console.error(e) }
    finally { setDeleteLoading(false); setDeleting(null) }
  }, [deleting, onRefresh])

  const filtered = sessions.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.slug.toLowerCase().includes(search.toLowerCase())
  )
  const sorted = [...filtered].sort((a, b) => b.name.localeCompare(a.name))

  const isCompact = sessions.length > 20

  return (
    <>
      <SessionModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditing(null) }}
        universityId={universityId} 
        departmentId={departmentId} 
        session={editing} 
        onSuccess={onRefresh}
        existingSessions={sessions} 
      />
      
      <ConfirmDelete 
        open={!!deleting} 
        label={`"${deleting?.name}" session`}
        onClose={() => setDeleting(null)} 
        onConfirm={handleDelete} 
        loading={deleteLoading} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 transition-all">
        <div>
          <h3 className="text-lg font-bold">Academic Sessions</h3>
          <p className="text-sm text-muted-foreground">Manage and organize sessions</p>
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
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Session</span>
          </button>
        </div>
      </div>

      {!sorted.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-sm border border-dashed bg-muted/30">
          <Clock className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">{search ? "No matches found" : "No sessions added yet"}</p>
        </div>
      ) : (
        <div className={cn("grid gap-4", isCompact ? "grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3")}>
          {sorted.map((s) => (
            <div key={s.id} className="relative rounded-sm border bg-card transition-all p-3 hover:shadow-md group">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="font-bold truncate text-sm">{s.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => { setEditing(s); setModalOpen(true) }} 
                    className="p-1.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs" 
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => setDeleting(s)} 
                    className="p-1.5 rounded-sm border bg-background hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all shadow-xs" 
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-xs tracking-tighter">{s.slug}</p>
                <Badge variant={s.is_active ? "success" : "default"} className="text-[9px] px-1.5 py-1 leading-tight">
                  {s.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
