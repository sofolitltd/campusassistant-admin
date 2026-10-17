import { api } from "@/lib/api"
import ReferralsClient from "./referrals-client"

export default async function ReferralsPage() {
  const stats = await api.referrals.getStats(30)
  return <ReferralsClient initialStats={stats} />
}

export const dynamic = "force-dynamic"
