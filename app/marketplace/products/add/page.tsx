"use client"

import { useRouter } from "next/navigation"
import { ProductForm } from "@/components/ProductForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddProductPage() {
  const router = useRouter()

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/marketplace/products" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
            <p className="text-muted-foreground">Add a new product to the Campus Marketplace.</p>
          </div>
        </div>
      </div>

      <ProductForm
        returnUrl="/marketplace/products"
        onSaved={() => router.push("/marketplace/products")}
      />
    </div>
  )
}
