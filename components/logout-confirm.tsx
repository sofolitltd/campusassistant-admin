"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"

import { endSession } from "@/lib/auth"

interface LogoutConfirmProps {
  open: boolean
  onClose: () => void
}

/** Confirm-then-logout modal, shared by the nav footer and the Settings page.
 * Portalled to <body> so the Sidebar's z-50 stacking context can't trap it. */
export function LogoutConfirm({ open, onClose }: LogoutConfirmProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, loading, onClose])

  async function handleLogout() {
    setLoading(true)
    try {
      await endSession()
      router.replace("/login")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-destructive-subtle p-3">
            <LogOut className="h-6 w-6 text-destructive" />
          </div>
          <h3 id="logout-confirm-title" className="text-lg font-bold">Log out?</h3>
          <p className="text-sm text-muted-foreground">You&apos;ll need to sign in again to access the admin panel.</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            autoFocus
            className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-all hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
