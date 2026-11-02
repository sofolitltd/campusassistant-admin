import { api } from "@/lib/api"
import ModeratorsClient from "./moderators-client"

export default async function ModeratorsPage() {
  const result = await api.moderators.getAll()
  return <ModeratorsClient initialModerators={result.data} initialCount={result.count} />
}

export const dynamic = "force-dynamic"
