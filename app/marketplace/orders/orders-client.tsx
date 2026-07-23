"use client"

import { useState, useEffect } from "react"
import { ShoppingBag, Loader2, ChevronDown } from "lucide-react"
import { api, Order, OrderStatus } from "@/lib/api"
import { Badge } from "../../universities/[id]/departments/[...slug]/components/SharedUI"

const STATUS_ORDER: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered']

const STATUS_VARIANTS: Record<OrderStatus, "default" | "success" | "danger" | "warn" | "info"> = {
  pending_payment: "warn",
  paid: "info",
  processing: "default",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = () => {
    setLoading(true)
    api.orders.getAll(statusFilter || undefined)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [statusFilter])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId)
    try {
      await api.orders.updateStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`)
    }
    setUpdating(null)
  }

  const nextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'cancelled' || current === 'delivered') return null
    const idx = STATUS_ORDER.indexOf(current)
    if (idx === -1 || idx >= STATUS_ORDER.length - 1) return null
    return STATUS_ORDER[idx + 1]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-1 rounded-sm border bg-muted/20 p-1">
          {['', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer ${
                statusFilter === s ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s ? STATUS_LABELS[s as OrderStatus] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-bold">No orders found</p>
          <p className="text-sm">Orders will appear here once users start checking out.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold">Order #{order.id.slice(0, 8)}</p>
                    <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} — {(order.total_amount || 0).toLocaleString()} TK
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {nextStatus(order.status) && (
                    <button
                      onClick={() => handleStatusChange(order.id, nextStatus(order.status)!)}
                      disabled={updating === order.id}
                      className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-bold hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {updating === order.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      Progress to {STATUS_LABELS[nextStatus(order.status)!]}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      disabled={updating === order.id}
                      className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Shipping</p>
                  <p className="text-sm">{order.shipping_recipient_name} — {order.shipping_phone}</p>
                  <p className="text-xs text-muted-foreground">{order.shipping_address_line}, {order.shipping_city}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Items</p>
                  <div className="space-y-1">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate max-w-[200px]">{item.product_title}</span>
                        <span className="text-muted-foreground">x{item.quantity} — TK {(item.unit_price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
