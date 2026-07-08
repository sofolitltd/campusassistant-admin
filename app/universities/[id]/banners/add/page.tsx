"use client"

import { BannerForm } from "@/components/BannerForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function AddUniversityBannerPage() {
  const params = useParams()
  const universityId = params.id as string

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/universities/${universityId}?tab=banners`} className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Banner</h1>
            <p className="text-muted-foreground">Add a new featured banner for this university.</p>
          </div>
        </div>
      </div>

      <BannerForm 
        defaultScope="University" 
        fixedUniversityId={universityId} 
        returnUrl={`/universities/${universityId}?tab=banners`} 
      />
    </div>
  )
}
