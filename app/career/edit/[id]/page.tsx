"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react"
import { CareerCircularForm } from "@/components/CareerCircularForm"
import { api, CareerCircular } from "@/lib/api"

export default function EditCareerCircularPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [circular, setCircular] = useState<CareerCircular | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.careerCirculars.getById(id)
      .then(setCircular)
      .catch(() => setCircular(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!circular) {
    return (
      <div className="space-y-6">
        <Link href="/career" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to circulars
        </Link>
        <div className="text-center py-20 text-muted-foreground">
          <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-bold">Circular not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/career"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to circulars
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black">Edit Circular</h1>
          <p className="text-sm text-muted-foreground">Update &ldquo;{circular.title}&rdquo;</p>
        </div>
      </div>

      <CareerCircularForm initialData={circular} returnUrl="/career" />
    </div>
  )
}
