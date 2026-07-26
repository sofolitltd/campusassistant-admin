"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProductForm } from "@/components/ProductForm"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { api, Product } from "@/lib/api"

export default function EditProductPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.products.getById(id)
        .then(setProduct)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link href="/marketplace/products" className="text-primary hover:underline mt-4 block">Back to Products</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/marketplace/products" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">Update product details.</p>
          </div>
        </div>
      </div>

      <ProductForm initialData={product} returnUrl="/marketplace/products" />
    </div>
  )
}
