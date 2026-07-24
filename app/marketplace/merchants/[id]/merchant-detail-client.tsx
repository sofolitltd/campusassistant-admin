"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Store,
  Check,
  X,
  Trash2,
  Loader2,
  Percent,
  Save,
  AlertTriangle,
  Phone,
  Mail,
  Tag,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Package,
  Globe,
  Link2,
  IdCard,
  FileCheck,
  User,
  Wallet,
} from "lucide-react"
import { api, Merchant, MerchantStatus, Product, getFullImageUrl } from "@/lib/api"
import { ConfirmDelete } from "../../../universities/[id]/departments/[...slug]/components/SharedUI"
import { cn } from "@/lib/utils"

interface MerchantDetailClientProps {
  merchant: Merchant
  initialProducts: Product[]
}

const STATUS_BADGE: Record<MerchantStatus, string> = {
  pending: "bg-amber-500 text-white",
  approved: "bg-emerald-500 text-white",
  rejected: "bg-red-500 text-white",
}

function RejectModal({ open, onClose, onConfirm, loading }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) {
  const [reason, setReason] = useState("")
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          <h3 className="text-lg font-bold">Reject merchant?</h3>
          <p className="text-sm text-muted-foreground">Optionally tell the applicant why.</p>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Reason (optional)"
          className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}Reject
          </button>
        </div>
      </div>
    </div>
  )
}

