import { Suspense } from "react"
import { api } from "@/lib/api"
import CircularsClient from "./circulars-client"
import { Loader2 } from "lucide-react"

export default async function CareerCircularsPage() {
  const circulars = await api.careerCirculars.getAll()

  return (
    <Suspense fallback={
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">Loading Circulars...</p>
      </div>
    }>
      <CircularsClient initialCirculars={circulars} />
    </Suspense>
  )
}
