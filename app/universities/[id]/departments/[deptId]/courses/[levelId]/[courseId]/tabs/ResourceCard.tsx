"use client"

import React, { useState, useRef, useEffect } from "react"
import { Resource, ResourceType, Batch } from "@/lib/api"
import { 
  Pencil, Trash2, Download, Play, BookOpen, Layers, HelpCircle, FileText, BookMarked, Search, AlertTriangle
} from "lucide-react"

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

function fmtBytes(b: number) {
  if (!b) return ""
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function getYoutubeThumb(url: string) {
  if (!url) return null
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  const id = (match && match[2].length === 11) ? match[2] : null
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export function ResourceCard({ resource, onEdit, onDelete, onPermanentDelete, onPlay, onView }: { 
  resource: Resource; 
  onEdit: () => void; 
  onDelete: () => void;
  onPermanentDelete?: () => void;
  onPlay?: (url: string, title: string, description?: string) => void;
  onView?: (url: string, title: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  const Icon = TYPE_ICONS[resource.type]
  const meta = (resource.metadata ?? {}) as Record<string, any>
  const thumb = resource.type === "video" ? getYoutubeThumb(resource.file_url) : resource.thumbnail_url

  const handleInteraction = (e: React.MouseEvent) => {
    if (resource.type === "video" && onPlay) {
      e.preventDefault()
      onPlay(resource.file_url, resource.title, resource.description)
    } else if (resource.type !== "video" && onView) {
      e.preventDefault()
      onView(resource.file_url, resource.title)
    }
  }

  if (resource.type !== "video") {
    return (
      <div 
        onClick={handleInteraction}
        className={`group relative rounded-sm border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex h-[110px] bg-gradient-to-r from-card to-muted/5 cursor-pointer ${menuOpen ? 'z-50' : ''}`}
      >
        {/* Left Side: Image or Icon */}
        <div className="w-24 h-full bg-muted/30 shrink-0 relative overflow-hidden border-r flex items-center justify-center">
          {thumb ? (
            <>
              <img src={thumb} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
              <Icon className="h-8 w-8 text-primary" />
              <span className="text-[8px] font-black uppercase tracking-tighter">{TYPE_LABELS[resource.type]}</span>
            </div>
          )}
          {resource.access_level === "pro" && (
            <div className="absolute top-1 left-1 px-1 py-0.5 rounded-sm bg-amber-500 text-[8px] font-black text-white shadow-sm z-10">PRO</div>
          )}
          {meta.is_edited && (
            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded-sm bg-blue-500/80 backdrop-blur-sm text-[7px] font-black text-white shadow-sm z-10 uppercase tracking-tighter">Edited</div>
          )}
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 p-3 flex flex-col min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">{resource.title}</h3>
            </div>
            {meta.author && <p className="text-[10px] text-muted-foreground mt-0.5 truncate italic">by {meta.author}</p>}
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {meta.pages && (
                <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-sm border border-primary/10">
                  <BookOpen className="h-2.5 w-2.5" /> {meta.pages}P
                </span>
              )}
              {resource.file_size_bytes > 0 && <span className="text-[10px] text-muted-foreground/60 font-medium">{fmtBytes(resource.file_size_bytes)}</span>}
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300" onClick={(e) => e.stopPropagation()}>
              <button onClick={onEdit} className="p-1.5 hover:bg-background hover:shadow-sm rounded-sm transition-all text-muted-foreground hover:text-foreground">
                <Pencil className="h-3 w-3" />
              </button>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-sm transition-all text-muted-foreground">
                  <Trash2 className="h-3 w-3" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-sm border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <button onClick={() => { setMenuOpen(false); onDelete() }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors text-left">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" /> Soft Delete
                    </button>
                    {onPermanentDelete && (
                      <button onClick={() => { setMenuOpen(false); onPermanentDelete() }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors text-left border-t">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Permanent Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
              {resource.file_url && (
                <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-sm transition-all">
                  <Download className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={handleInteraction}
      className={`group relative rounded-sm border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer ${menuOpen ? 'z-50' : ''}`}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        {thumb ? (
          <>
            <img src={thumb} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground/30">
            <Play className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-full bg-primary p-3 shadow-xl">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
        </div>
        {meta.duration && (
          <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded-sm bg-black/80 text-[10px] font-black text-white shadow-sm backdrop-blur-sm border border-white/10">
            {meta.duration}
          </div>
        )}
        {resource.access_level === "pro" && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-sm bg-amber-500 text-[9px] font-black text-white shadow-sm">PRO</div>
        )}
        {meta.is_edited && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-sm bg-blue-500/80 backdrop-blur-sm text-[8px] font-black text-white shadow-sm uppercase">Edited</div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{resource.title}</h3>
          {resource.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{resource.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {meta.author && <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">by {meta.author}</span>}
          {meta.exam_type && <span className="text-[9px] font-black bg-amber-100 text-amber-700 rounded-sm px-1.5 py-0.5 uppercase tracking-tighter">{meta.exam_type}</span>}
          {meta.year && <span className="text-[10px] font-medium text-muted-foreground">{meta.year}</span>}
          <div className="flex items-center gap-2 ml-auto">
            {meta.pages && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded-sm">
                <BookOpen className="h-2.5 w-2.5" /> {meta.pages}P
              </span>
            )}
            {resource.file_size_bytes > 0 && <span className="text-[10px] text-muted-foreground opacity-60 italic">{fmtBytes(resource.file_size_bytes)}</span>}
          </div>
        </div>
      </div>

      <div className="border-t bg-muted/5 p-2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1 items-center">
          <button onClick={onEdit} className="rounded-sm p-1.5 hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-sm p-1.5 hover:bg-red-50 hover:text-red-500 transition-all text-muted-foreground" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-sm border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <button onClick={() => { setMenuOpen(false); onDelete() }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors text-left">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" /> Soft Delete
                </button>
                {onPermanentDelete && (
                  <button onClick={() => { setMenuOpen(false); onPermanentDelete() }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors text-left border-t">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Permanent Delete
                  </button>
                )}
              </div>
            )}
          </div>
          {resource.file_url && (
            <div className="flex items-center gap-1.5 rounded-sm bg-primary/10 px-3 py-1.5 text-[10px] font-black text-primary uppercase tracking-widest shadow-sm ml-2">
              <Play className="h-3 w-3" /> Watch In-App
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
