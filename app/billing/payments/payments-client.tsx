"use client"

import { useCallback, useEffect, useState } from "react"
import { Undo2, Loader2 } from "lucide-react"
import { api, AdminPayment, PaymentStatus } from "@/lib/api"
import { Badge, Field, Modal, inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ErrorBanner, Pager, Spinner, Table, Td, Th, dangerBtn, formatDate, ghostBtn, taka } from "../billing-ui"

const LIMIT = 25
const VARIANT: Record<PaymentStatus, "default" | "success" | "danger" | "warn" | "info"> = {
  initiated: "warn", completed: "success", failed: "danger", cancelled: "default", needs_review: "danger", refunded: "info",
}

export function PaymentsClient() {
  const [rows, setRows] = useState<AdminPayment[] | null>(null)
  const [status, setStatus] = useState("")
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState("")
  const [target, setTarget] = useState<AdminPayment | null>(null)

  const load = useCallback(() => {
    setRows(null)
    const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) })
    if (status) q.set("status", status)
    api.billing.payments(q.toString()).then(r => setRows(r.payments ?? [])).catch(e => { setError(String(e.message ?? e)); setRows([]) })
  }, [status, offset])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setOffset(0) }} className={`${selectCls} !w-auto`}>
          <option value="">All statuses</option>
          {(["completed", "needs_review", "initiated", "failed", "cancelled", "refunded"] as const).map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">
          <b>Needs review</b> = bKash took the money but we did not grant anything automatically (amount mismatch, order cancelled mid-checkout). Refund it here.
        </p>
      </div>
      <ErrorBanner message={error} />
      {rows === null ? <Spinner label="Loading Payments..." /> : (
        <>
          <Table empty="No payments match." head={<><Th>Date</Th><Th>Customer</Th><Th>For</Th><Th right>Amount</Th><Th>bKash trx</Th><Th>Status</Th><Th /></>}>
            {rows.map(p => (
              <tr key={`${p.kind}-${p.id}`} className="hover:bg-muted/20">
                <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(p.created_at)}</Td>
                <Td>{p.user_email || "—"}</Td>
                <Td><span className="font-medium">{p.title}</span> <span className="text-[10px] uppercase text-muted-foreground">{p.kind}</span></Td>
                <Td right className="font-bold">{taka(p.amount)}</Td>
                <Td className="font-mono text-xs">{p.trx_id || "—"}</Td>
                <Td><Badge variant={VARIANT[p.status] ?? "default"}>{p.status.replace("_", " ")}</Badge></Td>
                <Td right>
                  {(p.status === "completed" || p.status === "needs_review") && (
                    <button className={ghostBtn} onClick={() => setTarget(p)}><Undo2 className="h-3.5 w-3.5" /> Refund</button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          <Pager offset={offset} limit={LIMIT} count={rows.length} onChange={setOffset} />
        </>
      )}
      <RefundModal payment={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); load() }} />
    </div>
  )
}

function RefundModal({ payment, onClose, onDone }: { payment: AdminPayment | null; onClose: () => void; onDone: () => void }) {
  const [reference, setReference] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { setReference(""); setReason(""); setError("") }, [payment])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!payment) return
    setBusy(true); setError("")
    try {
      // Subscription refunds are keyed by the payment row; order refunds by the order.
      await api.billing.refund(payment.kind, payment.kind === "order" ? payment.order_id! : payment.id, reference.trim(), reason.trim())
      onDone()
    } catch (err) { setError(String((err as Error).message ?? err)) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={!!payment} onClose={onClose} title="Record refund">
      {payment && (
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="rounded-sm border bg-muted/30 p-3 text-sm">
            Refund <b>{taka(payment.amount)}</b> to <b>{payment.user_email || "this customer"}</b> for {payment.title}.
            {payment.kind === "order"
              ? " The order is cancelled and any merchant earnings from it are reversed."
              : " Their Pro access from this payment ends and the invoice is voided."}
          </div>
          <p className="text-xs text-muted-foreground">
            This records the refund — it does not move money. First send the refund from your bKash merchant portal, then enter its transaction id below.
          </p>
          <ErrorBanner message={error} />
          <Field label="bKash refund transaction id" required>
            <input className={inputCls} value={reference} onChange={e => setReference(e.target.value)} required placeholder="e.g. 9A1B2C3D4E" />
          </Field>
          <Field label="Reason">
            <input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional note for the audit trail" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={ghostBtn} onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy || !reference.trim()} className={dangerBtn}>{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Record refund</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
