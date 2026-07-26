"use client"

import { useState } from "react"
import { Flag, Ban, X, Loader2, PackageSearch, User } from "lucide-react"
import { api, LostFoundReport, getFullImageUrl } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ReportsClientProps {
  initialReports: LostFoundReport[]
}

export default function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports, setReports] = useState<LostFoundReport[]>(initialReports)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleDismiss(report: LostFoundReport) {
    setDismissingId(report.id)
    try {
      await api.lostFoundReports.dismiss(report.id)
      setReports(prev => prev.filter(r => r.id !== report.id))
    } catch (err) {
      alert("Failed to dismiss report")
    } finally {
      setDismissingId(null)
    }
  }

  async function handleRemoveItem(report: LostFoundReport) {
    setRemovingId(report.id)
    try {
      if (report.item_id) {
        await api.lostFoundItems.updateStatus(report.item_id, "removed", `Removed via report: ${report.reason}`)
      }
      await api.lostFoundReports.resolve(report.id)
      setReports(prev => prev.filter(r => r.id !== report.id))
    } catch (err) {
      alert("Failed to remove item")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <p className="text-sm text-muted-foreground">
        {reports.length} pending report{reports.length === 1 ? "" : "s"}
      </p>

      {reports.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Flag className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No pending reports</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">Abuse/spam reports on Lost &amp; Found items will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map(report => (
            <div key={report.id} className="overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60">
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                    {report.item?.image_urls?.[0] ? (
                      <img src={getFullImageUrl(report.item.image_urls[0])} alt={report.item.title} className="h-full w-full object-cover" />
                    ) : (
                      <PackageSearch className="h-5 w-5 opacity-30" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm line-clamp-1" title={report.item?.title}>{report.item?.title || "Item"}</h3>
                    {report.reporter?.name && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" /> Reported by {report.reporter.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className={cn("rounded-sm border border-dashed border-border/60 bg-muted/20 p-2 text-xs")}>
                  <span className="font-bold text-muted-foreground">Reason: </span>{report.reason}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleRemoveItem(report)}
                    disabled={removingId === report.id}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-sm bg-red-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {removingId === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                    Remove Item
                  </button>
                  <button
                    onClick={() => handleDismiss(report)}
                    disabled={dismissingId === report.id}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-bold hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {dismissingId === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
