"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as Icons from "lucide-react"
import { Layers, Hash } from "lucide-react"
import { api, CareerCircularCategory } from "@/lib/api"

interface CareerCircularCategoryFormProps {
  initialData?: CareerCircularCategory
  returnUrl: string
  onSaved?: (category: CareerCircularCategory) => void
}

// icon_key stores a lucide-react icon component name (e.g. "Landmark",
// "GraduationCap", "FileText") so both admin and the Flutter app can render
// a consistent icon without needing an uploaded image per category.
export function CareerCircularCategoryForm({ initialData, returnUrl, onSaved }: CareerCircularCategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    icon_key: initialData?.icon_key || "Briefcase",
    index: initialData?.index?.toString() || "0",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const PreviewIcon = (Icons as unknown as Record<string, React.ElementType>)[formData.icon_key] || Icons.Briefcase

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: Partial<CareerCircularCategory> = {
        name: formData.name,
        icon_key: formData.icon_key,
        index: parseInt(formData.index) || 0,
      }

      let saved: CareerCircularCategory
      if (initialData?.id) {
        saved = await api.careerCircularCategories.update(initialData.id, payload)
      } else {
        saved = await api.careerCircularCategories.create(payload)
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
                placeholder="e.g. Government Job"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Icon key</label>
              <input
                name="icon_key"
                value={formData.icon_key}
                onChange={handleChange}
                placeholder="Lucide icon name, e.g. Landmark, GraduationCap, FileText"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">Must match a lucide-react icon name; used by both admin and the app.</p>
            </div>

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

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-primary mb-2">
            <Hash className="h-5 w-5" />
            <h2>Preview</h2>
          </div>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 bg-muted/30">
            <PreviewIcon className="h-10 w-10 text-primary" />
          </div>
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
