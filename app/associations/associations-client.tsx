"use client"

import { useState } from "react"
import {
  Plus,
  Landmark,
  MoreVertical,
  Trash2,
  Pencil,
  Calendar,
  Heart,
  Clock,
  BadgeCheck,
} from "lucide-react"
import Link from "next/link"
import { api, Association, getFullImageUrl } from "@/lib/api"
import { ConfirmDelete } from "../universities/[id]/departments/[...slug]/components/SharedUI"

interface AssociationsClientProps {
  initialAssociations: Association[]
}

type FilterTab = "all" | "active" | "pending"

export default function AssociationsClient({ initialAssociations }: AssociationsClientProps) {
  const [associations, setAssociations] = useState<Association[]>(initialAssociations)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filter, setFilter] = useState<FilterTab>("all")

  const pendingCount = associations.filter(a => !a.is_active).length
  const visibleAssociations = associations.filter(a => {
    if (filter === "active") return a.is_active
    if (filter === "pending") return !a.is_active
    return true
  })

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.associations.delete(deleteId)
      setAssociations(prev => prev.filter(a => a.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert("Failed to delete association")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associations</h1>
          <p className="text-muted-foreground text-sm">Manage the regional student association directory shown in the app.</p>
        </div>
        <Link
          href="/associations/add"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all active:scale-95 w-max whitespace-nowrap flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Association
        </Link>
      </div>

      {associations.length > 0 && (
        <div className="flex items-center gap-1.5 border-b">
          {([
            ["all", "All"],
            ["active", "Active"],
            ["pending", "Pending"],
          ] as [FilterTab, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${
                filter === value
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {value === "pending" && pendingCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {visibleAssociations.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Landmark className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No associations found</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">
            Create the first district or sub-district association.
          </p>
          <Link href="/associations/add" className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4" /> Create First Association
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleAssociations.map((association) => (
            <div key={association.id} className="group overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60">
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                {association.banner_url ? (
                  <img
                    src={getFullImageUrl(association.banner_url)}
                    alt={association.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center opacity-20">
                    <Landmark className="h-10 w-10" />
                  </div>
                )}

                {association.logo_url && (
                  <div className="absolute bottom-2 left-2 h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm bg-white">
                    <img src={getFullImageUrl(association.logo_url)} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {!association.is_active && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow-sm">
                      <Clock className="h-2.5 w-2.5" /> Pending
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm ${
                    association.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                  }`}>
                    {association.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm h-10 line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={association.name}>
                      {association.name}
                      {association.is_verified && (
                        <BadgeCheck className="ml-1 inline h-3.5 w-3.5 text-blue-500 align-text-top" />
                      )}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                        {association.association_type === "sub_district"
                          ? `${association.sub_district_name}, ${association.district_name}`
                          : association.district_name}
                        {association.category ? ` · ${association.category}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === association.id ? null : association.id)}
                      className="rounded-full p-1.5 hover:bg-accent transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {activeMenu === association.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 top-8 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                          <Link
                            href={`/associations/edit/${association.id}`}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold hover:bg-accent transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>
                          <button
                            onClick={() => { setDeleteId(association.id); setActiveMenu(null) }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-dashed pt-3 border-border/60">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                    <Calendar className="h-3 w-3" />
                    <span>{association.founded_year || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                    <Heart className="h-3 w-3" />
                    <span>{association.followers_count ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/associations/add"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted p-6 text-muted-foreground hover:border-primary hover:text-primary transition-all bg-muted/5 hover:bg-primary/5 group"
          >
            <div className="rounded-full bg-muted p-2.5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Association</span>
          </Link>
        </div>
      )}

      <ConfirmDelete
        open={!!deleteId}
        label="association"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
