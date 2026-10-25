"use client"

import { useState, useEffect, useCallback, useDeferredValue, useRef } from "react"
import { api, Student, Batch, Session, Contributor, CR, getApiUrl } from "@/lib/api"
import { Avatar, Badge, ConfirmDelete, selectCls, inputCls, Modal, ActionMenu } from "./SharedUI"
import { StudentModal } from "./StudentModal"
import { MakeCRModal, EndCRModal, isActiveCR } from "./CRModals"
import { GrantProModal, GrantProTarget } from "@/components/GrantProModal"
import { Users, Plus, Pencil, Trash2, Mail, Phone, ExternalLink, Search, Copy, Share2, RefreshCcw, Loader2, LayoutGrid, List, ChevronLeft, ChevronRight, MoreVertical, GraduationCap, Handshake, UserCheck, Send, UserMinus, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

const CONTRIBUTOR_TIERS = ["Platinum", "Gold", "Silver", "Bronze"]

interface StudentsTabProps {
  batches: Batch[]
  departmentId: string
  universityId: string
  universityName: string
  departmentName: string
  onBatchesRefresh: () => void
}

export function StudentsTab({ batches, departmentId, universityId, universityName, departmentName, onBatchesRefresh }: StudentsTabProps) {
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
  const [actionMenuStudentId, setActionMenuStudentId] = useState<string | null>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null)
  const [alumniStudent, setAlumniStudent] = useState<Student | null>(null)
  const [contributorStudent, setContributorStudent] = useState<Student | null>(null)
  const [contributorTier, setContributorTier] = useState(CONTRIBUTOR_TIERS[3])
  const [contributorLoading, setContributorLoading] = useState(false)
  const [contributorsByStudentId, setContributorsByStudentId] = useState<Record<string, Contributor>>({})
  const [removingContributor, setRemovingContributor] = useState<Contributor | null>(null)
  const [removeContributorLoading, setRemoveContributorLoading] = useState(false)
  const [activeCRs, setActiveCRs] = useState<CR[]>([])
  const [crStudent, setCrStudent] = useState<Student | null>(null)
  const [endingCR, setEndingCR] = useState<CR | null>(null)
  const [proTarget, setProTarget] = useState<GrantProTarget | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const filterScrollRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  // Rows open the preview dialog on click; a drag-to-scroll gesture must not
  // count as one. The scroll effect sets this on any horizontal drag move and
  // the row click consumes it.
  const tableMovedRef = useRef(false)
  
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
      queryParams.set('preload', 'true')

      // We use a raw fetch or update api.ts to support full response
      // For now, let's assume api.students.getAll is updated or we use fetchWithAuth
      const response = await fetch(`${getApiUrl()}/students?${queryParams.toString()}`)
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

  // Claimed/total ratio for the counter — one tiny count-only request per
  // filter change (deliberately NOT re-run on page changes; pagination can't
  // shift it, only membership mutations can, and those call it explicitly).
  const [claimedCount, setClaimedCount] = useState(0)
  const loadClaimedCount = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        department_id: departmentId,
        limit: "1",
        is_claimed: "true",
        ...(deferredSearch && { search: deferredSearch }),
        ...(filterBatch && { batch_id: filterBatch })
      })
      const response = await fetch(`${getApiUrl()}/students?${params.toString()}`)
      const result = await response.json()
      setClaimedCount(result.count || 0)
    }
    catch (err) {
      console.error("Error loading claimed count:", err)
    }
  }, [departmentId, deferredSearch, filterBatch])
  useEffect(() => { loadClaimedCount() }, [loadClaimedCount])

  const loadContributors = useCallback(async () => {
    try {
      const list = await api.contributors.getAllByDepartment(departmentId)
      const map: Record<string, Contributor> = {}
      for (const c of list) {
        if (c.student_profile_id) map[c.student_profile_id] = c
      }
      setContributorsByStudentId(map)
    } catch (err) {
      console.error("Failed to load contributors:", err)
    }
  }, [departmentId])

  useEffect(() => { loadContributors() }, [loadContributors])

  const loadCRs = useCallback(async () => {
    try {
      setActiveCRs((await api.crs.getAllByDepartment(departmentId)).filter(isActiveCR))
    } catch (err) {
      console.error("Failed to load CRs:", err)
    }
  }, [departmentId])

  useEffect(() => { loadCRs() }, [loadCRs])

  const crOf = (s: Student) => activeCRs.find(c => c.target_student_id === s.id || (!!s.user_id && c.user_id === s.user_id))

  // Drag-to-scroll for batch filters
  useEffect(() => {
    const el = filterScrollRef.current
    if (!el) return
    let isDown = false, startX = 0, scrollLeft = 0
    const onDown = (e: MouseEvent) => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = 'grabbing' }
    const onUp = () => { isDown = false; el.style.cursor = 'grab' }
    const onMove = (e: MouseEvent) => { if (!isDown) return; e.preventDefault(); el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) }
    el.addEventListener('mousedown', onDown)
    el.addEventListener('mouseup', onUp)
    el.addEventListener('mouseleave', onUp)
    el.addEventListener('mousemove', onMove)
    return () => { el.removeEventListener('mousedown', onDown); el.removeEventListener('mouseup', onUp); el.removeEventListener('mouseleave', onUp); el.removeEventListener('mousemove', onMove) }
  }, [])

  // Drag-to-scroll + wheel-to-horizontal-scroll for the students table (narrow/md screens)
  useEffect(() => {
    const el = tableScrollRef.current
    if (!el) return
    let isDown = false, startX = 0, scrollLeft = 0
    const onDown = (e: MouseEvent) => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = 'grabbing' }
    const onUp = () => { isDown = false; el.style.cursor = 'grab' }
    const onMove = (e: MouseEvent) => { if (!isDown) return; e.preventDefault(); tableMovedRef.current = true; el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) }
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('mousedown', onDown)
    el.addEventListener('mouseup', onUp)
    el.addEventListener('mouseleave', onUp)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('mouseup', onUp)
      el.removeEventListener('mouseleave', onUp)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  // Sort students: by student_id (roll)
  // "All" tab → descending (newest first), batch filter → ascending (oldest first)
  const sortedStudents = [...students].sort((a, b) =>
    filterBatch
      ? a.student_id.localeCompare(b.student_id)
      : b.student_id.localeCompare(a.student_id)
  )

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try { 
      await api.students.delete(deleting.id)
      loadData()
      loadClaimedCount()
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

  // Mints a fresh 6-digit claim code for an unclaimed student — the repair
  // path for legacy rows that have none, after which Send Mail becomes
  // available. Server 409s claimed profiles as a backstop.
  async function handleGenerateCode(s: Student) {
    try {
      await api.students.generateCode(s.id)
      loadData()
      setToast(`New claim code generated for ${s.name}`)
    }
    catch (err: any) {
      alert(err.message || "Failed to generate code")
    }
  }

  // Emails the profile-claim code to the student via the actionable mail
  // template. Only meaningful for unclaimed profiles with an email on file —
  // the menus/modals disable the action otherwise, and the server 409s an
  // already-claimed profile as a backstop.
  async function handleSendMail(s: Student) {
    try {
      await api.students.sendCodeEmail(s.id)
      setToast(`Claim code emailed to ${s.email}`)
    }
    catch (err: any) {
      alert(err.message || "Failed to send email")
    }
  }

  const handleAddToAlumni = (s: Student) => {
    setAlumniStudent(s)
  }

  const handleAddToContributor = (s: Student) => {
    setContributorTier(CONTRIBUTOR_TIERS[3])
    setContributorStudent(s)
  }

  async function handleRemoveContributor() {
    if (!removingContributor) return
    setRemoveContributorLoading(true)
    try {
      await api.contributors.hardDelete(removingContributor.id)
      setToast("Removed from contributors")
      setRemovingContributor(null)
      loadContributors()
    } catch (err: any) {
      setToast(err.message || "Failed to remove contributor")
    } finally {
      setRemoveContributorLoading(false)
    }
  }

  async function submitContributor(e: React.FormEvent) {
    e.preventDefault()
    if (!contributorStudent) return
    setContributorLoading(true)
    try {
      const sessionName = sessions.find(sess => sess.id === contributorStudent.session_id)?.name || ""
      await api.contributors.create({
        name: contributorStudent.name,
        image_url: contributorStudent.user?.avatar_url || "",
        tier: contributorTier,
        university_id: universityId,
        university_name: universityName,
        department_id: departmentId,
        department_name: departmentName,
        session: sessionName,
        student_profile_id: contributorStudent.id,
      })
      setToast("Added to contributors!")
      setContributorStudent(null)
      loadContributors()
    } catch (err: any) {
      setToast(err.message || "Failed to add to contributors")
    } finally {
      setContributorLoading(false)
    }
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
        onSuccess={() => { loadData(); loadClaimedCount() }}
      />

      <GrantProModal 
        open={!!proTarget} 
        target={proTarget} 
        onClose={() => setProTarget(null)} 
        onSuccess={() => { loadData(); setToast("Pro access granted") }} 
      />

      <StudentPreviewModal
        student={previewStudent}
        onClose={() => setPreviewStudent(null)}
        batches={batches}
        sessions={sessions}
        onToast={setToast}
        onCopyDetails={() => previewStudent && handleCopyCode(previewStudent)}
        onSendMail={() => previewStudent && handleSendMail(previewStudent)}
        onRefresh={loadData}
      />

      {alumniStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAlumniStudent(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-sm border bg-background shadow-2xl p-6">
            <h3 className="text-base font-black mb-1">Add to Alumni</h3>
            <p className="text-xs text-muted-foreground mb-4">Create alumni record from student profile.</p>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const batchName = batches.find(b => b.id === alumniStudent.batch_id)?.name || ""
              try {
                await api.alumni.create({
                  full_name: alumniStudent.name,
                  student_id: alumniStudent.student_id,
                  email: alumniStudent.email,
                  phone: alumniStudent.phone,
                  batch: batchName,
                  student_profile_id: alumniStudent.id,
                  university_id: universityId,
                  department_id: departmentId,
                  current_status: "employed",
                  organization: "",
                  designation: "",
                  location: "",
                  bio: "",
                  profile_image: "",
                  social_links: {},
                })
                setToast("Added to alumni!")
              } catch { setToast("Failed to add to alumni") }
              setAlumniStudent(null)
            }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Name</label>
                  <input className="w-full rounded-sm border bg-background px-3 py-2 text-sm" value={alumniStudent.name} disabled />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Student ID</label>
                  <input className="w-full rounded-sm border bg-background px-3 py-2 text-sm" value={alumniStudent.student_id} disabled />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</label>
                  <input className="w-full rounded-sm border bg-background px-3 py-2 text-sm" value={alumniStudent.email} disabled />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Phone</label>
                  <input className="w-full rounded-sm border bg-background px-3 py-2 text-sm" value={alumniStudent.phone} disabled />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setAlumniStudent(null)} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
                <button type="submit" className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all">Create Alumni</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contributorStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setContributorStudent(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-sm border bg-background shadow-2xl p-6">
            <h3 className="text-base font-black mb-1">Add to Contributor</h3>
            <p className="text-xs text-muted-foreground mb-4">Feature this student on the app's Contributors page.</p>
            <form onSubmit={submitContributor}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={contributorStudent.name} imageUrl={contributorStudent.user?.avatar_url} size="md" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{contributorStudent.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{departmentName} &middot; {universityName}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Contribution Tier</label>
                  <select value={contributorTier} onChange={(e) => setContributorTier(e.target.value)} className={selectCls}>
                    {CONTRIBUTOR_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setContributorStudent(null)} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
                <button type="submit" disabled={contributorLoading} className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {contributorLoading && <Loader2 className="h-4 w-4 animate-spin" />} Add Contributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDelete
        open={!!deleting}
        label={`student "${deleting?.name}"`}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {crStudent && (
        <MakeCRModal
          student={crStudent}
          batches={batches}
          activeCRs={activeCRs}
          universityId={universityId}
          departmentId={departmentId}
          onClose={() => setCrStudent(null)}
          onDone={(msg) => { setToast(msg); setCrStudent(null); loadCRs() }}
        />
      )}
      {endingCR && (
        <EndCRModal
          cr={endingCR}
          onClose={() => setEndingCR(null)}
          onDone={(msg) => { setToast(msg); setEndingCR(null); loadCRs() }}
        />
      )}

      <ConfirmDelete
        open={!!removingContributor}
        label={`"${removingContributor?.name}" from Contributors (permanent)`}
        onClose={() => setRemovingContributor(null)}
        onConfirm={handleRemoveContributor}
        loading={removeContributorLoading}
      />

      {/* Header — title and Add button share one row on every screen size */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h3 className="text-xl font-bold tracking-tight truncate">Department Students</h3>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1 truncate">Registry Management</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 rounded-sm bg-primary-gradient px-6 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md h-11 shrink-0 active:scale-95"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Student</span>
          </button>
        </div>
      </div>

      {/* Toolbar: batch tabs + search + live total, one strip */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2">
        <div className="relative group flex-1 min-w-0">
          <button
            onClick={() => filterScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div ref={filterScrollRef} className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 cursor-grab active:cursor-grabbing">
            <button
              onClick={() => { setFilterBatch(null); setCurrentPage(1); }}
              className={cn(
                "flex items-center gap-2 px-5 h-9 rounded-full text-[11px] font-black transition-all border shrink-0 uppercase tracking-tighter",
                !filterBatch ? "bg-primary-gradient text-white border-primary shadow-md" : "bg-card text-muted-foreground hover:bg-muted border-border"
              )}
            >
              All Students
            </button>
            {[...batches].sort((a, b) => {
              const numA = parseInt(a.name.match(/\d+/)?.[0] || "0")
              const numB = parseInt(b.name.match(/\d+/)?.[0] || "0")
              return numB - numA
            }).map((b) => (
              <button
                key={b.id}
                onClick={() => { setFilterBatch(b.id); setCurrentPage(1); }}
                className={cn(
                  "flex items-center gap-2 px-4 h-9 rounded-full text-[11px] font-black transition-all border shrink-0 whitespace-nowrap uppercase tracking-tighter",
                  filterBatch === b.id ? "bg-primary-gradient text-white border-primary shadow-md" : "bg-card text-muted-foreground hover:bg-muted border-border"
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => filterScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {/* Right cluster: search, claimed/total counter, view switch.
            While a fetch is in flight the counter just slots a single dash
            into its usual spot — no spinners, no shimmer, no locking. */}
        <div className="flex items-center gap-2 shrink-0 lg:pb-4">
          <div className="relative flex-1 lg:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={cn(inputCls, "pl-10 w-full h-9 font-medium text-sm")}
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-sm border bg-card text-muted-foreground text-[11px] font-black uppercase tracking-tighter shrink-0 whitespace-nowrap">
            <Users className="h-3.5 w-3.5" />
            {loading ? (
              <span className="opacity-40">-</span>
            ) : (
              <span>{claimedCount}/{totalCount}</span>
            )}
          </div>
          <button
            onClick={() => setViewMode(v => v === 'table' ? 'card' : 'table')}
            className="flex items-center justify-center rounded-sm border px-3 h-9 text-sm font-bold hover:bg-muted transition-all shrink-0 bg-card"
            title={viewMode === 'table' ? 'Card View' : 'Table View'}
          >
            {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
        </div>
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
          {viewMode === 'card' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedStudents.map((s) => {
                const sessionName = sessions.find(sess => sess.id === s.session_id)?.name || "N/A"
                return (
                  <div key={s.id} onClick={() => setPreviewStudent(s)} className="relative rounded-sm border p-4 bg-card hover:shadow-lg transition-all group overflow-hidden border-border/60 hover:border-primary/40 cursor-pointer active:scale-[0.995]">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={s.name} size="md" imageUrl={s.user?.avatar_url} />
                        <div className="min-w-0">
                          <p className="font-black truncate text-sm tracking-tight">{s.name}</p>
                          {s.email && <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>}
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-muted-foreground font-bold font-mono bg-muted/50 px-1.5 rounded-xs tracking-tighter">ID: {s.student_id}</p>
                            <div className="h-2.5 w-[1px] bg-muted-foreground/30"></div>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">{sessionName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setEditing(s); setModalOpen(true) }}
                          className="p-2 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-all shadow-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleting(s) }}
                          className="p-2 rounded-sm border bg-background hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-all shadow-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div>
                          <button onClick={(e) => { e.stopPropagation(); const el = e.currentTarget; setActionMenuAnchor(el); setActionMenuStudentId(actionMenuStudentId === s.id ? null : s.id) }}
                            className="p-2 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                          <ActionMenu open={actionMenuStudentId === s.id} anchorEl={actionMenuAnchor} onClose={() => { setActionMenuStudentId(null); setActionMenuAnchor(null) }}>
                            <button onClick={() => { setActionMenuStudentId(null); handleAddToAlumni(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                              <GraduationCap className="h-4 w-4 text-primary" /> Add to Alumni
                            </button>
                            {contributorsByStudentId[s.id] ? (
                              <button onClick={() => { setActionMenuStudentId(null); setRemovingContributor(contributorsByStudentId[s.id]) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors text-destructive">
                                <UserMinus className="h-4 w-4" /> Remove from Contributors
                              </button>
                            ) : (
                              <button onClick={() => { setActionMenuStudentId(null); handleAddToContributor(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                <Handshake className="h-4 w-4 text-primary" /> Add to Contributor
                              </button>
                            )}
                            {crOf(s) ? (
                              <button onClick={() => { setActionMenuStudentId(null); setEndingCR(crOf(s)!) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors text-destructive">
                                <UserMinus className="h-4 w-4" /> Remove as CR
                              </button>
                            ) : (
                              <button onClick={() => { setActionMenuStudentId(null); setCrStudent(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                <Crown className="h-4 w-4 text-primary" /> Make CR
                              </button>
                            )}
                            {s.user_id ? (
                              <button onClick={() => { setActionMenuStudentId(null); setProTarget({ id: s.user_id!, name: s.name, email: s.email }) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                <UserCheck className="h-4 w-4" /> Make User Pro
                              </button>
                            ) : (
                              <button disabled title="Not claimed yet — Pro needs a claimed account" className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground/50 text-left cursor-not-allowed">
                                <UserCheck className="h-4 w-4" /> Make User Pro
                              </button>
                            )}
                            {!s.is_claimed && (
                              <button onClick={() => { setActionMenuStudentId(null); handleGenerateCode(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                <RefreshCcw className="h-4 w-4 text-primary" /> Generate Code
                              </button>
                            )}
                            {!s.is_claimed && s.verification_code && s.email ? (
                              <button onClick={() => { setActionMenuStudentId(null); setActionMenuAnchor(null); handleSendMail(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                <Send className="h-4 w-4" /> Send Mail
                              </button>
                            ) : (
                              <button disabled title={!s.email ? "No email on file for this profile" : "Already claimed — no code left to send"} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground/50 text-left cursor-not-allowed">
                                <Send className="h-4 w-4" /> Send Mail
                              </button>
                            )}
                          </ActionMenu>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-0 flex-wrap">
                      {/* Soft rounded pills (the old batch-badge container),
                          tinted per state instead of the shared palette. */}
                      <span className={cn(
                        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap",
                        s.is_regular ? "bg-success-subtle border-success/20 text-success" : "bg-warning-subtle border-warning/20 text-warning"
                      )}>
                        {s.is_regular ? "Regular" : "Irregular"}
                      </span>
                      {s.is_claimed ? (
                        <span className="inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap bg-success-subtle border-success/20 text-success">
                          <RefreshCcw className="h-2.5 w-2.5" /> Claimed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap bg-warning-subtle border-warning/20 text-warning">
                          Unclaimed
                        </span>
                      )}
                      {s.blood_group && (
                        <span className="inline-flex items-center rounded-sm border border-destructive/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap bg-destructive-subtle text-destructive">
                          {s.blood_group}
                        </span>
                      )}
                      {/* Verification code rides the same row, pushed to the
                          right edge — hidden entirely when none exists so no
                          dash placeholder bloats the badges row. */}
                      {s.verification_code ? (
                        <div className="ml-auto flex items-center gap-1.5">
                          <code className={cn(
                            "text-[12px] font-black tracking-[0.15em]",
                            s.is_claimed ? "text-muted-foreground/40 line-through" : "text-primary drop-shadow-sm"
                          )}>
                            {s.verification_code}
                          </code>
                          {s.is_claimed && (
                            <div className="h-4 w-4 rounded-full bg-success-subtle text-success flex items-center justify-center" title="Verified">
                              <RefreshCcw className="h-2.5 w-2.5" />
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(s) }}
                            className="p-1 rounded-sm text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                            title="Copy Details"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="ml-auto text-muted-foreground/40 font-bold">-</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div ref={tableScrollRef} className="overflow-x-auto rounded-sm border cursor-grab active:cursor-grabbing">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 whitespace-nowrap">Batch</th>
                    <th className="px-4 py-3">ID / Session</th>
                    <th className="px-4 py-3 whitespace-nowrap">Regular</th>
                    <th className="px-4 py-3 whitespace-nowrap">Claimed</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedStudents.map((s) => {
                    const batchName = batches.find(b => b.id === s.batch_id)?.name || "N/A"
                    const sessionName = sessions.find(sess => sess.id === s.session_id)?.name || "N/A"
                    return (
                      <tr key={s.id} onClick={(e) => {
                        if (tableMovedRef.current) { tableMovedRef.current = false; return }
                        const path = e.nativeEvent.composedPath?.() as unknown[] | undefined
                        if (path?.some(n => n instanceof HTMLElement && n.tagName === 'BUTTON')) return
                        setPreviewStudent(s)
                      }} className="hover:bg-muted/30 transition-colors cursor-pointer">
                        <td className="px-4 py-2.5">
                          <Avatar name={s.name} size="sm" imageUrl={s.user?.avatar_url} />
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-bold truncate max-w-[180px]">{s.name}</p>
                          {s.email && <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{s.email}</p>}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="rounded-sm bg-primary/5 border border-primary/10 px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-tighter whitespace-nowrap">{batchName}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-mono text-xs font-bold">{s.student_id}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">{sessionName}</p>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap",
                              s.is_regular ? "bg-success-subtle border-success/20 text-success" : "bg-warning-subtle border-warning/20 text-warning"
                            )}>
                              {s.is_regular ? "Regular" : "Irregular"}
                            </span>
                            {s.blood_group && (
                              <span className="inline-flex items-center rounded-sm border border-destructive/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap bg-destructive-subtle text-destructive">
                                {s.blood_group}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {s.is_claimed ? (
                            <span className="inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap bg-success-subtle border-success/20 text-success">
                              <RefreshCcw className="h-2.5 w-2.5" /> Claimed
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter leading-tight whitespace-nowrap bg-warning-subtle border-warning/20 text-warning">
                              Unclaimed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {s.verification_code ? (
                            <div className="flex items-center gap-1.5 group/code">
                              <code className={cn(
                                "text-xs font-black tracking-wider",
                                s.is_claimed ? "text-muted-foreground/40 line-through" : "text-primary"
                              )}>
                                {s.verification_code}
                              </code>
                              <button onClick={(e) => { e.stopPropagation(); handleCopyCode(s) }}
                                className="p-1 rounded-sm text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                                title="Copy Details"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 font-bold">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditing(s); setModalOpen(true) }} 
                              className="p-1.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleting(s)}
                              className="p-1.5 rounded-sm border bg-background hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <div>
                              <button onClick={(e) => { e.stopPropagation(); const el = e.currentTarget; setActionMenuAnchor(el); setActionMenuStudentId(actionMenuStudentId === s.id ? null : s.id) }}
                                className="p-1.5 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                              <ActionMenu open={actionMenuStudentId === s.id} anchorEl={actionMenuAnchor} onClose={() => { setActionMenuStudentId(null); setActionMenuAnchor(null) }}>
                                <button onClick={() => { setActionMenuStudentId(null); handleAddToAlumni(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                  <GraduationCap className="h-4 w-4 text-primary" /> Add to Alumni
                                </button>
                                {contributorsByStudentId[s.id] ? (
                                  <button onClick={() => { setActionMenuStudentId(null); setRemovingContributor(contributorsByStudentId[s.id]) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors text-destructive">
                                    <UserMinus className="h-4 w-4" /> Remove from Contributors
                                  </button>
                                ) : (
                                  <button onClick={() => { setActionMenuStudentId(null); handleAddToContributor(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                    <Handshake className="h-4 w-4 text-primary" /> Add to Contributor
                                  </button>
                                )}
                                {crOf(s) ? (
                                  <button onClick={() => { setActionMenuStudentId(null); setEndingCR(crOf(s)!) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors text-destructive">
                                    <UserMinus className="h-4 w-4" /> Remove as CR
                                  </button>
                                ) : (
                                  <button onClick={() => { setActionMenuStudentId(null); setCrStudent(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                    <Crown className="h-4 w-4 text-primary" /> Make CR
                                  </button>
                                )}
                                {s.user_id ? (
                                  <button onClick={() => { setActionMenuStudentId(null); setProTarget({ id: s.user_id!, name: s.name, email: s.email }) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                    <UserCheck className="h-4 w-4" /> Make User Pro
                                  </button>
                                ) : (
                                  <button disabled title="Not claimed yet — Pro needs a claimed account" className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground/50 text-left cursor-not-allowed">
                                    <UserCheck className="h-4 w-4" /> Make User Pro
                                  </button>
                                )}
                                {!s.is_claimed && (
                                  <button onClick={() => { setActionMenuStudentId(null); handleGenerateCode(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                    <RefreshCcw className="h-4 w-4 text-primary" /> Generate Code
                                  </button>
                                )}
                                {!s.is_claimed && s.verification_code && s.email ? (
                                  <button onClick={() => { setActionMenuStudentId(null); setActionMenuAnchor(null); handleSendMail(s) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-muted text-left transition-colors">
                                    <Send className="h-4 w-4" /> Send Mail
                                  </button>
                                ) : (
                                  <button disabled title={!s.email ? "No email on file for this profile" : "Already claimed — no code left to send"} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground/50 text-left cursor-not-allowed">
                                    <Send className="h-4 w-4" /> Send Mail
                                  </button>
                                )}
                              </ActionMenu>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

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
          <div className="bg-primary-gradient text-primary-foreground px-8 py-4 rounded-sm shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4 border-l-4 border-primary-foreground/30">
            <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

function StudentPreviewModal({ student, onClose, batches, sessions, onToast, onCopyDetails, onSendMail, onRefresh }: {
  student: Student | null
  onClose: () => void
  batches: Batch[]
  sessions: Session[]
  onToast?: (msg: string) => void
  onCopyDetails?: () => void
  onSendMail?: () => void
  onRefresh?: () => void
}) {
  const [zoom, setZoom] = useState(false)
  const [mailing, setMailing] = useState(false)
  // A just-minted code lives here only — the parent's student prop still
  // carries the old (empty) value until the list reloads.
  const [mintedCode, setMintedCode] = useState<string | null>(null)
  const [minting, setMinting] = useState(false)

  // Fresh state per opened student — the component stays mounted while hidden.
  useEffect(() => { setZoom(false); setMailing(false); setMintedCode(null); setMinting(false) }, [student?.id])

  if (!student) return null

  const batchName = batches.find(b => b.id === student.batch_id)?.name || "Unknown Batch"
  const sessionName = sessions.find(s => s.id === student.session_id)?.name || "Unknown Session"
  const shownCode = mintedCode ?? student.verification_code
  const canSendMail = !student.is_claimed && !!shownCode && !!student.email

  async function handleGenerate() {
    if (!student || minting) return
    setMinting(true)
    try {
      const fresh = await api.students.generateCode(student.id)
      setMintedCode(fresh.verification_code)
      onToast?.(`New claim code generated for ${student.name}`)
      onRefresh?.()
    }
    catch (err: any) {
      onToast?.(err.message || "Failed to generate code")
    }
    finally {
      setMinting(false)
    }
  }

  async function handleSendMail() {
    if (!student || mailing) return
    setMailing(true)
    try {
      await api.students.sendCodeEmail(student.id)
      onToast?.(`Claim code emailed to ${student.email}`)
    }
    catch (err: any) {
      onToast?.(err.message || "Failed to send email")
    }
    finally {
      setMailing(false)
    }
  }

  return (
    <Modal open={!!student} onClose={() => { setZoom(false); onClose() }} title="Student Profile" className="sm:max-w-md">
      {/* Modal body renders with p-0 — this wrapper provides the single, even
          gutter the old version lacked (it mixed mb-8/pt-4/space-y-8 instead). */}
      <div className="p-6">
        {/* Identity header — photo left, name + badges right. Clicking the
            photo expands it in place; it is NOT the click target for the list
            (the whole row/card owns that). */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div
            onClick={() => setZoom(z => !z)}
            title={zoom ? "Shrink photo" : "View photo"}
            className={cn(
              "overflow-hidden shrink-0 rounded-xl border border-border shadow-sm cursor-zoom-in transition-all duration-300 hover:ring-2 hover:ring-primary/20",
              zoom && "w-full basis-full cursor-zoom-out"
            )}
          >
            {student.user?.avatar_url ? (
              <img src={student.user.avatar_url} alt={student.name} className={cn("object-cover", zoom ? "w-full aspect-square" : "h-20 w-20")} />
            ) : (
              <div className={cn("flex items-center justify-center bg-primary/10 text-primary font-black", zoom ? "w-full aspect-square text-7xl" : "h-20 w-20 text-2xl")}>
                {student.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
              </div>
            )}
          </div>
          {!zoom && (
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black tracking-tight truncate">{student.name}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {student.is_cr && (
                  <Badge variant="info" className="font-black uppercase text-[9px] tracking-tighter">Class Rep</Badge>
                )}
                <Badge variant={student.is_regular ? "success" : "warn"} className="font-black uppercase text-[9px] tracking-tighter">{student.is_regular ? "Regular" : "Irregular"}</Badge>
                <Badge variant={student.is_claimed ? "success" : "warn"} className="font-black uppercase text-[9px] tracking-tighter">{student.is_claimed ? "Verified" : "Pending"}</Badge>
              </div>
            </div>
          )}
        </div>

        {/* Registry facts — compact single-line boxes instead of the old
            oversized p-3/p-4 blocks with mb-8/space-y-8 gutters. */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { label: "Batch", value: batchName },
            { label: "Session", value: sessionName },
            { label: "Student ID", value: student.student_id }
          ].map(item => (
            <div key={item.label} className="rounded-sm border bg-muted/20 p-2.5 text-center min-w-0">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{item.label}</p>
              <p className="text-xs font-black truncate tracking-tight">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="rounded-sm border bg-muted/20 p-2.5 text-center">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Blood Group</p>
            <p className="text-sm font-black text-destructive tracking-tighter">{student.blood_group || "--"}</p>
          </div>
          <div className="rounded-sm border bg-muted/20 p-2.5 text-center">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Account</p>
            <p className={cn("text-sm font-black tracking-tighter", student.is_claimed ? "text-success" : "text-warning")}>
              {student.is_claimed ? "Claimed" : "Unclaimed"}
            </p>
          </div>
        </div>

        {student.email && (
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Institutional Email</p>
              <p className="text-sm font-bold truncate tracking-tight">{student.email}</p>
            </div>
            <a href={`mailto:${student.email}`} className="h-9 w-9 rounded-sm bg-primary-gradient text-white flex items-center justify-center hover:opacity-90 transition-all shadow-md shrink-0" title="Open in mail client">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        )}

        {shownCode ? (
          <div className="rounded-sm border border-dashed border-border bg-muted/10 p-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Claim Code</p>
              <code className={cn("text-base font-black tracking-[0.25em]", student.is_claimed ? "text-muted-foreground/40 line-through" : "text-primary")}>
                {shownCode}
              </code>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(shownCode); onToast?.("Claim code copied") }}
              className="p-2 rounded-sm border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
              title="Copy code"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {/* Actions — the mail button calls the API's actionable claim-code
            endpoint; Copy includes name/batch/code in the shared copy. */}
        <div className="flex gap-2 mt-5 pb-1">
          {canSendMail ? (
            <button
              onClick={handleSendMail}
              disabled={mailing}
              className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {mailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {mailing ? "Sending…" : "Send Claim Code Mail"}
            </button>
          ) : !student.is_claimed && !shownCode ? (
            <button
              onClick={handleGenerate}
              disabled={minting}
              className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {minting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              {minting ? "Generating…" : "Generate Claim Code"}
            </button>
          ) : (
            <button
              disabled
              title={student.is_claimed ? "Already claimed — no code left to send" : "No email on file for this profile"}
              className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" /> Send Claim Code Mail
            </button>
          )}
          <button
            onClick={() => onCopyDetails?.()}
            className="rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-2"
            title="Copy full details"
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
        </div>
      </div>
    </Modal>
  )
}
