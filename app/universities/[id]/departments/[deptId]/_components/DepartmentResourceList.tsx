"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api, Resource, ResourceType } from "@/lib/api"
import {
  ArrowLeft, Loader2, BookOpen,
  Layers, HelpCircle, FileText, BookMarked, Play, Search, ChevronLeft, ChevronRight,
} from "lucide-react"

const TYPE_ICONS: Record<string, React.ElementType> = {
  book: Layers,
  question: HelpCircle,
  syllabus: FileText,
  note: BookMarked,
  video: Play,
  research: Search,
}

const TYPE_LABELS: Record<string, string> = {
  book: "Book",
  question: "Question Paper",
  syllabus: "Syllabus",
  note: "Note",
  video: "Video Lecture",
  research: "Research Paper",
}

const PAGE_SIZE = 20

function fmtBytes(b: number) {
  if (!b) return ""
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("...")
  if (total > 1) pages.push(total)
  return pages
}

interface Props {
  title: string
  type: ResourceType
  universityId: string
  departmentId: string
  backUrl: string
}

export default function DepartmentResourceList({ title, type, universityId, departmentId, backUrl }: Props) {
  const [resources, setResources] = useState<Resource[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const Icon = TYPE_ICONS[type] || BookOpen
  const label = TYPE_LABELS[type] || title
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const load = useCallback(async (searchTerm: string, newOffset: number) => {
    setLoading(true); setError("")
    try {
      const res = await api.resources.getAllByDepartment(departmentId, type, searchTerm || undefined, newOffset, PAGE_SIZE)
      setResources(res.data)
      setTotalCount(res.count)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [departmentId, type])

  useEffect(() => {
    load(search, 0)
    setOffset(0)
  }, [load])

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * PAGE_SIZE
    setOffset(newOffset)
    load(search, newOffset)
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    setOffset(0)
    load(val, 0)
  }

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backUrl} className="rounded-full border p-2 hover:bg-accent transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-sm bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">{title}</h1>
              <p className="text-xs text-muted-foreground font-medium">{totalCount} {label}{totalCount !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by title or course code..."
          className="w-full rounded-sm border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
        </div>
      ) : error ? (
        <div className="rounded-sm border border-red-200 bg-red-50 dark:bg-red-900/10 p-6 text-center text-sm text-red-500">{error}</div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-sm border border-dashed bg-muted/20">
          <div className="rounded-full bg-muted p-6 mb-4"><Icon className="h-10 w-10 text-muted-foreground/40" /></div>
          <p className="text-lg font-bold">{search ? "No matches" : `No ${label.toLowerCase()}s yet`}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try a different search term." : `No resources of type "${type}" found for this department.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <ResourceRow key={r.id} resource={r} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground/40 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`min-w-[36px] h-9 rounded-sm text-sm font-bold transition-all ${
                      p === currentPage
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border hover:bg-accent"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ResourceRow({ resource }: { resource: Resource }) {
  const meta = (resource.metadata ?? {}) as Record<string, any>
  const thumb = resource.thumbnail_url
  const Icon = TYPE_ICONS[resource.type] || BookOpen
  const label = TYPE_LABELS[resource.type] || "Resource"

  return (
    <a
      href={resource.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-sm border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex overflow-hidden h-[110px] cursor-pointer"
    >
      <div className="w-24 h-full bg-muted/30 shrink-0 relative overflow-hidden border-r flex items-center justify-center">
        {thumb ? (
          <>
            <img src={thumb} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
            <Icon className="h-8 w-8 text-primary" />
            <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
          </div>
        )}
        {resource.access_level === "pro" && (
          <div className="absolute top-1 left-1 px-1 py-0.5 rounded-sm bg-amber-500 text-[8px] font-black text-white shadow-sm z-10">PRO</div>
        )}
      </div>

      <div className="flex-1 p-3 flex flex-col min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">{resource.title}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{resource.course_code}</p>
          {meta.author && <p className="text-[10px] text-muted-foreground mt-0.5 truncate italic">by {meta.author}</p>}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {resource.page_count > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-sm border border-primary/10">
                <BookOpen className="h-2.5 w-2.5" /> {resource.page_count}P
              </span>
            )}
            {resource.file_size_bytes > 0 && (
              <span className="text-[10px] text-muted-foreground/60 font-medium">{fmtBytes(resource.file_size_bytes)}</span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}
