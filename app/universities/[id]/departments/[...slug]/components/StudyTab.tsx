"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Level, Batch, api } from "@/lib/api"
import { EmptyState, Badge, ConfirmDelete } from "./SharedUI"
import { LevelModal } from "./LevelModal"
import {
  BookOpen, Plus, MoreVertical, Pencil, Trash2,
  BookCopy, ChevronRight, Library, HelpCircle, ScrollText, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StudyTabProps {
  study: Level[]
  universityId: string
  departmentId: string
  batches: Batch[]
  onRefresh: () => void
}

function statusVariant(s: string): "success" | "warn" | "default" {
  if (s === "active") return "success"
  if (s === "draft") return "warn"
  return "default"
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-sm border bg-muted/30 px-3 py-1.5 min-w-[60px]">
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-base font-black tabular-nums">{value}</span>
    </div>
  )
}

interface LevelCardProps {
  level: Level
  universityId: string
  departmentId: string
  onEdit: (s: Level) => void
  onDelete: (s: Level) => void
}

function LevelCard({ level, universityId, departmentId, onEdit, onDelete }: LevelCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const coursesUrl = `/universities/${universityId}/departments/${departmentId}/courses/${level.id}?levelName=${encodeURIComponent(level.name)}&deptSlug=${departmentId}`

  return (
    <div className="relative group rounded-sm border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
      onClick={(e) => { if ((e.target as HTMLElement).closest('[data-no-nav]')) return; router.push(coursesUrl) }}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate text-sm leading-tight">Level {level.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
              Order: {level.order}
              <ChevronRight className="h-3 w-3 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusVariant(level.status)}>
            {statusLabel(level.status)}
          </Badge>

          {/* Menu */}
          <div className="relative" data-no-nav>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p) }}
              className="rounded-full p-1.5 hover:bg-muted transition-all"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-36 rounded-sm border bg-card shadow-lg overflow-hidden animate-in zoom-in-95 duration-150">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(level) }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5 text-blue-500" /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(level) }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        <StatChip label="Courses" value={level.total_courses} />
        <StatChip label="Credits" value={level.total_credits} />
        <StatChip label="Marks" value={level.total_marks} />
      </div>

      {/* Batch pills */}
      {level.batches && level.batches.length > 0 && (
        <div className="border-t px-4 py-2.5 flex flex-wrap gap-1.5">
          {(level.batches as any[]).map((b: any) => (
            <span
              key={b.id ?? b}
              className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide"
            >
              {b.name ?? b}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function StudyTab({ study, universityId, departmentId, batches, onRefresh }: StudyTabProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Level | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sorted = [...study].sort((a, b) => a.order - b.order)

  function openAdd() { setEditTarget(null); setModalOpen(true) }
  function openEdit(s: Level) { setEditTarget(s); setModalOpen(true) }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.levels.delete(deleteTarget.id)
      onRefresh()
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      {/* ── Feature shortcuts ── */}
      <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-none">
        {[
          { href: `/universities/${universityId}/departments/${departmentId}/library`, label: "Library",        Icon: Library    },
          { href: `/universities/${universityId}/departments/${departmentId}/questions`, label: "Question Bank",  Icon: HelpCircle },
          { href: `/universities/${universityId}/departments/${departmentId}/syllabus`, label: "Full Syllabus",  Icon: ScrollText },
          { href: `/universities/${universityId}/departments/${departmentId}/research`, label: "Research Archive", Icon: Search    },
        ].map(({ href, label, Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 transition-all"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-black tracking-tight flex items-center gap-2">
            <BookCopy className="h-4 w-4 text-primary" /> Study Plan
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sorted.length} level{sorted.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Level
        </button>
      </div>

      {/* Content */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          label="levels"
          onAdd={openAdd}
          addLabel="Add Level"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((l) => (
            <LevelCard
              key={l.id}
              level={l}
              universityId={universityId}
              departmentId={departmentId}
              onEdit={openEdit}
              onDelete={(s) => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <LevelModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        universityId={universityId}
        departmentId={departmentId}
        level={editTarget}
        batches={batches}
        onSuccess={() => { setModalOpen(false); onRefresh() }}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget ? `Level ${deleteTarget.name}` : ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
