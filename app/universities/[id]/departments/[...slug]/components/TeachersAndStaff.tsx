"use client"

import { useState } from "react"
import { Teacher, Staff, api } from "@/lib/api"
import { Avatar, Badge, EmptyState, inputCls, ConfirmDelete, Modal } from "./SharedUI"
import { UserSquare2, Briefcase, Search, Plus, Pencil, Trash2, Phone, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TeacherModal } from "./TeacherModal"
import { StaffModal } from "./StaffModal"

interface TeachersTabProps {
  teachers: Teacher[]
  universityId: string
  departmentId: string
  onRefresh: () => void
}

function TeacherPreviewModal({ teacher, onClose }: { teacher: Teacher | null, onClose: () => void }) {
  if (!teacher) return null
  
  return (
    <Modal open={true} onClose={onClose} title="Teacher Details" className="max-w-md">
      <div className="flex flex-col gap-4 pb-4">
        {/* Header Card matching Flutter */}
        <div className="rounded-sm border bg-card p-4 shadow-sm flex items-start gap-4 relative">
          {teacher.user?.avatar_url ? (
            <img src={teacher.user.avatar_url} alt={teacher.name} className="h-[85px] w-[80px] rounded-sm object-cover bg-muted shrink-0 shadow-xs" />
          ) : (
            <div className="h-[85px] w-[80px] rounded-sm bg-primary/5 flex items-center justify-center shrink-0 shadow-xs border border-primary/10">
              <UserSquare2 className="h-10 w-10 text-primary/30" />
            </div>
          )}
          
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="text-[15px] font-bold leading-tight">{teacher.name}</h3>
            <p className="text-[13px] text-muted-foreground mt-1">{teacher.designation}</p>
            {teacher.phd && <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">{teacher.phd}</p>}
          </div>

          {teacher.is_chairman && (
            <div className="absolute left-4 bottom-2 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-[4px] border border-teal-200 dark:border-teal-800 shadow-xs leading-none">
              Chairman
            </div>
          )}
        </div>

        {/* Info Card matching Flutter */}
        <div className="rounded-sm border bg-card p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
            <span className="text-sm font-bold">Mobile:</span>
            <a href={`tel:${teacher.phone}`} className="text-sm text-primary hover:underline">{teacher.phone || "—"}</a>
          </div>
          
          <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
            <span className="text-sm font-bold">Email:</span>
            <a href={`mailto:${teacher.email}`} className="text-sm text-primary hover:underline break-all">{teacher.email || "—"}</a>
          </div>

          <div className="h-px bg-border my-2"></div>
          
          <div>
            <h4 className="text-sm font-bold mb-1">Publications:</h4>
            {teacher.publications ? (
              <a href={teacher.publications} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                {teacher.publications}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">No publications available.</span>
            )}
          </div>

          {teacher.interests && (
            <div className="pt-2">
              <h4 className="text-sm font-bold mb-2">Research Interests:</h4>
              <div className="flex flex-wrap gap-2">
                {teacher.interests.split(',').map((interest, i) => (
                  <span key={i} className="px-2 py-1 bg-muted rounded-sm text-[11px] font-medium border">
                    {interest.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function TeachersTab({ teachers, universityId, departmentId, onRefresh }: TeachersTabProps) {
  const [search, setSearch] = useState("")
  const [filterLeave, setFilterLeave] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [deleting, setDeleting] = useState<Teacher | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [preview, setPreview] = useState<Teacher | null>(null)

  const filtered = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
      t.designation.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filterLeave === "present") return t.is_present
    if (filterLeave === "leave") return !t.is_present
    return true
  })

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try { await api.teachers.delete(deleting.id); onRefresh() } catch {}
    finally { setDeleteLoading(false); setDeleting(null) }
  }

  return (
    <>
      {modalOpen && (
        <TeacherModal 
          open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
          universityId={universityId} departmentId={departmentId}
          teacher={editing} onSuccess={onRefresh}
        />
      )}

      <TeacherPreviewModal teacher={preview} onClose={() => setPreview(null)} />

      <ConfirmDelete 
        open={!!deleting} label={`teacher "${deleting?.name}"`}
        onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deleteLoading}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 transition-all">
        <div>
          <h3 className="text-lg font-bold">Faculty Members</h3>
          <p className="text-sm text-muted-foreground">Manage department teachers</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <select
              value={filterLeave}
              onChange={(e) => setFilterLeave(e.target.value)}
              className="appearance-none rounded-sm border bg-background pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-10 shrink-0"
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="leave">Leave</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" placeholder="Search..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputCls, "pl-10 w-full h-10")}
            />
          </div>
          <button 
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary px-3 md:px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all shadow-sm h-10 shrink-0"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Teacher</span>
          </button>
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState icon={UserSquare2} label="teachers" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => (
            <div key={t.id} className="relative rounded-sm border bg-card shadow-sm hover:shadow-md transition-all group overflow-hidden pl-3 pr-2 py-3 flex gap-4 h-[115px] cursor-pointer" onClick={() => setPreview(t)}>
              
              {/* Flutter Style Hero Image */}
              <div className="h-[85px] w-[80px] rounded-sm bg-muted overflow-hidden shrink-0 shadow-xs border relative z-0">
                {t.user?.avatar_url ? (
                  <img src={t.user.avatar_url} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary/30">
                    <UserSquare2 className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* Flutter Style Info */}
              <div className="flex-1 min-w-0 pr-1 flex flex-col pt-[2px]">
                <p className="font-bold text-[14px] leading-[1.15] line-clamp-2">{t.name}</p>
                <p className="text-[12px] text-muted-foreground mt-1 truncate max-w-[90%]">{t.designation}</p>
                {t.phd && <p className="text-[10px] text-muted-foreground/60 font-medium tracking-tight mt-[6px] line-clamp-2">{t.phd}</p>}
              </div>

              {/* Chairman Badge */}
              {t.is_chairman && (
                <div className="absolute left-[17px] bottom-[3px] bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] uppercase font-black px-[6px] py-[3px] rounded-[3px] shadow-xs leading-none z-10 pointer-events-none tracking-tight">
                  Chairman
                </div>
              )}

              {/* Action Buttons (Hover) */}
              <div className="absolute top-2 right-2 flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                <button onClick={(e) => { e.stopPropagation(); setEditing(t); setModalOpen(true); }} className="p-1 rounded-sm border bg-background/90 backdrop-blur-md hover:bg-muted text-muted-foreground hover:text-foreground shadow-xs">
                  <Pencil className="h-[10px] w-[10px]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleting(t); }} className="p-1 rounded-sm border bg-background/90 backdrop-blur-md hover:bg-red-50 text-muted-foreground hover:text-red-500 shadow-xs">
                  <Trash2 className="h-[10px] w-[10px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function StaffPreviewModal({ staff, onClose }: { staff: Staff | null, onClose: () => void }) {
  if (!staff) return null
  
  return (
    <Modal open={true} onClose={onClose} title="Staff Member Details" className="max-w-md">
      <div className="flex flex-col gap-4 pb-4">
        <div className="rounded-sm border bg-card p-4 shadow-sm flex items-start gap-4 relative">
          {staff.image_url ? (
            <img src={staff.image_url} alt={staff.name} className="h-[95px] w-[85px] rounded-sm object-cover bg-muted shrink-0 shadow-xs border" />
          ) : (
            <div className="h-[95px] w-[85px] rounded-sm bg-teal-50 flex items-center justify-center shrink-0 shadow-xs border border-teal-100">
              <Briefcase className="h-10 w-10 text-teal-200" />
            </div>
          )}
          
          <div className="flex-1 min-w-0 flex flex-col pt-1">
            <h3 className="text-[15px] font-bold leading-tight">{staff.name}</h3>
            <p className="text-[13px] text-muted-foreground mt-1">{staff.post}</p>
            {staff.serial > 0 && <p className="text-[11px] text-muted-foreground/60 mt-auto font-bold uppercase tracking-tighter">Serial: {staff.serial}</p>}
          </div>
        </div>

        <div className="rounded-sm border bg-card p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
            <span className="text-sm font-bold">Mobile:</span>
            {staff.mobile ? (
              <a href={`tel:${staff.mobile}`} className="text-sm text-primary font-bold hover:underline">{staff.mobile}</a>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <div className="pt-2 border-t mt-4">
             <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Administrative Contact</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

interface StaffTabProps {
  staff: Staff[]
  universityId: string
  departmentId: string
  onRefresh: () => void
}

export function StaffTab({ staff, universityId, departmentId, onRefresh }: StaffTabProps) {
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [deleting, setDeleting] = useState<Staff | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [preview, setPreview] = useState<Staff | null>(null)

  const filtered = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.post.toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile && s.mobile.toLowerCase().includes(search.toLowerCase()))
  ).sort((a,b) => (a.serial || 999) - (b.serial || 999))

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try { await api.staffs.delete(deleting.id); onRefresh() } catch {}
    finally { setDeleteLoading(false); setDeleting(null) }
  }

  return (
    <>
      {modalOpen && (
        <StaffModal 
          open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
          universityId={universityId} departmentId={departmentId}
          staff={editing} onSuccess={onRefresh}
        />
      )}

      <StaffPreviewModal staff={preview} onClose={() => setPreview(null)} />

      <ConfirmDelete 
        open={!!deleting} label={`staff member "${deleting?.name}"`}
        onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deleteLoading}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 transition-all">
        <div>
          <h3 className="text-lg font-bold">Staff Directory</h3>
          <p className="text-sm text-muted-foreground">Manage administrative & support staff</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" placeholder="Search..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputCls, "pl-10 w-full h-10")}
            />
          </div>
          <button 
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary px-3 md:px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all shadow-sm h-10 shrink-0"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Staff</span>
          </button>
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState icon={Briefcase} label="staff members" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="relative rounded-sm border bg-card shadow-sm hover:shadow-md transition-all group overflow-hidden pl-3 pr-2 py-3 flex gap-4 h-[120px] cursor-pointer" onClick={() => setPreview(s)}>
              
              {/* Flutter Style Hero Image (95x85) */}
              <div className="h-[95px] w-[85px] rounded-sm bg-muted overflow-hidden shrink-0 shadow-xs border relative z-0">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-teal-50 text-teal-200">
                    <Briefcase className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* Flutter Style Info */}
              <div className="flex-1 min-w-0 pr-6 flex flex-col pt-[2px]">
                <div className="flex items-start gap-1">
                  {s.serial > 0 && <span className="font-bold text-[14px] leading-[1.15]">{s.serial}.</span>}
                  <p className="font-bold text-[14px] leading-[1.15] truncate">{s.name}</p>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1 font-semibold truncate max-w-[95%]">{s.post}</p>
                {s.mobile && (
                   <div className="mt-auto mb-1">
                     <p className="text-[14px] font-black">{s.mobile}</p>
                   </div>
                )}
              </div>

              {/* In-Card Call action */}
              {s.mobile && (
                <a href={`tel:${s.mobile}`} className="absolute right-3 bottom-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors pointer-events-auto">
                  <Phone className="h-4 w-4 fill-current" />
                </a>
              )}

              {/* Action Buttons (Hover) */}
              <div className="absolute top-2 right-2 flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                <button onClick={(e) => { e.stopPropagation(); setEditing(s); setModalOpen(true); }} className="p-1 rounded-sm border bg-background/90 backdrop-blur-md hover:bg-muted text-muted-foreground hover:text-foreground shadow-xs">
                  <Pencil className="h-[10px] w-[10px]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleting(s); }} className="p-1 rounded-sm border bg-background/90 backdrop-blur-md hover:bg-red-50 text-muted-foreground hover:text-red-500 shadow-xs">
                  <Trash2 className="h-[10px] w-[10px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
