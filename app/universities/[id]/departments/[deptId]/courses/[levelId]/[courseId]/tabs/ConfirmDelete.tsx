"use client"

import React from "react"
import { AlertTriangle, Trash2, Loader2, Flame } from "lucide-react"

export function ConfirmDelete({ open, label, onClose, onConfirm, loading, permanent }: { 
  open: boolean; 
  label: string; 
  onClose: () => void; 
  onConfirm: () => void; 
  loading: boolean;
  permanent?: boolean;
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`rounded-full p-3 ${permanent ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            {permanent ? <Flame className="h-6 w-6 text-orange-600" /> : <AlertTriangle className="h-6 w-6 text-red-600" />}
          </div>
          <h3 className="text-lg font-bold">{permanent ? 'Permanently' : ''} Delete {label}?</h3>
          <p className="text-sm text-muted-foreground">
            {permanent 
              ? 'This will permanently delete the resource, remove associated files from storage, and cannot be recovered.'
              : 'The resource will be hidden from users. It can be restored by an admin.'}
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 rounded-sm px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${permanent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : permanent ? <Flame className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {permanent ? 'Permanent Delete' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
