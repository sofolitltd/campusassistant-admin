"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { api, Department, StudentVerificationRequest, StudentVerificationStatus, University } from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

export const VERIFICATION_STATUS_BADGE: Record<StudentVerificationStatus, string> = {
  pending: "bg-warning-subtle text-warning",
  approved: "bg-success-subtle text-success",
  rejected: "bg-destructive-subtle text-destructive",
}

const STATUS_TABS: { value: "" | StudentVerificationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
]

const selectCls = "rounded-sm border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"

export default function VerificationsClient() {
  const [items, setItems] = useState<StudentVerificationRequest[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"" | StudentVerificationStatus>("pending")
  const [universities, setUniversities] = useState<University[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [universityId, setUniversityId] = useState("")
  const [departmentId, setDepartmentId] = useState("")

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  useEffect(() => {
    api.universities.getAll("limit=200").then(setUniversities).catch(console.error)
  }, [])

  function selectUniversity(id: string) {
    setUniversityId(id)
    setDepartmentId("")
    setDepartments([])
    if (id) api.departments.getAllByUniversity(id).then(setDepartments).catch(console.error)
  }

  const loadData = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(newOffset) })
      if (status) params.set("status", status)
      if (universityId) params.set("university_id", universityId)
      if (departmentId) params.set("department_id", departmentId)
      const res = await api.studentVerifications.getAll(params.toString())
      setItems(res.data)
      setTotalCount(res.count)
      setOffset(newOffset)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [status, universityId, departmentId])

  useEffect(() => { loadData(0) }, [loadData])

  const goToPage = (page: number) => loadData((page - 1) * PAGE_SIZE)

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3"><BadgeCheck className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Student Verifications</h1>
          <p className="text-sm text-muted-foreground">Review document-based requests from students who joined without a verification code.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button key={t.label} onClick={() => setStatus(t.value)}
              className={cn("px-4 py-2 text-sm font-bold transition-all rounded-sm",
                status === t.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={universityId} onChange={e => selectUniversity(e.target.value)} className={selectCls}>
            <option value="">All universities</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.acronym || u.name}</option>)}
          </select>
          <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} disabled={!universityId} className={cn(selectCls, "disabled:opacity-50")}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.acronym || d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-sm border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Applicant", "Roll", "University / Dept", "Batch", "Submitted", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground italic">No verification requests found.</td></tr>
                ) : items.map(v => (
                  <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-sm">{v.name}</p>
                      <p className="text-[10px] text-muted-foreground">{v.user?.email}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{v.student_id}</td>
                    <td className="px-4 py-4 text-xs">
                      <p className="font-semibold">{v.university?.acronym || v.university?.name}</p>
                      <p className="text-muted-foreground">{v.department?.acronym || v.department?.name}</p>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <p>{v.batch?.name}</p>
                      <p className="text-muted-foreground">{v.session?.name}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-4">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", VERIFICATION_STATUS_BADGE[v.status])}>{v.status}</span>
                    </td>
                    <td className="px-4 py-4 text-right pr-6">
                      <Link href={`/verifications/${v.id}`} className="inline-flex items-center gap-1 rounded-sm border px-3 py-1.5 text-xs font-bold hover:bg-muted transition-all">
                        Review <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
              className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
            ><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => goToPage(p)}
                className={cn("min-w-[36px] h-9 rounded-sm text-sm font-bold transition-all", p === currentPage ? "bg-primary text-primary-foreground shadow-sm" : "border hover:bg-accent")}
              >{p}</button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
              className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
            ><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  )
}
