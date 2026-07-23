"use client"

import { useState, useMemo } from "react"
import {
  PackageSearch,
  MapPin,
  Calendar,
  Trash2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Search,
} from "lucide-react"
import { api, LostFoundItem, LostFoundStatus, getFullImageUrl } from "@/lib/api"
import { ConfirmDelete } from "../universities/[id]/departments/[...slug]/components/SharedUI"
import { cn } from "@/lib/utils"

interface ItemsClientProps {
  initialItems: LostFoundItem[]
}

const STATUS_TABS: { label: string; value: LostFoundStatus | "all" }[] = [
  { label: "Open", value: "open" },
  { label: "Claimed", value: "claimed" },
  { label: "Resolved", value: "resolved" },
  { label: "Removed", value: "removed" },
  { label: "All", value: "all" },
]

const STATUS_BADGE: Record<LostFoundStatus, string> = {
  open: "bg-blue-500 text-white",
  claimed: "bg-amber-500 text-white",
  resolved: "bg-emerald-500 text-white",
  removed: "bg-red-500 text-white",
}

function RemoveModal({ open, onClose, onConfirm, loading }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) {
  const [reason, setReason] = useState("")
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          <h3 className="text-lg font-bold">Remove this item?</h3>
          <p className="text-sm text-muted-foreground">It will be hidden from the app. Tell the poster why (optional).</p>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Reason (e.g. spam, fraudulent claim, duplicate)"
          className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ItemsClient({ initialItems }: ItemsClientProps) {
  const [items, setItems] = useState<LostFoundItem[]>(initialItems)
  const [activeTab, setActiveTab] = useState<LostFoundStatus | "all">("open")
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = activeTab === "all" ? items : items.filter(i => i.status === activeTab)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [items, activeTab, search])

  async function handleRemove(reason: string) {
    if (!removeId) return
    setRemoveLoading(true)
    try {
      await api.lostFoundItems.updateStatus(removeId, "removed", reason)
      setItems(prev => prev.map(i => i.id === removeId ? { ...i, status: "removed", removal_reason: reason } : i))
      setRemoveId(null)
    } catch (err) {
      alert("Failed to remove item")
    } finally {
      setRemoveLoading(false)
    }
  }

  async function handleRestore(id: string) {
    setRestoringId(id)
    try {
      await api.lostFoundItems.updateStatus(id, "open")
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: "open", removal_reason: undefined } : i))
    } catch (err) {
      alert("Failed to restore item")
    } finally {
      setRestoringId(null)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.lostFoundItems.delete(deleteId)
      setItems(prev => prev.filter(i => i.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert("Failed to delete item")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn("flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all rounded-sm",
                activeTab === tab.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  {items.filter(i => i.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, location..."
            className="rounded-sm border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <PackageSearch className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No items found</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">Nothing matches this filter right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <div key={item.id} className="overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {item.image_urls?.[0] ? (
                  <img src={getFullImageUrl(item.image_urls[0])} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><PackageSearch className="h-8 w-8 opacity-30" /></div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase mb-1", item.type === "lost" ? "bg-orange-500 text-white" : "bg-teal-500 text-white")}>
                      {item.type}
                    </span>
                    <h3 className="font-bold text-sm line-clamp-1" title={item.title}>{item.title}</h3>
                  </div>
                  <span className={cn("flex-shrink-0 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm", STATUS_BADGE[item.status])}>
                    {item.status}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}

                <div className="space-y-1 rounded-sm border border-dashed border-border/60 bg-muted/20 p-2">
                  {item.location && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  {item.category && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.category.name}</span>
                    </div>
                  )}
                  {item.poster?.name && (
                    <p className="text-[11px] text-muted-foreground truncate">Posted by {item.poster.name}</p>
                  )}
                </div>

                {item.status === "removed" && item.removal_reason && (
                  <p className="text-[10px] text-red-600 italic">Reason: {item.removal_reason}</p>
                )}

                <div className="flex gap-2 pt-1">
                  {item.status !== "removed" ? (
                    <button
                      onClick={() => setRemoveId(item.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-bold hover:bg-accent transition-all"
                    >
                      <Ban className="h-3.5 w-3.5" /> Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(item.id)}
                      disabled={restoringId === item.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-sm bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {restoringId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Restore
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="flex items-center justify-center rounded-sm border px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDelete
        open={!!deleteId}
        label="item"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
      <RemoveModal
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemove}
        loading={removeLoading}
      />
    </div>
  )
}
