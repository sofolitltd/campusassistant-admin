"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Search, Filter, MoreHorizontal, UserPlus, Loader2, Phone, Mail, Fingerprint,
  GraduationCap, Building2, CalendarDays, X, Briefcase, Award,
  Pencil, Trash2, Ban, CheckCircle, AlertTriangle, Users as UsersIcon, ShieldCheck, Crown
} from "lucide-react"
import { api, User, University, Department, Session, Batch, UserStats } from "@/lib/api"
import { USER_FILTER_KEYS, ROLE_OPTIONS, type UserFilterKey } from "./filters"
import { EditUserModal } from "./EditUserModal"
import { SubscriptionModal } from "./SubscriptionModal"

const filterSelectCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"

// Backend only flips `is_pro` to false on an hourly sweep, so a lapsed user can still
// have is_pro=true for up to an hour after pro_expiry — check both before showing "Pro".
function isUserCurrentlyPro(user: User) {
  if (!user.is_pro) return false
  if (!user.pro_expiry) return true
  return new Date(user.pro_expiry) > new Date()
}

// Pro flag still set but pro_expiry already passed (backend hasn't swept it yet).
function isUserExpiredPro(user: User) {
  return !!user.is_pro && !!user.pro_expiry && new Date(user.pro_expiry) <= new Date()
}

interface UsersClientProps {
  initialUsers: User[]
  totalCount: number
  universities: University[]
  departments: Department[]
  sessions: Session[]
  batches: Batch[]
  pageSize: number
  stats: UserStats
}

