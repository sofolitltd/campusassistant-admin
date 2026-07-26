"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  Upload,
  Type,
  Loader2,
  X,
  ChevronRight as ChevronRightIcon,
  ChevronDown,
  Check,
  Globe,
  Link as LinkIcon,
} from "lucide-react"
import {
  api,
  CareerCircular,
  CareerCircularTarget,
  CareerCircularCategory,
  University,
  getApiKey,
  getApiUrl,
} from "@/lib/api"
import { cn } from "@/lib/utils"

// A target with this department_id means "whole university" — a real UUID
// (uuid.Nil's string form), NOT an empty string (see ProductForm's
// TargetSelector for why an empty string would fail Go's uuid.UUID JSON binding).
const WHOLE_UNIVERSITY = "00000000-0000-0000-0000-000000000000"

function TargetSelector({
  universities,
  selectedTargets,
  onChange,
}: {
  universities: University[]
  selectedTargets: CareerCircularTarget[]
  onChange: (targets: CareerCircularTarget[]) => void
}) {
  const [expandedUni, setExpandedUni] = useState<string | null>(null)

  const isTargeted = (uniId: string, deptId: string) =>
    selectedTargets.some(t => t.university_id === uniId && t.department_id === deptId)

  const toggleTarget = (uniId: string, deptId: string) => {
    const exists = selectedTargets.find(t => t.university_id === uniId && t.department_id === deptId)
    if (exists) {
      onChange(selectedTargets.filter(t => t !== exists))
    } else {
      onChange([...selectedTargets, { university_id: uniId, department_id: deptId }])
    }
  }

  const toggleUniAll = (uni: University) => {
    if (isTargeted(uni.id, WHOLE_UNIVERSITY)) {
      onChange(selectedTargets.filter(t => t.university_id !== uni.id))
    } else {
      onChange([
        ...selectedTargets.filter(t => t.university_id !== uni.id),
        { university_id: uni.id, department_id: WHOLE_UNIVERSITY },
      ])
    }
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-sm p-2 bg-muted/5">
      {universities.map(uni => (
        <div key={uni.id} className="space-y-1">
          <div className="flex items-center gap-2 group p-1.5 hover:bg-muted/30 rounded-sm transition-colors">
            <button
              type="button"
              onClick={() => setExpandedUni(expandedUni === uni.id ? null : uni.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expandedUni === uni.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </button>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-bold truncate max-w-[200px]">{uni.name}</span>
              <button
                type="button"
                onClick={() => toggleUniAll(uni)}
                className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border transition-all",
                  isTargeted(uni.id, WHOLE_UNIVERSITY) ? "bg-primary border-primary text-white" : "text-muted-foreground hover:border-primary/50"
                )}
              >
                {isTargeted(uni.id, WHOLE_UNIVERSITY) ? "University Active" : "Set University"}
              </button>
            </div>
          </div>

          {expandedUni === uni.id && (
            <div className="ml-6 space-y-1 border-l pl-3 py-1">
              {uni.departments?.map(dept => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => toggleTarget(uni.id, dept.id)}
                  className={cn("w-full flex items-center justify-between p-1.5 rounded-sm text-left transition-all",
                    isTargeted(uni.id, dept.id) ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-medium">{dept.name}</span>
                  {isTargeted(uni.id, dept.id) && <Check className="h-3 w-3" />}
                </button>
              ))}
              {(!uni.departments || uni.departments.length === 0) && (
                <p className="text-[10px] text-muted-foreground italic py-1">No departments found.</p>
              )}
            </div>
          )}
        </div>
      ))}
      {universities.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Loading universities...</p>
      )}
    </div>
  )
}

export interface CareerCircularFormProps {
  initialData?: CareerCircular
  returnUrl: string
  onSaved?: (circular: CareerCircular) => void
}

