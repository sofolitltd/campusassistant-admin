"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AssociationForm } from "@/components/AssociationForm"
import { AssociationEventManager } from "@/components/AssociationEventManager"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { api, Association } from "@/lib/api"

export default function EditAssociationPage() {
  const params = useParams()
  const id = params.id as string
  const [association, setAssociation] = useState<Association | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.associations.getById(id)
        .then(setAssociation)
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

  if (!association) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Association not found</h2>
        <Link href="/associations" className="text-primary hover:underline mt-4 block">Back to Associations</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/associations" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Association</h1>
            <p className="text-muted-foreground">Update association details.</p>
          </div>
        </div>
      </div>

      <AssociationForm initialData={association} returnUrl="/associations" />

      <AssociationEventManager associationId={association.id} />
    </div>
  )
}
