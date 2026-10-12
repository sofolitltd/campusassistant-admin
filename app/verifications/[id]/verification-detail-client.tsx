"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, Check, Link2, Loader2, UserPlus, X } from "lucide-react"
import { api, StudentVerificationMatch, StudentVerificationRequest } from "@/lib/api"
import { cn } from "@/lib/utils"
import { VerificationDocument } from "@/components/VerificationDocument"
import { VERIFICATION_STATUS_BADGE } from "../verifications-client"

const SECOND_DOC_LABEL: Record<StudentVerificationRequest["second_doc_type"], string> = {
  registration_card: "Registration Card",
  certificate: "Certificate",
}

function RejectModal({ open, onClose, onConfirm, loading }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) {
  const [reason, setReason] = useState("")
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-destructive-subtle p-3"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
          <h3 className="text-lg font-bold">Reject request?</h3>
          <p className="text-sm text-muted-foreground">The student sees this reason and can resubmit.</p>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. ID card photo is blurry"
          className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={() => onConfirm(reason.trim())} disabled={loading || !reason.trim()} className="flex-1 rounded-sm bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{value || "—"}</span>
    </div>
  )
}

function MatchPanel({ match }: { match: StudentVerificationMatch }) {
  const s = match.student
  const owner = s?.user ? `${s.user.first_name} ${s.user.last_name}`.trim() || s.user.email : undefined

  const meta = {
    unclaimed: { icon: Link2, cls: "bg-info-subtle text-info", title: "Will link to an existing profile", body: "A CR/admin already added this roll. Approving attaches it to this account." },
    none: { icon: UserPlus, cls: "bg-success-subtle text-success", title: "A new student profile will be created", body: "No profile exists for this roll in this batch." },
    conflict: { icon: AlertTriangle, cls: "bg-destructive-subtle text-destructive", title: "Roll already claimed", body: `This profile belongs to ${owner ?? "another account"}. Approve is disabled — reject, or resolve the conflict first.` },
    linked: { icon: Check, cls: "bg-success-subtle text-success", title: "Linked to this profile", body: "This request was approved and linked." },
  }[match.type]

  return (
    <div className={cn("rounded-sm p-4 space-y-3", meta.cls)}>
      <div className="flex items-start gap-3">
        <meta.icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">{meta.title}</p>
          <p className="text-xs opacity-90">{meta.body}</p>
        </div>
      </div>
      {s && (
        <div className="rounded-sm bg-card text-foreground p-3 text-xs grid grid-cols-2 gap-2">
          <span className="text-muted-foreground">Name on profile</span><span className="font-semibold">{s.name || "—"}</span>
          <span className="text-muted-foreground">Phone</span><span className="font-semibold">{s.phone || "—"}</span>
          <span className="text-muted-foreground">Email</span><span className="font-semibold break-all">{s.email || "—"}</span>
        </div>
      )}
      {match.other_pending_count > 0 && (
        <p className="text-xs font-semibold text-warning">
          ⚠ {match.other_pending_count} other pending request{match.other_pending_count > 1 ? "s" : ""} claim this same roll.
        </p>
      )}
    </div>
  )
}

export default function VerificationDetailClient({ initialRequest, initialMatch }: { initialRequest: StudentVerificationRequest; initialMatch: StudentVerificationMatch }) {
  const router = useRouter()
  const [request, setRequest] = useState(initialRequest)
  const [match, setMatch] = useState(initialMatch)
  const [approving, setApproving] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  async function refresh() {
    const data = await api.studentVerifications.getById(request.id)
    setRequest(data.request)
    setMatch(data.match)
    router.refresh()
  }

  async function handleApprove() {
    setApproving(true)
    try {
      await api.studentVerifications.approve(request.id)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve request")
    } finally {
      setApproving(false)
    }
  }

  async function handleReject(reason: string) {
    setRejecting(true)
    try {
      await api.studentVerifications.reject(request.id, reason)
      setRejectOpen(false)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject request")
    } finally {
      setRejecting(false)
    }
  }

  const isPending = request.status === "pending"
  const account = request.user

  return (
    <div className="space-y-6 pb-20">
      <Link href="/verifications" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All verifications
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{request.name}</h1>
            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", VERIFICATION_STATUS_BADGE[request.status])}>{request.status}</span>
          </div>
          <p className="text-sm text-muted-foreground">Submitted {new Date(request.created_at).toLocaleString("en-GB")}</p>
        </div>
        {isPending && (
          <div className="flex gap-2">
            <button onClick={() => setRejectOpen(true)} className="inline-flex items-center gap-2 rounded-sm border border-destructive/40 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive-subtle transition-all">
              <X className="h-4 w-4" /> Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={approving || match.type === "conflict"}
              title={match.type === "conflict" ? "This roll is already claimed by another account" : undefined}
              className="inline-flex items-center gap-2 rounded-sm bg-success px-4 py-2 text-sm font-bold text-success-foreground hover:opacity-90 transition-all disabled:opacity-50"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
            </button>
          </div>
        )}
      </div>

      {request.status === "rejected" && request.rejection_reason && (
        <div className="rounded-sm bg-destructive-subtle text-destructive p-4 text-sm">
          <span className="font-bold">Rejection reason:</span> {request.rejection_reason}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Documents</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <VerificationDocument attachmentId={request.id_card_attachment_id} label="Student ID Card" />
            <VerificationDocument attachmentId={request.second_doc_attachment_id} label={SECOND_DOC_LABEL[request.second_doc_type]} />
          </div>
          <p className="text-xs text-muted-foreground">Check that the name and roll on both documents match the claimed details. Click a document to open it full size.</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border bg-card p-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Claimed details</h2>
            <div className="divide-y">
              <InfoRow label="Name" value={request.name} />
              <InfoRow label="Roll" value={request.student_id} />
              <InfoRow label="University" value={request.university?.name} />
              <InfoRow label="Department" value={request.department?.name} />
              <InfoRow label="Batch" value={request.batch?.name} />
              <InfoRow label="Session" value={request.session?.name} />
              <InfoRow label="Phone" value={request.phone} />
            </div>
          </div>

          <div className="rounded-sm border bg-card p-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Account</h2>
            <div className="divide-y">
              <InfoRow label="Name" value={account ? `${account.first_name} ${account.last_name}`.trim() : undefined} />
              <InfoRow label="Email" value={account?.email} />
              <InfoRow label="Phone" value={account?.phone} />
              <InfoRow label="Joined" value={account ? new Date(account.created_at).toLocaleDateString("en-GB") : undefined} />
            </div>
          </div>

          <MatchPanel match={match} />
        </div>
      </div>

      <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={handleReject} loading={rejecting} />
    </div>
  )
}
