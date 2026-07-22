"use client"

import { AssociationForm } from "@/components/AssociationForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddAssociationPage() {
  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/associations" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Association</h1>
            <p className="text-muted-foreground">Add a new district or sub-district association to the directory.</p>
          </div>
        </div>
      </div>

      <AssociationForm returnUrl="/associations" />
    </div>
  )
}
