"use client"

import { useState } from "react"
import { Search, Plus, MapPin, ExternalLink, MoreVertical, Loader2, Pencil, Trash2, X, Building2 } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { api, University } from "@/lib/api"
import { ConfirmDelete } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

interface UniversitiesClientProps {
  initialUniversities: University[]
}

export default function UniversitiesClient({ initialUniversities }: UniversitiesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<University | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setIsSearching(true)
    const params = new URLSearchParams(searchParams.toString())
    if (term) params.set("search", term)
    else params.delete("search")
    router.push(`${pathname}?${params.toString()}`)
    setTimeout(() => setIsSearching(false), 300)
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await api.universities.delete(deleting.id)
      setDeleting(null)
      router.refresh() // Refresh server component data
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Universities</h1>
          <p className="text-muted-foreground">Manage and explore partner universities with server-optimized architecture.</p>
        </div>
        <Link href="/universities/add" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all active:scale-95 shadow-sm whitespace-nowrap flex-shrink-0">
          <Plus className="h-4 w-4" />
          Add University
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, acronym or address..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
          />
          {searchTerm && (
            <button 
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isSearching && <Loader2 className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {initialUniversities.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-muted/20">
          <Building2 className="h-10 w-10 opacity-20 mb-3" />
          <p className="font-medium">No universities found.</p>
          <button onClick={() => router.refresh()} className="mt-2 text-primary hover:underline text-sm font-semibold">Try refreshing</button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initialUniversities.map((uni) => (
            <div 
              key={uni.id} 
              className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              {/* Context Menu Button */}
              <div className="absolute top-3 right-3 z-10">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveMenu(activeMenu === uni.id ? null : uni.id);
                  }}
                  className="rounded-full bg-white/90 p-1.5 text-slate-900 shadow-sm hover:bg-white border transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {activeMenu === uni.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setActiveMenu(null)} 
                    />
                    <div 
                      className="absolute right-0 top-10 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <button 
                        onClick={() => { setActiveMenu(null); router.push(`/universities/${uni.id}/edit`); }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                      </button>
                      <button 
                        onClick={() => { setActiveMenu(null); setDeleting(uni); }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              <Link href={`/universities/${uni.id}`} className="flex-1 flex flex-col">
                <div className="relative h-44 w-full overflow-hidden bg-muted/30 border-b">
                  {uni.logo_url ? (
                    <img 
                      src={uni.logo_url} 
                      alt={uni.name} 
                      className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-primary/5">
                      <Building2 className="h-12 w-12 opacity-10" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors tracking-tight line-clamp-1">{uni.name}</h3>
                      <span className="mt-1 inline-flex rounded bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary tracking-wider">
                        {uni.acronym}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary/60" />
                    <span className="line-clamp-2 leading-relaxed">{uni.address || 'No address provided'}</span>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Established</p>
                        <p className="text-sm font-bold mt-0.5">{uni.established_year || 'N/A'}</p>
                      </div>
                      <div>
                         <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Depts</p>
                         <p className="text-sm font-bold mt-0.5">{uni.departments?.length || 0}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      EXPLORE <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <ConfirmDelete 
        open={!!deleting} 
        label={`university "${deleting?.name}"`}
        onClose={() => setDeleting(null)} 
        onConfirm={handleDelete} 
        loading={deleteLoading}
      />
    </div>
  )
}
