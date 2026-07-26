"use client"

import Link from "next/link"
import { ArrowLeft, Briefcase } from "lucide-react"
import { CareerCircularForm } from "@/components/CareerCircularForm"

export default function AddCareerCircularPage() {
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
          <h1 className="text-xl font-black">Create Circular</h1>
          <p className="text-sm text-muted-foreground">Post a new job/exam circular for students.</p>
        </div>
      </div>

      <CareerCircularForm returnUrl="/career" />
    </div>
  )
}