export default function UsersClient({
  initialUsers,
  totalCount,
  universities,
  departments,
  sessions,
  batches,
  pageSize,
  stats
}: UsersClientProps) {
  const statCards = [
    { title: "Total Users", value: stats.total, icon: UsersIcon, color: "text-info", bg: "bg-info-subtle" },
    { title: "Students", value: stats.students, icon: GraduationCap, color: "text-success", bg: "bg-success-subtle" },
    { title: "Teachers", value: stats.teachers, icon: Briefcase, color: "text-warning", bg: "bg-warning-subtle" },
    { title: "Staff", value: stats.staff, icon: Award, color: "text-info", bg: "bg-info-subtle" },
    { title: "Verified", value: stats.verified, icon: ShieldCheck, color: "text-success", bg: "bg-success-subtle" },
  ]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [isSearching, setIsSearching] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [subscriptionTarget, setSubscriptionTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deletePermanently, setDeletePermanently] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  const filterValue = (key: UserFilterKey) => searchParams.get(key) || ""
  const activeFilterCount = USER_FILTER_KEYS.filter((k) => searchParams.get(k)).length
  const [showFilters, setShowFilters] = useState(activeFilterCount > 0)

  // Cascading option lists, fetched on demand and cached per parent id so
  // switching back and forth doesn't refetch.
  const [deptCache, setDeptCache] = useState<Record<string, Department[]>>({})
  const [sessionCache, setSessionCache] = useState<Record<string, Session[]>>({})
  const [batchCache, setBatchCache] = useState<Record<string, Batch[]>>({})
  const selectedUni = filterValue("university_id")
  const selectedDept = filterValue("department_id")
  const deptOptions = selectedUni ? deptCache[selectedUni] : undefined
  const sessionOptions = selectedDept ? sessionCache[selectedDept] : undefined
  const batchOptions = selectedDept ? batchCache[selectedDept] : undefined

  useEffect(() => {
    if (!selectedUni || deptCache[selectedUni]) return
    api.departments.getAll(`university_id=${selectedUni}&limit=100`)
      .then((list) => setDeptCache((c) => ({ ...c, [selectedUni]: list })))
      .catch(() => setDeptCache((c) => ({ ...c, [selectedUni]: [] })))
  }, [selectedUni, deptCache])

  useEffect(() => {
    if (!selectedDept || (sessionCache[selectedDept] && batchCache[selectedDept])) return
    Promise.all([
      api.sessions.getAll(`department_id=${selectedDept}&limit=100`).catch(() => [] as Session[]),
      api.batches.getAll(`department_id=${selectedDept}&limit=100`).catch(() => [] as Batch[]),
    ]).then(([sessionList, batchList]) => {
      setSessionCache((c) => ({ ...c, [selectedDept]: sessionList }))
      setBatchCache((c) => ({ ...c, [selectedDept]: batchList }))
    })
  }, [selectedDept, sessionCache, batchCache])

  const setFilter = (key: UserFilterKey, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    // Children of a cascading filter no longer apply once the parent changes.
    if (key === "university_id") ["department_id", "session_id", "batch_id"].forEach((k) => params.delete(k))
    if (key === "department_id") ["session_id", "batch_id"].forEach((k) => params.delete(k))
    params.set("offset", "0")
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    USER_FILTER_KEYS.forEach((k) => params.delete(k))
    params.set("offset", "0")
    router.push(`${pathname}?${params.toString()}`)
  }

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])
  
  const currentPage = Number(searchParams.get("offset") || 0) / pageSize
  const totalPages = Math.ceil(totalCount / pageSize)

  // Lookup Maps
  const uniMap = new Map(universities.map(u => [u.id, u]))
  const deptMap = new Map(departments.map(d => [d.id, d]))
  const sessionMap = new Map(sessions.map(s => [s.id, s]))
  const batchMap = new Map(batches.map(b => [b.id, b]))

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setIsSearching(true)
    const params = new URLSearchParams(searchParams.toString())
    if (term) params.set("search", term)
    else params.delete("search")
    params.set("offset", "0") // Reset to page 1
    router.push(`${pathname}?${params.toString()}`)
    setTimeout(() => setIsSearching(false), 300)
  }

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("offset", newOffset.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true); setActionError("")
    try {
      await api.users.delete(deleteTarget.id, deletePermanently)
      setDeleteTarget(null)
      setDeletePermanently(false)
      setActiveMenu(null)
      router.refresh()
    } catch (e: any) {
      setActionError(e.message || "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage and monitor all platform users with server-side processing.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary-gradient px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all active:scale-95">
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md group">
            <div className={`inline-flex rounded-lg p-2 ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
              <h2 className="text-2xl font-black mt-1 tracking-tight">{stat.value.toLocaleString()}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b p-4 bg-muted/5">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-md border bg-background py-2 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters ? "bg-accent text-accent-foreground" : "hover:bg-accent"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary-gradient px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="border-b bg-muted/5 p-4">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              <FilterField label="Role">
                <select value={filterValue("role")} onChange={(e) => setFilter("role", e.target.value)} className={filterSelectCls}>
                  <option value="">All roles</option>
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FilterField>
              <FilterField label="Status">
                <select value={filterValue("is_active")} onChange={(e) => setFilter("is_active", e.target.value)} className={filterSelectCls}>
                  <option value="">Any status</option>
                  <option value="true">Active</option>
                  <option value="false">Banned</option>
                </select>
              </FilterField>
              <FilterField label="Verification">
                <select value={filterValue("is_verified")} onChange={(e) => setFilter("is_verified", e.target.value)} className={filterSelectCls}>
                  <option value="">Any</option>
                  <option value="true">Verified</option>
                  <option value="false">Not verified</option>
                </select>
              </FilterField>
              <FilterField label="Plan">
                <select value={filterValue("plan_status")} onChange={(e) => setFilter("plan_status", e.target.value)} className={filterSelectCls}>
                  <option value="">Any plan</option>
                  <option value="pro">Pro</option>
                  <option value="expired">Expired</option>
                  <option value="basic">Basic</option>
                </select>
              </FilterField>
              <FilterField label="Gender">
                <select value={filterValue("gender")} onChange={(e) => setFilter("gender", e.target.value)} className={filterSelectCls}>
                  <option value="">Any gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </FilterField>
              <FilterField label="University">
                <select value={selectedUni} onChange={(e) => setFilter("university_id", e.target.value)} className={filterSelectCls}>
                  <option value="">All universities</option>
                  {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </FilterField>
              <FilterField label="Department">
                <select
                  value={selectedDept}
                  onChange={(e) => setFilter("department_id", e.target.value)}
                  disabled={!selectedUni || !deptOptions}
                  className={filterSelectCls}
                >
                  <option value="">{!selectedUni ? "Select a university first" : !deptOptions ? "Loading..." : "All departments"}</option>
                  {deptOptions?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </FilterField>
              <FilterField label="Session">
                <select
                  value={filterValue("session_id")}
                  onChange={(e) => setFilter("session_id", e.target.value)}
                  disabled={!selectedDept || !sessionOptions}
                  className={filterSelectCls}
                >
                  <option value="">{!selectedDept ? "Select a department first" : !sessionOptions ? "Loading..." : "All sessions"}</option>
                  {sessionOptions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FilterField>
              <FilterField label="Batch">
                <select
                  value={filterValue("batch_id")}
                  onChange={(e) => setFilter("batch_id", e.target.value)}
                  disabled={!selectedDept || !batchOptions}
                  className={filterSelectCls}
                >
                  <option value="">{!selectedDept ? "Select a department first" : !batchOptions ? "Loading..." : "All batches"}</option>
                  {batchOptions?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </FilterField>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <X className="h-4 w-4" /> Clear filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-widest font-bold border-b">
              <tr>
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Affiliation</th>
                <th className="px-6 py-4">Role Details</th>
                <th className="px-6 py-4 text-center">Plan</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No users match your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => {
                  const studentInfo = user.student;
                  const teacherInfo = user.teacher;
                  const university = user.university || (user.university_id ? uniMap.get(user.university_id) : null);
                  const department = user.department || (user.department_id ? deptMap.get(user.department_id) : null);
                  
                  const isStudentRole = user.role === "student";
                  const isTeacherRole = user.role === "teacher";
                  
                  return (
                    <tr key={user.id} className="group hover:bg-muted/30 transition-all duration-200">
                      {/* Identity Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full border bg-muted overflow-hidden flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="User" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-primary/5">
                                <Fingerprint className="h-6 w-6 opacity-50" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-base truncate tracking-tight">{user.first_name} {user.last_name}</span>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 leading-none">
                                <Mail className="h-3 w-3" /> {user.email}
                              </span>
                              {user.phone && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 leading-none mt-1">
                                  <Phone className="h-3 w-3" /> {user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Affiliation Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-[220px]">
                          {university ? (
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground" /> {university.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">National Access</span>
                          )}
                          {department && (
                            <span className="text-[11px] text-muted-foreground mt-1 font-medium line-clamp-1">
                              {department.name}
                            </span>
                          )}
                          <span className="capitalize text-[9px] font-black mt-2 inline-flex w-fit px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Role Details Column */}
                      <td className="px-6 py-4">
                        {studentInfo ? (
                          <div className="bg-info-subtle rounded-lg p-2.5 border border-info/30 flex flex-col gap-1.5 min-w-[160px]">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[9px] font-bold text-info uppercase flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" /> Student Card
                              </span>
                              <span className="text-[10px] font-mono font-black bg-white dark:bg-black px-1.5 rounded border border-info/30 py-0.5 shadow-xs">
                                {studentInfo.student_id}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1 border-t border-info/30 pt-1.5">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-info/70 uppercase font-bold leading-none">Batch</span>
                                <span className="text-[10px] font-bold mt-0.5 truncate">
                                  {studentInfo.batch?.name || (studentInfo.batch_id ? batchMap.get(studentInfo.batch_id)?.name : "N/A")}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-info/70 uppercase font-bold leading-none">Session</span>
                                <span className="text-[10px] font-bold mt-0.5 truncate">
                                  {studentInfo.session?.name || (studentInfo.session_id ? sessionMap.get(studentInfo.session_id)?.name : "N/A")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : teacherInfo ? (
                          <div className="bg-warning-subtle rounded-lg p-2.5 border border-warning/30 flex flex-col gap-1.5 min-w-[160px]">
                             <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-warning uppercase flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> Teacher Card
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1 border-t border-warning/30 pt-1.5">
                              <span className="text-[11px] font-bold truncate leading-none">{teacherInfo.designation}</span>
                              {teacherInfo.phd && (
                                <span className="text-[10px] text-warning/80 flex items-center gap-1 font-medium">
                                  <Award className="h-3 w-3" /> {teacherInfo.phd}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : isStudentRole || isTeacherRole ? (
                          <div className="bg-muted/40 rounded-lg p-2.5 border border-dashed flex flex-col gap-1 min-w-[160px]">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                               <Loader2 className="h-3 w-3 animate-pulse" /> {isStudentRole ? "Student" : "Teacher"} Profile
                            </span>
                            <span className="text-[10px] text-muted-foreground italic">Linkage pending...</span>
                          </div>
                        ) : (
                          <div className="h-10 flex items-center text-[10px] text-muted-foreground italic opacity-50 px-2">
                             Standard Profile
                          </div>
                        )}
                      </td>

                      {/* Plan Column */}
                      <td className="px-6 py-4 text-center">
                        {isUserCurrentlyPro(user) ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSubscriptionTarget(user) }}
                              className="inline-flex items-center gap-1 rounded-full bg-primary-gradient px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary-foreground hover:opacity-90 transition-all"
                              title="View / edit subscription"
                            >
                              <Crown className="h-3 w-3" /> Pro
                            </button>
                            {user.pro_expiry && (
                              <span className="text-[8px] font-medium text-muted-foreground">
                                till {new Date(user.pro_expiry).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ) : isUserExpiredPro(user) ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSubscriptionTarget(user) }}
                              className="inline-flex items-center gap-1 rounded-full border border-destructive bg-destructive-subtle px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-destructive hover:opacity-80 transition-all"
                              title="Pro expired — view / renew subscription"
                            >
                              <Crown className="h-3 w-3" /> Expired
                            </button>
                            <span className="text-[8px] font-medium text-muted-foreground">
                              since {new Date(user.pro_expiry!).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full border bg-muted px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            Basic
                          </span>
                        )}
                      </td>

                      {/* Joined Date Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-xs font-bold">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                           <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                             <CalendarDays className="h-3 w-3" /> Registered
                           </span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`h-2 w-2 rounded-full shadow-[0_0_8px] ${
                            user.is_active ? "bg-success shadow-success/30" : "bg-destructive shadow-destructive/30"
                          }`} />
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${
                            user.is_active ? "text-success" : "text-destructive"
                          }`}>
                            {user.is_active ? "Active" : "Banned"}
                          </span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === user.id ? null : user.id) }}
                          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </button>
                        {activeMenu === user.id && (
                          <div ref={menuRef} className="absolute right-4 top-12 z-50 w-44 rounded-sm border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditTarget(user); setActiveMenu(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-accent transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit User
                            </button>
                            <div className="border-t border-border/50" />
                            {user.is_active ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null) }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-destructive-subtle hover:text-destructive transition-all"
                              >
                                <Ban className="h-3.5 w-3.5" /> Ban User
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null) }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-success-subtle hover:text-success transition-all"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Unban User
                              </button>
                            )}
                            <div className="border-t border-border/50" />
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(user); setActiveMenu(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-destructive-subtle hover:text-destructive transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete User
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-4">
            <span>Showing <strong className="text-foreground">{initialUsers.length}</strong> of <strong className="text-foreground">{totalCount}</strong> users</span>
            <span className="opacity-30">|</span>
            <span>Page <strong className="text-foreground">{currentPage + 1}</strong> of <strong className="text-foreground">{totalPages || 1}</strong></span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handlePageChange(Math.max(0, (currentPage - 1) * pageSize))}
              disabled={currentPage === 0}
              className="rounded border px-3 py-1.5 font-bold hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              PREVIOUS
            </button>
            <button 
              onClick={() => handlePageChange((currentPage + 1) * pageSize)}
              disabled={currentPage >= totalPages - 1}
              className="rounded border px-3 py-1.5 font-bold hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* ── Edit User Modal ───────────────────────────────────── */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* ── Subscription Modal ────────────────────────────────── */}
      {subscriptionTarget && (
        <SubscriptionModal
          user={subscriptionTarget}
          onClose={() => setSubscriptionTarget(null)}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* ── Confirm Delete Modal ──────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => { setDeleteTarget(null); setDeletePermanently(false) }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="rounded-full bg-destructive-subtle p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold">Delete User?</h3>
              <p className="text-sm text-muted-foreground">
                Delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.email})?
              </p>
              <p className="text-sm text-muted-foreground">
                {deletePermanently
                  ? "This removes the account from the database entirely — cannot be undone, and frees the email for reuse."
                  : "This deactivates the account (soft delete) — it disappears from lists, but can be restored from the database if needed."}
              </p>

              <label className="flex w-full items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive-subtle p-3 text-left">
                <input
                  type="checkbox"
                  checked={deletePermanently}
                  onChange={(e) => setDeletePermanently(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-destructive"
                />
                <span className="text-xs font-medium text-destructive">
                  Permanently delete — skip the soft delete and erase this account for good.
                </span>
              </label>

              {actionError && <p className="text-sm text-destructive bg-destructive-subtle w-full rounded-sm p-2">{actionError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setDeleteTarget(null); setDeletePermanently(false); setActionError("") }} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-sm bg-destructive px-4 py-2.5 text-sm font-bold text-white hover:bg-destructive/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletePermanently ? "Delete Permanently" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
