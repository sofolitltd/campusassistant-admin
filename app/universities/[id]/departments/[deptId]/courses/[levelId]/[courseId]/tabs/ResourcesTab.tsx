"use client"

import { useState, useEffect, useCallback } from "react"
import { api, Resource, ResourceType, Batch } from "@/lib/api"
import { Plus, Loader2, Layers, HelpCircle, FileText, BookMarked, Play, Users, Search } from "lucide-react"

import { ResourceCard } from "./ResourceCard"
import { ResourceModal } from "./ResourceModal"
import { ConfirmDelete } from "./ConfirmDelete"
import { VideoPlayerModal } from "./VideoPlayerModal"
import { PdfViewerModal } from "./PdfViewerModal"
import { deleteFile } from "./resource-utils"

const TYPE_ICONS: Record<ResourceType, React.ElementType> = {
  book: Layers,
  question: HelpCircle,
  syllabus: FileText,
  note: BookMarked,
  video: Play,
  research: Search,
}

const TYPE_LABELS: Record<ResourceType, string> = {
  book: "Book",
  question: "Question Paper",
  syllabus: "Syllabus",
  note: "Note",
  video: "Video Lecture",
  research: "Research Paper",
}

interface ResourcesTabProps {
  type: ResourceType
  courseCode: string
  universityId: string
  departmentId: string
  batches: Batch[]
  lessonNo?: number
}

export default function ResourcesTab({ type, courseCode, universityId, departmentId, batches, lessonNo }: ResourcesTabProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Resource | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [batchFilter, setBatchFilter] = useState<string>("all")
  const [playVideo, setPlayVideo] = useState<{ url: string; title: string; description?: string } | null>(null)
  const [viewPdf, setViewPdf] = useState<{ url: string; title: string } | null>(null)

  const Icon = TYPE_ICONS[type]
  const label = TYPE_LABELS[type]

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await api.resources.getAllByCourse(courseCode, type, lessonNo)
      setResources(data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [courseCode, type, lessonNo])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try { 
      if (deleteTarget.file_url) await deleteFile(deleteTarget.file_url)
      if (deleteTarget.thumbnail_url) await deleteFile(deleteTarget.thumbnail_url)
      await api.resources.delete(deleteTarget.id)
      await load() 
    }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const filteredResources = resources.filter(r => {
    if (batchFilter === "all") return true
    return r.batches?.some(b => b.id === batchFilter)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-sm bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-bold block leading-none">{resources.length} {label}{resources.length !== 1 ? "s" : ""}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Total Library</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[140px]">
            <select 
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full appearance-none rounded-sm border bg-background px-3 py-2 pr-8 text-xs font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all hover:bg-muted/30"
            >
              <option value="all">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <Users className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground opacity-50" />
          </div>

          <button
            onClick={() => { setEditTarget(null); setModal(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add {label}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary opacity-30" />
        </div>
      ) : error ? (
        <p className="rounded-sm border border-red-200 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-500">{error}</p>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-sm border border-dashed bg-muted/20">
          <div className="rounded-full bg-muted p-5 mb-3"><Icon className="h-8 w-8 text-muted-foreground/40" /></div>
          <p className="font-bold">
            {batchFilter === "all" ? `No ${label.toLowerCase()}s yet` : `No ${label.toLowerCase()}s for this batch`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {batchFilter === "all" ? `Add the first ${label.toLowerCase()} for this course.` : `Try selecting another batch or add a new resource.`}
          </p>
          {batchFilter === "all" && (
            <button onClick={() => { setEditTarget(null); setModal(true) }}
              className="mt-5 flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
              <Plus className="h-4 w-4" /> Add {label}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onEdit={() => { setEditTarget(r); setModal(true) }}
              onDelete={() => setDeleteTarget(r)}
              onPlay={(url, title, desc) => setPlayVideo({ url, title, description: desc })}
              onView={(url, title) => setViewPdf({ url, title })}
            />
          ))}
        </div>
      )}

      <ResourceModal
        open={modal}
        onClose={() => setModal(false)}
        resource={editTarget}
        type={type}
        courseCode={courseCode}
        universityId={universityId}
        departmentId={departmentId}
        lessonNo={lessonNo}
        batches={batches}
        onSuccess={() => { setModal(false); load() }}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget ? `"${deleteTarget.title}"` : ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <VideoPlayerModal 
        open={!!playVideo}
        onClose={() => setPlayVideo(null)}
        videoUrl={playVideo?.url ?? ""}
        title={playVideo?.title ?? ""}
        description={playVideo?.description}
      />

      <PdfViewerModal
        open={!!viewPdf}
        onClose={() => setViewPdf(null)}
        url={viewPdf?.url ?? ""}
        title={viewPdf?.title ?? ""}
      />
    </div>
  )
}
