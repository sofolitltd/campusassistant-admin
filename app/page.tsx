import { Suspense } from "react"
import { api } from "@/lib/api"
import DashboardClient from "./dashboard-client"
import { Loader2 } from "lucide-react"

export default async function DashboardPage() {
  // ELITE: Fetch dashboard stats on the server for instant data paint
  const stats = await api.stats.getDashboard()

  return (
    <Suspense fallback={
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">Crunching Portal Analytics...</p>
      </div>
    }>
      <DashboardClient stats={stats} />
    </Suspense>
  )
}
