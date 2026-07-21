"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Image as ImageIcon, Loader2, Send, X } from "lucide-react"
import { api } from "@/lib/api"
import { inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { NotificationAudienceBuilder, TargetRow } from "@/components/NotificationAudienceBuilder"
import { uploadFile } from "@/lib/upload-utils"
import { compressForNotification } from "@/lib/image-helper"

const NOTIFICATION_TYPES = [
  { value: "general", label: "General" },
  { value: "routineUpdate", label: "Routine Update" },
  { value: "studyMaterial", label: "Study Material" },
  { value: "notice", label: "Notice" },
  { value: "exam", label: "Exam" },
  { value: "event", label: "Event" },
]

type AudienceMode = "all" | "custom"

export default function AddNotificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "general",
    action_route: "",
  })

  const [pickedImage, setPickedImage] = useState<Blob | null>(null)
  const [imageError, setImageError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<AudienceMode>("all")
  const [rows, setRows] = useState<TargetRow[]>([])

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError("")
    try {
      setPickedImage(await compressForNotification(file))
    } catch (err) {
      console.error("Image compression failed:", err)
      setImageError("Could not process that image — try a different file.")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "custom" && rows.length === 0) {
      alert("Add at least one target to the custom audience before sending.")
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        body: form.body,
        type: form.type,
        data: {} as Record<string, unknown>,
      }
      if (pickedImage) {
        setUploading(true)
        try {
          payload.image_url = await uploadFile(pickedImage, "notifications")
        } finally {
          setUploading(false)
        }
      }
      if (mode === "all") {
        payload.scope = "university" // no target_id => broadcast to every user
      } else {
        payload.scope = "custom"
        payload.targets = rows.map(r => ({
          university_id: r.universityId,
          ...(r.departmentId ? { department_id: r.departmentId } : {}),
          ...(r.batchId ? { batch_id: r.batchId } : {}),
        }))
      }
      if (form.action_route) {
        (payload.data as Record<string, unknown>).action_route = form.action_route
      }
      const result = await api.notifications.create(payload) as { count?: number }
      if (!result?.count) {
        alert("No matching users were found for the given audience — no notification was sent.")
        return
      }
      router.push("/notifications")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send notification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Send Notification</h1>
            <p className="text-muted-foreground">Send a push notification to users.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Content</h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Exam Schedule Updated"
              value={form.title}
              onChange={e => update("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Body <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              className={`${inputCls} min-h-[100px] resize-y`}
              placeholder="Notification message content..."
              value={form.body}
              onChange={e => update("body", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Type <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              className={selectCls}
              value={form.type}
              onChange={e => update("type", e.target.value)}
            >
              {NOTIFICATION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Image (optional)</label>
            <div className="rounded-sm border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-1 hover:border-primary/40 transition-all overflow-hidden">
              {pickedImage ? (
                <div className="relative flex items-center gap-4 p-3 bg-background rounded-sm shadow-sm border">
                  <div className="w-16 h-16 bg-muted shrink-0 rounded-sm overflow-hidden border shadow-inner flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(pickedImage)} alt="Notification image preview" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate pr-8">New image selected</p>
                    <p className="text-[10px] text-muted-foreground">{Math.round(pickedImage.size / 1024)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPickedImage(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center py-6 gap-2 group/btn">
                  <div className="rounded-full bg-primary/10 p-3 group-hover/btn:scale-110 transition-transform">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-bold">Upload Image</p>
                  <p className="text-[10px] text-muted-foreground">Compressed automatically, shown as a big-picture image in the push notification</p>
                </button>
              )}
              <input ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden" accept="image/*" />
            </div>
            {imageError && <p className="text-[10px] text-red-500 font-medium">{imageError}</p>}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Target Audience</h2>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("all")}
              className={`text-left rounded-lg border-2 p-3 transition-all ${
                mode === "all" ? "border-primary bg-primary/5" : "border-transparent bg-muted/40 hover:bg-muted"
              }`}
            >
              <p className="text-sm font-bold">All Users</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Every user across every university (general/broadcast channel).</p>
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`text-left rounded-lg border-2 p-3 transition-all ${
                mode === "custom" ? "border-primary bg-primary/5" : "border-transparent bg-muted/40 hover:bg-muted"
              }`}
            >
              <p className="text-sm font-bold">Custom Audience</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Build a mix of universities, departments, and/or batches.</p>
            </button>
          </div>

          {mode === "custom" && (
            <div className="pt-2">
              <NotificationAudienceBuilder rows={rows} onChange={setRows} />
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-medium">Action Route</label>
            <input
              className={inputCls}
              placeholder="e.g. /routine, /study, /notice/123"
              value={form.action_route}
              onChange={e => update("action_route", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Deep link route users navigate to when tapping the notification.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/notifications"
            className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold hover:bg-muted transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {uploading ? "Uploading image..." : loading ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </form>
    </div>
  )
}
