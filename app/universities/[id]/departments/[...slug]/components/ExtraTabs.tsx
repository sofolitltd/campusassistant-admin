"use client"

import { useState } from "react"
import { CR, Banner, EmergencyContact, api, getFullImageUrl } from "@/lib/api"
import { Avatar, Badge, EmptyState, ConfirmDelete } from "./SharedUI"
import { 
  GraduationCap, Phone, Mail, ExternalLink, CalendarDays, 
  Megaphone, ImageIcon, ShieldAlert, BadgeCheck, Plus, Edit2, Trash2,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { BannerModal } from "./BannerModal"
import { ContactModal } from "./ContactModal"

export function CRsTab({ crs }: { crs: CR[] }) {
  if (!crs.length) return <EmptyState icon={GraduationCap} label="class representatives" />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...crs].sort((a, b) => (b.is_current ? 1 : 0) - (a.is_current ? 1 : 0)).map((cr) => (
        <div key={cr.id} className="rounded-sm border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start gap-3 mb-3">
            <Avatar name={cr.name} imageUrl={cr.image_url} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold truncate">{cr.name}</p>
                {cr.is_current && <Badge variant="success">Current</Badge>}
              </div>
              <p className="text-xs text-muted-foreground font-mono">ID: {cr.student_id}</p>
              <p className="text-xs text-muted-foreground">Batch: {cr.batch || "—"}</p>
            </div>
          </div>
          <div className="border-t pt-3 space-y-1.5">
            {cr.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" />{cr.phone}</p>}
            {cr.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" />{cr.email}</p>}
            {cr.fb && <a href={cr.fb} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Facebook</a>}
            {(cr.term_start || cr.term_end) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {cr.term_start ? new Date(cr.term_start).getFullYear() : "?"} – {cr.term_end ? new Date(cr.term_end).getFullYear() : "Present"}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function BannersTab({ banners, universityId, departmentId, onRefresh }: { banners: Banner[]; universityId: string; departmentId: string; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Banner | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!selected) return
    setLoading(true)
    try {
      await api.banners.delete(selected.id)
      onRefresh()
      setDeleteOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Department Banners</h3>
          <p className="text-xs text-muted-foreground">Promotional images shown on the mobile app home screen.</p>
        </div>
        <Link 
          href={`/universities/${universityId}/departments/${departmentId}/banners/add`}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </Link>
      </div>

      {!banners.length ? (
        <EmptyState icon={Megaphone} label="banners" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {[...banners].sort((a, b) => b.priority - a.priority).map((b) => (
            <div key={b.id} className="group rounded-sm border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all relative">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Link 
                  href={`/universities/${universityId}/departments/${departmentId}/banners/edit/${b.id}`}
                  className="p-1.5 bg-background/80 backdrop-blur-sm border rounded-sm hover:bg-background text-primary transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Link>
                <button onClick={() => { setSelected(b); setDeleteOpen(true) }} className="p-1.5 bg-background/80 backdrop-blur-sm border rounded-sm hover:bg-background text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>

              {b.image_url ? (
                <div className="aspect-[21/9] w-full overflow-hidden border-b bg-muted/20">
                  <img src={getFullImageUrl(b.image_url)} alt={b.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              ) : (
                <div className="aspect-[21/9] w-full bg-muted/20 flex items-center justify-center border-b"><ImageIcon className="h-10 w-10 text-muted-foreground/30" /></div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold truncate" title={b.title}>{b.title}</p>
                  <Badge variant={b.is_active ? "success" : "default"}>{b.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge variant="info" className="lowercase">{b.target_scope}</Badge>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border px-1.5 py-0.5 rounded-sm">Prio: {b.priority}</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                    {new Date(b.start_at).toLocaleDateString()} – {new Date(b.end_at).toLocaleDateString()}
                  </p>
                  {b.click_url && (
                    <a href={b.click_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1 uppercase tracking-widest">
                      <ExternalLink className="h-3 w-3" /> Link
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BannerModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        banner={selected}
        universityId={universityId}
        departmentId={departmentId}
        onSuccess={onRefresh}
      />

      <ConfirmDelete 
        open={deleteOpen}
        label="banner"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  )
}

export function ContactsTab({ contacts, universityId, departmentId, onRefresh }: { contacts: EmergencyContact[]; universityId: string; departmentId: string; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<EmergencyContact | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const grouped = contacts.reduce<Record<string, EmergencyContact[]>>((acc, c) => {
    const cat = c.category || "Other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  async function handleDelete() {
    if (!selected) return
    setLoading(true)
    try {
      await api.emergencyContacts.delete(selected.id)
      onRefresh()
      setDeleteOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Emergency Contacts</h3>
          <p className="text-xs text-muted-foreground">Crucial helpline numbers and contact details for students.</p>
        </div>
        <button 
          onClick={() => { setSelected(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Contact
        </button>
      </div>

      {!contacts.length ? (
        <EmptyState icon={Phone} label="emergency contacts" />
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-4 mb-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">{cat}</h4>
                <div className="h-px w-full bg-border opacity-50" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <div key={c.id} className="group rounded-sm border bg-card p-5 shadow-sm hover:shadow-md transition-all relative">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => { setSelected(c); setModalOpen(true) }} className="p-1.5 bg-background border rounded-sm hover:bg-muted text-primary transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setSelected(c); setDeleteOpen(true) }} className="p-1.5 bg-background border rounded-sm hover:bg-muted text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      {c.logo_url ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted/10 shrink-0">
                          <img src={c.logo_url} alt={c.title} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800">
                          <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-base">{c.title}</p>
                        {c.designation && <p className="text-xs text-muted-foreground font-medium">{c.designation}</p>}
                        {c.is_verified && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 mt-1 uppercase tracking-wider">
                            <BadgeCheck className="h-3 w-3" /> Verified Source
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Phone Number</span>
                        <a href={`tel:${c.phone}`} className="text-lg font-black text-primary flex items-center gap-2 hover:underline decoration-2 underline-offset-4 tracking-tight">
                          <Phone className="h-4 w-4" /> {c.phone}
                        </a>
                      </div>

                      {c.email && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Email Address</span>
                          <p className="text-xs font-medium flex items-center gap-2 text-muted-foreground truncate"><Mail className="h-3 w-3" /> {c.email}</p>
                        </div>
                      )}
                      
                      {c.description && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">"{c.description}"</p>
                      )}

                      <div className="pt-1 flex items-center gap-2">
                        <Badge variant="info" className="text-[9px] px-1.5 py-0">{c.target_scope}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ContactModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        contact={selected}
        universityId={universityId}
        departmentId={departmentId}
        onSuccess={onRefresh}
      />

      <ConfirmDelete 
        open={deleteOpen}
        label="emergency contact"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  )
}
