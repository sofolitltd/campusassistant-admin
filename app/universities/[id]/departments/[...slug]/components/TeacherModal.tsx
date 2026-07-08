"use client"

import { useState, useEffect } from "react"
import { api, Teacher } from "@/lib/api"
import { Modal, Field, inputCls } from "./SharedUI"
import { Save, AlertCircle } from "lucide-react"

interface TeacherModalProps {
  open: boolean
  onClose: () => void
  teacher: Teacher | null
  universityId: string
  departmentId: string
  onSuccess: () => void
}

export function TeacherModal({ open, onClose, teacher, universityId, departmentId, onSuccess }: TeacherModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [designation, setDesignation] = useState("")
  const [phd, setPhd] = useState("")
  const [about, setAbout] = useState("")
  const [interests, setInterests] = useState("")
  const [publications, setPublications] = useState("")
  const [weight, setWeight] = useState(0)
  const [isChairman, setIsChairman] = useState(false)
  const [isPresent, setIsPresent] = useState(true)

  useEffect(() => {
    if (open) {
      if (teacher) {
        setName(teacher.name || "")
        setEmail(teacher.email || "")
        setPhone(teacher.phone || "")
        setDesignation(teacher.designation || "")
        setPhd(teacher.phd || "")
        setAbout(teacher.about || "")
        setInterests(teacher.interests || "")
        setPublications(teacher.publications || "")
        setWeight(teacher.weight || 0)
        setIsChairman(teacher.is_chairman || false)
        setIsPresent(teacher.is_present ?? true)
      } else {
        setName("")
        setEmail("")
        setPhone("")
        setDesignation("Lecturer")
        setPhd("")
        setAbout("")
        setInterests("")
        setPublications("")
        setWeight(0)
        setIsChairman(false)
        setIsPresent(true)
      }
      setError("")
    }
  }, [open, teacher])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError("Name is required")
    if (!designation.trim()) return setError("Designation is required")

    setLoading(true)
    setError("")

    try {
      const payload: Partial<Teacher> = {
        name, email, phone, designation, phd,
        about, interests, publications,
        weight, is_chairman: isChairman, is_present: isPresent,
        department_id: departmentId, university_id: universityId
      }

      if (teacher) {
        await api.teachers.update(teacher.id, payload)
      } else {
        await api.teachers.create(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save teacher")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={teacher ? "Edit Faculty Member" : "Add Faculty Member"} className="max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-sm mb-4 border border-red-100 shrink-0 mx-6 mt-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Dr. John Doe" required />
            </Field>
            <Field label="Designation" required>
              <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} className={inputCls} placeholder="e.g. Associate Professor" required />
            </Field>
            
            <Field label="Email Address">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="e.g. john@university.edu" />
            </Field>
            <Field label="Phone Number">
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="e.g. +1 234 567 8900" />
            </Field>

            <div className="sm:col-span-2">
              <Field label="PhD Details / Academic Credentials">
                <input type="text" value={phd} onChange={e => setPhd(e.target.value)} className={inputCls} placeholder="e.g. Ph.D. in Computer Science, MIT" />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Research Interests (Comma separated)">
                <input type="text" value={interests} onChange={e => setInterests(e.target.value)} className={inputCls} placeholder="e.g. Machine Learning, NLP, Data Science" />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Publications Link">
                <input type="url" value={publications} onChange={e => setPublications(e.target.value)} className={inputCls} placeholder="e.g. https://scholar.google.com/..." />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="About">
                <textarea value={about} onChange={e => setAbout(e.target.value)} className={inputCls} placeholder="Brief biography..." rows={3} />
              </Field>
            </div>
          </div>

          <div className="border-t pt-4">
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Settings & Status</p>
             <div className="grid sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 p-3 rounded-sm border bg-card cursor-pointer hover:bg-muted transition-colors">
                  <input type="checkbox" checked={isChairman} onChange={e => setIsChairman(e.target.checked)} className="rounded-xs accent-primary" />
                  <span className="text-sm font-medium">Is Chairman</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-sm border bg-card cursor-pointer hover:bg-muted transition-colors">
                  <input type="checkbox" checked={isPresent} onChange={e => setIsPresent(e.target.checked)} className="rounded-xs accent-primary" />
                  <span className="text-sm font-medium">Currently Present</span>
                </label>
                <div className="flex flex-col gap-1 justify-center">
                  <label className="text-sm font-medium">Sorting Weight</label>
                  <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className={inputCls} placeholder="Higher = Top" />
                </div>
             </div>
          </div>
        </div>

        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Faculty"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
