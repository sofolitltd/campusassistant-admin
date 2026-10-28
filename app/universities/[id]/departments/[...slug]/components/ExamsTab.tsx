"use client"

import { useState, useEffect } from "react"
import { api, ExamNotice, Batch, Course, getFullImageUrl } from "@/lib/api"
import { uploadFile, deleteFile } from "@/lib/upload-utils"
import { EmptyState, ConfirmDelete, Modal, Field, Badge, inputCls, selectCls } from "./SharedUI"
import { ClipboardList, Plus, Trash2, Edit2, FileText, Upload, X, Loader2, AlertCircle, Save, MapPin, Clock3, BookOpen } from "lucide-react"

const MAX_FILE_BYTES = 5 * 1024 * 1024

const EXAM_TYPES: { value: ExamNotice["exam_type"]; label: string; variant: "default" | "success" | "danger" | "warn" | "info" }[] = [
  { value: "quiz", label: "Quiz", variant: "info" },
  { value: "midterm", label: "Midterm", variant: "warn" },
  { value: "final", label: "Final", variant: "danger" },
  { value: "retake", label: "Retake", variant: "default" },
  { value: "improvement", label: "Improvement", variant: "default" },
]

function examTypeMeta(type: string) {
  return EXAM_TYPES.find(t => t.value === type) ?? EXAM_TYPES[0]
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function countdownLabel(dateStr: string) {
  const d = daysUntil(dateStr)
  if (d < 0) return "Past"
  if (d === 0) return "Today"
  if (d === 1) return "Tomorrow"
  return `In ${d} days`
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function ExamModal({ exam, batches, universityId, departmentId, onClose, onSuccess }: {
  exam: ExamNotice | null
  batches: Batch[]
  universityId: string
  departmentId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [courseName, setCourseName] = useState(exam?.course_name ?? "")
  const [courseCode, setCourseCode] = useState(exam?.course_code ?? "")
  const [courses, setCourses] = useState<Course[]>([])
  const [examType, setExamType] = useState<ExamNotice["exam_type"]>(exam?.exam_type ?? "midterm")
  const [batchId, setBatchId] = useState(exam?.batch_id ?? "")
  const [examDate, setExamDate] = useState(exam?.exam_date ? exam.exam_date.slice(0, 10) : "")
  const [startTime, setStartTime] = useState(exam?.start_time ?? "")
  const [room, setRoom] = useState(exam?.room ?? "")
  const [note, setNote] = useState(exam?.note ?? "")

  const [seatPlanFile, setSeatPlanFile] = useState<File | null>(null)
  const [seatPlanUrl, setSeatPlanUrl] = useState(exam?.seat_plan_url ?? "")
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null)
  const [syllabusUrl, setSyllabusUrl] = useState(exam?.syllabus_url ?? "")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    api.courses.getAllByDepartment(departmentId).then(setCourses).catch(console.error)
  }, [departmentId])

  function pickCourse(code: string) {
    setCourseCode(code)
    if (!code) return
    const course = courses.find(c => c.course_code === code)
    if (course && !courseName.trim()) setCourseName(course.course_title)
  }

  function pickFile(setFile: (f: File | null) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (!f) return
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") return setError("Only images or PDF files are allowed")
      if (f.size > MAX_FILE_BYTES) return setError("File must be 5MB or smaller")
      setError("")
      setFile(f)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseName.trim()) return setError("Course name is required")
    if (!examDate) return setError("Exam date is required")
    setLoading(true)
    setError("")
    try {
      let finalSeatPlanUrl = seatPlanUrl
      let finalSyllabusUrl = syllabusUrl
      if (seatPlanFile) finalSeatPlanUrl = await uploadFile(seatPlanFile, "exam-notices")
      if (syllabusFile) finalSyllabusUrl = await uploadFile(syllabusFile, "exam-notices")

      const payload: Partial<ExamNotice> = {
        course_name: courseName.trim(),
        course_code: courseCode,
        exam_type: examType,
        exam_date: new Date(`${examDate}T00:00:00`).toISOString(),
        start_time: startTime,
        room: room.trim(),
        note: note.trim(),
        seat_plan_url: finalSeatPlanUrl,
        syllabus_url: finalSyllabusUrl,
      }

      if (exam) {
        await api.examNotices.update(exam.id, payload)
      } else {
        await api.examNotices.create({
          ...payload,
          university_id: universityId,
          department_id: departmentId,
          batch_id: batchId || null,
        })
      }
      if (exam?.seat_plan_url && exam.seat_plan_url !== finalSeatPlanUrl) await deleteFile(exam.seat_plan_url)
      if (exam?.syllabus_url && exam.syllabus_url !== finalSyllabusUrl) await deleteFile(exam.syllabus_url)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save exam notice")
    } finally {
      setLoading(false)
    }
  }

  function FileField({ label, file, url, onPick, onClear }: {
    label: string
    file: File | null
    url: string
    onPick: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
  }) {
    const hasFile = !!file || !!url
    return (
      <Field label={label}>
        {hasFile ? (
          <div className="flex items-center justify-between gap-2 rounded-sm border bg-muted/40 px-3 py-2 text-sm">
            <span className="truncate flex items-center gap-2"><FileText className="h-4 w-4 shrink-0" /> {file ? file.name : "Current attachment"}</span>
            <button type="button" onClick={onClear} className="text-destructive shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border-2 border-dashed p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary transition-colors">
            <Upload className="h-4 w-4" /> Choose file (max 5MB)
            <input type="file" accept="image/*,application/pdf" onChange={onPick} className="hidden" />
          </label>
        )}
      </Field>
    )
  }

  return (
    <Modal open onClose={onClose} title={exam ? "Edit Exam Notice" : "Add Exam Notice"} className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm mb-2 border border-destructive/30 mx-6 mt-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <Field label="Course Name" required>
            <input value={courseName} onChange={e => setCourseName(e.target.value)} className={inputCls} maxLength={200} placeholder="e.g. Data Structures" />
          </Field>

          <Field label="Link to Study Course (Optional)">
            <select value={courseCode} onChange={e => pickCourse(e.target.value)} className={selectCls}>
              <option value="">Not linked</option>
              {courses.map(c => (
                <option key={c.id} value={c.course_code}>{c.course_title} ({c.course_code})</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">Lets students tap through to this course's materials from the exam card.</p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Exam Type" required>
              <select value={examType} onChange={e => setExamType(e.target.value as ExamNotice["exam_type"])} className={selectCls}>
                {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            {!exam && (
              <Field label="Audience">
                <select value={batchId} onChange={e => setBatchId(e.target.value)} className={selectCls}>
                  <option value="">Whole department</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Exam Date" required>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Start Time">
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Room (Optional)">
            <input value={room} onChange={e => setRoom(e.target.value)} className={inputCls} placeholder="e.g. Room 204, Building B" />
          </Field>

          <FileField
            label="Seat Plan (Optional)"
            file={seatPlanFile}
            url={seatPlanUrl}
            onPick={pickFile(setSeatPlanFile)}
            onClear={() => { setSeatPlanFile(null); setSeatPlanUrl("") }}
          />
          <FileField
            label="Syllabus (Optional)"
            file={syllabusFile}
            url={syllabusUrl}
            onPick={pickFile(setSyllabusFile)}
            onClear={() => { setSyllabusFile(null); setSyllabusUrl("") }}
          />

          <Field label="Note (Optional)">
            <textarea value={note} onChange={e => setNote(e.target.value)} className={inputCls} rows={2} placeholder="Anything else students should know…" />
          </Field>
        </div>
        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 mt-auto shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary-gradient text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export function ExamsTab({ exams, batches, universityId, departmentId, onRefresh }: {
  exams: ExamNotice[]
  batches: Batch[]
  universityId: string
  departmentId: string
  onRefresh: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<ExamNotice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExamNotice | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.examNotices.delete(deleteTarget.id)
      if (deleteTarget.seat_plan_url) await deleteFile(deleteTarget.seat_plan_url)
      if (deleteTarget.syllabus_url) await deleteFile(deleteTarget.syllabus_url)
      onRefresh()
      setDeleteTarget(null)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  const sorted = [...exams].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
  const batchName = (id?: string | null) => (id ? batches.find(b => b.id === id)?.name : null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Exam Notices</h3>
          <p className="text-xs text-muted-foreground">Upcoming exams shown to students with a countdown. Push a reminder from Notifications after saving.</p>
        </div>
        <button
          onClick={() => { setSelected(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary-gradient px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Exam Notice
        </button>
      </div>

      {!sorted.length ? (
        <EmptyState icon={ClipboardList} label="exam notices" onAdd={() => { setSelected(null); setModalOpen(true) }} addLabel="Add Exam Notice" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((exam) => {
            const meta = examTypeMeta(exam.exam_type)
            const past = daysUntil(exam.exam_date) < 0
            return (
              <div key={exam.id} className={`group relative rounded-sm border bg-card shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-2 ${past ? "opacity-60" : ""}`}>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => { setSelected(exam); setModalOpen(true) }} className="p-1.5 bg-background border rounded-sm hover:bg-muted text-primary transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(exam)} className="p-1.5 bg-background border rounded-sm hover:bg-muted text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pr-16">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <Badge variant={past ? "default" : "success"}>{countdownLabel(exam.exam_date)}</Badge>
                </div>

                <h4 className="font-bold text-sm truncate">{exam.course_name}</h4>
                {exam.course_code && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                    <BookOpen className="h-3 w-3" /> Linked to {exam.course_code}
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(exam.exam_date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                    {exam.start_time && ` · ${exam.start_time}`}
                  </div>
                  {exam.room && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {exam.room}
                    </div>
                  )}
                  <div>{batchName(exam.batch_id) ?? "Whole department"}</div>
                </div>

                {(exam.seat_plan_url || exam.syllabus_url) && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {exam.seat_plan_url && (
                      <a href={getFullImageUrl(exam.seat_plan_url)} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline">
                        <FileText className="h-3 w-3" /> Seat Plan
                      </a>
                    )}
                    {exam.syllabus_url && (
                      <a href={getFullImageUrl(exam.syllabus_url)} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline">
                        <FileText className="h-3 w-3" /> Syllabus
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <ExamModal
          exam={selected}
          batches={batches}
          universityId={universityId}
          departmentId={departmentId}
          onClose={() => setModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      <ConfirmDelete
        open={!!deleteTarget}
        label="exam notice"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
