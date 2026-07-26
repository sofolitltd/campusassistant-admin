"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Layers, Loader2 } from "lucide-react"
import { CareerCircularCategoryForm } from "@/components/CareerCircularCategoryForm"
import { api, CareerCircularCategory } from "@/lib/api"

export default function EditCareerCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [category, setCategory] = useState<CareerCircularCategory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.careerCircularCategories.getById(id)
      .then(setCategory)
      .catch(() => setCategory(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <Link href="/career/categories" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to categories
        </Link>
        <div className="text-center py-20 text-muted-foreground">
          <Layers className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-bold">Category not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/career/categories"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to categories
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black">Edit Category</h1>
          <p className="text-sm text-muted-foreground">Update &ldquo;{category.name}&rdquo;</p>
        </div>
      </div>

      <CareerCircularCategoryForm initialData={category} returnUrl="/career/categories" />
    </div>
  )
}
