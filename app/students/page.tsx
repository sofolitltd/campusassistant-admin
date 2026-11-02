"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, GraduationCap, Loader2, Search, Users } from "lucide-react"
import { api, type Batch, type Department, type PaginatedResponse, type Student, type University } from "@/lib/api"
import { StudentModal } from "@/app/universities/[id]/departments/[...slug]/components/StudentModal"
import { ModeratorRoleManager } from "@/components/ModeratorRoleManager"

const PAGE_SIZE = 50
const selectCls = "w-full rounded-sm border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"

export default function StudentsPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [universityId, setUniversityId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<PaginatedResponse<Student> | null>(null)
  const [loadingUniversities, setLoadingUniversities] = useState(true)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Student | null>(null)
  const [moderatorStudent, setModeratorStudent] = useState<Student | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    api.universities.getAll("limit=500")
      .then((items) => { if (active) setUniversities(items) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load universities.") })
      .finally(() => { if (active) setLoadingUniversities(false) })
    return () => { active = false }
  }, [])

  const loadStudents = useCallback(async (active: () => boolean) => {
    if (!batchId) {
      setResult(null)
      setLoadingStudents(false)
      return
    }

    setError("")
    setLoadingStudents(true)
    const params = new URLSearchParams({
      university_id: universityId,
      department_id: departmentId,
      batch_id: batchId,
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      preload: "true",
    })
    if (search.trim()) params.set("search", search.trim())

    try {
      const response = await api.students.getPage(params.toString())
      if (active()) setResult(response)
    } catch (err) {
      if (active()) {
        setResult(null)
        setError(err instanceof Error ? err.message : "Could not load students.")
      }
    } finally {
      if (active()) setLoadingStudents(false)
    }
  }, [batchId, departmentId, page, search, universityId])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) void loadStudents(() => active)
    })
    return () => { active = false }
  }, [loadStudents, refreshKey])

  async function selectUniversity(id: string) {
    setUniversityId(id)
    setDepartmentId("")
    setBatchId("")
    setDepartments([])
    setBatches([])
    setResult(null)
    setPage(0)
    setError("")
    if (!id) return

    setLoadingDepartments(true)
    try {
      setDepartments(await api.departments.getAllByUniversity(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load departments.")
    } finally {
      setLoadingDepartments(false)
    }
  }

  async function selectDepartment(id: string) {
    setDepartmentId(id)
    setBatchId("")
    setBatches([])
    setResult(null)
    setPage(0)
    setError("")
    if (!id) return

    setLoadingBatches(true)
    try {
      setBatches(await api.batches.getAllByDepartment(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load batches.")
    } finally {
      setLoadingBatches(false)
    }
  }

  const selectedUniversity = universities.find((item) => item.id === universityId)
  const selectedDepartment = departments.find((item) => item.id === departmentId)
  const totalPages = result ? Math.ceil(result.count / PAGE_SIZE) : 0

  return (
    <div className="space-y-6 pb-16">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-3"><GraduationCap className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">Browse students by university, department, and batch.</p>
        </div>
      </header>

      <section className="grid gap-3 rounded-sm border bg-card p-4 md:grid-cols-3">
        <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
          University
          <select value={universityId} onChange={(event) => void selectUniversity(event.target.value)} disabled={loadingUniversities} className={selectCls}>
            <option value="">{loadingUniversities ? "Loading universities…" : "Select university"}</option>
            {universities.map((university) => <option key={university.id} value={university.id}>{university.acronym || university.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
          Department
          <select value={departmentId} onChange={(event) => void selectDepartment(event.target.value)} disabled={!universityId || loadingDepartments} className={selectCls}>
            <option value="">{loadingDepartments ? "Loading departments…" : "Select department"}</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.acronym || department.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
          Batch
          <select value={batchId} onChange={(event) => { setBatchId(event.target.value); setPage(0); setResult(null) }} disabled={!departmentId || loadingBatches} className={selectCls}>
            <option value="">{loadingBatches ? "Loading batches…" : "Select batch"}</option>
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
        </label>
      </section>

      {error && <p role="alert" className="flex items-center gap-2 rounded-sm bg-destructive-subtle p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</p>}

      {batchId && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">{selectedUniversity?.acronym || selectedUniversity?.name} · {selectedDepartment?.acronym || selectedDepartment?.name} · {batches.find((batch) => batch.id === batchId)?.name}</h2>
              <p className="text-xs text-muted-foreground">{result?.count ?? 0} students</p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder="Search name or roll" className={`${selectCls} pl-9`} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-sm border bg-card">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Claim status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingStudents ? (
                  <tr><td colSpan={5} className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                ) : !result?.data.length ? (
                  <tr><td colSpan={5} className="py-16 text-center text-muted-foreground"><Users className="mx-auto mb-2 h-6 w-6 opacity-30" />No students found for this batch.</td></tr>
                ) : result.data.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{student.name || "Unnamed student"}</p>
                      <p className="text-xs text-muted-foreground">{student.email || student.user?.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{student.student_id || "—"}</td>
                    <td className="px-4 py-3 text-xs">{student.session?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={student.is_claimed ? "rounded-full bg-success-subtle px-2 py-1 text-[10px] font-bold text-success" : "rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground"}>
                        {student.is_claimed ? "Claimed" : "Unclaimed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setModeratorStudent(student)} className="mr-2 rounded-sm border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Moderator roles</button>
                      <button onClick={() => setEditing(student)} className="rounded-sm border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {Math.max(totalPages, 1)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0 || loadingStudents} className="rounded-sm border px-3 py-1.5 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage((current) => current + 1)} disabled={loadingStudents || page + 1 >= totalPages} className="rounded-sm border px-3 py-1.5 disabled:opacity-50">Next</button>
            </div>
          </div>
        </section>
      )}

      {!batchId && !error && (
        <div className="rounded-sm border border-dashed bg-muted/20 px-6 py-16 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-semibold">Choose a batch to view students</p>
          <p className="mt-1 text-sm text-muted-foreground">Student records stay hidden until you select a university, department, and batch.</p>
        </div>
      )}

      {editing && (
        <StudentModal
          open
          onClose={() => setEditing(null)}
          universityId={editing.university_id}
          departmentId={editing.department_id}
          currentBatchId={editing.batch_id}
          student={editing}
          onSuccess={() => { setEditing(null); setRefreshKey((key) => key + 1) }}
        />
      )}
      {moderatorStudent && (
        <ModeratorRoleManager student={moderatorStudent} dialogOpen onDialogClose={() => setModeratorStudent(null)} hideTrigger />
      )}
    </div>
  )
}
