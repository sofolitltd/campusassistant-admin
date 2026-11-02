"use client"

import { useState, useCallback, useEffect } from "react"
import { api, TrashItem, TrashSummary } from "@/lib/api"
import { useIsSuperAdmin } from "@/lib/auth"
import { ConfirmDelete } from "../universities/[id]/departments/[...slug]/components/SharedUI"
import { Trash2, RotateCcw, Flame, Loader2, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

export default function TrashClient({ initialSummary }: { initialSummary: TrashSummary[] }) {
  const superAdmin = useIsSuperAdmin()
  const [summary, setSummary] = useState(initialSummary)
  const [type, setType] = useState<string | null>(initialSummary[0]?.type ?? null)
  const [items, setItems] = useState<TrashItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [purgeTarget, setPurgeTarget] = useState<TrashItem | null>(null)

  const load = useCallback(async (t: string, offset = 0) => {
    setLoading(true); setError("")
    try {
      const res = await api.trash.list(t, offset, PAGE_SIZE)
      setItems(prev => offset === 0 ? (res.data ?? []) : [...prev, ...(res.data ?? [])])
      setTotal(res.total ?? 0)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (type) load(type) }, [type, load])

  // After a restore or purge: drop the row and refresh the per-type counts.
  const afterChange = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setTotal(n => Math.max(0, n - 1))
    const fresh = await api.trash.summary().catch(() => null)
    if (fresh) setSummary(fresh)
  }, [])

  async function restore(item: TrashItem) {
    if (!type) return
    setBusyId(item.id); setError("")
    try { await api.trash.restore(type, item.id); await afterChange(item.id) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusyId(null) }
  }

  async function purge() {
    if (!type || !purgeTarget) return
    setBusyId(purgeTarget.id); setError("")
    try { await api.trash.purge(type, purgeTarget.id); await afterChange(purgeTarget.id) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusyId(null); setPurgeTarget(null) }
  }

  const typeName = summary.find(s => s.type === type)?.name ?? type

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Trash2 className="h-6 w-6 text-primary" /> Trash
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything soft-deleted across the dashboard. Any admin can restore;
          {superAdmin ? " as a super admin you can also delete permanently." : " only a super admin can delete permanently."}
        </p>
      </div>

      {summary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-sm border border-dashed bg-muted/20">
          <div className="rounded-full bg-muted p-5 mb-3"><Inbox className="h-8 w-8 text-muted-foreground/40" /></div>
          <p className="font-bold">The Trash is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {summary.map(s => (
              <button key={s.type} onClick={() => setType(s.type)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm font-medium shrink-0 transition-all",
                  type === s.type ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                <span>{s.name}</span>
                <span className="text-[10px] font-black rounded-sm bg-muted px-1.5 py-0.5">{s.count}</span>
              </button>
            ))}
          </nav>

          <div className="space-y-3 min-w-0">
            {error && <p className="rounded-sm border border-destructive/30 bg-destructive-subtle p-3 text-sm text-destructive">{error}</p>}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{typeName} · {total}</p>

            {loading && items.length === 0 ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary opacity-30" /></div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing here.</p>
            ) : (
              <div className="divide-y rounded-sm border bg-card">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label || item.id}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Deleted {new Date(item.deleted_at).toLocaleString()}
                        {item.deleted_by ? ` by ${item.deleted_by}` : ""}
                      </p>
                    </div>
                    <button onClick={() => restore(item)} disabled={busyId === item.id}
                      className="flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-bold hover:bg-muted transition-all disabled:opacity-50">
                      {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Restore
                    </button>
                    {superAdmin && (
                      <button onClick={() => setPurgeTarget(item)} disabled={busyId === item.id}
                        className="flex items-center gap-1.5 rounded-sm border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive-subtle transition-all disabled:opacity-50">
                        <Flame className="h-3.5 w-3.5" /> Delete permanently
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {items.length < total && type && (
              <button onClick={() => load(type, items.length)} disabled={loading}
                className="w-full rounded-sm border py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition-all disabled:opacity-50">
                {loading ? "Loading…" : `Load more (${total - items.length} left)`}
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmDelete
        open={!!purgeTarget}
        label={purgeTarget ? `"${purgeTarget.label || purgeTarget.id}" permanently` : ""}
        message="This erases the record for good, and for resources also deletes the stored file. It cannot be undone."
        onClose={() => setPurgeTarget(null)}
        onConfirm={purge}
        loading={!!purgeTarget && busyId === purgeTarget.id}
      />
    </div>
  )
}
