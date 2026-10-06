"use client"

import { useEffect, useState } from "react"
import { api, Invoice } from "@/lib/api"
import { Badge } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ErrorBanner, Pager, Spinner, Table, Td, Th, formatDate, taka } from "../billing-ui"

const LIMIT = 25

export function InvoicesClient() {
  const [rows, setRows] = useState<Invoice[] | null>(null)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    setRows(null)
    api.billing.invoices(new URLSearchParams({ limit: String(LIMIT), offset: String(offset) }).toString())
      .then(r => setRows(r.invoices ?? []))
      .catch(e => { setError(String(e.message ?? e)); setRows([]) })
  }, [offset])

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Invoices are issued automatically when a payment completes. Customers view and print theirs in the app.</p>
      <ErrorBanner message={error} />
      {rows === null ? <Spinner label="Loading Invoices..." /> : (
        <>
          <Table empty="No invoices yet." head={<><Th>Number</Th><Th>Date</Th><Th>Customer</Th><Th>Items</Th><Th right>Total</Th><Th>Status</Th></>}>
            {rows.map(i => (
              <tr key={i.id} className="hover:bg-muted/20">
                <Td className="font-mono text-xs font-bold">{i.number}</Td>
                <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(i.issued_at)}</Td>
                <Td>{i.customer_name || i.customer_email || "—"}<div className="text-xs text-muted-foreground">{i.customer_email}</div></Td>
                <Td className="text-xs">{(i.lines ?? []).map(l => `${l.description} ×${l.quantity}`).join(", ")}</Td>
                <Td right className="font-bold">{taka(i.total)}</Td>
                <Td>{i.voided_at ? <Badge variant="danger">void</Badge> : <Badge variant="success">paid</Badge>}</Td>
              </tr>
            ))}
          </Table>
          <Pager offset={offset} limit={LIMIT} count={rows.length} onChange={setOffset} />
        </>
      )}
    </div>
  )
}
