"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ClubForm } from "@/components/ClubForm"
import { ClubEventManager } from "@/components/ClubEventManager"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { api, Club } from "@/lib/api"

export default function EditClubPage() {
  const params = useParams()
  const id = params.id as string
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.clubs.getById(id)
        .then(setClub)
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

  if (!club) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Club not found</h2>
        <Link href="/clubs" className="text-primary hover:underline mt-4 block">Back to Clubs</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clubs" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Club</h1>
            <p className="text-muted-foreground">Update club details.</p>
          </div>
        </div>
      </div>

      <ClubForm initialData={club} returnUrl="/clubs" />

      <ClubEventManager clubId={club.id} />
    </div>
  )
}
