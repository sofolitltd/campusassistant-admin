import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { CategoriesClient } from "./categories-client"

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">Loading Categories...</p>
      </div>
    }>
      <CategoriesClient />
    </Suspense>
  )
}
