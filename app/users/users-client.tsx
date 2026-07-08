"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Search, Filter, MoreHorizontal, UserPlus, Loader2, Phone, Mail, Fingerprint,
  GraduationCap, Building2, CalendarDays, X, Briefcase, Award,
  Pencil, Trash2, Ban, CheckCircle, AlertTriangle
} from "lucide-react"
import { api, User, University, Department, Session, Batch } from "@/lib/api"

interface UsersClientProps {
  initialUsers: User[]
  totalCount: number
  universities: University[]
  departments: Department[]
  sessions: Session[]
  batches: Batch[]
  pageSize: number
}

export default function UsersClient({
  initialUsers,
  totalCount,
  universities,
  departments,
  sessions,
  batches,
  pageSize
}: UsersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [isSearching, setIsSearching] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

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
      await api.users.delete(deleteTarget.id)
      setDeleteTarget(null)
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
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage and monitor all platform users with server-side processing.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all active:scale-95">
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
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
          <button className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-widest font-bold border-b">
              <tr>
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Affiliation</th>
                <th className="px-6 py-4">Role Details</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No users matching your search.</p>
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
                          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-2.5 border border-blue-100/50 dark:border-blue-900/30 flex flex-col gap-1.5 min-w-[160px]">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" /> Student Card
                              </span>
                              <span className="text-[10px] font-mono font-black bg-white dark:bg-black px-1.5 rounded border border-blue-100 py-0.5 shadow-xs">
                                {studentInfo.student_id}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1 border-t border-blue-100/50 pt-1.5">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-blue-500/70 uppercase font-bold leading-none">Batch</span>
                                <span className="text-[10px] font-bold mt-0.5 truncate">
                                  {studentInfo.batch?.name || (studentInfo.batch_id ? batchMap.get(studentInfo.batch_id)?.name : "N/A")}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-blue-500/70 uppercase font-bold leading-none">Session</span>
                                <span className="text-[10px] font-bold mt-0.5 truncate">
                                  {studentInfo.session?.name || (studentInfo.session_id ? sessionMap.get(studentInfo.session_id)?.name : "N/A")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : teacherInfo ? (
                          <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-2.5 border border-amber-100/50 dark:border-amber-900/30 flex flex-col gap-1.5 min-w-[160px]">
                             <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> Teacher Card
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1 border-t border-amber-100/50 pt-1.5">
                              <span className="text-[11px] font-bold truncate leading-none">{teacherInfo.designation}</span>
                              {teacherInfo.phd && (
                                <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 flex items-center gap-1 font-medium">
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
                            user.is_active ? "bg-emerald-500 shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50"
                          }`} />
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${
                            user.is_active ? "text-emerald-600" : "text-red-600"
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
                              onClick={(e) => { e.stopPropagation(); setActiveMenu(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-accent transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit User
                            </button>
                            <div className="border-t border-border/50" />
                            {user.is_active ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null) }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-red-50 hover:text-red-600 transition-all"
                              >
                                <Ban className="h-3.5 w-3.5" /> Ban User
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null) }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Unban User
                              </button>
                            )}
                            <div className="border-t border-border/50" />
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(user); setActiveMenu(null) }}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-left hover:bg-red-50 hover:text-red-600 transition-all"
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

      {/* ── Confirm Delete Modal ──────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold">Delete User?</h3>
              <p className="text-sm text-muted-foreground">
                Delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.email})?
              </p>
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              {actionError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 w-full rounded-sm p-2">{actionError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setDeleteTarget(null); setActionError("") }} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-sm bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
