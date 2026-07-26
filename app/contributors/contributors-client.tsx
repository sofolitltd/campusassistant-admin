"use client"

import { useState } from "react"
import {
  Users,
  MoreVertical,
  Trash2,
  Pencil,
  School,
  Save,
} from "lucide-react"
import { api, Contributor, getFullImageUrl } from "@/lib/api"
import { ConfirmDelete, Modal, Field, selectCls } from "../universities/[id]/departments/[...slug]/components/SharedUI"

const CONTRIBUTOR_TIERS = ["Platinum", "Gold", "Silver", "Bronze"]

const TIER_COLORS: Record<string, string> = {
  Platinum: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  Gold: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Silver: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Bronze: "bg-orange-700/10 text-orange-700 border-orange-700/20",
}

interface ContributorsClientProps {
  initialContributors: Contributor[]
}

export default function ContributorsClient({ initialContributors }: ContributorsClientProps) {
  const [contributors, setContributors] = useState<Contributor[]>(initialContributors)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editing, setEditing] = useState<Contributor | null>(null)
  const [editTier, setEditTier] = useState(CONTRIBUTOR_TIERS[0])
  const [editLoading, setEditLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openEdit(c: Contributor) {
    setEditTier(c.tier || CONTRIBUTOR_TIERS[0])
    setEditing(c)
    setActiveMenu(null)
  }

  async function handleSaveTier(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setEditLoading(true)
    try {
      const updated = await api.contributors.update(editing.id, { tier: editTier })
      setContributors(prev => prev.map(c => c.id === editing.id ? { ...c, tier: updated.tier } : c))
      setEditing(null)
    } catch {
      alert("Failed to update tier")
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.contributors.hardDelete(deleteId)
      setContributors(prev => prev.filter(c => c.id !== deleteId))
      setDeleteId(null)
    } catch {
      alert("Failed to remove contributor")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contributors</h1>
        <p className="text-muted-foreground text-sm">
          People featured on the app&apos;s Contributors page. Add new ones from a student&apos;s
          profile menu in Universities → Department → Students.
        </p>
      </div>

      {contributors.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No contributors yet</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">
            Promote a student to Contributor from their profile menu in a department&apos;s Students tab.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contributors.map((c) => (
            <div key={c.id} className="group relative overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {c.image_url ? (
                    <img
                      src={getFullImageUrl(c.image_url)}
                      alt={c.name}
                      className="h-12 w-12 rounded-full object-cover border shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      {c.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" title={c.name}>{c.name}</p>
                    <span className={`inline-block mt-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TIER_COLORS[c.tier] || "bg-muted text-muted-foreground border-border"}`}>
                      {c.tier}
                    </span>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)}
                    className="rounded-full p-1.5 hover:bg-accent transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {activeMenu === c.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 top-8 w-36 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => openEdit(c)}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold hover:bg-accent transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit Tier
                        </button>
                        <button
                          onClick={() => { setDeleteId(c.id); setActiveMenu(null) }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-start gap-1.5 border-t border-dashed pt-3 border-border/60">
                <School className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 text-[10px] text-muted-foreground leading-snug">
                  <p className="truncate font-bold">{c.department_name}</p>
                  <p className="truncate">{c.university_name}{c.session ? ` · ${c.session}` : ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Contribution Tier">
        <form onSubmit={handleSaveTier} className="p-6 space-y-4">
          <Field label="Contribution Tier" required>
            <select value={editTier} onChange={(e) => setEditTier(e.target.value)} className={selectCls}>
              {CONTRIBUTOR_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={editLoading} className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> {editLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={!!deleteId}
        label="contributor (permanent)"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
