"use client"

import { useRouter } from "next/navigation"
import { SkillForm } from "@/components/SkillForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddSkillPage() {
  const router = useRouter()

  return (
    <div className="space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/skills" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Skill</h1>
            <p className="text-muted-foreground">Add a new skill to the &quot;Skill Up&quot; catalog.</p>
          </div>
        </div>
      </div>

      <SkillForm
        returnUrl="/skills"
        onSaved={(skill) => router.push(`/skills/edit/${skill.id}`)}
      />
    </div>
  )
}
