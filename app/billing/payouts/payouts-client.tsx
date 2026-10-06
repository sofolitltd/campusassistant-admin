"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { api, Merchant, MerchantPayout, PayoutStatus } from "@/lib/api"
import { Badge, Field, Modal, inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ErrorBanner, Pager, Spinner, Table, Td, Th, dangerBtn, formatDate, ghostBtn, primaryBtn, taka } from "../billing-ui"

const LIMIT = 25
const VARIANT: Record<PayoutStatus, "warn" | "success" | "danger"> = { requested: "warn", paid: "success", rejected: "danger" }

export function PayoutsClient() {
  const [rows, setRows] = useState<MerchantPayout[] | null>(null)
  const [merchants, setMerchants] = useState<Record<string, Merchant>>({})
  const [status, setStatus] = useState("requested")
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState("")
  const [action, setAction] = useState<{ kind: "pay" | "reject"; payout: MerchantPayout } | null>(null)

  useEffect(() => {
    api.merchants.getAll().then(list => setMerchants(Object.fromEntries(list.map(m => [m.id, m])))).catch(() => {})
  }, [])

  const load = useCallback(() => {
    setRows(null)
    const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) })
    if (status) q.set("status", status)
    api.billing.payouts(q.toString()).then(r => setRows(r.payouts ?? [])).catch(e => { setError(String(e.message ?? e)); setRows([]) })
  }, [status, offset])

  useEffect(() => { load() }, [load])

  const name = useMemo(() => (id: string) => merchants[id]?.business_name ?? id.slice(0, 8), [merchants])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setOffset(0) }} className={`${selectCls} !w-auto`}>
          <option value="requested">Awaiting transfer</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <p className="text-xs text-muted-foreground">Send the money from bKash/your bank first, then mark the payout paid with the transfer id.</p>
      </div>
      <ErrorBanner message={error} />
      {rows === null ? <Spinner label="Loading Payouts..." /> : (
        <>
          <Table empty="No payouts here." head={<><Th>Requested</Th><Th>Merchant</Th><Th>Send to</Th><Th right>Amount</Th><Th>Status</Th><Th>Reference</Th><Th /></>}>
            {rows.map(p => (
              <tr key={p.id} className="hover:bg-muted/20">
                <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(p.created_at)}</Td>
                <Td className="font-medium">{name(p.merchant_id)}</Td>
                <Td><span className="text-[10px] font-black uppercase text-muted-foreground">{p.method}</span> <span className="font-mono text-xs">{p.account}</span></Td>
                <Td right className="font-bold">{taka(p.amount)}</Td>
                <Td><Badge variant={VARIANT[p.status]}>{p.status}</Badge></Td>
                <Td className="font-mono text-xs">{p.reference || (p.note ? <span className="font-sans text-muted-foreground">{p.note}</span> : "—")}</Td>
                <Td right>
                  {p.status === "requested" && (
                    <div className="flex justify-end gap-2">
                      <button className={primaryBtn} onClick={() => setAction({ kind: "pay", payout: p })}><Check className="h-3.5 w-3.5" /> Mark paid</button>
                      <button className={ghostBtn} onClick={() => setAction({ kind: "reject", payout: p })}><X className="h-3.5 w-3.5" /> Reject</button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          <Pager offset={offset} limit={LIMIT} count={rows.length} onChange={setOffset} />
        </>
      )}
      <ActionModal action={action} merchantName={name} onClose={() => setAction(null)} onDone={() => { setAction(null); load() }} />
    </div>
  )
}

function ActionModal({ action, merchantName, onClose, onDone }: {
  action: { kind: "pay" | "reject"; payout: MerchantPayout } | null
  merchantName: (id: string) => string
  onClose: () => void
  onDone: () => void
}) {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => { setText(""); setError("") }, [action])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!action) return
    setBusy(true); setError("")
    try {
      if (action.kind === "pay") await api.billing.markPayoutPaid(action.payout.id, text.trim())
      else await api.billing.rejectPayout(action.payout.id, text.trim())
      onDone()
    } catch (err) { setError(String((err as Error).message ?? err)) }
    finally { setBusy(false) }
  }

  const pay = action?.kind === "pay"
  return (
    <Modal open={!!action} onClose={onClose} title={pay ? "Mark payout as paid" : "Reject payout"}>
      {action && (
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="rounded-sm border bg-muted/30 p-3 text-sm">
            {pay ? <>Confirm you sent <b>{taka(action.payout.amount)}</b> to <b>{merchantName(action.payout.merchant_id)}</b> via {action.payout.method} <span className="font-mono">{action.payout.account}</span>.</>
              : <>Reject the <b>{taka(action.payout.amount)}</b> request from <b>{merchantName(action.payout.merchant_id)}</b>. The amount returns to their balance.</>}
          </div>
          <ErrorBanner message={error} />
          <Field label={pay ? "Transfer / transaction id" : "Reason (shown to the merchant)"} required={pay}>
            <input className={inputCls} value={text} onChange={e => setText(e.target.value)} required={pay} placeholder={pay ? "e.g. bKash TrxID" : "e.g. Wrong account number"} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={ghostBtn} onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy || (pay && !text.trim())} className={pay ? primaryBtn : dangerBtn}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {pay ? "Confirm paid" : "Reject payout"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
