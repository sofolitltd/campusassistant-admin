"use client"

import { useState } from "react"
import { api, Notice, getFullImageUrl } from "@/lib/api"
import { EmptyState, ConfirmDelete } from "./SharedUI"
import { NoticeModal } from "./NoticeModal"
import { Bell, Plus, Edit2, Trash2 } from "lucide-react"

export function NoticesTab({ notices, universityId, departmentId, onRefresh }: { notices: Notice[]; universityId: string; departmentId: string; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Notice | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!selected) return
    setLoading(true)
    try {
      await api.notices.delete(selected.id)
      onRefresh()
      setDeleteOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const sorted = [...notices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Department Notices</h3>
          <p className="text-xs text-muted-foreground">Announcements shown on the student notice board in the app.</p>
        </div>
        <button
          onClick={() => { setSelected(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Notice
        </button>
      </div>

      {!sorted.length ? (
        <EmptyState icon={Bell} label="notices" onAdd={() => { setSelected(null); setModalOpen(true) }} addLabel="Add Notice" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((n) => (
            <div key={n.id} className="group rounded-sm border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all relative">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => { setSelected(n); setModalOpen(true) }} className="p-1.5 bg-background/80 backdrop-blur-sm border rounded-sm hover:bg-background text-primary transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => { setSelected(n); setDeleteOpen(true) }} className="p-1.5 bg-background/80 backdrop-blur-sm border rounded-sm hover:bg-background text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>

              {n.image_urls?.[0] && (
                <div className="aspect-[16/9] w-full overflow-hidden border-b bg-muted/20">
                  <img src={getFullImageUrl(n.image_urls[0])} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm truncate" title={n.uploader}>{n.uploader}</p>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-tighter whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoticeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        notice={selected}
        universityId={universityId}
        departmentId={departmentId}
        onSuccess={onRefresh}
      />

      <ConfirmDelete
        open={deleteOpen}
        label="Notice"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  )
}
