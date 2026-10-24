import { Loader2 } from "lucide-react"

// Route-level loading.tsx fallback: shown the moment a link is clicked while
// the server fetches the page, instead of the old page sitting frozen.
export function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      <p className="animate-pulse text-sm font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  )
}
