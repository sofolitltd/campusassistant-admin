import { api } from "@/lib/api"
import ClubDetailClient from "./club-detail-client"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClubDetailPage({ params }: Props) {
  const { id } = await params
  const club = await api.clubs.getById(id)

  if (!club) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
        <p className="font-bold">Club not found</p>
      </div>
    )
  }

  return <ClubDetailClient club={club} />
}
