import { Suspense } from "react"
import { api } from "@/lib/api"
import SkillsClient from "./skills-client"
import { Loader2 } from "lucide-react"

export default async function SkillsPage() {
  const skills = await api.skills.getAll()

  return (
    <Suspense fallback={
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">Loading Skills...</p>
      </div>
    }>
      <SkillsClient initialSkills={skills} />
    </Suspense>
  )
}
