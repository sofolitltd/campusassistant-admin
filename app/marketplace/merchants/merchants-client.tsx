"use client"

import { useState, useMemo } from "react"
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
  Tag
} from "lucide-react"
import { api, Merchant, MerchantStatus, getFullImageUrl } from "@/lib/api"
import { ConfirmDelete } from "../../universities/[id]/departments/[...slug]/components/SharedUI"
import { cn } from "@/lib/utils"

interface MerchantsClientProps {
  initialMerchants: Merchant[]
}

const STATUS_TABS: { label: string; value: MerchantStatus | "all" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
]

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

export default function MerchantsClient({ initialMerchants }: MerchantsClientProps) {
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants)
  const [activeTab, setActiveTab] = useState<MerchantStatus | "all">("pending")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [commissionDrafts, setCommissionDrafts] = useState<Record<string, string>>({})
  const [savingCommissionId, setSavingCommissionId] = useState<string | null>(null)

  const filtered = useMemo(
    () => activeTab === "all" ? merchants : merchants.filter(m => m.status === activeTab),
    [merchants, activeTab]
  )

  async function handleApprove(id: string) {
    setApprovingId(id)
    try {
      await api.merchants.approve(id)
      setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: "approved" } : m))
    } catch (err) {
      alert("Failed to approve merchant")
    } finally {
      setApprovingId(null)
    }
  }

  async function handleReject(reason: string) {
    if (!rejectId) return
    setRejectLoading(true)
    try {
      await api.merchants.reject(rejectId, reason)
      setMerchants(prev => prev.map(m => m.id === rejectId ? { ...m, status: "rejected", rejection_reason: reason } : m))
      setRejectId(null)
    } catch (err) {
      alert("Failed to reject merchant")
    } finally {
      setRejectLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.merchants.delete(deleteId)
      setMerchants(prev => prev.filter(m => m.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert("Failed to delete merchant")
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleSaveCommission(merchant: Merchant) {
    const draft = commissionDrafts[merchant.id]
    const rate = draft !== undefined ? parseFloat(draft) : merchant.commission_rate
    if (Number.isNaN(rate)) return
    setSavingCommissionId(merchant.id)
    try {
      await api.merchants.update(merchant.id, { commission_rate: rate })
      setMerchants(prev => prev.map(m => m.id === merchant.id ? { ...m, commission_rate: rate } : m))
      setCommissionDrafts(prev => {
        const next = { ...prev }
        delete next[merchant.id]
        return next
      })
    } catch (err) {
      alert("Failed to update commission rate")
    } finally {
      setSavingCommissionId(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn("flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all rounded-sm",
              activeTab === tab.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                {merchants.filter(m => m.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Store className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No merchants found</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">
            {activeTab === "pending" ? "No pending applications right now." : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(merchant => (
            <div key={merchant.id} className="overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60">
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                    {merchant.logo_url ? (
                      <img src={getFullImageUrl(merchant.logo_url)} alt={merchant.business_name} className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-5 w-5 opacity-30" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm line-clamp-1" title={merchant.business_name}>{merchant.business_name}</h3>
                    <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm", STATUS_BADGE[merchant.status])}>
                      {merchant.status}
                    </span>
                  </div>
                </div>

                {merchant.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{merchant.description}</p>
                )}

                {(merchant.business_type || merchant.phone || merchant.email) && (
                  <div className="space-y-1 rounded-sm border border-dashed border-border/60 bg-muted/20 p-2">
                    {merchant.business_type && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Tag className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{merchant.business_type}</span>
                      </div>
                    )}
                    {merchant.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{merchant.phone}</span>
                      </div>
                    )}
                    {merchant.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{merchant.email}</span>
                      </div>
                    )}
                  </div>
                )}

                {merchant.status === "rejected" && merchant.rejection_reason && (
                  <p className="text-[10px] text-red-600 italic">Reason: {merchant.rejection_reason}</p>
                )}

                <div className="flex items-center gap-2 border-t border-dashed pt-3 border-border/60">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={commissionDrafts[merchant.id] ?? merchant.commission_rate}
                    onChange={e => setCommissionDrafts(prev => ({ ...prev, [merchant.id]: e.target.value }))}
                    className="w-16 rounded-sm border bg-background px-1.5 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-[10px] text-muted-foreground">% commission</span>
                  {commissionDrafts[merchant.id] !== undefined && commissionDrafts[merchant.id] !== merchant.commission_rate.toString() && (
                    <button
                      onClick={() => handleSaveCommission(merchant)}
                      disabled={savingCommissionId === merchant.id}
                      className="ml-auto flex items-center gap-1 rounded-sm bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {savingCommissionId === merchant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  {merchant.status !== "approved" && (
                    <button
                      onClick={() => handleApprove(merchant.id)}
                      disabled={approvingId === merchant.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-sm bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {approvingId === merchant.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                  )}
                  {merchant.status !== "rejected" && (
                    <button
                      onClick={() => setRejectId(merchant.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-bold hover:bg-accent transition-all"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(merchant.id)}
                    className="flex items-center justify-center rounded-sm border px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDelete
        open={!!deleteId}
        label="merchant"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
      <RejectModal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={handleReject}
        loading={rejectLoading}
      />
    </div>
  )
}
