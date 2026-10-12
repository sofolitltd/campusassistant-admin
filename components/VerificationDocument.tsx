"use client"

import { useState, useEffect } from "react"
import { IdCard, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// Verification documents are stored privately — the server never hands back
// a permanent URL, only an attachment id. Resolve a short-lived viewing URL
// just-in-time instead of caching one, since it can expire.
export function VerificationDocument({
  attachmentId,
  label,
  className,
}: {
  attachmentId: string
  label: string
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.attachments.getUrl(attachmentId)
      .then(res => { if (!cancelled) setUrl(res.url) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [attachmentId])

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group block overflow-hidden rounded-md border border-border/60", !url && "pointer-events-none", className)}
    >
      <div className="aspect-video bg-muted overflow-hidden flex items-center justify-center">
        {error ? (
          <p className="text-xs text-muted-foreground">Could not load document</p>
        ) : url ? (
          <img src={url} alt={label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center gap-1.5 p-2 text-xs font-semibold">
        <IdCard className="h-3.5 w-3.5 text-muted-foreground" /> {label}
      </div>
    </a>
  )
}
