"use client"

import { useState } from "react"
import { 
  Search, Plus, MoreVertical, Loader2, Pencil, Trash2, X, Phone,
  ShieldAlert, Mail, MapPin, BadgeCheck, Globe, Building2, GraduationCap
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { api, EmergencyContact } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ConfirmDelete } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { ContactModal } from "@/app/universities/[id]/departments/[...slug]/components/ContactModal"

interface ContactsClientProps {
  initialContacts: EmergencyContact[]
}

export default function ContactsClient({ initialContacts }: ContactsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<EmergencyContact | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)

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
      await api.emergencyContacts.delete(deleting.id)
      setDeleting(null)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Group contacts by category
  const grouped = initialContacts.reduce<Record<string, EmergencyContact[]>>((acc, c) => {
    const cat = c.category || "General"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Contacts</h1>
          <p className="text-muted-foreground">Manage platform-wide helplines and administrative contacts.</p>
        </div>
        <button 
          onClick={() => {
            setEditingContact(null)
            setModalOpen(true)
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all active:scale-95 w-max whitespace-nowrap flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
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
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
          {["All", "National", "University", "Department"].map((scope) => {
            const isAct = (searchParams.get("target_scope") || "All") === scope
            return (
              <button
                key={scope}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  if (scope === "All") params.delete("target_scope")
                  else params.set("target_scope", scope)
                  router.push(`${pathname}?${params.toString()}`)
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                  isAct ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted text-muted-foreground"
                )}
              >
                {scope}
              </button>
            )
          })}
        </div>
      </div>

      {!initialContacts.length ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-muted/20">
          <Phone className="h-10 w-10 opacity-20 mb-3" />
          <p className="font-bold tracking-tight">No contacts found.</p>
          <p className="text-xs">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">{category}</h2>
                <div className="h-px w-full bg-border opacity-50" />
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                  >
                    <div className="absolute top-2 right-2 z-10">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === contact.id ? null : contact.id)}
                        className="rounded-full p-1.5 hover:bg-accent border border-transparent hover:border-border transition-all"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {activeMenu === contact.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-0 top-8 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                            <button 
                              onClick={() => { 
                                setActiveMenu(null)
                                setEditingContact(contact)
                                setModalOpen(true)
                              }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-bold hover:bg-accent transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                            </button>
                            <button 
                              onClick={() => { setActiveMenu(null); setDeleting(contact); }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-start gap-3 mb-3 pr-6">
                      <div className="h-10 w-10 rounded-full border bg-muted/10 flex items-center justify-center overflow-hidden shrink-0">
                        {contact.logo_url ? (
                          <img src={contact.logo_url} alt={contact.title} className="h-full w-full object-cover" />
                        ) : (
                          <ShieldAlert className="h-5 w-5 text-red-500/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{contact.title}</h3>
                        <div className="flex items-center gap-2">

                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mt-1 line-clamp-1">{contact.designation || "Support Personnel"}</p>
                                {contact.is_verified && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </div>
                        )}
                        </div>
                       
                  
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 pt-3 border-t border-dashed">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Phone Number</span>
                        <a href={`tel:${contact.phone}`} className="text-sm font-black text-primary hover:underline underline-offset-4 flex items-center gap-1.5 tracking-tight">
                          <Phone className="h-3.5 w-3.5" /> {contact.phone}
                        </a>
                      </div>

                      {contact.email && (
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Email Address</span>
                          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                            <Mail className="h-3.5 w-3.5" /> {contact.email}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        <span className={cn(
                          "px-1.5 py-[1px] rounded bg-muted text-[9px] font-bold uppercase tracking-tighter",
                          contact.target_scope === "National" && "bg-blue-100 text-blue-700",
                          contact.target_scope === "University" && "bg-purple-100 text-purple-700",
                          contact.target_scope === "Department" && "bg-orange-100 text-orange-700"
                        )}>
                          {contact.target_scope}
                        </span>
                        {contact.targets && contact.targets.length > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                            {contact.target_scope === "University" ? <Building2 className="h-2.5 w-2.5" /> : <GraduationCap className="h-2.5 w-2.5" />}
                            {contact.targets.length} Target{contact.targets.length > 1 ? 's' : ''}
                          </span>
                          
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDelete 
        open={!!deleting} 
        label={`contact "${deleting?.title}"`}
        onClose={() => setDeleting(null)} 
        onConfirm={handleDelete} 
        loading={deleteLoading}
      />

      <ContactModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contact={editingContact}
        universityId=""
        departmentId=""
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
