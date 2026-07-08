"use client"

import { useState, useEffect } from "react"
import { api, Transport, getFullImageUrl, getApiKey, getApiUrl } from "@/lib/api"
import { EmptyState, ConfirmDelete, Modal, Field, inputCls } from "../departments/[...slug]/components/SharedUI"
import { Bus, Plus, Edit2, Trash2, Save, AlertCircle, Clock, Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Modal ───────────────────────────────────────────────────────────────────

interface TransportModalProps {
  open: boolean
  onClose: () => void
  transport: Transport | null
  universityId: string
  onSuccess: () => void
}

function TransportModal({ open, onClose, transport, universityId, onSuccess }: TransportModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState(transport?.title || "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(transport?.image ? getFullImageUrl(transport.image) : null)
  const [time, setTime] = useState(transport?.time || "")

  // Reset form when opened with new transport
  useEffect(() => {
    if (open) {
      setTitle(transport?.title || "")
      setImageFile(null)
      setImagePreview(transport?.image ? getFullImageUrl(transport.image) : null)
      setTime(transport?.time || "")
      setError("")
    }
  }, [open, transport])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError("Title is required")
    if (!imagePreview && !imageFile) return setError("Transport image schedule is required")

    setLoading(true)
    setError("")

    try {
      let imageUrl = transport?.image || ""

      if (imageFile) {
        // 1. Delete old image if exists
        if (transport?.image) {
          try {
            await fetch(`${getApiUrl()}/upload?url=${transport.image}`, {
              method: 'DELETE',
              headers: { 'X-API-Key': getApiKey() },
            })
          } catch (err) {
            console.error("Failed to delete old image:", err)
          }
        }

        // 2. Upload new image
        const uploadFormData = new FormData()
        uploadFormData.append("image", imageFile)
        uploadFormData.append("folder", "transports")

        const uploadRes = await fetch(`${getApiUrl()}/upload`, {
          method: 'POST',
          headers: { 'X-API-Key': getApiKey() },
          body: uploadFormData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          imageUrl = uploadData.file_url || uploadData.url
        } else {
          throw new Error("Failed to upload image")
        }
      }

      const payload: Partial<Transport> = {
        title,
        image: imageUrl,
        time,
        university_id: universityId
      }

      if (transport) {
        await api.transports.update(transport.id, payload)
      } else {
        await api.transports.create(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save transport")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={transport ? "Edit Transport Schedule" : "Add Transport Schedule"} className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-sm mb-4 border border-red-100 shrink-0 mx-6 mt-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="px-6 py-4 space-y-4">
          <Field label="Title / Route Name" required>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Upayan & Dowayan Bus Schedule" required />
          </Field>
          
          <Field label="Schedule Image" required>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="group relative h-40 w-full overflow-hidden rounded-sm border-2 border-dashed bg-muted hover:border-primary flex items-center justify-center transition-colors">
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Transport schedule preview" 
                      className="h-full w-full object-cover"
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      className="absolute top-2 right-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                    <Upload className="h-8 w-8" />
                    <span className="text-xs uppercase font-bold tracking-wider">Upload Schedule Image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-center text-muted-foreground italic">
                Max 5MB. Matches Routine model layout.
              </p>
            </div>
          </Field>
          
          <Field label="Active Time / Validity (Optional)">
            <input type="text" value={time} onChange={e => setTime(e.target.value)} className={inputCls} placeholder="e.g. Effective from Summer 2026" />
          </Field>
        </div>

        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {loading ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── TransportTab ─────────────────────────────────────────────────────────────

export function TransportTab({
  transports,
  universityId,
  onRefresh,
}: {
  transports: Transport[]
  universityId: string
  onRefresh: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Transport | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!selected) return
    setLoading(true)
    try {
      await api.transports.delete(selected.id)
      onRefresh()
      setDeleteOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">University Transports</h3>
          <p className="text-xs text-muted-foreground">Manage bus and other transport schedules for the university.</p>
        </div>
        <button
          onClick={() => { setSelected(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Schedule
        </button>
      </div>

      {!transports.length ? (
        <EmptyState icon={Bus} label="transports" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transports.map((transport) => (
            <div key={transport.id} className="group relative rounded-sm border bg-card shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => { setSelected(transport); setModalOpen(true) }}
                  className="p-1.5 bg-background border rounded-sm hover:bg-muted text-primary transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setSelected(transport); setDeleteOpen(true) }}
                  className="p-1.5 bg-background border rounded-sm hover:bg-muted text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="aspect-[4/3] bg-muted relative border-b overflow-hidden rounded-t-sm">
                {transport.image ? (
                  <img 
                    src={getFullImageUrl(transport.image)} 
                    alt={transport.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/800x600/f1f5f9/64748b?text=Invalid+Image"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground/40 gap-2">
                    <Bus className="h-10 w-10 stroke-[1.5]" />
                    <span className="text-xs font-medium">No schedule image</span>
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h4 className="font-bold text-sm mb-1 truncate pr-16">{transport.title}</h4>
                {transport.time && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="truncate">{transport.time}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransportTabModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transport={selected}
        universityId={universityId}
        onSuccess={onRefresh}
      />

      <ConfirmDelete
        open={deleteOpen}
        label="transport"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  )
}

function TransportTabModal(props: TransportModalProps) {
  if (!props.open) return null
  return <TransportModal {...props} />
}
