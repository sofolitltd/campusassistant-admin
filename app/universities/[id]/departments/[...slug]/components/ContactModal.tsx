"use client"

import { useState, useEffect } from "react"
import { api, EmergencyContact } from "@/lib/api"
import { Modal, Field, inputCls } from "./SharedUI"
import { Save, AlertCircle, ToggleLeft, ToggleRight, ShieldCheck } from "lucide-react"

interface ContactModalProps {
  open: boolean
  onClose: () => void
  contact: EmergencyContact | null
  universityId: string
  departmentId: string
  onSuccess: () => void
}

export function ContactModal({ open, onClose, contact, universityId, departmentId, onSuccess }: ContactModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState("")
  const [designation, setDesignation] = useState("")
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState("Administrative")
  const [targetScope, setTargetScope] = useState(departmentId ? "Department" : universityId ? "University" : "National")
  const [isVerified, setIsVerified] = useState(true)
  const [logoUrl, setLogoUrl] = useState("")

  const [universities, setUniversities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedUniIds, setSelectedUniIds] = useState<Set<string>>(new Set())
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<string>>(new Set())
  const [selectedUniIdForDept, setSelectedUniIdForDept] = useState(universityId || "")
  const [targetingOpen, setTargetingOpen] = useState(false)

  useEffect(() => {
    if (targetScope === "University" || targetScope === "Department") {
      api.universities.getAll().then(setUniversities).catch(console.error)
    }
  }, [targetScope])

  useEffect(() => {
    const fetchUniId = selectedUniIdForDept || universityId
    if (targetScope === "Department" && fetchUniId && !departmentId) {
      api.departments.getAllByUniversity(fetchUniId).then(setDepartments).catch(console.error)
    }
  }, [targetScope, selectedUniIdForDept, universityId, departmentId])

  useEffect(() => {
    if (open) {
      if (contact) {
        setTitle(contact.title || "")
        setDesignation(contact.designation || "")
        setDescription(contact.description || "")
        setPhone(contact.phone || "")
        setEmail(contact.email || "")
        setCategory(contact.category || "Administrative")
        setTargetScope(contact.target_scope || (departmentId ? "Department" : universityId ? "University" : "National"))
        setIsVerified(contact.is_verified ?? true)
        setLogoUrl(contact.logo_url || "")
        
        if (contact.target_scope === "University" && contact.targets) {
          setSelectedUniIds(new Set(contact.targets.map((t: any) => t.university_id)))
        } else if (contact.target_scope === "Department" && contact.targets) {
          setSelectedDeptIds(new Set(contact.targets.map((t: any) => t.department_id)))
          setSelectedUniIdForDept(contact.targets[0]?.university_id || universityId || "")
        }
      } else {
        setTitle("")
        setDesignation("")
        setDescription("")
        setPhone("")
        setEmail("")
        setCategory("Administrative")
        setTargetScope(departmentId ? "Department" : universityId ? "University" : "National")
        setIsVerified(true)
        setLogoUrl("")
        setSelectedUniIds(new Set())
        setSelectedDeptIds(new Set())
      }
      setError("")
    }
  }, [open, contact])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError("Title/Name is required")
    if (!phone.trim()) return setError("Phone number is required")

    setLoading(true)
    setError("")

    try {
      let targets: any[] = []
      if (targetScope === "University") {
        if (!universityId && selectedUniIds.size === 0) return setError("Select at least one university")
        targets = Array.from(selectedUniIds).map(id => ({ university_id: id }))
        if (universityId && targets.length === 0) targets = [{ university_id: universityId }]
      } else if (targetScope === "Department") {
        if (!departmentId && selectedDeptIds.size === 0) return setError("Select at least one department")
        targets = Array.from(selectedDeptIds).map(id => ({ university_id: selectedUniIdForDept || universityId, department_id: id }))
        if (departmentId && targets.length === 0) targets = [{ university_id: universityId, department_id: departmentId }]
      }

      const payload: Partial<EmergencyContact> = {
        title, designation, description, phone, email,
        category, target_scope: targetScope, is_verified: isVerified, logo_url: logoUrl,
        targets
      } as any

      if (contact) {
        await api.emergencyContacts.update(contact.id, payload)
      } else {
        await api.emergencyContacts.create(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save contact")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <Modal open={open} onClose={onClose} title={contact ? "Edit Emergency Contact" : "Add Emergency Contact"} className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-sm mb-4 border border-red-100 shrink-0 mx-6 mt-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name / Office Title" required>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Proctor Office" required />
            </Field>
            <Field label="Category" required>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                <option value="Administrative">Administrative</option>
                <option value="Medical">Medical / Hospital</option>
                <option value="Security">Security / Police</option>
                <option value="Fire Service">Fire Service</option>
                <option value="Transport">Transport</option>
                <option value="Student Service">Student Service</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Designation / Role">
            <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} className={inputCls} placeholder="e.g. Chief Security Officer" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number" required>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+8801..." required />
            </Field>
            <Field label="Email (Optional)">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="office@university.edu" />
            </Field>
          </div>

          <Field label="Logo / Icon URL">
            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>

          <Field label="Description / Note">
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Brief description of services..." rows={2} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Visibility Scope">
              <select 
                value={targetScope} 
                onChange={e => {
                  setTargetScope(e.target.value)
                  if (!departmentId) setSelectedDeptIds(new Set())
                }} 
                disabled={!!departmentId}
                className={inputCls}
              >
                {!universityId && !departmentId && <option value="National">National</option>}
                {!departmentId && <option value="University">University</option>}
                <option value="Department">Department</option>
              </select>
            </Field>
            
            <div className="flex flex-col gap-1.5 justify-center pt-5">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <button type="button" onClick={() => setIsVerified(!isVerified)} className="transition-all">
                    {isVerified ? <ToggleRight className="h-7 w-7 text-green-600" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                  </button>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold flex items-center gap-1">
                      Verified {isVerified && <ShieldCheck className="h-3 w-3 text-green-600" />}
                    </span>
                  </div>
               </label>
            </div>
          </div>

          {targetScope !== "National" && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setTargetingOpen(true)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-dashed p-4 hover:bg-accent/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-xl leading-none">+</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold uppercase tracking-tight">Pick {targetScope} Targets</p>
                    <p className="text-xs text-muted-foreground">
                      {targetScope === "University" 
                        ? `${selectedUniIds.size} universities selected`
                        : `${selectedDeptIds.size} departments selected`
                      }
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Contact"}
          </button>
        </div>
      </form>
    </Modal>

    {/* Targeting Sub-Modal */}
    <Modal 
      open={targetingOpen} 
      onClose={() => setTargetingOpen(false)} 
      title={`Select Target ${targetScope}s`}
      className="max-w-2xl"
    >
      <div className="p-6 space-y-6">
        {targetScope === "University" && !universityId && (
          <div className="space-y-4">
            <div className="grid gap-2 max-h-[50vh] overflow-y-auto pr-2">
              {universities.map(uni => (
                <label key={uni.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <span className="text-sm font-medium">{uni.name}</span>
                  <input
                    type="checkbox"
                    checked={selectedUniIds.has(uni.id)}
                    onChange={(e) => {
                      const newIds = new Set(selectedUniIds)
                      if (e.target.checked) newIds.add(uni.id)
                      else newIds.delete(uni.id)
                      setSelectedUniIds(newIds)
                    }}
                    className="h-5 w-5 rounded border-gray-300 text-primary"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {targetScope === "Department" && (
          <div className="space-y-6">
            {!universityId && (
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Step 1: Select University</label>
                <select
                  value={selectedUniIdForDept}
                  onChange={(e) => {
                    setSelectedUniIdForDept(e.target.value)
                    setSelectedDeptIds(new Set())
                  }}
                  className={inputCls}
                >
                  <option value="">-- Choose University --</option>
                  {universities.map(uni => (
                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(selectedUniIdForDept || universityId) && !departmentId && (
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">
                  Step 2: Select Departments ({selectedDeptIds.size})
                </label>
                <div className="grid sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2">
                  {departments.map(dept => (
                    <label key={dept.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDeptIds.has(dept.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedDeptIds)
                          if (e.target.checked) newSet.add(dept.id)
                          else newSet.delete(dept.id)
                          setSelectedDeptIds(newSet)
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-primary"
                      />
                      <p className="text-sm font-bold truncate">{dept.name}</p>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 flex gap-3 border-t">
          <button 
            type="button"
            onClick={() => setTargetingOpen(false)}
            className="flex-1 rounded-lg bg-primary py-3 text-sm font-bold text-white hover:opacity-90 transition-all"
          >
            Done Selection
          </button>
        </div>
      </div>
    </Modal>
  </>
  )
}
