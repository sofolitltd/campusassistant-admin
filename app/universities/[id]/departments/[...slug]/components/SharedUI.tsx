"use client"

import { cn } from "@/lib/utils"
import { X, Plus, AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { useEffect } from "react"

export function Avatar({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" }
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  if (imageUrl)
    return <img src={imageUrl} alt={name} className={cn("rounded-full object-cover shrink-0", sizes[size])} onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold bg-primary/10 text-primary shrink-0", sizes[size])}>
      {initials}
    </div>
  )
}

export function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: "default" | "success" | "danger" | "warn" | "info"; className?: string }) {
  const colors = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold",
    info: "bg-primary/10 text-primary border border-primary/20 font-bold",
  }
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider", colors[variant], className)}>{children}</span>
}

export function EmptyState({ icon: Icon, label, onAdd, addLabel }: { icon: React.ElementType; label: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center rounded-sm border border-dashed bg-muted/20">
      <div className="rounded-full bg-muted p-6 mb-4"><Icon className="h-10 w-10 text-muted-foreground/40" /></div>
      <p className="text-lg font-bold capitalize">No {label} yet</p>
      <p className="text-sm text-muted-foreground mt-1">Records will appear here once added.</p>
      {onAdd && (
        <button onClick={onAdd} className="mt-6 flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
          <Plus className="h-4 w-4" />{addLabel || "Add"}
        </button>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
      <div 
        className={cn("relative z-10 w-full sm:max-w-lg rounded-sm border bg-card shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]", className)} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-all"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ConfirmDelete({ open, label, onClose, onConfirm, loading }: { open: boolean; label: string; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          <h3 className="text-lg font-bold">Delete {label}?</h3>
          <p className="text-sm text-muted-foreground">This action cannot be undone and will delete all associated data.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

export const inputCls = "w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
export const selectCls = "w-full rounded-sm border bg-background px-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat text-foreground"
