"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layers, Type, FileText, Hash, Image } from "lucide-react"
import { api, getApiUrl, getApiKey, MarketplaceCategory } from "@/lib/api"

interface CategoryFormProps {
  initialData?: MarketplaceCategory
  returnUrl: string
  onSaved?: (category: MarketplaceCategory) => void
}

export function CategoryForm({ initialData, returnUrl, onSaved }: CategoryFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    index: initialData?.index?.toString() || "0",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      let image_url = initialData?.image_url || ""

      if (imageFile) {
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

        const uploadFormData = new FormData()
        uploadFormData.append("image", imageFile)
        uploadFormData.append("folder", "marketplace-categories")

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

      const payload: Partial<MarketplaceCategory> = {
        name: formData.name,
        description: formData.description,
        index: parseInt(formData.index) || 0,
        image_url,
      }

      let saved: MarketplaceCategory
      if (initialData?.id) {
        saved = await api.marketplaceCategories.update(initialData.id, payload)
      } else {
        saved = await api.marketplaceCategories.create(payload)
      }

      if (onSaved) {
        onSaved(saved)
      } else {
        router.push(returnUrl)
        router.refresh()
      }
    } catch (error: any) {
      alert(`Error saving category: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Layers className="h-5 w-5" />
            <h2>Category Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Stationery"
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
                placeholder="Describe the category"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Sort Index</label>
                <input
                  type="number"
                  min={0}
                  name="index"
                  value={formData.index}
                  onChange={handleChange}
                  placeholder="0"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Image className="h-5 w-5" />
            <h2>Image</h2>
          </div>

          <div
            className="relative flex items-center justify-center rounded-lg border-2 border-dashed p-4 min-h-[160px] cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-full max-w-full rounded object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1 text-xs text-destructive hover:bg-background"
                >
                  ✕
                </button>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <Image className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Click to upload</p>
              </div>
            )}
          </div>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(returnUrl)}
            className="flex-1 rounded-md border px-4 py-2 text-sm font-bold hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : initialData ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </form>
  )
}
