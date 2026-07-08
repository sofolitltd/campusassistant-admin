"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Save, 
  Upload, 
  Globe, 
  Calendar,
  Image as ImageIcon,
  Loader2,
  X,
  Type,
  TrendingUp,
  Clock,
  Target,
  Plus
} from "lucide-react"
import { api, Department, University, Banner, getFullImageUrl, getApiKey, getApiUrl } from "@/lib/api"
import { Modal } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

export interface BannerFormProps {
  initialData?: Banner;
  defaultScope?: "National" | "University" | "Department";
  fixedUniversityId?: string;
  fixedDepartmentId?: string;
  returnUrl: string;
}

export function BannerForm({ initialData, defaultScope = "National", fixedUniversityId, fixedDepartmentId, returnUrl }: BannerFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(getFullImageUrl(initialData?.image_url) || null)
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    click_url: initialData?.click_url || "",
    priority: initialData?.priority?.toString() || "0",
    is_active: initialData?.is_active ?? true,
    start_at: initialData?.start_at ? new Date(initialData.start_at).toISOString().slice(0, 16) : "",
    end_at: initialData?.end_at ? new Date(initialData.end_at).toISOString().slice(0, 16) : ""
  })

  const [targetScope, setTargetScope] = useState(initialData?.target_scope || defaultScope)
  
  // Lists for selection
  const [universities, setUniversities] = useState<University[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  
  // Selected IDs
  const [selectedUniIds, setSelectedUniIds] = useState<Set<string>>(() => {
    if (initialData?.target_scope === "University" && initialData.targets) {
      return new Set(initialData.targets.map(t => t.university_id).filter(Boolean) as string[])
    }
    return fixedUniversityId ? new Set([fixedUniversityId]) : new Set()
  })
  
  const [selectedUniIdForDept, setSelectedUniIdForDept] = useState(initialData?.targets?.[0]?.university_id || fixedUniversityId || "")
  const [fixedUniversityName, setFixedUniversityName] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<string>>(() => {
    if (initialData?.target_scope === "Department" && initialData.targets) {
      return new Set(initialData.targets.map(t => t.department_id).filter(Boolean) as string[])
    }
    return fixedDepartmentId ? new Set([fixedDepartmentId]) : new Set()
  })

  // Fetch uni name if fixed
  useEffect(() => {
    if (fixedUniversityId && !fixedUniversityName) {
      api.universities.getOne(fixedUniversityId).then(res => setFixedUniversityName(res?.name || "")).catch(console.error)
    }
  }, [fixedUniversityId, fixedUniversityName])

  // Fetch Unis if needed
  useEffect(() => {
    if (!fixedUniversityId && (targetScope === "University" || targetScope === "Department") && universities.length === 0) {
      api.universities.getAll().then(res => setUniversities(res)).catch(console.error)
    }
  }, [targetScope, fixedUniversityId, universities.length])

  // Fetch Depts if needed
  useEffect(() => {
    const uniId = selectedUniIdForDept || fixedUniversityId
    if (targetScope === "Department" && uniId && !fixedDepartmentId) {
      api.departments.getAllByUniversity(uniId).then(res => setDepartments(res)).catch(console.error)
    } else if (targetScope !== "Department" || !uniId) {
      setDepartments([])
    }
  }, [targetScope, selectedUniIdForDept, fixedUniversityId, fixedDepartmentId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imagePreview && !imageFile) {
      alert("Please upload a banner image.")
      return
    }

    let targets: any[] = []
    const uniId = selectedUniIdForDept || fixedUniversityId
    
    if (targetScope === "University") {
      if (selectedUniIds.size === 0) {
        alert("Please select at least one target university.")
        return
      }
      targets = Array.from(selectedUniIds).map(uniId => ({
        university_id: uniId
      }))
    } else if (targetScope === "Department") {
      if (!uniId) {
        alert("Please select a target university.")
        return
      }
      if (selectedDeptIds.size === 0) {
        alert("Please select at least one target department.")
        return
      }
      targets = Array.from(selectedDeptIds).map(deptId => ({
        university_id: uniId,
        department_id: deptId
      }))
    }

    setLoading(true)
    
    try {
      let image_url = initialData?.image_url || ""
      
      if (imageFile) {
        // 1. Delete old image if exists
        if (initialData?.image_url) {
          try {
            await fetch(`${getApiUrl()}/upload?url=${initialData.image_url}`, {
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
        uploadFormData.append("folder", "banners")
        
        const uploadRes = await fetch(`${getApiUrl()}/upload`, {
          method: 'POST',
          headers: { 'X-API-Key': getApiKey() },
          body: uploadFormData,
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          image_url = uploadData.file_url || uploadData.url
        } else {
          throw new Error("Failed to upload image")
        }
      }

      const startAtISO = formData.start_at ? new Date(formData.start_at).toISOString() : new Date().toISOString()
      const endAtISO = formData.end_at ? new Date(formData.end_at).toISOString() : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()

      const payload = {
        title: formData.title,
        click_url: formData.click_url,
        priority: parseInt(formData.priority) || 0,
        is_active: formData.is_active,
        start_at: startAtISO,
        end_at: endAtISO,
        image_url,
        target_scope: targetScope,
        targets
      }

      if (initialData?.id) {
        await api.banners.update(initialData.id, payload)
      } else {
        await api.banners.create(payload)
      }
      
      router.push(returnUrl)
      router.refresh()
    } catch (error: any) {
      alert(`Error saving banner: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      {/* Left Column: Main Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Type className="h-5 w-5" />
            <h2>Banner Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Banner Title *</label>
              <input
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Fall Admission 2026"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Click URL (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  name="click_url"
                  value={formData.click_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Priority (Sort Order)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    placeholder="0"
                    className="mt-1 w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Higher numbers appear first.</p>
              </div>
              
              <div className="flex flex-col justify-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Active (Visible)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 font-semibold text-primary mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <h2>Targeting</h2>
            </div>
            <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {targetScope}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Target Scope</label>
              <select
                value={targetScope}
                onChange={(e) => {
                  setTargetScope(e.target.value as any)
                  if (!fixedDepartmentId) setSelectedDeptIds(new Set())
                }}
                disabled={!!fixedDepartmentId}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                {!fixedUniversityId && !fixedDepartmentId && <option value="National">National</option>}
                {!fixedDepartmentId && <option value="University">University</option>}
                <option value="Department">Department</option>
              </select>
            </div>

            {targetScope !== "National" && fixedUniversityId && targetScope === "University" ? (
              <div className="pt-2">
                <div className="w-full flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold uppercase tracking-tight">Target: {fixedUniversityName || "Loading..."}</p>
                    <p className="text-xs text-muted-foreground">This banner targets the current university</p>
                  </div>
                </div>
              </div>
            ) : targetScope !== "National" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-dashed p-4 hover:bg-accent/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Plus className="h-5 w-5" />
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
        </div>

        {/* Targeting Modal */}
        <Modal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title={`Select Target ${targetScope}s`}
          className="max-w-2xl"
        >
          <div className="p-6 space-y-6">
            {targetScope === "University" && !fixedUniversityId && (
              <div className="space-y-4">
                <div className="grid gap-2 max-h-[50vh] overflow-y-auto pr-2">
                  {universities.map(uni => (
                    <label key={uni.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs">
                          {uni.acronym}
                        </div>
                        <span className="text-sm font-medium">{uni.name}</span>
                      </div>
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
                  {universities.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Loading universities...</p>}
                </div>
              </div>
            )}

            {targetScope === "Department" && (
              <div className="space-y-6">
                {!fixedUniversityId && (
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Step 1: Select University</label>
                    <select
                      value={selectedUniIdForDept}
                      onChange={(e) => {
                        setSelectedUniIdForDept(e.target.value)
                        setSelectedDeptIds(new Set())
                      }}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">-- Choose University --</option>
                      {universities.map(uni => (
                        <option key={uni.id} value={uni.id}>{uni.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(selectedUniIdForDept || fixedUniversityId) && !fixedDepartmentId && (
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">
                      Step 2: Select Departments ({selectedDeptIds.size})
                    </label>
                    
                    {departments.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-xs">Fetching departments...</p>
                      </div>
                    ) : (
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
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{dept.name}</p>
                              <p className="text-[10px] text-muted-foreground">{dept.acronym}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex gap-3 border-t">
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-lg bg-primary py-3 text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Done Selection
              </button>
            </div>
          </div>
        </Modal>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Clock className="h-5 w-5" />
            <h2>Schedule</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Start Date & Time (Optional)</label>
              <input
                type="datetime-local"
                name="start_at"
                value={formData.start_at}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date & Time (Optional)</label>
              <input
                type="datetime-local"
                name="end_at"
                value={formData.end_at}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Media */}
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <ImageIcon className="h-5 w-5" />
            <h2>Banner Image *</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="group relative h-40 w-full overflow-hidden rounded-xl border-2 border-dashed bg-muted transition-colors hover:border-primary flex items-center justify-center">
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview} 
                    alt="Banner preview" 
                    className="h-full w-full object-cover"
                  />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                  <Upload className="h-8 w-8" />
                  <span className="text-xs uppercase font-bold tracking-wider">Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-[10px] text-center text-muted-foreground italic">
              Recommended: 16:9 Landscape ratio (e.g. 1920x1080). Max 5MB.
            </p>
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
            Publish Banner
          </button>
        </div>
      </div>
    </form>
  )
}
