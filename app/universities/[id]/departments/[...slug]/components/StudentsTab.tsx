"use client"

import { useState, useEffect, useCallback, useDeferredValue } from "react"
import { api, Student, Batch, Session, getApiKey, getApiUrl } from "@/lib/api"
import { Avatar, Badge, ConfirmDelete, selectCls, inputCls, Modal } from "./SharedUI"
import { StudentModal } from "./StudentModal"
import { Users, Plus, Pencil, Trash2, Mail, Phone, ExternalLink, Search, Copy, Share2, RefreshCcw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentsTabProps {
  batches: Batch[]
  departmentId: string
  universityId: string
  onBatchesRefresh: () => void
}

export function StudentsTab({ batches, departmentId, universityId, onBatchesRefresh }: StudentsTabProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterBatch, setFilterBatch] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState<Student | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  
  const deferredSearch = useDeferredValue(search)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  // ELITE: Server-side search & pagination implementation
  const loadData = useCallback(async () => {
    setLoading(true)
    try { 
      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      const queryParams = new URLSearchParams({
        department_id: departmentId,
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
        ...(deferredSearch && { search: deferredSearch }),
        ...(filterBatch && { batch_id: filterBatch })
      })

      // We use a raw fetch or update api.ts to support full response
      // For now, let's assume api.students.getAll is updated or we use fetchWithAuth
      const response = await fetch(`${getApiUrl()}/students?${queryParams.toString()}`, {
        headers: {
          'X-API-Key': getApiKey(),
        }
      })
      const result = await response.json()
      
      setStudents(result.data || [])
      setTotalCount(result.count || 0)

      // Only load sessions once if needed
      if (sessions.length === 0) {
        const sessData = await api.sessions.getAllByUniversity(universityId)
        setSessions(sessData)
      }
    }
    catch (err) { 
      console.error("Error loading students:", err)
      setStudents([]) 
    }
    finally { setLoading(false) }
  }, [departmentId, universityId, currentPage, deferredSearch, filterBatch])

  useEffect(() => { loadData() }, [loadData])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try { 
      await api.students.delete(deleting.id)
      loadData() 
      setToast("Student removed successfully")
    }
    catch (err: any) { 
      alert(err.message)
    } finally { 
      setDeleteLoading(false) 
      setDeleting(null) 
    }
  }

  const handleCopyCode = (s: Student) => {
    const batchName = batches.find(b => b.id === s.batch_id)?.name || "N/A"
    const msg = `🎓 *Campus Assistant Student Profile*\n----------------------------------\nName: ${s.name}\nBatch: ${batchName}\nStudent ID: ${s.student_id}\nVerification Code: ${s.verification_code}\n\n🚀 *How to verify:*\n1. Download App: https://play.google.com/store/apps/details?id=com.sofolit.campusassistant\n2. Create a new account\n3. Provide the code above & verify your profile.`
    navigator.clipboard.writeText(msg)
    setToast("Verification details copied!")
  }

  return (
    <div className="animate-in fade-in duration-500">
      <StudentModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditing(null) }}
        universityId={universityId} 
        departmentId={departmentId} 
        currentBatchId={filterBatch || undefined}
        student={editing} 
        onSuccess={loadData} 
      />

      <StudentPreviewModal 
        student={previewStudent} 
        onClose={() => setPreviewStudent(null)} 
        batches={batches}
        sessions={sessions}
      />

      <ConfirmDelete 
        open={!!deleting} 
        label={`student "${deleting?.name}"`} 
        onClose={() => setDeleting(null)} 
        onConfirm={handleDelete} 
        loading={deleteLoading} 
      />

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Department Students</h3>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Registry Management</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <input 
              type="text" 
              placeholder="Search by name, ID, or email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={cn(inputCls, "pl-10 w-full h-11 font-medium")}
            />
          </div>
          <button 
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md h-11 shrink-0 active:scale-95"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Student</span>
          </button>
        </div>
      </div>

      {/* Batch Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 mb-2">
        <button 
          onClick={() => { setFilterBatch(null); setCurrentPage(1); }}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black transition-all border shrink-0 uppercase tracking-tighter",
            !filterBatch ? "bg-primary text-white border-primary shadow-md" : "bg-card text-muted-foreground hover:bg-muted border-border"
          )}
        >
          All Students
          <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] leading-none", !filterBatch ? "bg-white/20" : "bg-muted-foreground/10")}>
            {totalCount}
          </span>
        </button>
        {batches.map((b) => (
          <button 
            key={b.id}
            onClick={() => { setFilterBatch(b.id); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black transition-all border shrink-0 whitespace-nowrap uppercase tracking-tighter",
              filterBatch === b.id ? "bg-primary text-white border-primary shadow-md" : "bg-card text-muted-foreground hover:bg-muted border-border"
            )}
          >
            {b.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 rounded-sm border bg-card animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-sm border-2 border-dashed bg-muted/10 border-border/60">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-bold text-muted-foreground">{search ? "No matching students found" : "No students in this department registry"}</p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-4 text-xs font-bold text-primary hover:underline uppercase tracking-widest">Clear Search</button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => {
              const batchName = batches.find(b => b.id === s.batch_id)?.name || "N/A"
              const sessionName = sessions.find(sess => sess.id === s.session_id)?.name || "N/A"
              return (
                <div key={s.id} className="relative rounded-sm border p-4 bg-card hover:shadow-lg transition-all group overflow-hidden border-border/60 hover:border-primary/40">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button onClick={() => setPreviewStudent(s)} className="hover:scale-105 transition-transform">
                        <Avatar name={s.name} size="md" imageUrl={s.user?.image_url} />
                      </button>
                      <div className="min-w-0">
                        <p className="font-black truncate text-sm tracking-tight">{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-muted-foreground font-bold font-mono bg-muted/50 px-1.5 rounded-xs tracking-tighter">ID: {s.student_id}</p>
                          <div className="h-2.5 w-[1px] bg-muted-foreground/30"></div>
                          <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">{sessionName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => { setEditing(s); setModalOpen(true) }} 
                        className="p-2 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-all shadow-sm" 
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleting(s)} 
                        className="p-2 rounded-sm border bg-background hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-all shadow-sm" 
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 bg-primary/5 border border-primary/10 rounded-sm px-2 py-0.5">
                       <p className="text-[9px] font-black text-primary uppercase tracking-tighter">{batchName}</p>
                    </div>
                    <Badge variant={s.is_regular ? "success" : "warn"} className="text-[9px] px-2 py-0.5 leading-tight font-black uppercase">
                      {s.is_regular ? "Regular" : "Irregular"}
                    </Badge>
                    {s.blood_group && (
                      <Badge variant="danger" className="text-[9px] px-2 py-0.5 leading-tight font-black">{s.blood_group}</Badge>
                    )}
                  </div>

                  <div className="pt-4 border-t border-dashed border-border flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5">Verification Code</p>
                      <div className="flex items-center gap-2">
                        <code className={cn(
                          "text-[14px] font-black tracking-[0.2em]",
                          s.is_claimed ? "text-muted-foreground/40 line-through" : "text-primary drop-shadow-sm"
                        )}>
                          {s.verification_code || "------"}
                        </code>
                        {s.is_claimed && (
                          <div className="h-4 w-4 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center" title="Verified">
                             <RefreshCcw className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCopyCode(s)}
                        className="p-2.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm group/btn"
                        title="Copy Details"
                      >
                        <Copy className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-dashed pt-6 mt-8 gap-4">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Showing <span className="font-black text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-black text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-black text-foreground">{totalCount}</span>
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  className="px-6 py-2.5 rounded-sm border bg-card hover:bg-muted text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all shadow-sm active:scale-95"
                >
                  Previous
                </button>
                <div className="px-4 py-2.5 rounded-sm bg-primary/5 text-[10px] font-black border border-primary/20 text-primary">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2.5 rounded-sm border bg-card hover:bg-muted text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all shadow-sm active:scale-95"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-primary text-primary-foreground px-8 py-4 rounded-sm shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4 border-l-4 border-primary-foreground/30">
            <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

function StudentPreviewModal({ student, onClose, batches, sessions }: { student: Student | null; onClose: () => void; batches: Batch[]; sessions: Session[] }) {
  const [zoom, setZoom] = useState(false)
  if (!student) return null

  const batchName = batches.find(b => b.id === student.batch_id)?.name || "Unknown Batch"
  const sessionName = sessions.find(s => s.id === student.session_id)?.name || "Unknown Session"

  return (
    <Modal open={!!student} onClose={() => { setZoom(false); onClose() }} title="Profile Identity">
      <div className="flex flex-col items-center">
        <div 
          onClick={() => setZoom(!zoom)}
          className={cn(
            "relative overflow-hidden group transition-all duration-500 shadow-2xl border-4 border-white cursor-zoom-in rounded-xl",
            zoom ? "w-full aspect-square" : "h-44 w-44 mb-8"
          )}
        >
          {student.user?.image_url ? (
            <img src={student.user?.image_url} alt={student.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary text-5xl font-black italic">
              {student.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
            </div>
          )}
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest pointer-events-none backdrop-blur-xs">
            {zoom ? "Click to close" : "Click to view"}
          </div>
        </div>

        {!zoom && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 leading-none">Registered Student</p>
              <h2 className="text-3xl font-black tracking-tight leading-none">{student.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                {student.is_cr && (
                  <Badge variant="info" className="bg-primary text-white border-0 font-black uppercase text-[9px] tracking-tighter">Class Representative</Badge>
                )}
                <Badge variant={student.is_regular ? "success" : "warn"} className="font-black uppercase text-[9px] tracking-tighter">{student.is_regular ? "Regular" : "Irregular"}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Batch", value: batchName },
                { label: "Session", value: sessionName },
                { label: "Student ID", value: student.student_id }
              ].map(item => (
                <div key={item.label} className="rounded-lg border bg-muted/20 p-3 text-center">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-xs font-black truncate tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-muted/20 p-4 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Blood Group</p>
                <p className="text-2xl font-black text-red-500 tracking-tighter">{student.blood_group || "--"}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Status</p>
                <Badge variant={student.is_claimed ? "success" : "default"} className="font-black uppercase tracking-tighter">
                  {student.is_claimed ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {student.email && (
                <div className="rounded-xl border p-4 bg-primary/5 border-primary/20 flex items-center justify-between group/row hover:bg-primary/10 transition-colors">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Institutional Email</p>
                    <p className="text-sm font-bold truncate tracking-tight">{student.email}</p>
                  </div>
                  <a href={`mailto:${student.email}`} className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shrink-0">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              )}
            </div>

            <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-[0.3em] pt-4 opacity-40">
              ID Registry: {student.id.slice(0, 8)}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
