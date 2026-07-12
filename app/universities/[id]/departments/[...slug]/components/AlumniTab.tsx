"use client"

import { useState, useEffect } from "react"
import { Alumni, api, Student, Organization } from "@/lib/api"
import { Avatar, Badge, EmptyState, ConfirmDelete } from "./SharedUI"
import {
  GraduationCap, Phone, Mail, ExternalLink, Link2,
  MapPin, Briefcase, Plus, Edit2, Trash2, Search, X, Users2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Modal ───────────────────────────────────────────────────────────────────

type AlumniFormData = Omit<Alumni, "id" | "created_at">

export function AlumniModal({
  open,
  onClose,
  alumni,
  universityId,
  departmentId,
  onSuccess,
  initialData,
}: {
  open: boolean
  onClose: () => void
  alumni: Alumni | null
  universityId: string
  departmentId: string
  onSuccess: () => void
  initialData?: Partial<AlumniFormData>
}) {
  const isEdit = !!alumni
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<AlumniFormData>>({
    university_id: universityId,
    department_id: departmentId,
    current_status: "employed",
    social_links: {},
  })

  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [batches, setBatches] = useState<{ id: string; name: string }[]>([])
  const [designations, setDesignations] = useState<string[]>([])
  const [desigQuery, setDesigQuery] = useState("")
  const [showDesigDropdown, setShowDesigDropdown] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgQuery, setOrgQuery] = useState("")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        alumni
          ? {
              full_name: alumni.full_name,
              student_id: alumni.student_id,
              email: alumni.email,
              phone: alumni.phone,
              batch: alumni.batch,
              passing_year: alumni.passing_year,
              current_status: alumni.current_status,
              organization: alumni.organization,
              designation: alumni.designation,
              location: alumni.location,
              bio: alumni.bio,
              profile_image: alumni.profile_image,
              social_links: alumni.social_links,
              university_id: universityId,
              department_id: departmentId,
              created_by: alumni.created_by,
              student_profile_id: alumni.student_profile_id,
              organization_id: alumni.organization_id,
            }
          : {
              university_id: universityId,
              department_id: departmentId,
              current_status: "employed",
              social_links: {},
              ...initialData,
            }
      )
      setSelectedStudent(alumni?.student_profile || null)
      setStudentSearchQuery("")
      setSearchResults([])
      setShowSearchResults(false)

      api.organizations.getAll().then((orgs) => {
        setOrganizations(orgs)
        if (alumni) {
          setOrgQuery(alumni.organization || "")
          if (alumni.organization_id) {
            const found = orgs.find((o) => o.id === alumni.organization_id)
            setSelectedOrg(found || null)
          } else {
            setSelectedOrg(null)
          }
        } else if (initialData?.organization) {
          setOrgQuery(initialData.organization)
          const matched = orgs.find((o) => o.name.toLowerCase() === initialData.organization!.toLowerCase())
          if (matched) {
            setSelectedOrg(matched)
            setForm((p) => ({ ...p, organization_id: matched.id }))
          } else {
            setSelectedOrg(null)
          }
        } else {
          setOrgQuery("")
          setSelectedOrg(null)
        }
      }).catch(console.error)

      api.batches.getAllByDepartment(departmentId).then((b) => {
        setBatches(b.map((b) => ({ id: b.id, name: b.name })).sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true })))
      }).catch(console.error)

      api.alumni.getAllByDepartment(universityId, departmentId).then((al) => {
        const unique = [...new Set(al.map((a) => a.designation).filter(Boolean))]
        setDesignations(unique)
        if (alumni) {
          setDesigQuery(alumni.designation || "")
        } else {
          setDesigQuery(initialData?.designation || "")
        }
      }).catch(console.error)
    }
  }, [open, alumni, universityId, departmentId, initialData])

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSearchResults(false)
      setShowOrgDropdown(false)
    }
    document.addEventListener("click", handleOutsideClick)
    return () => document.removeEventListener("click", handleOutsideClick)
  }, [])

  const handleStudentSearch = async (query: string) => {
    setStudentSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    setSearchingStudents(true)
    try {
      const students = await api.students.getAll(`search=${encodeURIComponent(query)}`)
      setSearchResults(students)
      setShowSearchResults(true)
    } catch (err) {
      console.error("Error searching students:", err)
    } finally {
      setSearchingStudents(false)
    }
  }

  if (!open) return null

  const set = (k: keyof AlumniFormData, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const setSocial = (k: string, v: string) =>
    setForm((p) => ({ ...p, social_links: { ...(p.social_links ?? {}), [k]: v } }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.alumni.update(alumni!.id, form)
      } else {
        await api.alumni.create(form)
      }
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 backdrop-blur-sm px-6 py-4">
          <div>
            <h2 className="text-base font-black tracking-tight">{isEdit ? "Edit Alumni" : "Add Alumni"}</h2>
            <p className="text-xs text-muted-foreground">Fill in the alumni's professional and contact information.</p>
          </div>
          <button onClick={onClose} className="rounded-full border p-2 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Linked Student Profile */}
          <section className="bg-muted/40 p-4 rounded-sm border space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5" /> Linked Student Profile
            </p>
            {selectedStudent ? (
              <div className="flex items-center justify-between bg-background border p-3 rounded-sm">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedStudent.user?.avatar_url ? (
                    <img src={selectedStudent.user.avatar_url} alt={selectedStudent.name} className="h-9 w-9 rounded-full object-cover border bg-muted shrink-0" />
                  ) : (
                    <Avatar name={selectedStudent.name} imageUrl={undefined} size="sm" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{selectedStudent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedStudent.student_id} • {selectedStudent.email || "No email"}</p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">
                      {selectedStudent.batch?.name && <span>Batch {selectedStudent.batch.name}</span>}
                      {selectedStudent.session?.name && <span> • {selectedStudent.session.name}</span>}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setForm(p => {
                      const { student_profile_id, batch, student_id, full_name, email, phone, ...rest } = p;
                      return rest;
                    });
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Unlink
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    className={cn(inputCls, "pl-9")}
                    placeholder="Search students by name, email, or student ID..."
                    value={studentSearchQuery}
                    onChange={(e) => handleStudentSearch(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                  />
                  {searchingStudents && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                </div>

                {showSearchResults && studentSearchQuery.trim().length >= 2 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto border bg-background rounded-sm shadow-lg divide-y">
                    {searchResults.length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground text-center">No students found for "{studentSearchQuery}"</p>
                    ) : (
                      searchResults.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setForm((p) => ({
                              ...p,
                              student_profile_id: s.id,
                              full_name: p.full_name || s.name,
                              student_id: p.student_id || s.student_id,
                              email: p.email || s.email,
                              phone: p.phone || s.phone,
                              batch: p.batch || s.batch?.name || "",
                            }));
                            setShowSearchResults(false);
                            setStudentSearchQuery("");
                          }}
                          className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {s.user?.avatar_url ? (
                              <img src={s.user.avatar_url} alt={s.name} className="h-9 w-9 rounded-full object-cover border bg-muted shrink-0" />
                            ) : (
                              <Avatar name={s.name} imageUrl={undefined} size="sm" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.student_id} • {s.email || "No email"}</p>
                              <p className="text-[10px] text-muted-foreground/60 truncate">
                                {s.batch?.name && <span>Batch {s.batch.name}</span>}
                                {s.session?.name && <span> • {s.session.name}</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Personal Info */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b">Personal Info</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input required className={inputCls} placeholder="e.g. Md. Rahim Uddin" value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Student ID</label>
                <input className={inputCls} placeholder="e.g. CSE-2018-001" value={form.student_id ?? ""} onChange={(e) => set("student_id", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Batch</label>
                <select className={inputCls} value={form.batch ?? ""} onChange={(e) => set("batch", e.target.value)}>
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Passing Year</label>
                <select className={inputCls} value={form.passing_year ?? ""} onChange={(e) => set("passing_year", e.target.value)}>
                  <option value="">Select year</option>
                  {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Current Status *</label>
                <select required className={inputCls} value={form.current_status ?? "employed"} onChange={(e) => set("current_status", e.target.value)}>
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="higher_study">Higher Study</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>
            </div>
          </section>

          {/* Employment */}
          <section onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b">Employment</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className={labelCls}>Organization</label>
                <div className="relative">
                  {selectedOrg && selectedOrg.logo_url && (
                    <img
                      src={selectedOrg.logo_url}
                      alt={selectedOrg.name}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full object-cover border bg-muted"
                    />
                  )}
                  <input
                    type="text"
                    className={cn(inputCls, selectedOrg?.logo_url ? "pl-10" : "")}
                    placeholder="Search or type to add organization..."
                    value={orgQuery}
                    onChange={(e) => {
                      const val = e.target.value
                      setOrgQuery(val)
                      set("organization", val)
                      // Check for exact case-insensitive match
                      const matched = organizations.find((o) => o.name.toLowerCase() === val.trim().toLowerCase())
                      if (matched) {
                        setSelectedOrg(matched)
                        set("organization_id", matched.id)
                      } else {
                        setSelectedOrg(null)
                        setForm((p) => {
                          const { organization_id, ...rest } = p
                          return rest
                        })
                      }
                      setShowOrgDropdown(true)
                    }}
                    onFocus={() => setShowOrgDropdown(true)}
                  />
                  {orgQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrgQuery("")
                        setSelectedOrg(null)
                        setForm((p) => {
                          const { organization_id, ...rest } = p
                          return { ...rest, organization: "" }
                        })
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {showOrgDropdown && orgQuery.trim().length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto border bg-background rounded-sm shadow-lg divide-y">
                    {/* Matching results */}
                    {organizations
                      .filter((o) => o.name.toLowerCase().includes(orgQuery.toLowerCase()))
                      .map((org) => (
                        <div
                          key={org.id}
                          onClick={() => {
                            setSelectedOrg(org)
                            setOrgQuery(org.name)
                            set("organization", org.name)
                            set("organization_id", org.id)
                            setShowOrgDropdown(false)
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                        >
                          {org.logo_url ? (
                            <img src={org.logo_url} alt={org.name} className="h-6 w-6 rounded-full object-cover border bg-muted" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                              {org.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-bold text-foreground">{org.name}</p>
                            {org.website && <p className="text-[10px] text-muted-foreground truncate">{org.website}</p>}
                          </div>
                        </div>
                      ))}

                    {/* Offer to create a new organization */}
                    {!organizations.some((o) => o.name.toLowerCase() === orgQuery.trim().toLowerCase()) && (
                      <div
                        onClick={async () => {
                          try {
                            const newOrg = await api.organizations.create({ name: orgQuery.trim() })
                            // Refresh our local organizations list
                            const updatedOrgs = await api.organizations.getAll()
                            setOrganizations(updatedOrgs)
                            
                            // Select it
                            setSelectedOrg(newOrg)
                            setOrgQuery(newOrg.name)
                            set("organization", newOrg.name)
                            set("organization_id", newOrg.id)
                          } catch (err) {
                            console.error("Error creating organization on-the-fly:", err)
                          }
                          setShowOrgDropdown(false)
                        }}
                        className="flex items-center gap-2 p-3 hover:bg-primary/10 text-primary cursor-pointer transition-colors text-xs font-bold"
                      >
                        <Plus className="h-4 w-4" />
                        Add "{orgQuery.trim()}" as a new organization
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className={labelCls}>Designation</label>
                <div className="relative">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Software Engineer"
                    value={desigQuery}
                    onChange={(e) => {
                      const val = e.target.value
                      setDesigQuery(val)
                      set("designation", val)
                      setShowDesigDropdown(true)
                    }}
                    onFocus={() => setShowDesigDropdown(true)}
                  />
                  {desigQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setDesigQuery("")
                        setForm((p) => ({ ...p, designation: "" }))
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {showDesigDropdown && desigQuery.trim().length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto border bg-background rounded-sm shadow-lg divide-y">
                    {designations
                      .filter((d) => d.toLowerCase().includes(desigQuery.toLowerCase()))
                      .map((d) => (
                        <div
                          key={d}
                          onClick={() => {
                            setDesigQuery(d)
                            set("designation", d)
                            setShowDesigDropdown(false)
                          }}
                          className="p-3 hover:bg-muted cursor-pointer transition-colors text-xs"
                        >
                          {d}
                        </div>
                      ))}

                    {!designations.some((d) => d.toLowerCase() === desigQuery.trim().toLowerCase()) && (
                      <div
                        onClick={() => {
                          setDesigQuery(desigQuery.trim())
                          set("designation", desigQuery.trim())
                          setShowDesigDropdown(false)
                        }}
                        className="flex items-center gap-2 p-3 hover:bg-primary/10 text-primary cursor-pointer transition-colors text-xs font-bold"
                      >
                        <Plus className="h-4 w-4" />
                        Add "{desigQuery.trim()}" as a new designation
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Location</label>
                <input className={inputCls} placeholder="e.g. Dhaka, Bangladesh" value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b">Contact</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} placeholder="email@example.com" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} placeholder="+8801XXXXXXXXX" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Social */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b">Social Links</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Facebook URL</label>
                <input className={inputCls} placeholder="https://facebook.com/..." value={form.social_links?.facebook ?? ""} onChange={(e) => setSocial("facebook", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>LinkedIn URL</label>
                <input className={inputCls} placeholder="https://linkedin.com/in/..." value={form.social_links?.linkedin ?? ""} onChange={(e) => setSocial("linkedin", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Bio */}
          <section>
            <label className={labelCls}>Short Bio</label>
            <textarea className={cn(inputCls, "resize-none")} rows={3} placeholder="A short professional bio..." value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="rounded-sm border px-5 py-2 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-sm bg-primary px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-all disabled:opacity-60">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
              {isEdit ? "Save Changes" : "Add Alumni"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Status badge helper ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  employed: "Employed",
  self_employed: "Self-Employed",
  higher_study: "Higher Study",
  unemployed: "Unemployed",
}
const STATUS_VARIANT: Record<string, "success" | "info" | "default" | "warn"> = {
  employed: "success",
  self_employed: "info",
  higher_study: "info",
  unemployed: "default",
}

// ─── AlumniTab ────────────────────────────────────────────────────────────────

export function AlumniTab({
  alumni,
  universityId,
  departmentId,
  onRefresh,
}: {
  alumni: Alumni[]
  universityId: string
  departmentId: string
  onRefresh: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Alumni | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orgFilter, setOrgFilter] = useState("all")
  const [organizations, setOrganizations] = useState<Organization[]>([])

  useEffect(() => {
    api.organizations.getAll().then(setOrganizations).catch(console.error)
  }, [alumni])

  async function handleDelete() {
    if (!selected) return
    setLoading(true)
    try {
      await api.alumni.delete(selected.id)
      onRefresh()
      setDeleteOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = alumni.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      a.full_name?.toLowerCase().includes(q) ||
      a.student_id?.toLowerCase().includes(q) ||
      a.organization?.toLowerCase().includes(q) ||
      a.designation?.toLowerCase().includes(q) ||
      a.batch?.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || a.current_status === statusFilter
    const matchOrg = orgFilter === "all" || a.organization_id === orgFilter
    return matchSearch && matchStatus && matchOrg
  })

  // Group by batch
  const grouped = filtered.reduce<Record<string, Alumni[]>>((acc, a) => {
    const key = a.batch || "Unknown"
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})
  const sortedBatches = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold">Alumni Network</h3>
          <p className="text-xs text-muted-foreground">
            {alumni.length} alumni registered across {sortedBatches.length} batches.
          </p>
        </div>
        <button
          onClick={() => { setSelected(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Alumni
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-sm border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            placeholder="Search by name, ID, batch, organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="employed">Employed</option>
          <option value="self_employed">Self-Employed</option>
          <option value="higher_study">Higher Study</option>
          <option value="unemployed">Unemployed</option>
        </select>
        <select
          className="rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-semibold"
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
        >
          <option value="all">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {!alumni.length ? (
        <EmptyState icon={Users2} label="alumni" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Search className="h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">No results found</p>
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setOrgFilter("all") }} className="text-xs text-primary hover:underline font-bold">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedBatches.map((batch) => (
            <div key={batch}>
              {/* Batch header */}
              <div className="flex items-center gap-4 mb-5">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                  Batch {batch}
                </h4>
                <div className="h-px flex-1 bg-border opacity-50" />
                <span className="text-[10px] font-black text-muted-foreground border px-2 py-0.5 rounded-sm">{grouped[batch].length}</span>
              </div>

              {/* Cards grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[batch].map((a) => (
                  <div key={a.id} className="group relative rounded-sm border bg-card shadow-sm hover:shadow-md transition-all">
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => { setSelected(a); setModalOpen(true) }}
                        className="p-1.5 bg-background border rounded-sm hover:bg-muted text-primary transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelected(a); setDeleteOpen(true) }}
                        className="p-1.5 bg-background border rounded-sm hover:bg-muted text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="p-5">
                      {/* Avatar + name */}
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar name={a.full_name} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate pr-14">{a.full_name}</p>
                          {a.student_id && (
                            <p className="text-xs text-muted-foreground font-mono">{a.student_id}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                            <Badge variant={STATUS_VARIANT[a.current_status] ?? "default"}>
                              {STATUS_LABELS[a.current_status] ?? a.current_status}
                            </Badge>
                            {a.student_profile_id && (
                              <Badge variant="success" className="gap-1">
                                <Link2 className="h-3 w-3" /> Linked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Employment */}
                      {(a.designation || a.organization) && (
                        <div className="flex items-start gap-2 mb-3">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            {a.designation && <p className="text-xs font-semibold truncate">{a.designation}</p>}
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                              {a.organization_ref?.logo_url ? (
                                <img
                                  src={a.organization_ref.logo_url}
                                  alt={a.organization}
                                  className="h-3.5 w-3.5 rounded-full object-cover border bg-muted shrink-0"
                                />
                              ) : organizations.find((o) => o.id === a.organization_id)?.logo_url ? (
                                <img
                                  src={organizations.find((o) => o.id === a.organization_id)!.logo_url}
                                  alt={a.organization}
                                  className="h-3.5 w-3.5 rounded-full object-cover border bg-muted shrink-0"
                                />
                              ) : null}
                              {a.organization && <p className="text-xs text-muted-foreground truncate">{a.organization}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                      {a.location && (
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{a.location}</p>
                        </div>
                      )}

                      {/* Contact + social */}
                      <div className="border-t pt-3 space-y-1.5">
                        {a.phone && (
                          <a href={`tel:${a.phone}`} className="text-xs text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <Phone className="h-3 w-3" /> {a.phone}
                          </a>
                        )}
                        {a.email && (
                          <a href={`mailto:${a.email}`} className="text-xs text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors truncate">
                            <Mail className="h-3 w-3" /> {a.email}
                          </a>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {a.social_links?.facebook && (
                            <a href={a.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> FB
                            </a>
                          )}
                          {a.social_links?.linkedin && (
                            <a href={a.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <Link2 className="h-3 w-3" /> LI
                            </a>
                          )}
                        </div>
                        {a.passing_year && (
                          <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                            Class of {a.passing_year}
                          </p>
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

      <AlumniModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        alumni={selected}
        universityId={universityId}
        departmentId={departmentId}
        onSuccess={onRefresh}
      />

      <ConfirmDelete
        open={deleteOpen}
        label="alumni record"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  )
}
