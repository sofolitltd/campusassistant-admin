"use client"

import { BannerForm } from "@/components/BannerForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function AddDepartmentBannerPage() {
  const params = useParams()
  const universityId = params.id as string
  const deptId = params.deptId as string

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/universities/${universityId}/departments/${deptId}?tab=banners`} className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Department Banner</h1>
            <p className="text-muted-foreground">Add a new featured banner specifically for this department.</p>
          </div>
        </div>
      </div>

      <BannerForm 
        defaultScope="Department" 
        fixedUniversityId={universityId}
        fixedDepartmentId={deptId}
        returnUrl={`/universities/${universityId}/departments/${deptId}?tab=banners`} 
      />
    </div>
  )
}
