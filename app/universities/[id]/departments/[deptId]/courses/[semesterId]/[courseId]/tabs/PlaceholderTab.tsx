"use client"

import { Construction } from "lucide-react"

interface PlaceholderTabProps {
  label: string
  description?: string
}

export default function PlaceholderTab({ label, description }: PlaceholderTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-sm border border-dashed bg-muted/20">
      <div className="rounded-full bg-muted p-5 mb-4">
        <Construction className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-base font-bold">{label}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
        {description ?? `${label} management is coming soon.`}
      </p>
    </div>
  )
}
