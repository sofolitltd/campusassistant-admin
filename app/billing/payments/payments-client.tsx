"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Undo2, Loader2, Mail, Phone } from "lucide-react"
import { api, AdminPayment, PaymentStatus, SubscriptionAttempt } from "@/lib/api"
import { Badge, Field, Modal, inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ErrorBanner, Pager, Spinner, Table, Td, Th, dangerBtn, formatDate, ghostBtn, taka } from "../billing-ui"

const LIMIT = 25
const VARIANT: Record<PaymentStatus, "default" | "success" | "danger" | "warn" | "info"> = {
  initiated: "warn", completed: "success", failed: "danger", cancelled: "default", needs_review: "danger", refunded: "info",
}

export function PaymentsClient() {
  const [view, setView] = useState<"payments" | "follow-up">("payments")
  const [rows, setRows] = useState<AdminPayment[] | null>(null)
  const [status, setStatus] = useState("")
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState("")
  const [target, setTarget] = useState<AdminPayment | null>(null)
  const [attempts, setAttempts] = useState<SubscriptionAttempt[] | null>(null)
  const [attemptStatus, setAttemptStatus] = useState("unresolved")
  const [attemptOffset, setAttemptOffset] = useState(0)
  const [attemptError, setAttemptError] = useState("")

  const load = useCallback(() => {
    setRows(null)
    setError("")
    const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) })
    if (status) q.set("status", status)
    api.billing.payments(q.toString()).then(r => setRows(r.payments ?? [])).catch(e => { setError(String(e.message ?? e)); setRows([]) })
  }, [status, offset])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-sm border bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setView("payments")}
            className={`rounded-sm px-3 py-1.5 text-xs font-bold transition-all ${view === "payments" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Payment history
          </button>
          <button
            type="button"
            onClick={() => setView("follow-up")}
            className={`rounded-sm px-3 py-1.5 text-xs font-bold transition-all ${view === "follow-up" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Subscription follow-up
          </button>
        </div>
        {view === "payments" ? (
          <div className="flex flex-wrap items-center gap-3">
            <select value={status} onChange={e => { setStatus(e.target.value); setOffset(0) }} className={`${selectCls} !w-auto`}>
              <option value="">All statuses</option>
              {(["completed", "needs_review", "initiated", "failed", "cancelled", "refunded"] as const).map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">
              <b>Needs review</b> = bKash took the money but we did not grant anything automatically (amount mismatch, order cancelled mid-checkout). Refund it here.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="payment-follow-up-status" className="text-xs font-semibold">Show</label>
            <select
              id="payment-follow-up-status"
              value={attemptStatus}
              onChange={e => { setAttemptStatus(e.target.value); setAttemptOffset(0) }}
              className={`${selectCls} !w-auto`}
            >
              <option value="unresolved">Failed, cancelled & needs review</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="needs_review">Needs review (payment received)</option>
              <option value="initiated">Awaiting payment result</option>
            </select>
          </div>
        )}
      </div>
      {view === "payments" ? (
        <>
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
        </>
      ) : (
        <SubscriptionFollowUp
          status={attemptStatus}
          offset={attemptOffset}
          onPageChange={setAttemptOffset}
          attempts={attempts}
          setAttempts={setAttempts}
          error={attemptError}
          setError={setAttemptError}
        />
      )}
      <RefundModal payment={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); load() }} />
    </div>
  )
}

function SubscriptionFollowUp({
  status, offset, onPageChange, attempts, setAttempts, error, setError,
}: {
  status: string
  offset: number
  onPageChange: (offset: number) => void
  attempts: SubscriptionAttempt[] | null
  setAttempts: (attempts: SubscriptionAttempt[] | null) => void
  error: string
  setError: (error: string) => void
}) {
  useEffect(() => {
    let active = true
    setAttempts(null)
    setError("")
    const params = new URLSearchParams({ status, limit: String(LIMIT), offset: String(offset) })

    api.billing.subscriptionAttempts(params.toString()).then(result => {
      if (active) setAttempts(result.attempts)
    }).catch((err: unknown) => {
      if (!active) return
      setError(String((err as Error).message ?? err))
      setAttempts([])
    })

    return () => { active = false }
  }, [status, offset, setAttempts, setError])

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Follow up with users whose recorded subscription checkout failed or was cancelled. Contact them by email or phone; only checkout attempts recorded by the app appear here.
      </p>
      <ErrorBanner message={error} />
      {attempts === null ? <Spinner label="Loading subscription checkouts..." /> : (
        <>
          <Table
            empty="No subscription checkouts match this status."
            head={<><Th>Date</Th><Th>Customer / contact</Th><Th>Plan</Th><Th right>Amount</Th><Th>Status</Th></>}
          >
            {attempts.map(attempt => {
              const fullName = `${attempt.first_name} ${attempt.last_name}`.trim()
              return (
                <tr key={attempt.id} className="hover:bg-muted/20">
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(attempt.created_at)}</Td>
                  <Td>
                    <Link href={`/users/${attempt.user_id}`} className="font-semibold hover:text-primary">
                      {fullName || attempt.user_email || "Unknown user"}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {attempt.user_email && (
                        <a className="inline-flex items-center gap-1 hover:text-primary" href={`mailto:${attempt.user_email}`}>
                          <Mail className="h-3 w-3" />
                          {attempt.user_email}
                        </a>
                      )}
                      {attempt.phone && (
                        <a className="inline-flex items-center gap-1 hover:text-primary" href={`tel:${attempt.phone.replace(/[^\d+]/g, "")}`}>
                          <Phone className="h-3 w-3" />
                          {attempt.phone}
                        </a>
                      )}
                      {!attempt.user_email && !attempt.phone && <span>No contact details available</span>}
                    </div>
                  </Td>
                  <Td>{attempt.plan_title || "Subscription plan"}</Td>
                  <Td right className="font-bold">{taka(attempt.amount)}</Td>
                  <Td><Badge variant={VARIANT[attempt.status] ?? "default"}>{attempt.status.replace("_", " ")}</Badge></Td>
                </tr>
              )
            })}
          </Table>
          <Pager offset={offset} limit={LIMIT} count={attempts.length} onChange={onPageChange} />
        </>
      )}
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
