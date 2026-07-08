"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { BannerForm } from "@/components/BannerForm"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { api, Banner } from "@/lib/api"

export default function EditUniversityBannerPage() {
  const params = useParams()
  const universityId = params.id as string
  const bannerId = params.bannerId as string
  
  const [banner, setBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bannerId) {
      api.banners.getOne(bannerId)
        .then(setBanner)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [bannerId])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!banner) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Banner not found</h2>
        <Link href={`/universities/${universityId}?tab=banners`} className="text-primary hover:underline mt-4 block">Back to University</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/universities/${universityId}?tab=banners`} className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Banner</h1>
            <p className="text-muted-foreground">Modify this university banner.</p>
          </div>
        </div>
      </div>

      <BannerForm 
        initialData={banner}
        defaultScope="University"
        fixedUniversityId={universityId}
        returnUrl={`/universities/${universityId}?tab=banners`} 
      />
    </div>
  )
}
