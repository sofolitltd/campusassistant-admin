"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Whole taka, e.g. "৳1,500". */
export function taka(n: number) {
  return `৳${n.toLocaleString("en-US")}`
}

export function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border bg-card shadow-sm overflow-hidden", className)}>{children}</div>
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col h-[40vh] items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">{label}</p>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return <div className="rounded-sm bg-destructive-subtle border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive">{message}</div>
}

export function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={cn("px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground", right ? "text-right" : "text-left")}>{children}</th>
}

export function Td({ children, right, className }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={cn("px-4 py-3 text-sm align-middle", right && "text-right tabular-nums", className)}>{children}</td>
}

export function Table({ head, children, empty }: { head: React.ReactNode; children: React.ReactNode; empty?: string }) {
  const rows = Array.isArray(children) ? children.length : children ? 1 : 0
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-muted/30"><tr>{head}</tr></thead>
          <tbody className="divide-y">{children}</tbody>
        </table>
      </div>
      {rows === 0 && <div className="px-4 py-12 text-center text-sm text-muted-foreground">{empty ?? "Nothing here yet."}</div>}
    </Card>
  )
}

export function Pager({ offset, limit, count, onChange }: { offset: number; limit: number; count: number; onChange: (offset: number) => void }) {
  const hasNext = count >= limit
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>Showing {count === 0 ? 0 : offset + 1}–{offset + count}</span>
      <div className="flex gap-2">
        <button disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))} className="rounded-sm border px-3 py-1.5 font-bold hover:bg-muted disabled:opacity-40">Previous</button>
        <button disabled={!hasNext} onClick={() => onChange(offset + limit)} className="rounded-sm border px-3 py-1.5 font-bold hover:bg-muted disabled:opacity-40">Next</button>
      </div>
    </div>
  )
}

export const primaryBtn = "inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
export const ghostBtn = "inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-bold hover:bg-muted disabled:opacity-50 transition-all"
export const dangerBtn = "inline-flex items-center justify-center gap-2 rounded-sm bg-destructive px-4 py-2 text-xs font-bold text-white hover:bg-destructive/90 disabled:opacity-50 transition-all"
