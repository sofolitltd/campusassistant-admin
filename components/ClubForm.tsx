"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  Upload,
  Type,
  Info,
  Loader2,
  X,
  Link2,
  Phone,
} from "lucide-react"
import { api, Club, ClubType, CLUB_CATEGORIES, University } from "@/lib/api"
import { getApiKey, getApiUrl } from "@/lib/api"
import { Field, inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

export interface ClubFormProps {
  initialData?: Club
  returnUrl: string
}

async function uploadImage(file: File, folder: string): Promise<string> {
  const uploadFormData = new FormData()
  uploadFormData.append("image", file)
  uploadFormData.append("folder", folder)

  const uploadRes = await fetch(`${getApiUrl()}/upload`, {
    method: 'POST',
    headers: { 'X-API-Key': getApiKey() },
    body: uploadFormData,
  })

  if (!uploadRes.ok) throw new Error(`Failed to upload ${folder} image`)
  const uploadData = await uploadRes.json()
  return uploadData.file_url || uploadData.url
}

async function deleteImage(url: string) {
  try {
    await fetch(`${getApiUrl()}/upload?url=${url}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': getApiKey() },
    })
  } catch (err) {
    console.error("Failed to delete old image:", err)
  }
}

function ImagePicker({
  label,
  preview,
  onChange,
  onClear,
  hint,
}: {
  label: string
  preview: string | null
  onChange: (file: File) => void
  onClear: () => void
  hint: string
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="group relative mt-1 h-32 w-full overflow-hidden rounded-xl border-2 border-dashed bg-muted transition-colors hover:border-primary flex items-center justify-center">
        {preview ? (
          <>
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onClear() }}
              className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-md"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
            <Upload className="h-6 w-6" />
            <span className="text-xs uppercase font-bold tracking-wider">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onChange(file)
              }}
            />
          </label>
        )}
      </div>
      <p className="text-[10px] text-center text-muted-foreground italic flex items-start gap-1 mt-1">
        <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
        {hint}
      </p>
    </div>
  )
}

export function ClubForm({ initialData, returnUrl }: ClubFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialData?.banner_url || null)

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    club_type: (initialData?.club_type || "department") as ClubType,
    university_id: initialData?.university_id || "",
    department_id: initialData?.department_id || "",
    founded_year: initialData?.founded_year?.toString() || "",
    contact_email: initialData?.contact_email || "",
    contact_phone: initialData?.contact_phone || "",
    is_active: initialData?.is_active ?? true,
    category: initialData?.category || "",
    is_verified: initialData?.is_verified ?? false,
    facebook: initialData?.social_links?.facebook || "",
    instagram: initialData?.social_links?.instagram || "",
    linkedin: initialData?.social_links?.linkedin || "",
  })

  useEffect(() => {
    api.universities.getAll("preload=true").then(setUniversities).catch(console.error)
  }, [])

  const selectedUniversity = universities.find(u => u.id === formData.university_id)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === "university_id") {
      setFormData(prev => ({ ...prev, university_id: value, department_id: "" }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleLogoChange = (file: File) => {
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (file: File) => {
    setBannerFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setBannerPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.university_id) {
      alert("Please select a university")
      return
    }
    if (formData.club_type === "department" && !formData.department_id) {
      alert("Please select a department for a department-scoped club")
      return
    }

    setLoading(true)
    try {
      let logo_url = initialData?.logo_url || ""
      if (logoFile) {
        if (initialData?.logo_url) await deleteImage(initialData.logo_url)
        logo_url = await uploadImage(logoFile, "clubs")
      } else if (logoPreview === null) {
        logo_url = ""
      }

      let banner_url = initialData?.banner_url || ""
      if (bannerFile) {
        if (initialData?.banner_url) await deleteImage(initialData.banner_url)
        banner_url = await uploadImage(bannerFile, "clubs")
      } else if (bannerPreview === null) {
        banner_url = ""
      }

      const payload: Partial<Club> = {
        name: formData.name,
        description: formData.description,
        club_type: formData.club_type,
        university_id: formData.university_id,
        department_id: formData.club_type === "department" ? formData.department_id : null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : undefined,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        is_active: formData.is_active,
        category: formData.category,
        is_verified: formData.is_verified,
        logo_url,
        banner_url,
        social_links: {
          facebook: formData.facebook || undefined,
          instagram: formData.instagram || undefined,
          linkedin: formData.linkedin || undefined,
        },
      }

      if (initialData?.id) {
        await api.clubs.update(initialData.id, payload)
      } else {
        await api.clubs.create(payload)
      }

      router.push(returnUrl)
      router.refresh()
    } catch (error: any) {
      alert(`Error saving club: ${error.message}`)
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
            <h2>Club Details</h2>
          </div>

          <div className="space-y-4">
            <Field label="Name" required>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Photography Club"
                className={inputCls}
              />
            </Field>

            <Field label="Description">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="What does this club do?"
                className={inputCls}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Club Type" required>
                <select name="club_type" value={formData.club_type} onChange={handleChange} className={selectCls}>
                  <option value="department">Department Club</option>
                  <option value="university">University Club</option>
                </select>
              </Field>
              <Field label="Category">
                <select name="category" value={formData.category} onChange={handleChange} className={selectCls}>
                  <option value="">Uncategorized</option>
                  {CLUB_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Founded Year">
                <input
                  type="number"
                  name="founded_year"
                  value={formData.founded_year}
                  onChange={handleChange}
                  placeholder="e.g. 2015"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="University" required>
                <select name="university_id" value={formData.university_id} onChange={handleChange} className={selectCls}>
                  <option value="">Select university</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </Field>
              {formData.club_type === "department" && (
                <Field label="Department" required>
                  <select name="department_id" value={formData.department_id} onChange={handleChange} className={selectCls}>
                    <option value="">Select department</option>
                    {selectedUniversity?.departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Active (visible to users)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_verified"
                  checked={formData.is_verified}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Verified (shows an official badge)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Phone className="h-5 w-5" />
            <h2>Contact</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Email">
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="club@university.edu"
                className={inputCls}
              />
            </Field>
            <Field label="Contact Phone">
              <input
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="+880..."
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Link2 className="h-5 w-5" />
            <h2>Social Links</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Facebook">
              <input
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className={inputCls}
              />
            </Field>
            <Field label="Instagram">
              <input
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
                className={inputCls}
              />
            </Field>
            <Field label="LinkedIn">
              <input
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/..."
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Upload className="h-5 w-5" />
            <h2>Images</h2>
          </div>
          <ImagePicker
            label="Logo"
            preview={logoPreview}
            onChange={handleLogoChange}
            onClear={() => { setLogoFile(null); setLogoPreview(null) }}
            hint="Square, max 5MB."
          />
          <ImagePicker
            label="Banner"
            preview={bannerPreview}
            onChange={handleBannerChange}
            onClear={() => { setBannerFile(null); setBannerPreview(null) }}
            hint="16:9 landscape, max 5MB."
          />
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
            {initialData ? "Save Changes" : "Create Club"}
          </button>
        </div>
      </div>
    </form>
  )
}
