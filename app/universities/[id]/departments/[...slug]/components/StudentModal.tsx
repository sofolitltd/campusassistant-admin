"use client"

import { useState, useEffect } from "react"
import { api, Student, Batch, Session, Hall } from "@/lib/api"
import { Modal, Field, inputCls, selectCls } from "./SharedUI"
import { Loader2, ToggleLeft, ToggleRight, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentModalProps {
  open: boolean
  onClose: () => void
  universityId: string
  departmentId: string
  currentBatchId?: string
  student?: Student | null
  onSuccess: () => void
}

export function StudentModal({
  open, onClose, universityId, departmentId, currentBatchId, student, onSuccess,
}: StudentModalProps) {
  const isEdit = !!student
  const [studentId, setStudentId] = useState(student?.student_id ?? "")
  const [name, setName] = useState(student?.name ?? "")
  const [email, setEmail] = useState(student?.email ?? "")
  const [phone, setPhone] = useState(student?.phone ?? "")
  const [bloodGroup, setBloodGroup] = useState(student?.blood_group ?? "")
  const [batchId, setBatchId] = useState(student?.batch_id ?? currentBatchId ?? "")
  const [sessionId, setSessionId] = useState(student?.session_id ?? "")
  const [hallId, setHallId] = useState(student?.hall_id ?? "")
  const [verificationCode, setVerificationCode] = useState(student?.verification_code ?? "")
  const [isRegular, setIsRegular] = useState(student?.is_regular ?? true)
  const [isCr, setIsCr] = useState(student?.is_cr ?? false)
  const [createdAt, setCreatedAt] = useState("")

  const [batches, setBatches] = useState<Batch[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setStudentId(student?.student_id ?? "")
      setName(student?.name ?? "")
      setEmail(student?.email ?? "")
      setPhone(student?.phone ?? "")
      setBloodGroup(student?.blood_group ?? "")
      setBatchId(student?.batch_id ?? currentBatchId ?? "")
      setSessionId(student?.session_id ?? "")
      setHallId(student?.hall_id ?? "")
      setVerificationCode(student?.verification_code ?? Math.random().toString(36).substring(2, 8).toUpperCase())
      setIsRegular(student?.is_regular ?? true)
      setIsCr(student?.is_cr ?? false)
      setCreatedAt(student?.created_at ? new Date(student.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
      setError("")

      Promise.all([
        api.batches.getAllByDepartment(departmentId),
        api.sessions.getAllByUniversity(universityId),
        api.halls.getAllByUniversity(universityId),
      ]).then(([b, s, h]) => {
        setBatches(b)
        setSessions([...s].sort((a, b) => b.name.localeCompare(a.name)))
        setHalls(h)
      }).catch(() => { })
    }
  }, [open, student, departmentId, universityId, currentBatchId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Client-side Validation
    if (!name.trim()) return setError("Student name is required")
    if (!batchId) return setError("Please select a batch")
    if (!studentId.trim()) return setError("Student ID is required")
    if (!sessionId) return setError("Please select an academic session")

    setLoading(true); setError("")
    try {
      const payload = {
        student_id: studentId.trim(), name: name.trim(), email: email.trim(), phone: phone.trim(), 
        blood_group: bloodGroup,
        batch_id: batchId, session_id: sessionId, hall_id: hallId,
        verification_code: verificationCode, is_regular: isRegular, is_cr: isCr,
        created_at: new Date(createdAt).toISOString(),
        university_id: universityId, department_id: departmentId
      }
      if (isEdit) await api.students.update(student!.id, payload)
      else await api.students.create(payload)
      onSuccess(); onClose()
    } catch (err: any) { 
      setError(err.message || "Failed to save student record") 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Student" : "Add Student"}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Row: Name */}
        <Field label="Full Name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className={inputCls} />
        </Field>

        {/* Row: Batch | ID */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Batch" required>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className={selectCls}>
              <option value="">Select Batch</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Student ID" required>
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. 190101" className={inputCls} />
          </Field>
        </div>

        {/* Row: Session | Blood */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Session" required>
            <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={selectCls} required>
              <option value="">Select Session</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Blood Group">
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={selectCls}>
              <option value="">Blood Group</option>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>

        {/* Row: Hall */}
        <Field label="Hall">
          <select value={hallId} onChange={(e) => setHallId(e.target.value)} className={selectCls}>
            <option value="">Select Hall</option>
            {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Field>

        {/* Row: Email | Phone */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@mail.com" className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017..." className={inputCls} />
          </Field>
        </div>

        {/* Row: Verification Code */}
        <Field label="Verification Code">
          <div className="relative">
            <input 
              value={verificationCode} 
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())} 
              placeholder="e.g. AB12XY" 
              className={cn(inputCls, "pr-12 font-mono tracking-widest")} 
            />
            <button 
              type="button"
              onClick={() => setVerificationCode(Math.random().toString(36).substring(2, 8).toUpperCase())}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-sm hover:bg-muted text-primary transition-colors"
              title="Generate Code"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </Field>

        {/* Row: Status Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-sm border p-3">
            <span className="text-sm font-medium">Regular?</span>
            <button type="button" onClick={() => setIsRegular(!isRegular)} className="transition-all">
              {isRegular ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex items-center justify-between rounded-sm border p-3">
            <span className="text-sm font-medium">Class CR?</span>
            <button type="button" onClick={() => setIsCr(!isCr)} className="transition-all">
              {isCr ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Row: Member Since */}
        <Field label="Member Since (Registration Date)">
          <input 
            type="date" 
            value={createdAt} 
            onChange={(e) => setCreatedAt(e.target.value)} 
            className={inputCls} 
          />
        </Field>
        {error && <p className="text-sm text-red-500 rounded-sm bg-red-50 dark:bg-red-900/20 p-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? "Update" : "Add Student"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
