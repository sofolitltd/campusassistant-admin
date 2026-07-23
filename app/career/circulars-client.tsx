"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  Calendar,
  Search,
} from "lucide-react"
import { api, CareerCircular } from "@/lib/api"
import { ConfirmDelete } from "../universities/[id]/departments/[...slug]/components/SharedUI"
import { cn } from "@/lib/utils"

interface CircularsClientProps {
  initialCirculars: CareerCircular[]
}

export default function CircularsClient({ initialCirculars }: CircularsClientProps) {
  const [circulars, setCirculars] = useState<CareerCircular[]>(initialCirculars)
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all")
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = circulars
    if (filter === "published") list = list.filter(c => c.is_published)
    if (filter === "draft") list = list.filter(c => !c.is_published)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.organization?.toLowerCase().includes(q))
    }
    return list
  }, [circulars, filter, search])

  async function handleTogglePublish(circular: CareerCircular) {
    setTogglingId(circular.id)
    try {
      await api.careerCirculars.update(circular.id, { is_published: !circular.is_published })
      setCirculars(prev => prev.map(c => c.id === circular.id ? { ...c, is_published: !c.is_published } : c))
    } catch (err) {
      alert("Failed to update publish status")
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.careerCirculars.delete(deleteId)
      setCirculars(prev => prev.filter(c => c.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert("Failed to delete circular")
    } finally {
      setDeleteLoading(false)
    }
  }

  const isPastDeadline = (date?: string) => !!date && new Date(date).getTime() < Date.now()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
          {(["all", "published", "draft"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn("px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all rounded-sm",
                filter === tab ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, organization..."
              className="rounded-sm border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <Link
            href="/career/add"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Circular
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No circulars found</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">Post your first job/exam circular.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(circular => (
            <div key={circular.id} className="overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {circular.category && (
                      <span className="inline-block rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-bold uppercase mb-1">
                        {circular.category.name}
                      </span>
                    )}
                    <h3 className="font-bold text-sm line-clamp-2" title={circular.title}>{circular.title}</h3>
                    {circular.organization && (
                      <p className="text-xs text-muted-foreground truncate">{circular.organization}</p>
                    )}
                  </div>
                  <span className={cn("flex-shrink-0 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm",
                    circular.is_published ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                    {circular.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="space-y-1 rounded-sm border border-dashed border-border/60 bg-muted/20 p-2">
                  {circular.deadline_date && (
                    <div className={cn("flex items-center gap-1.5 text-[11px]", isPastDeadline(circular.deadline_date) ? "text-red-600" : "text-muted-foreground")}>
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>Deadline: {new Date(circular.deadline_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Eye className="h-3 w-3 flex-shrink-0" />
                    <span>{circular.views_count} views</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleTogglePublish(circular)}
                    disabled={togglingId === circular.id}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-bold hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {togglingId === circular.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {circular.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <Link
                    href={`/career/edit/${circular.id}`}
                    className="flex items-center justify-center rounded-sm border px-3 py-2 text-xs font-bold hover:bg-accent transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(circular.id)}
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
        label="circular"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
