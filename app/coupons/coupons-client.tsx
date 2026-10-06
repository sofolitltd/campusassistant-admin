"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TicketPercent, Plus, Pencil, Check, X, Tag, Percent, Banknote, Infinity
} from "lucide-react"
import { api, CouponCode, SubscriptionPlan } from "@/lib/api"
import { cn } from "@/lib/utils"

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border bg-card shadow-sm overflow-hidden", className)}>{children}</div>
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "indigo" | "danger" }) {
  const cls = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    indigo: "bg-info-subtle text-info",
    danger: "bg-destructive-subtle text-destructive",
  }[variant]
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", cls)}>{children}</span>
}

// ── Coupon Modal ─────────────────────────────────────────────────────────────
function CouponModal({
  open, onClose, coupon, plans, onSuccess
}: {
  open: boolean; onClose: () => void; coupon?: CouponCode | null; plans: SubscriptionPlan[]; onSuccess: () => void
}) {
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [maxUses, setMaxUses] = useState("1")
  const [planId, setPlanId] = useState("")
  const [minAmount, setMinAmount] = useState("0")
  const [expiresAt, setExpiresAt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      if (coupon) {
        setCode(coupon.code)
        setDiscountType(coupon.discount_type as "percentage" | "fixed")
        setDiscountValue(coupon.discount_value.toString())
        setMaxUses(coupon.max_uses.toString())
        setPlanId(coupon.plan_id ?? "")
        setMinAmount(coupon.min_amount.toString())
        setExpiresAt(coupon.expires_at ? coupon.expires_at.slice(0, 16) : "")
        setError("")
      } else {
        setCode(""); setDiscountType("percentage"); setDiscountValue(""); setMaxUses("1"); setPlanId(""); setMinAmount("0"); setExpiresAt(""); setError("")
      }
    }
  }, [open, coupon])

  if (!open) return null

  function validate(): string | null {
    if (!code.trim()) return "Code is required"
    if (!discountValue || parseInt(discountValue) <= 0) return "Discount value must be > 0"
    if (discountType === "percentage" && parseInt(discountValue) > 100) return "Percentage cannot exceed 100"
    if (!maxUses || parseInt(maxUses) < 1) return "Max uses must be at least 1"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseInt(discountValue),
        max_uses: parseInt(maxUses),
        min_amount: parseInt(minAmount) || 0,
      }
      if (planId) payload.plan_id = planId
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString()

      if (coupon) {
        await api.coupons.update(coupon.id, payload)
      } else {
        await api.coupons.create(payload)
      }
      onSuccess(); onClose()
    } catch (err) { setError(String(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TicketPercent className="h-5 w-5 text-primary" /> {coupon ? "Edit Coupon" : "Create Coupon"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1">
          {error && (
            <div className="rounded-sm bg-destructive-subtle border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive">{error}</div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER50"
              className="w-full rounded-sm border bg-background px-3 py-2 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount Type</label>
              <div className="flex gap-1">
                {(["percentage", "fixed"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setDiscountType(t)} className={cn("flex items-center gap-1 flex-1 px-2 py-2 text-[10px] font-bold border rounded-sm hover:bg-muted transition-all", discountType === t && "bg-primary border-primary text-white")}>
                    {t === "percentage" ? <Percent className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                    {t === "percentage" ? "%" : "TK"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value</label>
              <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "e.g. 50" : "e.g. 500"} className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Uses</label>
              <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min Amount (BDT)</label>
              <input type="number" min="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Restrict to Plan (optional)</label>
            <select value={planId} onChange={e => setPlanId(e.target.value)} className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Any Plan</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.title} — {p.price} BDT</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expires At (optional)</label>
            <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-sm border py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Processing..." : coupon ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function CouponsClient() {
  const [coupons, setCoupons] = useState<CouponCode[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<CouponCode | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [couponData, planData] = await Promise.all([
        api.coupons.getAll(),
        api.subscriptions.getPlans(),
      ])
      setCoupons(couponData)
      setPlans(planData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function toggleActive(c: CouponCode) {
    setTogglingId(c.id)
    try {
      await api.coupons.update(c.id, { is_active: !c.is_active })
      setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
    } catch (err) { console.error(err) }
    finally { setTogglingId(null) }
  }

  const now = new Date()

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3"><TicketPercent className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Coupon Codes</h1>
            <p className="text-sm text-muted-foreground">Create and manage promo codes for Pro subscriptions.</p>
          </div>
        </div>
        <button
          onClick={() => { setEditCoupon(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Code</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Discount</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Usage</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground italic">No coupon codes yet.</td></tr>
                ) : (
                  coupons.map(c => {
                    const expired = c.expires_at !== null && new Date(c.expires_at) < now
                    const exhausted = c.used_count >= c.max_uses

                    return (
                      <tr key={c.id} className={cn("hover:bg-muted/10 transition-colors", !c.is_active && "opacity-50")}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="font-black text-sm tracking-wider">{c.code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={c.discount_type === "percentage" ? "indigo" : "success"}>
                            {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} TK`}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{c.used_count}</span>
                            <span className="text-muted-foreground text-[10px]">/ {c.max_uses}</span>
                            {exhausted && <Badge variant="warning">Exhausted</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {c.plan_id ? (
                            <span className="text-xs font-medium">{plans.find(p => p.id === c.plan_id)?.title ?? "Unknown"}</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Any Plan</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {c.expires_at ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium">{new Date(c.expires_at).toLocaleDateString("en-GB")}</span>
                              {expired && <Badge variant="danger">Expired</Badge>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Infinity className="h-3 w-3" />
                              <span className="text-[10px] italic">Never</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {c.is_active && !expired && !exhausted ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="warning">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => toggleActive(c)}
                              disabled={togglingId === c.id}
                              className={cn(
                                "rounded-full p-2 transition-all",
                                c.is_active
                                  ? "hover:bg-destructive-subtle hover:text-destructive text-muted-foreground"
                                  : "hover:bg-success-subtle hover:text-success text-muted-foreground"
                              )}
                              title={c.is_active ? "Deactivate" : "Activate"}
                            >
                              {togglingId === c.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : c.is_active ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => { setEditCoupon(c); setModalOpen(true) }}
                              className="rounded-full p-2 hover:bg-info-subtle hover:text-info transition-all text-muted-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CouponModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        coupon={editCoupon}
        plans={plans}
        onSuccess={loadData}
      />
    </div>
  )
}
