"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, MapPin, Globe, GraduationCap, Building2, ImageIcon, Info,
  ExternalLink, Plus, Loader2, CalendarDays, MoreVertical, Pencil,
  Trash2, Save, Maximize, Share2, Layers, Calendar, Eye, Layout,
  School, Phone, Bus
} from "lucide-react"
import Link from "next/link"
import { api, University, Department, Hall, Banner, EmergencyContact, getFullImageUrl, Transport } from "@/lib/api"
import { ContactsTab } from "./departments/[...slug]/components/ExtraTabs"
import { TransportTab } from "./components/TransportTab"
import { cn } from "@/lib/utils"
import { ConfirmDelete, Modal, Field, inputCls } from "./departments/[...slug]/components/SharedUI"

type TabType = "overview" | "departments" | "halls" | "banners" | "contacts" | "transports"

interface UniversityDetailClientProps {
  university: University
  initialDepartments: Department[]
  initialHalls: Hall[]
  initialBanners: Banner[]
  initialContacts: EmergencyContact[]
  initialTransports: Transport[]
  universityId: string
}

export default function UniversityDetailClient({ 
  university, 
  initialDepartments, 
  initialHalls, 
  initialBanners,
  initialContacts,
  initialTransports,
  universityId 
}: UniversityDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize from URL or default to departments
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get("tab") as TabType) || "departments")
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [halls, setHalls] = useState<Hall[]>(initialHalls)
  const [banners, setBanners] = useState<Banner[]>(initialBanners)
  const [contacts, setContacts] = useState<EmergencyContact[]>(initialContacts)
  const [transports, setTransports] = useState<Transport[]>(initialTransports)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)
  const [deletingHall, setDeletingHall] = useState<Hall | null>(null)
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Hall states
  const [isHallModalOpen, setIsHallModalOpen] = useState(false)
  const [editingHall, setEditingHall] = useState<Hall | null>(null)
  const [hallName, setHallName] = useState("")
  const [hallLoading, setHallLoading] = useState(false)

  // Sync URL when tab changes internally
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("tab", tab)
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }, [router, searchParams])

  async function handleDeleteDept() {
    if (!deletingDept) return
    setDeleteLoading(true)
    try {
      await api.departments.delete(deletingDept.id)
      setDepartments(prev => prev.filter(d => d.id !== deletingDept.id))
      setDeletingDept(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleSaveHall(e: React.FormEvent) {
    e.preventDefault()
    setHallLoading(true)
    try {
      if (editingHall) {
        const updated = await api.halls.update(editingHall.id, { name: hallName })
        setHalls(prev => prev.map(h => h.id === editingHall.id ? updated : h))
      } else {
        const created = await api.halls.create({ name: hallName, university_id: universityId })
        setHalls(prev => [...prev, created])
      }
      setIsHallModalOpen(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setHallLoading(false)
    }
  }

  async function handleDeleteHall() {
    if (!deletingHall) return
    setDeleteLoading(true)
    try {
      await api.halls.delete(deletingHall.id)
      setHalls(prev => prev.filter(h => h.id !== deletingHall.id))
      setDeletingHall(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleDeleteBanner() {
    if (!deletingBanner) return
    setDeleteLoading(true)
    try {
      await api.banners.delete(deletingBanner.id)
      setBanners(prev => prev.filter(b => b.id !== deletingBanner.id))
      setDeletingBanner(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getHostname = (url: string) => {
    if (!url) return "No website"
    try {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`
      return new URL(formattedUrl).hostname
    } catch {
      return url
    }
  }

  const tabs = [
    { id: "departments", label: "Departments", icon: GraduationCap },
    { id: "banners", label: "Banners", icon: ImageIcon },
    { id: "contacts", label: "Contacts", icon: Phone },
    { id: "transports", label: "Transports", icon: Bus },
    { id: "halls", label: "Halls", icon: Building2 },
    { id: "overview", label: "Overview", icon: Info },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/universities" className="rounded-full border p-2 hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card p-2 shadow-sm">
              {university.logo_url ? (
                <img src={university.logo_url} alt={university.name} className="h-full w-full object-contain" />
              ) : (
                <GraduationCap className="h-8 w-8 text-muted-foreground opacity-20" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight md:text-2xl lg:text-3xl">{university.name}</h1>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-black text-primary uppercase tracking-tighter">{university.acronym}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {university.address || "No address"}</span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  <Globe className="h-3.5 w-3.5" /> 
                  <a href={university.website_url?.startsWith('http') ? university.website_url : `https://${university.website_url}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {getHostname(university.website_url)}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TabType)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-500">
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Established", value: university.established_year || "N/A", icon: CalendarDays },
                { label: "Faculties", value: university.total_faculties || "0", icon: Layers },
                { label: "Departments", value: university.total_departments || "0", icon: GraduationCap },
                { label: "Campus Area", value: university.campus_area || "N/A", icon: Maximize },
              ].map((s) => (
                <div key={s.label} className="bg-card border rounded-sm p-4 flex items-center gap-4 shadow-xs transition-all hover:shadow-md">
                  <div className="rounded-full bg-primary/5 p-2.5"><s.icon className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-bold text-sm tracking-tight">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-card border rounded-sm p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                      <span className="h-6 w-1 bg-primary rounded-full hidden sm:block" />
                      University Biography
                    </h4>
                    <Link 
                      href={`/universities/${universityId}/edit`}
                      className="flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter hover:bg-muted transition-all"
                    >
                      <Pencil className="h-3 w-3" /> Edit Profile
                    </Link>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
                    {university.about || "No detailed information available for this university yet."}
                  </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card border rounded-sm p-5 shadow-xs group">
                    <h5 className="font-bold text-sm mb-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> Campus Location
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">{university.address || "No address provided"}</p>
                    <div className="mt-4 pt-4 border-t border-dashed space-y-1">
                      <p className="text-[10px] text-muted-foreground">Coordinates</p>
                      <p className="text-xs font-mono">{university.latitude}, {university.longitude}</p>
                    </div>
                  </div>
                  <div className="bg-card border rounded-sm p-5 shadow-xs">
                    <h5 className="font-bold text-sm mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" /> Infrastructure
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Residential Halls</span>
                        <span className="font-bold">{university.total_halls || "0"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Institution Type</span>
                        <span className="font-bold">Public/Research</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar Actions */}
              <div className="space-y-6">
                <section className="bg-card border rounded-sm p-6 shadow-xs">
                  <h4 className="text-sm font-bold mb-4">Actions</h4>
                  <div className="space-y-2">
                    <Link 
                      href={`/universities/${universityId}/edit`}
                      className="w-full flex items-center justify-between p-3 rounded-sm border hover:bg-muted text-xs font-semibold transition-all"
                    >
                      Edit University <Pencil className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => {
                        navigator.share?.({
                          title: university.name,
                          text: university.about,
                          url: window.location.href
                        }).catch(() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        });
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-sm border hover:bg-muted text-xs font-semibold transition-all"
                    >
                      Share Institution <Share2 className="h-4 w-4" />
                    </button>
                    {university.website_url && (
                      <a 
                        href={university.website_url.startsWith('http') ? university.website_url : `https://${university.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between p-3 rounded-sm border hover:bg-muted text-xs font-semibold transition-all text-primary"
                      >
                        Visit Official Site <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </section>
                
                <div className="p-1 rounded-sm border border-primary/20 bg-primary/5 text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-white border p-2 mb-2 flex items-center justify-center">
                    {university.logo_url ? (
                      <img src={university.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <GraduationCap className="h-6 w-6 text-primary opacity-80" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-primary px-4 tracking-tight uppercase">{university.acronym}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "departments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Academic Departments</h3>
              <Link href={`/universities/${universityId}/departments/add`} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-sm transition-all active:scale-95">
                <Plus className="h-3.5 w-3.5" /> Add Department
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm bg-muted/20">
                  No departments found for this university.
                </div>
              ) : (
                departments.map((dept) => (
                  <Link 
                    key={dept.id} 
                    href={`/universities/${universityId}/departments/${dept.id}`}
                    className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-muted/30 border-b flex items-center justify-center">
                      {dept.logo_url ? (
                        <img src={dept.logo_url} alt={dept.name} className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <GraduationCap className="h-12 w-12 opacity-10" />
                      )}
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenu(activeMenu === dept.id ? null : dept.id);
                          }}
                          className="rounded-full bg-white/90 p-1.5 text-slate-900 shadow-sm hover:bg-white border transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {activeMenu === dept.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveMenu(null);
                              }} 
                            />
                            <div 
                              className="absolute right-0 top-10 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/universities/${universityId}/departments/${dept.id}/edit`); }}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                              </button>
                              <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenu(null); setDeletingDept(dept); }}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 tracking-tight">{dept.name}</h3>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-black text-primary whitespace-nowrap">
                          {dept.acronym}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {dept.about || 'No description provided'}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Established</p>
                            <p className="text-sm font-bold mt-0.5">{dept.established_year || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                          VIEW DETAILS <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <ConfirmDelete 
              open={!!deletingDept} 
              label={`department "${deletingDept?.name}"`}
              onClose={() => setDeletingDept(null)} 
              onConfirm={handleDeleteDept} 
              loading={deleteLoading}
            />
          </div>
        )}

        {activeTab === "halls" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Residential Halls</h3>
              <button 
                onClick={() => {
                  setEditingHall(null);
                  setHallName("");
                  setIsHallModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-sm transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> Add Hall
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {halls.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm bg-muted/20">
                  No halls listed for this university.
                </div>
              ) : (
                halls.map((hall) => (
                  <div key={hall.id} className="relative flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-primary font-black text-sm uppercase border border-primary/10">
                        {hall.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold tracking-tight">{hall.name}</span>
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenu(activeMenu === `hall-${hall.id}` ? null : `hall-${hall.id}`);
                        }}
                        className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors border border-transparent hover:border-border"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                      
                      {activeMenu === `hall-${hall.id}` && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenu(null);
                            }} 
                          />
                          <div 
                            className="absolute right-0 top-10 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <button 
                              onClick={() => {
                                setActiveMenu(null);
                                setEditingHall(hall);
                                setHallName(hall.name);
                                setIsHallModalOpen(true);
                              }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                setActiveMenu(null);
                                setDeletingHall(hall);
                              }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Modal 
              open={isHallModalOpen} 
              onClose={() => setIsHallModalOpen(false)} 
              title={editingHall ? "Edit Hall" : "Add Hall"}
            >
              <form onSubmit={handleSaveHall} className="p-6 space-y-6">
                <Field label="Hall Name" required>
                  <input
                    required
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                    placeholder="e.g. Bangabandhu Hall"
                    className={cn(inputCls, "font-bold")}
                  />
                </Field>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsHallModalOpen(false)} className="rounded-sm border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={hallLoading} className="rounded-sm bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                    {hallLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </form>
            </Modal>

            <ConfirmDelete 
              open={!!deletingHall} 
              label={`hall "${deletingHall?.name}"`}
              onClose={() => setDeletingHall(null)} 
              onConfirm={handleDeleteHall} 
              loading={deleteLoading}
            />
          </div>
        )}

        {activeTab === "banners" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">University Banners</h3>
              <Link href={`/universities/${universityId}/banners/add`} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-sm transition-all active:scale-95">
                <Plus className="h-4 w-4" /> Add Banner
              </Link>
            </div>
            
            {banners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-xl border-2 border-dashed border-border/60">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="font-bold text-muted-foreground text-sm">No banners specifically for {university.name}</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {banners.map((banner) => (
                  <div key={banner.id} className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                    <div className="relative h-40 w-full overflow-hidden bg-muted">
                      {banner.image_url ? (
                        <img 
                          src={getFullImageUrl(banner.image_url)} 
                          alt={banner.title} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center opacity-10">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase shadow-sm ${
                          banner.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                        }`}>
                          {banner.is_active ? "Active" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                            {banner.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-1.5">
                            <School className="h-3 w-3 text-orange-500" />
                            <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">{banner.target_scope}</span>
                          </div>
                        </div>

                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === banner.id ? null : banner.id)}
                            className="rounded-full p-1.5 hover:bg-accent transition-colors border border-transparent hover:border-border"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>

                          {activeMenu === banner.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                              <div className="absolute right-0 top-10 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                                <Link 
                                  href={`/banners/edit/${banner.id}`}
                                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                                </Link>
                                <button 
                                  onClick={() => {
                                    setDeletingBanner(banner)
                                    setActiveMenu(null)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 border-t pt-3 border-dashed">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-muted-foreground font-bold uppercase tracking-tighter">
                            <Calendar className="h-3 w-3" />
                            <span>Ends {new Date(banner.end_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span>{banner.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-6">
            <ContactsTab 
              contacts={contacts} 
              universityId={universityId} 
              departmentId="" // Empty for university level
              onRefresh={() => {
                api.emergencyContacts.getAll(`university_id=${universityId}&target_scope=University`).then(setContacts)
              }} 
            />
          </div>
        )}

        {activeTab === "transports" && (
          <div className="space-y-6">
            <TransportTab 
              transports={transports} 
              universityId={universityId} 
              onRefresh={() => {
                api.transports.getAllByUniversity(universityId).then(setTransports)
              }} 
            />
          </div>
        )}
      </div>

      <ConfirmDelete 
        open={!!deletingBanner} 
        label="banner"
        onClose={() => setDeletingBanner(null)} 
        onConfirm={handleDeleteBanner} 
        loading={deleteLoading}
      />
    </div>
  )
}
