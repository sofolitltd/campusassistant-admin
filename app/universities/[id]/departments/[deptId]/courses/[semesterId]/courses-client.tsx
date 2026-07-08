"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, BookOpen, Pencil, Trash2, MoreVertical,
  Loader2, AlertTriangle, Tag, Hash, GraduationCap, ChevronRight,
  CheckCircle,
} from "lucide-react"
import { api, Course, CourseCategory, CoursePrefix, Semester, Batch } from "@/lib/api"
import { cn } from "@/lib/utils"
import { CourseModal } from "./components/CourseModal"

// ── Inline primitives ────────────────────────────────────────────────────────
function ConfirmDelete({ open, label, onClose, onConfirm, loading }: { open: boolean; label: string; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          <h3 className="text-lg font-bold">Delete {label}?</h3>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfigModal({ open, onClose, title, items, onAdd, onDelete, placeholder }: {
  open: boolean; onClose: () => void; title: string
  items: { id: string; name?: string; prefix?: string; description?: string }[]
  onAdd: (value: string) => Promise<void>; onDelete: (id: string) => Promise<void>; placeholder: string
}) {
  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setSaving(true)
    try { await onAdd(value.trim()); setValue("") } finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-sm border bg-card shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-all text-muted-foreground">✕</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
              className="flex-1 rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button type="submit" disabled={saving}
              className="rounded-sm bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
            </button>
          </form>
          <div className="space-y-1.5">
            {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items yet.</p>}
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-sm border bg-muted/30 px-3 py-2">
                <span className="text-sm font-medium">{item.name ?? item.prefix}</span>
                <button onClick={async () => { setDeletingId(item.id); await onDelete(item.id); setDeletingId(null) }}
                  disabled={deletingId === item.id}
                  className="rounded-full p-1 hover:bg-red-50 hover:text-red-500 transition-all text-muted-foreground">
                  {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  universityId: string
  departmentId: string
  semesterId: string
  semesterName: string
  departmentSlug: string
}

export default function CoursesClient({ universityId, departmentId, semesterId, semesterName, departmentSlug }: Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [prefixes, setPrefixes] = useState<CoursePrefix[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [courseModal, setCourseModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Course | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [prefixModal, setPrefixModal] = useState(false)

  const [unassigned, setUnassigned] = useState<Course[]>([])
  const [fixing, setFixing] = useState(false)
  const [fixDone, setFixDone] = useState(0)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [c, cats, prefs, sems, bats, all] = await Promise.all([
        api.courses.getAllBySemester(semesterId),
        api.courseCategories.getAllByDepartment(departmentId),
        api.coursePrefixes.getAllByDepartment(departmentId),
        api.semesters.getAllByDepartment(departmentId),
        api.batches.getAllByDepartment(departmentId),
        api.courses.getAllByDepartment(departmentId),
      ])
      setCourses(c)
      // Find courses that have no semester_id (orphaned)
      setUnassigned(all.filter((cr) => !cr.semester_id))
      setFixing(false); setFixDone(0)
      setCategories(cats.sort((a, b) => a.order - b.order))
      setPrefixes(prefs)
      setSemesters(sems)
      setBatches(bats)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [semesterId, departmentId])

  useEffect(() => { load() }, [load])

  // Group by category
  const grouped: Record<string, Course[]> = {}
  for (const c of courses) {
    const cat = c.course_category?.name ?? "General"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(c)
  }
  const catOrder = categories.map((c) => c.name)
  const sortedGroups = [
    ...catOrder.filter((k) => grouped[k]),
    ...Object.keys(grouped).filter((k) => !catOrder.includes(k)),
  ]

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await api.courses.delete(deleteTarget.id); await load() }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const backUrl = `/universities/${universityId}/departments/${departmentSlug}?tab=study`

  async function handleFixAll() {
    setFixing(true); setError(""); setFixDone(0)
    for (const course of unassigned) {
      try {
        await api.courses.update(course.id, { semester_id: semesterId })
        setFixDone((p) => p + 1)
      } catch (e: any) {
        console.error(`Failed to fix course ${course.course_code}:`, e)
      }
    }
    await load()
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href={backUrl} className="rounded-full border p-2 hover:bg-accent transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
        
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> {semesterName}
            </h1>
            <p className="text-sm text-muted-foreground">{courses.length} course{courses.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setCatModal(true)}
            className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium hover:bg-muted transition-all">
            <Tag className="h-3.5 w-3.5" /> Categories
          </button>
          <button onClick={() => setPrefixModal(true)}
            className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium hover:bg-muted transition-all">
            <Hash className="h-3.5 w-3.5" /> Code Prefixes
          </button>
          <button
            onClick={() => { setEditTarget(null); setCourseModal(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> Add Course
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
        </div>
      ) : error ? (
        <div className="rounded-sm border border-red-200 bg-red-50 dark:bg-red-900/10 p-6 text-center text-red-500 text-sm">{error}</div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-sm border border-dashed bg-muted/20">
          <div className="rounded-full bg-muted p-6 mb-4"><GraduationCap className="h-10 w-10 text-muted-foreground/40" /></div>
          <p className="text-lg font-bold">No courses yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add courses to Semester {semesterName}.</p>
          <button onClick={() => { setEditTarget(null); setCourseModal(true) }}
            className="mt-6 flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> Add Course
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map((cat) => (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-primary">{cat}</span>
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground font-bold">{grouped[cat].length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[cat].map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    universityId={universityId}
                    departmentId={departmentId}
                    semesterId={semesterId}
                    semesterName={semesterName}
                    onEdit={() => {
                      setEditTarget(course)
                      setCourseModal(true)
                    }}
                    onDelete={() => setDeleteTarget(course)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Unassigned Courses Section ──────────────────────────────── */}
      {!loading && unassigned.length > 0 && (
        <div className="mt-8 rounded-sm border border-red-200 bg-red-50/50 dark:bg-red-900/5">
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-bold text-red-700 dark:text-red-400">
                {unassigned.length} course{unassigned.length !== 1 ? "s" : ""} without semester
              </span>
            </div>
            <button
              onClick={handleFixAll}
              disabled={fixing}
              className="flex items-center gap-2 rounded-sm bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {fixing ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Fixing {fixDone}/{unassigned.length}</>
              ) : fixDone > 0 ? (
                <><CheckCircle className="h-3 w-3" /> Fixed {fixDone}</>
              ) : (
                <><CheckCircle className="h-3 w-3" /> Assign "{semesterName}" to All</>
              )}
            </button>
          </div>
          <div className="p-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto">
            {unassigned.map((cr) => (
              <div key={cr.id} className="flex items-center gap-2 rounded-sm bg-white dark:bg-red-900/10 border px-3 py-2 text-sm">
                <span className="font-bold text-red-600 text-xs shrink-0">{cr.course_code}</span>
                <span className="truncate text-muted-foreground">{cr.course_title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CourseModal
        open={courseModal}
        onClose={() => setCourseModal(false)}
        universityId={universityId}
        departmentId={departmentId}
        semesterId={semesterId}
        course={editTarget}
        categories={categories}
        prefixes={prefixes}
        semesters={semesters}
        batches={batches}
        onSuccess={() => { setCourseModal(false); load() }}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget ? `"${deleteTarget.course_title}"` : ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfigModal
        open={catModal}
        onClose={() => { setCatModal(false); load() }}
        title="Manage Course Categories"
        items={categories}
        placeholder="e.g. Core, Elective, Lab…"
        onAdd={async (name) => {
          await api.courseCategories.create({ name, department_id: departmentId, university_id: universityId })
          const fresh = await api.courseCategories.getAllByDepartment(departmentId)
          setCategories(fresh.sort((a, b) => a.order - b.order))
        }}
        onDelete={async (id) => {
          await api.courseCategories.delete(id)
          setCategories((prev) => prev.filter((c) => c.id !== id))
        }}
      />

      <ConfigModal
        open={prefixModal}
        onClose={() => { setPrefixModal(false); load() }}
        title="Manage Code Prefixes"
        items={prefixes}
        placeholder="e.g. CSE, PSY, ENG…"
        onAdd={async (prefix) => {
          await api.coursePrefixes.create({ prefix: prefix.toUpperCase(), department_id: departmentId, university_id: universityId })
          const fresh = await api.coursePrefixes.getAllByDepartment(departmentId)
          setPrefixes(fresh)
        }}
        onDelete={async (id) => {
          await api.coursePrefixes.delete(id)
          setPrefixes((prev) => prev.filter((p) => p.id !== id))
        }}
      />
    </div>
  )
}

// ── Course Card ────────────────────────────────────────────────────────────────
function CourseCard({ course, universityId, departmentId, semesterId, semesterName, onEdit, onDelete }: {
  course: Course
  universityId: string
  departmentId: string
  semesterId: string
  semesterName: string
  onEdit: () => void
  onDelete: () => void
}) {
  const router = useRouter()
  const detailUrl = `/universities/${universityId}/departments/${departmentId}/courses/${semesterId}/${course.id}?semesterName=${encodeURIComponent(semesterName)}&courseCode=${encodeURIComponent(course.course_code)}&courseTitle=${encodeURIComponent(course.course_title)}`

  return (
    <div
      className="group rounded-sm border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex gap-0 overflow-hidden cursor-pointer"
      onClick={(e) => { if ((e.target as HTMLElement).closest('[data-no-nav]')) return; router.push(detailUrl) }}
    >
      {/* Thumbnail */}
      <div className="w-24 shrink-0 bg-muted/30 flex items-center justify-center border-r overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.course_title}
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
        ) : (
          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{course.course_code}</p>
            <p className="font-bold text-sm leading-tight mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">{course.course_title}</p>
          </div>
          
          {/* Actions Toolbar (Hover only) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" data-no-nav>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="p-1.5 rounded-sm bg-background border shadow-sm hover:bg-muted text-muted-foreground hover:text-blue-500 transition-all"
              title="Edit Course"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded-sm bg-background border shadow-sm hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
              title="Delete Course"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Stats chips */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {course.total_credits > 0 && (
            <span className="text-[10px] font-bold bg-muted rounded-sm px-1.5 py-0.5 text-muted-foreground">
              Credits: {course.total_credits}
            </span>
          )}
          {course.total_marks > 0 && (
            <span className="text-[10px] font-bold bg-muted rounded-sm px-1.5 py-0.5 text-muted-foreground">
              Marks: {course.total_marks}
            </span>
          )}
        </div>

        {/* Go to details hint */}
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-primary/0 group-hover:text-primary/60 transition-colors">
          View Details <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}
