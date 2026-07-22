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
  ChevronRight as ChevronRightIcon,
  ChevronDown,
  Check,
  Globe,
  Store
} from "lucide-react"
import { api, Product, ProductTarget, Merchant, University, getApiKey, getApiUrl } from "@/lib/api"
import { cn } from "@/lib/utils"

// A target with this department_id means "whole university" — a real UUID
// (uuid.Nil's string form), NOT an empty string (see SkillForm's TargetSelector
// for why an empty string would fail Go's uuid.UUID JSON binding).
const WHOLE_UNIVERSITY = "00000000-0000-0000-0000-000000000000"

function TargetSelector({
  universities,
  selectedTargets,
  onChange
}: {
  universities: University[]
  selectedTargets: ProductTarget[]
  onChange: (targets: ProductTarget[]) => void
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
        { university_id: uni.id, department_id: WHOLE_UNIVERSITY }
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

export interface ProductFormProps {
  initialData?: Product
  returnUrl: string
  onSaved?: (product: Product) => void
}

export function ProductForm({ initialData, returnUrl, onSaved }: ProductFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_urls?.[0] || null)
  const [universities, setUniversities] = useState<University[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [platformMerchant, setPlatformMerchant] = useState<Merchant | null>(null)

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    stock: initialData?.stock?.toString() || "0",
    category: initialData?.category || "",
    merchant_id: initialData?.merchant_id || "",
    is_published: initialData?.is_published ?? false
  })
  const [targets, setTargets] = useState<ProductTarget[]>(initialData?.targets || [])

  useEffect(() => {
    api.universities.getAll("preload=true").then(setUniversities).catch(console.error)
    api.merchants.getAll("approved").then(setMerchants).catch(console.error)
    api.merchants.getPlatform().then(m => {
      setPlatformMerchant(m)
      setFormData(prev => prev.merchant_id ? prev : { ...prev, merchant_id: m.id })
    }).catch(console.error)
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
    setLoading(true)

    try {
      let image_url = initialData?.image_urls?.[0] || ""

      if (imageFile) {
        if (initialData?.image_urls?.[0]) {
          try {
            await fetch(`${getApiUrl()}/upload?url=${initialData.image_urls[0]}`, {
              method: 'DELETE',
              headers: { 'X-API-Key': getApiKey() },
            })
          } catch (err) {
            console.error("Failed to delete old image:", err)
          }
        }

        const uploadFormData = new FormData()
        uploadFormData.append("image", imageFile)
        uploadFormData.append("folder", "products")

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

      const payload: Partial<Product> = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        category: formData.category,
        merchant_id: formData.merchant_id || platformMerchant?.id,
        is_published: formData.is_published,
        image_urls: image_url ? [image_url] : [],
        targets
      }

      let saved: Product
      if (initialData?.id) {
        saved = await api.products.update(initialData.id, payload)
      } else {
        saved = await api.products.create(payload)
      }

      if (onSaved) {
        onSaved(saved)
      } else {
        router.push(returnUrl)
        router.refresh()
      }
    } catch (error: any) {
      alert(`Error saving product: ${error.message}`)
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
            <h2>Product Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Scientific Calculator"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the product"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Price (৳) *</label>
                <input
                  required
                  type="number"
                  min={0}
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <input
                  type="number"
                  min={0}
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Stationery"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Merchant</label>
                <select
                  name="merchant_id"
                  value={formData.merchant_id}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {platformMerchant && (
                    <option value={platformMerchant.id}>Campus Assistant (in-house)</option>
                  )}
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>{m.business_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Published (visible to users)</span>
                </label>
              </div>
            </div>
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
            Leave empty to show this product to everyone. Select specific universities or
            departments to restrict it.
          </p>
          <TargetSelector universities={universities} selectedTargets={targets} onChange={setTargets} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Upload className="h-5 w-5" />
            <h2>Image</h2>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="group relative h-40 w-full overflow-hidden rounded-xl border-2 border-dashed bg-muted transition-colors hover:border-primary flex items-center justify-center">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setImageFile(null); setImagePreview(null) }}
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
            <p className="text-[10px] text-center text-muted-foreground italic flex items-start gap-1">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              Square or landscape works best. Max 5MB.
            </p>
          </div>
        </div>

        {formData.merchant_id && platformMerchant && formData.merchant_id !== platformMerchant.id && (
          <div className="rounded-xl border bg-card p-4 shadow-sm flex items-start gap-2 text-xs text-muted-foreground">
            <Store className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
            This product is listed under a merchant, not Campus Assistant itself.
          </div>
        )}

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
            {initialData ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </form>
  )
}
