"use client"

import { useState, useEffect } from "react"
import { api, Banner } from "@/lib/api"
import { Modal, Field, inputCls } from "./SharedUI"
import { Save, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BannerModalProps {
  open: boolean
  onClose: () => void
  banner: Banner | null
  universityId: string
  departmentId: string
  onSuccess: () => void
}

export function BannerModal({ open, onClose, banner, universityId, departmentId, onSuccess }: BannerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [clickUrl, setClickUrl] = useState("")
  const [priority, setPriority] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [targetScope, setTargetScope] = useState("department")

  useEffect(() => {
    if (open) {
      if (banner) {
        setTitle(banner.title || "")
        setImageUrl(banner.image_url || "")
        setClickUrl(banner.click_url || "")
        setPriority(banner.priority || 0)
        setIsActive(banner.is_active ?? true)
        setStartAt(banner.start_at ? new Date(banner.start_at).toISOString().split('T')[0] : "")
        setEndAt(banner.end_at ? new Date(banner.end_at).toISOString().split('T')[0] : "")
        setTargetScope(banner.target_scope || "department")
      } else {
        setTitle("")
        setImageUrl("")
        setClickUrl("")
        setPriority(0)
        setIsActive(true)
        setStartAt(new Date().toISOString().split('T')[0])
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        setEndAt(nextMonth.toISOString().split('T')[0])
        setTargetScope("department")
      }
      setError("")
    }
  }, [open, banner])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError("Title is required")
    if (!imageUrl.trim()) return setError("Image URL is required")

    setLoading(true)
    setError("")

    try {
      const payload: Partial<Banner> = {
        title, image_url: imageUrl, click_url: clickUrl,
        priority, is_active: isActive,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        target_scope: targetScope,
      }

      if (banner) {
        await api.banners.update(banner.id, payload)
      } else {
        // For new banners, we might need to handle targets or the API might handle it via department_id if added
        // Assuming the API expects department_id/university_id in the payload for scope
        const createPayload = {
          ...payload,
          university_id: universityId,
          department_id: departmentId
        }
        await api.banners.create(createPayload as any)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save banner")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={banner ? "Edit Banner" : "Add Banner"} className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-sm mb-4 border border-red-100 shrink-0 mx-6 mt-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <Field label="Banner Title" required>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Admission Open 2024" required />
          </Field>
          
          <Field label="Image URL" required>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputCls} placeholder="https://example.com/banner.jpg" required />
          </Field>
          
          <Field label="Click URL (Optional)">
            <input type="url" value={clickUrl} onChange={e => setClickUrl(e.target.value)} className={inputCls} placeholder="https://example.com/more-info" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required>
              <input type="date" value={startAt} onChange={e => setStartAt(e.target.value)} className={inputCls} required />
            </Field>
            <Field label="End Date" required>
              <input type="date" value={endAt} onChange={e => setEndAt(e.target.value)} className={inputCls} required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority (Higher = First)">
              <input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Target Scope">
              <select value={targetScope} onChange={e => setTargetScope(e.target.value)} className={inputCls}>
                <option value="department">Department</option>
                <option value="university">University</option>
                <option value="national">National</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-between p-3 rounded-sm border bg-muted/20">
            <div>
              <p className="text-sm font-bold">Active Status</p>
              <p className="text-[10px] text-muted-foreground">Only active banners are shown to users.</p>
            </div>
            <button type="button" onClick={() => setIsActive(!isActive)} className="transition-all">
              {isActive ? <ToggleRight className="h-8 w-8 text-primary" /> : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
            </button>
          </div>
        </div>

        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Banner"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
