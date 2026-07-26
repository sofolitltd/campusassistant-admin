"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Globe, 
  GraduationCap, 
  Calendar,
  Info,
  Loader2,
  X
} from "lucide-react"
import Link from "next/link"
import { api, getApiKey, getApiUrl, Faculty } from "@/lib/api"
import { selectCls } from "../[...slug]/components/SharedUI"

export default function AddDepartmentPage() {
  const router = useRouter()
  const params = useParams()
  const universityId = params.id as string

  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faculties, setFaculties] = useState<Faculty[]>([])

  const [formData, setFormData] = useState({
    name: "",
    acronym: "",
    slug: "",
    established_year: "",
    website_url: "",
    about: "",
    faculty_id: ""
  })

  useEffect(() => {
    api.faculties.getAllByUniversity(universityId).then(setFaculties).catch(() => {})
  }, [universityId])

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
    
    setFormData(prev => ({ ...prev, name, slug }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "name") {
      handleNameChange(e as React.ChangeEvent<HTMLInputElement>);
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      let logo_url = ""
      
      // Handle image upload if selected
      if (logoFile) {
        const uploadFormData = new FormData()
        uploadFormData.append("image", logoFile)
        uploadFormData.append("folder", "departments")
        
        const uploadRes = await fetch(`${getApiUrl()}/upload`, {
          method: 'POST',
          headers: {
            'X-API-Key': getApiKey(),
          },
          body: uploadFormData,
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          logo_url = uploadData.file_url || uploadData.url
        }
      }

      await api.departments.create({
        ...formData,
        established_year: parseInt(formData.established_year) || 0,
        faculty_id: formData.faculty_id || undefined,
        logo_url,
        university_id: universityId
      })
      
      router.push(`/universities/${universityId}?tab=departments`)
      router.refresh()
    } catch (error: any) {
      alert(`Error adding department: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/universities/${universityId}?tab=departments`} className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Department</h1>
            <p className="text-muted-foreground">Register a new department under this university.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-semibold text-primary mb-2">
              <GraduationCap className="h-5 w-5" />
              <h2>Primary Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Department Name *</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Department of Computer Science"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Slug (Auto-generated)</label>
                <input
                  readOnly
                  name="slug"
                  value={formData.slug}
                  className="mt-1 w-full rounded-md border bg-muted px-3 py-2 text-sm outline-none cursor-not-allowed"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Acronym *</label>
                  <input
                    required
                    name="acronym"
                    value={formData.acronym}
                    onChange={handleChange}
                    placeholder="e.g. CSE"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Established Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      name="established_year"
                      value={formData.established_year}
                      onChange={handleChange}
                      placeholder="e.g. 1990"
                      className="mt-1 w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Faculty</label>
                <select
                  name="faculty_id"
                  value={formData.faculty_id}
                  onChange={handleChange}
                  className={`mt-1 ${selectCls}`}
                >
                  <option value="">No faculty assigned</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-semibold text-primary mb-2">
              <Info className="h-5 w-5" />
              <h2>About & Description</h2>
            </div>
            <div>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows={6}
                placeholder="Write about the department (Markdown supported in app)..."
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Media & Links */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-semibold text-primary mb-2">
              <Upload className="h-5 w-5" />
              <h2>Department Logo</h2>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="group relative h-32 w-32 overflow-hidden rounded-xl border-2 border-dashed bg-muted transition-colors hover:border-primary">
                {logoPreview ? (
                  <>
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-full w-full object-contain p-2"
                    />
                    <button 
                      type="button"
                      onClick={() => {setLogoFile(null); setLogoPreview(null)}}
                      className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-[10px] uppercase font-bold">Pick Logo</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-center text-muted-foreground italic">
                Recommended: Square image with transparent background (PNG). Max 2MB.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-semibold text-primary mb-2">
              <Globe className="h-5 w-5" />
              <h2>Web Links</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
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
              Save Department
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
