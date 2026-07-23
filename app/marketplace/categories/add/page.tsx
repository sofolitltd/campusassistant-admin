"use client"

import Link from "next/link"
import { ArrowLeft, Layers } from "lucide-react"
import { CategoryForm } from "@/components/CategoryForm"

export default function AddCategoryPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/marketplace/categories"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to categories
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black">Create Category</h1>
          <p className="text-sm text-muted-foreground">Add a new product category to the Campus Marketplace.</p>
        </div>
      </div>

      <CategoryForm returnUrl="/marketplace/categories" />
    </div>
  )
}