function toDateInputValue(iso?: string) {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function CareerCircularForm({ initialData, returnUrl, onSaved }: CareerCircularFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [categories, setCategories] = useState<CareerCircularCategory[]>([])
  const [attachments, setAttachments] = useState<string[]>(initialData?.attachment_urls || [])
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    organization: initialData?.organization || "",
    category_id: initialData?.category_id || "",
    description: initialData?.description || "",
    post_link: initialData?.post_link || "",
    resource_link: initialData?.resource_link || "",
    publish_date: toDateInputValue(initialData?.publish_date),
    deadline_date: toDateInputValue(initialData?.deadline_date),
    is_published: initialData?.is_published ?? false,
  })
  const [targets, setTargets] = useState<CareerCircularTarget[]>(initialData?.targets || [])

  useEffect(() => {
    api.universities.getAll("preload=true").then(setUniversities).catch(console.error)
    api.careerCircularCategories.getAll().then(setCategories).catch(console.error)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      for (const file of files) {
        const uploadFormData = new FormData()
        uploadFormData.append("image", file)
        uploadFormData.append("folder", "career")

        const uploadRes = await fetch(`${getApiUrl()}/upload`, {
          method: 'POST',
          headers: { 'X-API-Key': getApiKey() },
          body: uploadFormData,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          setAttachments(prev => [...prev, uploadData.file_url || uploadData.url])
        }
      }
    } catch (err) {
      alert("Failed to upload one or more attachments")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const removeAttachment = (url: string) => {
    setAttachments(prev => prev.filter(a => a !== url))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: Partial<CareerCircular> = {
        title: formData.title,
        organization: formData.organization,
        category_id: formData.category_id || undefined,
        description: formData.description,
        post_link: formData.post_link,
        resource_link: formData.resource_link,
        publish_date: formData.publish_date ? new Date(formData.publish_date).toISOString() : undefined,
        deadline_date: formData.deadline_date ? new Date(formData.deadline_date).toISOString() : undefined,
        is_published: formData.is_published,
        attachment_urls: attachments,
        targets,
      }

      let saved: CareerCircular
      if (initialData?.id) {
        saved = await api.careerCirculars.update(initialData.id, payload)
      } else {
        saved = await api.careerCirculars.create(payload)
      }

      if (onSaved) {
        onSaved(saved)
      } else {
        router.push(returnUrl)
        router.refresh()
      }
    } catch (error: any) {
      alert(`Error saving circular: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Type className="h-5 w-5" />
            <h2>Circular Details</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Bangladesh Bank Officer (General) Recruitment 2026"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Organization</label>
                <input
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="e.g. Bangladesh Bank"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Eligibility, vacancy details, how to apply..."
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">None (uncategorized)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Publish Date</label>
                <input
                  type="date"
                  name="publish_date"
                  value={formData.publish_date}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deadline Date</label>
                <input
                  type="date"
                  name="deadline_date"
                  value={formData.deadline_date}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5" /> Job Posting Link
                </label>
                <input
                  name="post_link"
                  value={formData.post_link}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5" /> Resource Link
                </label>
                <input
                  name="resource_link"
                  value={formData.resource_link}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Published (visible to students)</span>
            </label>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 font-semibold text-primary mb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <h2>Audience</h2>
            </div>
            <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {targets.length === 0 ? "Global" : `${targets.length} target${targets.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty to show this circular to everyone. Select specific universities or
            departments to restrict it.
          </p>
          <TargetSelector universities={universities} selectedTargets={targets} onChange={setTargets} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Upload className="h-5 w-5" />
            <h2>Attachments</h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {attachments.map(url => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <img src={url} alt="Attachment" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAttachment(url)}
                  className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary transition-colors">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="text-[10px] font-bold uppercase">Add</span>
              <input type="file" accept="image/*" multiple onChange={handleAttachmentUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {initialData ? "Save Changes" : "Create Circular"}
          </button>
        </div>
      </div>
    </form>
  )
}
