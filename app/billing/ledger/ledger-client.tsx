"use client"

import { useEffect, useState } from "react"
import { api, LedgerRow } from "@/lib/api"
import { selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ErrorBanner, Pager, Spinner, Table, Td, Th, formatDate, taka } from "../billing-ui"

const LIMIT = 50
const ACCOUNTS = [
  ["", "All accounts"],
  ["revenue:subscriptions", "Revenue — subscriptions"],
  ["revenue:commission", "Revenue — commission"],
  ["revenue:platform_sales", "Revenue — platform sales"],
  ["liability:orders_escrow", "Held for orders"],
  ["liability:payouts_pending", "Payouts pending"],
  ["asset:gateway_bkash", "bKash received"],
  ["asset:cash_out", "Paid out"],
] as const

export function LedgerClient() {
  const [rows, setRows] = useState<LedgerRow[] | null>(null)
  const [account, setAccount] = useState("")
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    setRows(null)
    const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) })
    if (account) q.set("account", account)
    api.billing.ledger(q.toString()).then(r => setRows(r.entries ?? [])).catch(e => { setError(String(e.message ?? e)); setRows([]) })
  }, [account, offset])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={account} onChange={e => { setAccount(e.target.value); setOffset(0) }} className={`${selectCls} !w-auto`}>
          {ACCOUNTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">Read-only. Every entry has an equal and opposite one; corrections appear as new <i>refund:</i> entries, never edits.</p>
      </div>
      <ErrorBanner message={error} />
      {rows === null ? <Spinner label="Loading Ledger..." /> : (
        <>
          <Table empty="No ledger entries yet." head={<><Th>Date</Th><Th>Account</Th><Th>Event</Th><Th right>Debit</Th><Th right>Credit</Th><Th>Note</Th></>}>
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/20">
                <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(r.created_at)}</Td>
                <Td className="font-mono text-xs">{r.account.startsWith("liability:merchant:") ? `merchant ${r.account.slice(-8)}` : r.account}</Td>
                <Td className="text-xs">{r.kind}</Td>
                <Td right>{r.debit ? taka(r.debit) : ""}</Td>
                <Td right>{r.credit ? taka(r.credit) : ""}</Td>
                <Td className="text-xs text-muted-foreground">{r.memo}</Td>
              </tr>
            ))}
          </Table>
          <Pager offset={offset} limit={LIMIT} count={rows.length} onChange={setOffset} />
        </>
      )}
    </div>
  )
}
