"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { SkillForm } from "@/components/SkillForm"
import { SkillVideoManager } from "@/components/SkillVideoManager"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { api, Skill } from "@/lib/api"

export default function EditSkillPage() {
  const params = useParams()
  const id = params.id as string
  const [skill, setSkill] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.skills.getById(id)
        .then(setSkill)
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

  if (!skill) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Skill not found</h2>
        <Link href="/skills" className="text-primary hover:underline mt-4 block">Back to Skills</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/skills" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Skill</h1>
            <p className="text-muted-foreground">Update details and manage videos.</p>
          </div>
        </div>
      </div>

      <SkillForm initialData={skill} returnUrl="/skills" />

      <SkillVideoManager skillId={skill.id} />
    </div>
  )
}
