"use client"

import { useState, useEffect } from "react"
import { api, Staff } from "@/lib/api"
import { Modal, Field, inputCls } from "./SharedUI"
import { Save, AlertCircle } from "lucide-react"

interface StaffModalProps {
  open: boolean
  onClose: () => void
  staff: Staff | null
  universityId: string
  departmentId: string
  onSuccess: () => void
}

export function StaffModal({ open, onClose, staff, universityId, departmentId, onSuccess }: StaffModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [post, setPost] = useState("")
  const [mobile, setMobile] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [serial, setSerial] = useState(0)

  useEffect(() => {
    if (open) {
      if (staff) {
        setName(staff.name || "")
        setPost(staff.post || "")
        setMobile(staff.mobile || "")
        setImageUrl(staff.image_url || "")
        setSerial(staff.serial || 0)
      } else {
        setName("")
        setPost("")
        setMobile("")
        setImageUrl("")
        setSerial(0)
      }
      setError("")
    }
  }, [open, staff])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError("Name is required")
    if (!post.trim()) return setError("Post/Designation is required")

    setLoading(true)
    setError("")

    try {
      const payload: Partial<Staff> = {
        name: name.trim(),
        post: post.trim(),
        mobile: mobile.trim(),
        image_url: imageUrl.trim(),
        serial: Number(serial),
        department_id: departmentId,
        university_id: universityId
      }

      if (staff) {
        await api.staffs.update(staff.id, payload)
      } else {
        await api.staffs.create(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save staff member")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={staff ? "Edit Staff Member" : "Add Staff Member"} className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-sm mb-4 border border-red-100 shrink-0 mx-6 mt-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <Field label="Full Name" required>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Jane Doe" required />
          </Field>
          
          <Field label="Post / Designation" required>
            <input type="text" value={post} onChange={e => setPost(e.target.value)} className={inputCls} placeholder="e.g. Administrative Officer" required />
          </Field>

          <Field label="Image URL">
            <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputCls} placeholder="https://example.com/staff.jpg" />
          </Field>
          
          <Field label="Mobile Number">
            <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} className={inputCls} placeholder="e.g. +8801700000000" />
          </Field>

          <Field label="Sorting Serial">
            <input type="number" value={serial} onChange={e => setSerial(Number(e.target.value))} className={inputCls} placeholder="Lower number = Top" />
          </Field>
        </div>

        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Staff"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
