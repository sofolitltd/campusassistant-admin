import { Suspense } from "react"
import { api } from "@/lib/api"
import ReportsClient from "./reports-client"
import { Loader2 } from "lucide-react"

export default async function LostFoundReportsPage() {
  const reports = await api.lostFoundReports.getAll("pending")

  return (
    <Suspense fallback={
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">Loading Reports...</p>
      </div>
    }>
      <ReportsClient initialReports={reports} />
    </Suspense>
  )
}