// Verification documents are stored privately — the server never hands back
// a permanent URL, only an attachment id. Resolve a short-lived viewing URL
// just-in-time instead of caching one, since it can expire.
function VerificationDocument({ attachmentId, label }: { attachmentId: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.attachments.getUrl(attachmentId)
      .then(res => { if (!cancelled) setUrl(res.url) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [attachmentId])

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group block overflow-hidden rounded-md border border-border/60", !url && "pointer-events-none")}
    >
      <div className="aspect-video bg-muted overflow-hidden flex items-center justify-center">
        {error ? (
          <p className="text-xs text-muted-foreground">Could not load document</p>
        ) : url ? (
          <img src={url} alt={label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center gap-1.5 p-2 text-xs font-semibold">
        <IdCard className="h-3.5 w-3.5 text-muted-foreground" /> {label}
      </div>
    </a>
  )
}

export default function MerchantDetailClient({ merchant: initialMerchant, initialProducts }: MerchantDetailClientProps) {
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant>(initialMerchant)
  const [products] = useState<Product[]>(initialProducts)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [commissionDraft, setCommissionDraft] = useState<string | undefined>(undefined)
  const [savingCommission, setSavingCommission] = useState(false)

  async function handleApprove() {
    setApproving(true)
    try {
      await api.merchants.approve(merchant.id)
      setMerchant(prev => ({ ...prev, status: "approved" }))
    } catch (err) {
      alert("Failed to approve merchant")
    } finally {
      setApproving(false)
    }
  }

  async function handleReject(reason: string) {
    setRejectLoading(true)
    try {
      await api.merchants.reject(merchant.id, reason)
      setMerchant(prev => ({ ...prev, status: "rejected", rejection_reason: reason }))
      setRejectOpen(false)
    } catch (err) {
      alert("Failed to reject merchant")
    } finally {
      setRejectLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await api.merchants.delete(merchant.id)
      router.push("/marketplace/merchants")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete merchant")
      setDeleteLoading(false)
    }
  }

  async function handleSaveCommission() {
    const rate = commissionDraft !== undefined ? parseFloat(commissionDraft) : merchant.commission_rate
    if (Number.isNaN(rate)) return
    setSavingCommission(true)
    try {
      await api.merchants.update(merchant.id, { commission_rate: rate })
      setMerchant(prev => ({ ...prev, commission_rate: rate }))
      setCommissionDraft(undefined)
    } catch (err) {
      alert("Failed to update commission rate")
    } finally {
      setSavingCommission(false)
    }
  }

  return (
    <div className="space-y-6 pb-32 md:pb-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link href="/marketplace/merchants" className="rounded-full p-2 hover:bg-accent transition-colors border">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merchant Profile</h1>
          <p className="text-sm text-muted-foreground">Review and manage this merchant's account.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card shadow-xs p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                {merchant.logo_url ? (
                  <img src={getFullImageUrl(merchant.logo_url)} alt={merchant.business_name} className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-8 w-8 opacity-30" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{merchant.business_name}</h2>
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shadow-sm", STATUS_BADGE[merchant.status])}>
                    {merchant.status}
                  </span>
                  {merchant.is_platform && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      <ShieldCheck className="h-3 w-3" /> Platform
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(merchant.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>

            {merchant.description && (
              <p className="text-sm text-muted-foreground">{merchant.description}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {merchant.business_type && (
                <div className="flex items-center gap-2 rounded-sm border border-dashed border-border/60 bg-muted/20 p-3">
                  <Tag className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Business Type</p>
                    <p className="text-xs font-medium truncate">{merchant.business_type}</p>
                  </div>
                </div>
              )}
              {merchant.phone && (
                <div className="flex items-center gap-2 rounded-sm border border-dashed border-border/60 bg-muted/20 p-3">
                  <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Phone</p>
                    <p className="text-xs font-medium truncate">{merchant.phone}</p>
                  </div>
                </div>
              )}
              {merchant.email && (
                <div className="flex items-center gap-2 rounded-sm border border-dashed border-border/60 bg-muted/20 p-3">
                  <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Email</p>
                    <p className="text-xs font-medium truncate">{merchant.email}</p>
                  </div>
                </div>
              )}
              {merchant.website && (
                <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-sm border border-dashed border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors">
                  <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Website</p>
                    <p className="text-xs font-medium truncate text-primary">{merchant.website}</p>
                  </div>
                </a>
              )}
              {merchant.social_media_link && (
                <a href={merchant.social_media_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-sm border border-dashed border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors">
                  <Link2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Social Media</p>
                    <p className="text-xs font-medium truncate text-primary">{merchant.social_media_link}</p>
                  </div>
                </a>
              )}
            </div>

            {merchant.status === "rejected" && merchant.rejection_reason && (
              <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-900/10">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400"><span className="font-bold">Rejection reason:</span> {merchant.rejection_reason}</p>
              </div>
            )}
          </div>

          {merchant.user && (
            <div className="rounded-lg border bg-card shadow-xs p-6 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Applicant Account
              </h3>
              <p className="text-xs text-muted-foreground">
                Cross-check this against the verification documents below before approving.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-sm border border-dashed border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Name</p>
                  <p className="text-xs font-medium truncate">{merchant.user.first_name} {merchant.user.last_name}</p>
                </div>
                <div className="rounded-sm border border-dashed border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Account Email</p>
                  <p className="text-xs font-medium truncate">{merchant.user.email}</p>
                </div>
              </div>
            </div>
          )}

          {(merchant.student_id_proof_url || merchant.nid_proof_url) && (
            <div className="rounded-lg border bg-card shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" /> Verification Documents
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {merchant.student_id_proof_url && (
                  <VerificationDocument attachmentId={merchant.student_id_proof_url} label="Student ID Proof" />
                )}
                {merchant.nid_proof_url && (
                  <VerificationDocument attachmentId={merchant.nid_proof_url} label="NID Proof" />
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" /> Products ({products.length})
            </h3>
            {products.length === 0 ? (
              <p className="text-xs text-muted-foreground">This merchant has no products yet.</p>
            ) : (
              <div className="divide-y divide-dashed divide-border/60">
                {products.map(product => (
                  <Link
                    key={product.id}
                    href={`/marketplace/products/edit/${product.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-muted/20 transition-colors -mx-2 px-2 rounded-sm"
                  >
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                      {product.image_urls?.[0] ? (
                        <img src={getFullImageUrl(product.image_urls[0])} alt={product.title} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 opacity-30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{product.title}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black">৳{product.price.toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        {product.is_published ? "Published" : "Draft"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {(merchant.payout_method || merchant.payout_account) && (
            <div className="rounded-lg border bg-card shadow-xs p-6 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" /> Payout Details
              </h3>
              <div className="rounded-sm border border-dashed border-border/60 bg-muted/20 p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">{merchant.payout_method ?? "Method"}</p>
                <p className="text-xs font-medium truncate">{merchant.payout_account || "—"}</p>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold">Commission Rate</h3>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={commissionDraft ?? merchant.commission_rate}
                onChange={e => setCommissionDraft(e.target.value)}
                className="w-20 rounded-sm border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-xs text-muted-foreground">% commission</span>
            </div>
            {commissionDraft !== undefined && commissionDraft !== merchant.commission_rate.toString() && (
              <button
                onClick={handleSaveCommission}
                disabled={savingCommission}
                className="w-full flex items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
              >
                {savingCommission ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            )}
          </div>

          <div className="rounded-lg border bg-card shadow-xs p-6 space-y-2">
            <h3 className="text-sm font-bold mb-2">Actions</h3>
            {merchant.status !== "approved" && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="w-full flex items-center justify-center gap-1.5 rounded-sm bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
              >
                {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </button>
            )}
            {merchant.status !== "rejected" && (
              <button
                onClick={() => setRejectOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2.5 text-xs font-bold hover:bg-accent transition-all"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            )}
            <button
              onClick={() => setDeleteOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Merchant
            </button>
          </div>
        </div>
      </div>

      <ConfirmDelete
        open={deleteOpen}
        label="merchant"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
      />
    </div>
  )
}
