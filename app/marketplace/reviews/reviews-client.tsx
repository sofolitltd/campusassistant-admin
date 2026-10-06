"use client"

import { useCallback, useEffect, useState } from "react"
import { Eye, EyeOff, Loader2, Star } from "lucide-react"
import { api, ProductReview } from "@/lib/api"
import { Badge, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ErrorBanner, Pager, Spinner, Table, Td, Th, formatDate, ghostBtn } from "@/app/billing/billing-ui"

const LIMIT = 25

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={i <= n ? "h-3.5 w-3.5 fill-warning text-warning" : "h-3.5 w-3.5 text-border"} />
      ))}
    </span>
  )
}

export function ReviewsClient() {
  const [rows, setRows] = useState<ProductReview[] | null>(null)
  const [hidden, setHidden] = useState("")
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")

  const load = useCallback(() => {
    setRows(null)
    const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) })
    if (hidden) q.set("hidden", hidden)
    api.reviews.list(q.toString()).then(r => setRows(r.reviews ?? [])).catch(e => { setError(String(e.message ?? e)); setRows([]) })
  }, [hidden, offset])

  useEffect(() => { load() }, [load])

  async function toggle(r: ProductReview) {
    setBusyId(r.id); setError("")
    try {
      await api.reviews.setHidden(r.id, !r.is_hidden)
      setRows(rs => rs?.map(x => x.id === r.id ? { ...x, is_hidden: !r.is_hidden } : x) ?? null)
    } catch (e) { setError(String((e as Error).message ?? e)) }
    finally { setBusyId("") }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={hidden} onChange={e => { setHidden(e.target.value); setOffset(0) }} className={`${selectCls} !w-auto`}>
          <option value="">All reviews</option>
          <option value="false">Visible</option>
          <option value="true">Hidden</option>
        </select>
        <p className="text-xs text-muted-foreground">Hidden reviews disappear from the app and no longer count toward ratings.</p>
      </div>
      <ErrorBanner message={error} />
      {rows === null ? <Spinner label="Loading Reviews..." /> : (
        <>
          <Table empty="No reviews here." head={<><Th>Date</Th><Th>Product</Th><Th>Rating</Th><Th>Review</Th><Th>Status</Th><Th /></>}>
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/20 align-top">
                <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(r.created_at)}</Td>
                <Td className="font-medium max-w-[14rem] truncate">{r.product_title || r.product_id.slice(0, 8)}</Td>
                <Td><Stars n={r.rating} /></Td>
                <Td className="max-w-md">
                  <p className="whitespace-pre-wrap break-words">{r.comment || <span className="text-muted-foreground">No comment</span>}</p>
                  {r.seller_reply && <p className="mt-1 rounded-sm bg-muted/40 px-2 py-1 text-xs text-muted-foreground"><b>Seller:</b> {r.seller_reply}</p>}
                </Td>
                <Td><Badge variant={r.is_hidden ? "danger" : "success"}>{r.is_hidden ? "hidden" : "visible"}</Badge></Td>
                <Td right>
                  <button className={ghostBtn} disabled={busyId === r.id} onClick={() => toggle(r)}>
                    {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : r.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {r.is_hidden ? "Unhide" : "Hide"}
                  </button>
                </Td>
              </tr>
            ))}
          </Table>
          <Pager offset={offset} limit={LIMIT} count={rows.length} onChange={setOffset} />
        </>
      )}
    </div>
  )
}
