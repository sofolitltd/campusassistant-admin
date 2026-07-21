"use client"

import { useState, useEffect, useRef } from "react"
import { api, Notice } from "@/lib/api"
import { Modal, Field, inputCls } from "./SharedUI"
import { uploadFile, deleteFile } from "@/lib/upload-utils"
import { optimizeImage } from "@/lib/image-helper"
import { Save, AlertCircle, Image as ImageIcon, X } from "lucide-react"

interface NoticeModalProps {
  open: boolean
  onClose: () => void
  notice: Notice | null
  universityId: string
  departmentId: string
  onSuccess: () => void
}

export function NoticeModal({ open, onClose, notice, universityId, departmentId, onSuccess }: NoticeModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const [uploader, setUploader] = useState("")
  const [message, setMessage] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [pickedBlob, setPickedBlob] = useState<Blob | null>(null)
  const [urlToDelete, setUrlToDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setError("")
      setPickedBlob(null)
      setUrlToDelete(null)
      if (notice) {
        setUploader(notice.uploader || "")
        setMessage(notice.message || "")
        setImageUrl(notice.image_urls?.[0] || "")
      } else {
        setUploader("")
        setMessage("")
        setImageUrl("")
      }
    }
  }, [open, notice])

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPickedBlob(await optimizeImage(file))
    } catch (err) {
      console.error("Optimization failed:", err)
      setPickedBlob(file)
    }
  }

  function removeImage() {
    if (imageUrl) setUrlToDelete(imageUrl)
    setImageUrl("")
    setPickedBlob(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uploader.trim()) return setError("Uploader name is required")
    if (!message.trim()) return setError("Message is required")

    setLoading(true)
    setError("")

    try {
      let finalUrl = imageUrl

      if (pickedBlob) {
        setUploading(true)
        if (urlToDelete) await deleteFile(urlToDelete).catch(console.error)
        finalUrl = await uploadFile(pickedBlob, "notices")
        setUploading(false)
      } else if (urlToDelete) {
        await deleteFile(urlToDelete).catch(console.error)
        finalUrl = ""
      }

      const payload: Partial<Notice> = {
        uploader: uploader.trim(),
        message: message.trim(),
        image_urls: finalUrl ? [finalUrl] : [],
      }

      if (notice) {
        await api.notices.update(notice.id, payload)
      } else {
        await api.notices.create({ ...payload, university_id: universityId, department_id: departmentId })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save notice")
      setUploading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={notice ? "Edit Notice" : "Add Notice"} className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-sm mb-4 border border-red-100 shrink-0 mx-6 mt-4">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <Field label="Uploader / Posted By" required>
            <input type="text" value={uploader} onChange={e => setUploader(e.target.value)} className={inputCls} placeholder="e.g. Department Office" required />
          </Field>

          <Field label="Message" required>
            <textarea value={message} onChange={e => setMessage(e.target.value)} className={inputCls} rows={5} placeholder="Notice content shown to students…" required />
          </Field>

          <Field label="Image (Optional)">
            <div className="rounded-sm border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-1 hover:border-primary/40 transition-all overflow-hidden">
              {pickedBlob || imageUrl ? (
                <div className="relative flex items-center gap-4 p-3 bg-background rounded-sm shadow-sm border">
                  <div className="w-16 h-16 bg-muted shrink-0 rounded-sm overflow-hidden border shadow-inner flex items-center justify-center">
                    <img src={pickedBlob ? URL.createObjectURL(pickedBlob) : imageUrl} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate pr-8">{pickedBlob ? "New image selected" : "Current image"}</p>
                  </div>
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center py-6 gap-2 group/btn">
                  <div className="rounded-full bg-primary/10 p-3 group-hover/btn:scale-110 transition-transform">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-bold">Upload Image</p>
                </button>
              )}
              <input ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden" accept="image/*" />
            </div>
          </Field>
        </div>

        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading || uploading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
            <Save className="h-4 w-4" /> {loading || uploading ? "Saving..." : "Save Notice"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
