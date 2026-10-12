"use client"

import { useState, useEffect, useCallback } from "react"
import { api, ClassNotice, ClassSlot, ClassSlotStatus, Batch, getFullImageUrl } from "@/lib/api"
import { uploadFile, deleteFile } from "@/lib/upload-utils"
import { ActionMenu, ConfirmDelete, Modal, Field, Badge, EmptyState, inputCls, selectCls } from "./SharedUI"
import { CalendarClock, Plus, Trash2, Edit2, FileText, Upload, X, Loader2, AlertCircle, Save, Megaphone, MoreVertical, Ban, Clock3, RotateCcw, Settings } from "lucide-react"

const MAX_FILE_BYTES = 5 * 1024 * 1024
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
function todayStr() {
  const d = new Date()
  const pad = (v: number) => String(v).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isExpired(n: ClassNotice) {
  return !!n.expires_at && new Date(n.expires_at).getTime() <= Date.now()
}

// <input type="date"> speaks local YYYY-MM-DD; the notice lapses at the end of that day.
function toDateInput(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (v: number) => String(v).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function fromDateInput(v: string) {
  return v ? new Date(`${v}T23:59:59`).toISOString() : null
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function NoticeModal({ notice, batches, universityId, departmentId, onClose, onSuccess }: {
  notice: ClassNotice | null
  batches: Batch[]
  universityId: string
  departmentId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState(notice?.title ?? "")
  const [message, setMessage] = useState(notice?.message ?? "")
  const [batchId, setBatchId] = useState(notice?.batch_id ?? "")
  const [expires, setExpires] = useState(toDateInput(notice?.expires_at))
  const [file, setFile] = useState<File | null>(null)
  const [existingUrl, setExistingUrl] = useState(notice?.file_url ?? "")
  const [existingType, setExistingType] = useState<ClassNotice["file_type"]>(notice?.file_type ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") return setError("Only images or PDF files are allowed")
    if (f.size > MAX_FILE_BYTES) return setError("File must be 5MB or smaller")
    setError("")
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError("Title is required")
    setLoading(true)
    setError("")
    try {
      let file_url = existingUrl
      let file_type = existingType
      if (file) {
        file_url = await uploadFile(file, "class-notices")
        file_type = file.type === "application/pdf" ? "pdf" : "image"
      }
      const payload: Partial<ClassNotice> = {
        title: title.trim(),
        message: message.trim(),
        file_url,
        file_type: file_url ? file_type : "",
        expires_at: fromDateInput(expires),
      }
      if (notice) {
        await api.classNotices.update(notice.id, payload)
      } else {
        await api.classNotices.create({
          ...payload,
          university_id: universityId,
          department_id: departmentId,
          batch_id: batchId || null,
        })
      }
      // Drop the replaced/removed file only after the notice no longer points at it.
      if (notice?.file_url && notice.file_url !== file_url) await deleteFile(notice.file_url)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save notice")
    } finally {
      setLoading(false)
    }
  }

  const hasFile = !!file || !!existingUrl

  return (
    <Modal open onClose={onClose} title={notice ? "Edit Notice" : "Post Notice"} className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm mb-2 border border-destructive/30 mx-6 mt-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div className="px-6 py-4 space-y-4">
          <Field label="Title" required>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} maxLength={200} placeholder="e.g. Tomorrow's class is cancelled" />
          </Field>
          <Field label="Message (Optional)">
            <textarea value={message} onChange={e => setMessage(e.target.value)} className={inputCls} rows={3} />
          </Field>
          {!notice && (
            <Field label="Audience">
              <select value={batchId} onChange={e => setBatchId(e.target.value)} className={selectCls}>
                <option value="">Whole department (all batches)</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Visible until (Optional)">
            <input type="date" value={expires} onChange={e => setExpires(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Image or PDF (Optional)">
            {hasFile ? (
              <div className="flex items-center justify-between gap-2 rounded-sm border bg-muted/40 px-3 py-2 text-sm">
                <span className="truncate">{file ? file.name : "Current attachment"}</span>
                <button type="button" onClick={() => { setFile(null); setExistingUrl(""); setExistingType("") }} className="text-destructive shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border-2 border-dashed p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary transition-colors">
                <Upload className="h-4 w-4" /> Choose file (max 5MB)
                <input type="file" accept="image/*,application/pdf" onChange={pickFile} className="hidden" />
              </label>
            )}
          </Field>
        </div>
        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary-gradient text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Weekly schedule ─────────────────────────────────────────────────────────

function SlotModal({ slot, universityId, departmentId, batchId, onClose, onSuccess }: {
  slot: ClassSlot | null
  universityId: string
  departmentId: string
  batchId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [dayOfWeek, setDayOfWeek] = useState(slot?.day_of_week ?? 0)
  const [courseName, setCourseName] = useState(slot?.course_name ?? "")
  const [teacher, setTeacher] = useState(slot?.teacher ?? "")
  const [room, setRoom] = useState(slot?.room ?? "")
  const [startTime, setStartTime] = useState(slot?.start_time ?? "")
  const [endTime, setEndTime] = useState(slot?.end_time ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseName.trim()) return setError("Course name is required")
    if (!startTime || !endTime) return setError("Start and end time are required")
    setLoading(true)
    setError("")
    try {
      const payload: Partial<ClassSlot> = {
        day_of_week: dayOfWeek,
        course_name: courseName.trim(),
        teacher: teacher.trim(),
        room: room.trim(),
        start_time: startTime,
        end_time: endTime,
      }
      if (slot) {
        await api.classSlots.update(slot.id, payload)
      } else {
        await api.classSlots.create({
          ...payload,
          university_id: universityId,
          department_id: departmentId,
          batch_id: batchId,
        })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save class slot")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={slot ? "Edit Class" : "Add Class"} className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm mb-2 border border-destructive/30 mx-6 mt-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div className="px-6 py-4 space-y-4">
          <Field label="Day" required>
            <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))} className={selectCls}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </Field>
          <Field label="Course" required>
            <input value={courseName} onChange={e => setCourseName(e.target.value)} className={inputCls} placeholder="e.g. Data Structures" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" required>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
            </Field>
            <Field label="End time" required>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Teacher (Optional)">
            <input value={teacher} onChange={e => setTeacher(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Room (Optional)">
            <input value={room} onChange={e => setRoom(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary-gradient text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ScheduleModal({ slots, universityId, departmentId, batchId, onClose, onRefresh }: {
  slots: ClassSlot[]
  universityId: string
  departmentId: string
  batchId: string
  onClose: () => void
  onRefresh: () => void
}) {
  const [slotModal, setSlotModal] = useState<{ slot: ClassSlot | null } | null>(null)
  const [toDelete, setToDelete] = useState<ClassSlot | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.classSlots.delete(toDelete.id)
      setToDelete(null)
      onRefresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Weekly Class Schedule" className="max-w-2xl">
      <div className="px-6 py-4 space-y-5">
        <div className="flex justify-end">
          <button onClick={() => setSlotModal({ slot: null })} className="flex items-center gap-1.5 rounded-sm bg-primary-gradient px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Class
          </button>
        </div>
        {!slots.length ? (
          <EmptyState icon={CalendarClock} label="class slots" />
        ) : (
          DAYS.map((day, dow) => {
            const dayLots = slots.filter(s => s.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time))
            if (!dayLots.length) return null
            return (
              <div key={dow}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{day}</h4>
                <ul className="space-y-2">
                  {dayLots.map(s => (
                    <li key={s.id} className="flex items-center justify-between gap-3 rounded-sm border bg-card px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.course_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.start_time}–{s.end_time}{s.teacher ? ` · ${s.teacher}` : ""}{s.room ? ` · ${s.room}` : ""}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setSlotModal({ slot: s })} aria-label="Edit class" className="p-1.5 rounded-sm border hover:bg-muted text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setToDelete(s)} aria-label="Delete class" className="p-1.5 rounded-sm border hover:bg-muted text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })
        )}
      </div>
      {slotModal && (
        <SlotModal
          slot={slotModal.slot}
          universityId={universityId}
          departmentId={departmentId}
          batchId={batchId}
          onClose={() => setSlotModal(null)}
          onSuccess={onRefresh}
        />
      )}
      <ConfirmDelete open={!!toDelete} label="class" onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={deleting} />
    </Modal>
  )
}

function StatusModal({ slot, date, existing, onClose, onSuccess }: {
  slot: ClassSlot
  date: string
  existing: ClassSlotStatus | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [status, setStatus] = useState<"cancelled" | "rescheduled">(existing?.status ?? "cancelled")
  const [newStartTime, setNewStartTime] = useState(existing?.new_start_time ?? slot.start_time)
  const [newEndTime, setNewEndTime] = useState(existing?.new_end_time ?? slot.end_time)
  const [newRoom, setNewRoom] = useState(existing?.new_room ?? slot.room)
  const [note, setNote] = useState(existing?.note ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.classSlots.setStatus({
        class_slot_id: slot.id,
        date,
        status,
        new_start_time: status === "rescheduled" ? newStartTime : "",
        new_end_time: status === "rescheduled" ? newEndTime : "",
        new_room: status === "rescheduled" ? newRoom : "",
        note: note.trim(),
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`${slot.course_name} — ${date}`} className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm mb-2 border border-destructive/30 mx-6 mt-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div className="px-6 py-4 space-y-4">
          <Field label="Status" required>
            <select value={status} onChange={e => setStatus(e.target.value as "cancelled" | "rescheduled")} className={selectCls}>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </Field>
          {status === "rescheduled" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="New start time">
                  <input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className={inputCls} />
                </Field>
                <Field label="New end time">
                  <input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="New room (Optional)">
                <input value={newRoom} onChange={e => setNewRoom(e.target.value)} className={inputCls} />
              </Field>
            </>
          )}
          <Field label="Note (Optional)">
            <input value={note} onChange={e => setNote(e.target.value)} className={inputCls} placeholder="e.g. Teacher is on leave" />
          </Field>
        </div>
        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary-gradient text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TodaySchedule({ universityId, departmentId, batches }: { universityId: string; departmentId: string; batches: Batch[] }) {
  const [batchId, setBatchId] = useState("")
  const [slots, setSlots] = useState<ClassSlot[]>([])
  const [statuses, setStatuses] = useState<ClassSlotStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [statusModal, setStatusModal] = useState<{ slot: ClassSlot; existing: ClassSlotStatus | null } | null>(null)
  const [menuSlot, setMenuSlot] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => { if (!batchId && batches.length) setBatchId(batches[0].id) }, [batches, batchId])

  const date = todayStr()
  const dow = new Date().getDay()

  const load = useCallback(async () => {
    if (!batchId) return
    setLoading(true)
    try {
      const [s, st] = await Promise.all([
        api.classSlots.getAllByBatch(departmentId, batchId),
        api.classSlots.getStatusesForDate(departmentId, batchId, date),
      ])
      setSlots(s)
      setStatuses(st)
      setError("")
    } catch (e: any) {
      setError(e.message || "Failed to load class schedule")
    } finally {
      setLoading(false)
    }
  }, [departmentId, batchId, date])

  useEffect(() => { load() }, [load])

  const todaySlots = slots.filter(s => s.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const statusFor = (slotId: string) => statuses.find(st => st.class_slot_id === slotId) ?? null

  async function markHeld(slotId: string) {
    const st = statusFor(slotId)
    if (st) await api.classSlots.deleteStatus(st.id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select value={batchId} onChange={e => setBatchId(e.target.value)} className={selectCls + " flex-1"} aria-label="Select batch">
          {!batches.length && <option value="">No batches</option>}
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button onClick={() => setScheduleOpen(true)} disabled={!batchId} className="flex items-center gap-1.5 rounded-sm border px-3 py-2.5 text-xs font-bold hover:bg-muted disabled:opacity-50 shrink-0">
          <Settings className="h-3.5 w-3.5" /> Manage
        </button>
      </div>

      {error && <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm border border-destructive/30"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !batchId ? (
        <div className="rounded-sm border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium">No batches yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add a batch to this department to set up its class schedule.</p>
        </div>
      ) : !todaySlots.length ? (
        <div className="rounded-sm border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium">No classes scheduled for today</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The CR enters the weekly routine once at the start of the semester via &quot;Manage&quot;, then only marks changes here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {todaySlots.map(s => {
            const st = statusFor(s.id)
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-sm border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{s.course_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {st?.status === "rescheduled" ? `${st.new_start_time}–${st.new_end_time}` : `${s.start_time}–${s.end_time}`}
                    {(st?.status === "rescheduled" ? st.new_room : s.room) ? ` · ${st?.status === "rescheduled" ? st.new_room : s.room}` : ""}
                    {s.teacher ? ` · ${s.teacher}` : ""}
                  </p>
                  {st?.note && <p className="text-xs text-muted-foreground italic mt-0.5">{st.note}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {st?.status === "cancelled" && <Badge variant="danger">Cancelled</Badge>}
                  {st?.status === "rescheduled" && <Badge variant="warn">Rescheduled</Badge>}
                  {!st && <Badge variant="success">Held</Badge>}
                  <button
                    onClick={(e) => { setMenuSlot(s.id); setMenuAnchor(e.currentTarget) }}
                    aria-label="Change status"
                    className="p-1.5 rounded-sm border hover:bg-muted"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                  <ActionMenu open={menuSlot === s.id} anchorEl={menuSlot === s.id ? menuAnchor : null} onClose={() => setMenuSlot(null)}>
                    <button onClick={() => { markHeld(s.id); setMenuSlot(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                      <RotateCcw className="h-4 w-4" /> Mark held
                    </button>
                    <button onClick={() => { setStatusModal({ slot: s, existing: null }); setMenuSlot(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-destructive">
                      <Ban className="h-4 w-4" /> Mark cancelled
                    </button>
                    <button onClick={() => { setStatusModal({ slot: s, existing: st }); setMenuSlot(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
                      <Clock3 className="h-4 w-4" /> Reschedule
                    </button>
                  </ActionMenu>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {scheduleOpen && (
        <ScheduleModal
          slots={slots}
          universityId={universityId}
          departmentId={departmentId}
          batchId={batchId}
          onClose={() => setScheduleOpen(false)}
          onRefresh={load}
        />
      )}
      {statusModal && (
        <StatusModal
          slot={statusModal.slot}
          date={date}
          existing={statusModal.existing}
          onClose={() => setStatusModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function TodayPanel({ universityId, departmentId }: { universityId: string; departmentId: string }) {
  const [notices, setNotices] = useState<ClassNotice[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [batchFilter, setBatchFilter] = useState("")
  const [modal, setModal] = useState<{ notice: ClassNotice | null } | null>(null)
  const [toDelete, setToDelete] = useState<ClassNotice | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const [n, b] = await Promise.all([
        api.classNotices.getAllByDepartment(departmentId),
        api.batches.getAllByDepartment(departmentId),
      ])
      setNotices(n)
      setBatches(b)
      setError("")
    } catch (e: any) {
      setError(e.message || "Failed to load notices")
    } finally {
      setLoading(false)
    }
  }, [departmentId])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.classNotices.delete(toDelete.id)
      if (toDelete.file_url) await deleteFile(toDelete.file_url)
      setToDelete(null)
      load()
    } catch (e: any) {
      setError(e.message || "Failed to delete notice")
    } finally {
      setDeleting(false)
    }
  }

  const batchName = (id?: string | null) => (id ? batches.find(b => b.id === id)?.name ?? "Unknown batch" : "All batches")
  const visible = notices.filter(n => !batchFilter || n.batch_id === batchFilter || !n.batch_id)
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
      {/* Left — today's classes */}
      <section className="rounded-sm border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Today</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-6">{today}</p>
        <TodaySchedule universityId={universityId} departmentId={departmentId} batches={batches} />
      </section>

      {/* Right — notice board */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Notice Board</h3>
          </div>
          <button onClick={() => setModal({ notice: null })} className="flex items-center gap-1.5 rounded-sm bg-primary-gradient px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Post
          </button>
        </div>

        <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className={selectCls} aria-label="Filter by batch">
          <option value="">All batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {error && <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm border border-destructive/30"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !visible.length ? (
          <EmptyState icon={Megaphone} label="class notices" />
        ) : (
          <ul className="space-y-3">
            {visible.map(n => (
              <li key={n.id} className="group rounded-sm border bg-card overflow-hidden">
                {n.file_type === "image" && n.file_url && (
                  <a href={getFullImageUrl(n.file_url)} target="_blank" rel="noreferrer">
                    <img src={getFullImageUrl(n.file_url)} alt={n.title} className="w-full max-h-56 object-cover border-b" />
                  </a>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm">{n.title}</h4>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setModal({ notice: n })} aria-label="Edit notice" className="p-1.5 rounded-sm border hover:bg-muted text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setToDelete(n)} aria-label="Delete notice" className="p-1.5 rounded-sm border hover:bg-muted text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {n.message && <p className="text-xs text-muted-foreground whitespace-pre-line">{n.message}</p>}
                  {n.file_type === "pdf" && n.file_url && (
                    <a href={getFullImageUrl(n.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                      <FileText className="h-4 w-4" /> Open PDF
                    </a>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="info">{batchName(n.batch_id)}</Badge>
                    {isExpired(n) ? <Badge variant="warn">Expired</Badge> : n.expires_at ? <span>Until {new Date(n.expires_at).toLocaleDateString()}</span> : null}
                    <span>· {n.posted_by_name || "Unknown"} · {new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal && (
        <NoticeModal
          notice={modal.notice}
          batches={batches}
          universityId={universityId}
          departmentId={departmentId}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
      <ConfirmDelete open={!!toDelete} label="notice" onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  )
}
