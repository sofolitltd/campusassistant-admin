"use client"

import { useEffect, useState } from "react"
import { api, RefundRecord } from "@/lib/api"
import { Badge } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ErrorBanner, Pager, Spinner, Table, Td, Th, formatDate, taka } from "../billing-ui"

const LIMIT = 25

export function RefundsClient() {
  const [rows, setRows] = useState<RefundRecord[] | null>(null)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    setRows(null)
    api.billing.refunds(new URLSearchParams({ limit: String(LIMIT), offset: String(offset) }).toString())
      .then(r => setRows(r.refunds ?? []))
      .catch(e => { setError(String(e.message ?? e)); setRows([]) })
  }, [offset])

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Refunds are recorded from the <b>Payments</b> tab. This is the audit trail.</p>
      <ErrorBanner message={error} />
      {rows === null ? <Spinner label="Loading Refunds..." /> : (
        <>
          <Table empty="No refunds recorded." head={<><Th>Date</Th><Th>Type</Th><Th right>Amount</Th><Th>bKash reference</Th><Th>Reason</Th></>}>
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/20">
                <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(r.created_at)}</Td>
                <Td><Badge variant={r.kind === "order" ? "info" : "default"}>{r.kind}</Badge></Td>
                <Td right className="font-bold">{taka(r.amount)}</Td>
                <Td className="font-mono text-xs">{r.reference}</Td>
                <Td className="text-muted-foreground">{r.reason || "—"}</Td>
              </tr>
            ))}
          </Table>
          <Pager offset={offset} limit={LIMIT} count={rows.length} onChange={setOffset} />
        </>
      )}
    </div>
  )
}
