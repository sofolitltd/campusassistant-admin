"use client"

import { useState } from "react"
import { X, Search, Check, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Batch } from "@/lib/api"

interface BatchSelectionModalProps {
  open: boolean
  onClose: () => void
  batches: Batch[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function BatchSelectionModal({
  open,
  onClose,
  batches,
  selectedIds,
  onToggle
}: BatchSelectionModalProps) {
  const [search, setSearch] = useState("")
  
  const filtered = batches
    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.name.localeCompare(a.name))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-sm border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-tight">
            <Users className="h-3.5 w-3.5 text-primary" /> Select Batches
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batches…"
              className="w-full rounded-sm border bg-muted/20 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const allFilteredIds = filtered.map(b => b.id)
                allFilteredIds.forEach(id => {
                  if (!selectedIds.includes(id)) onToggle(id)
                })
              }}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Select All Filtered
            </button>
            <span className="text-[10px] text-muted-foreground">|</span>
            <button
              type="button"
              onClick={() => {
                selectedIds.forEach(id => onToggle(id))
              }}
              className="text-[10px] font-bold text-red-500 hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-1.5 content-start">
          {filtered.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-[11px] text-muted-foreground italic">
              No batches found
            </div>
          ) : (
            filtered.map((b) => {
              const isSelected = selectedIds.includes(b.id)
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onToggle(b.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-1.5 rounded-sm text-[11px] font-bold transition-all border",
                    isSelected
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  <span className="truncate">{b.name}</span>
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              )
            })
          )}
        </div>

        <div className="p-3 border-t bg-muted/5 flex items-center justify-between gap-3">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {selectedIds.length} Selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm bg-primary px-4 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
