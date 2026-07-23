import { api } from "@/lib/api"
import SkillDetailClient from "./skill-detail-client"

type Props = {
  params: Promise<{ id: string }>
}

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params
  const skill = await api.skills.getById(id)

  if (!skill) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
        <p className="font-bold">Skill not found</p>
      </div>
    )
  }

  return <SkillDetailClient skill={skill} />
}
