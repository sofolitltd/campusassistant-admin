"use client"

import { useState } from "react"
import { 
  Plus, 
  Image as ImageIcon, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  Pencil,
  Eye,
  Calendar,
  Globe
} from "lucide-react"
import Link from "next/link"
import { api, Banner, getFullImageUrl, getApiKey, getApiUrl } from "@/lib/api"
import { ConfirmDelete } from "../universities/[id]/departments/[...slug]/components/SharedUI"

interface BannersClientProps {
  initialBanners: Banner[]
}

export default function BannersClient({ initialBanners }: BannersClientProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    const bannerToDelete = banners.find(b => b.id === deleteId)
    
    try {
      await api.banners.delete(deleteId)
      if (bannerToDelete?.image_url) {
        try {
          fetch(`${getApiUrl()}/upload?url=${bannerToDelete.image_url}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': getApiKey() },
          })
        } catch (imgErr) {
          console.error("Failed to delete image from storage:", imgErr)
        }
      }
      setBanners(prev => prev.filter(b => b.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert("Failed to delete banner")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">National Banners</h1>
          <p className="text-muted-foreground text-sm">Manage platform-wide marketing banners.</p>
        </div>
        <Link 
          href="/banners/add" 
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all active:scale-95 w-max whitespace-nowrap flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No banners found</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">
            Start by creating a global banner for the mobile app home screen.
          </p>
          <Link href="/banners/add" className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4" /> Create First Banner
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {banners.map((banner) => (
            <div key={banner.id} className="group overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60">
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                {banner.image_url ? (
                  <img 
                    src={getFullImageUrl(banner.image_url)} 
                    alt={banner.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center opacity-20">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm ${
                    banner.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                  }`}>
                    {banner.is_active ? "Active" : "Draft"}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm h-10 line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={banner.title}>
                      {banner.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{banner.target_scope}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === banner.id ? null : banner.id)}
                      className="rounded-full p-1.5 hover:bg-accent transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {activeMenu === banner.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 top-8 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                          <Link 
                            href={`/banners/edit/${banner.id}`}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold hover:bg-accent transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>
                          <button 
                            onClick={() => {
                              setDeleteId(banner.id)
                              setActiveMenu(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-dashed pt-3 border-border/60">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-muted-foreground font-bold">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(banner.start_at).toLocaleDateString()} – {new Date(banner.end_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                      <Eye className="h-3 w-3" />
                      <span>Prio: {banner.priority}</span>
                    </div>
                    {banner.click_url && (
                      <a 
                        href={banner.click_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase tracking-tight"
                      >
                        Visit <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link 
            href="/banners/add"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted p-6 text-muted-foreground hover:border-primary hover:text-primary transition-all bg-muted/5 hover:bg-primary/5 group"
          >
            <div className="rounded-full bg-muted p-2.5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Banner</span>
          </Link>
        </div>
      )}

      <ConfirmDelete 
        open={!!deleteId}
        label="banner"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
