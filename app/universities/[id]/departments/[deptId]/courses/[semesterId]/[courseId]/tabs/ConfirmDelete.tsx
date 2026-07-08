"use client"

import React from "react"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"

export function ConfirmDelete({ open, label, onClose, onConfirm, loading }: { 
  open: boolean; 
  label: string; 
  onClose: () => void; 
  onConfirm: () => void; 
  loading: boolean 
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
          <h3 className="text-lg font-bold">Delete {label}?</h3>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
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
