"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import * as Icons from "lucide-react"
import { Layers, Plus, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react"
import { api, LostFoundCategory } from "@/lib/api"
import { ConfirmDelete } from "../../universities/[id]/departments/[...slug]/components/SharedUI"

export function CategoriesClient() {
  const [categories, setCategories] = useState<LostFoundCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    api.lostFoundCategories.getAll()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.lostFoundCategories.delete(deleteId)
      setCategories(prev => prev.filter(c => c.id !== deleteId))
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`)
    }
    setDeleteLoading(false)
    setDeleteId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const sorted = [...categories].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sorted.length} categor{ sorted.length === 1 ? 'y' : 'ies' }
        </p>
        <Link
          href="/lost-and-found/categories/add"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Layers className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-bold">No categories yet</p>
          <p className="text-sm">Create your first Lost &amp; Found category.</p>
          <Link
            href="/lost-and-found/categories/add"
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Create First Category
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map(cat => {
            const Icon = (Icons as unknown as Record<string, React.ElementType>)[cat.icon_key] || Icons.Package
            return (
              <div
                key={cat.id}
                className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
                  <Icon className="h-10 w-10 text-primary/70" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate">{cat.name}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Index: {cat.index ?? 0}
                  </p>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
                      className="rounded-full bg-background/80 p-2 shadow-sm hover:bg-background cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === cat.id && (
                      <div className="absolute right-0 top-10 z-10 w-36 rounded-md border bg-card shadow-lg">
                        <Link
                          href={`/lost-and-found/categories/edit/${cat.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                        <button
                          onClick={() => { setDeleteId(cat.id); setMenuOpen(null) }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <Link
            href="/lost-and-found/categories/add"
            className="flex items-center justify-center rounded-xl border-2 border-dashed bg-card p-8 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors min-h-[200px]"
          >
            <div className="text-center">
              <Plus className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm font-bold">Add Category</p>
            </div>
          </Link>
        </div>
      )}

      <ConfirmDelete
        open={!!deleteId}
        label="category"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
