"use client"

import { useState } from "react"
import { History, Loader2, X } from "lucide-react"
import { api, type AuditLog } from "@/lib/api"

export function AuditHistory({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [error, setError] = useState("")

  async function loadHistory() {
    setOpen(true)
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ entity_type: entityType, entity_id: entityId, limit: "20" })
      const result = await api.auditLogs.getAll(params.toString())
      setLogs(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load audit history.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={loadHistory} className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
        <History className="h-3.5 w-3.5" /> History
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button type="button" aria-label="Close audit history" onClick={(event) => { event.stopPropagation(); setOpen(false) }} className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
          <section role="dialog" aria-modal="true" aria-labelledby="audit-history-title" onClick={(event) => event.stopPropagation()} className="relative z-10 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-sm border bg-card shadow-2xl">
            <header className="flex items-center justify-between border-b p-4">
              <div>
                <h2 id="audit-history-title" className="font-bold">Audit history</h2>
                <p className="text-xs text-muted-foreground">{entityType} · {entityId}</p>
              </div>
              <button type="button" aria-label="Close audit history" onClick={() => setOpen(false)} className="rounded-sm p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="max-h-[calc(80vh-4.5rem)] overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading history…</div>
              ) : error ? (
                <p role="alert" className="py-4 text-sm text-destructive">{error}</p>
              ) : logs.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No audit events recorded for this item.</p>
              ) : (
                <ol className="space-y-3">
                  {logs.map((entry) => (
                    <li key={entry.id} className="rounded-sm border p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-sm font-semibold">{entry.action}</span>
                        <time className="text-xs text-muted-foreground" dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.actor_label || entry.actor_id} · {entry.via_role || entry.actor_type}
                      </p>
                      {entry.reason && <p className="mt-2 text-sm">{entry.reason}</p>}
                      {entry.changes && Object.keys(entry.changes).length > 0 && (
                        <pre className="mt-2 overflow-x-auto rounded-sm bg-muted/40 p-2 text-xs">{JSON.stringify(entry.changes, null, 2)}</pre>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
