import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mirrors the backend's UserSubscription.ComputeStatus — never stored,
// always derived from dates so grace period shows up consistently
// everywhere the admin UI needs a subscription's lifecycle state.
export function computeSubStatus(sub: {
  end_date: string | null
  grace_ends_at?: string | null
  refunded_at?: string | null
}): "active" | "grace" | "expired" | "refunded" {
  if (sub.refunded_at) return "refunded"
  if (sub.end_date === null) return "active" // lifetime
  const now = new Date()
  if (new Date(sub.end_date) > now) return "active"
  if (sub.grace_ends_at && new Date(sub.grace_ends_at) > now) return "grace"
  return "expired"
}

// dd/mm/yy — users table/cards and detail page. Empty string for null/invalid.
export function fmtDdMmYy(iso: string | null | undefined) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`
}
