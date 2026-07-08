"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, GraduationCap, Layers, Users, BookOpen, UserSquare2,
  Briefcase, Megaphone, Phone, Info, Clock, Loader2, MapPin, Globe,
  School, CalendarDays, ExternalLink, Users2
} from "lucide-react"

// API & Types
import { 
  api, Department, Session, Batch, Student, Teacher, Staff, 
  Semester, CR, Banner, EmergencyContact, University, Alumni, Routine
} from "@/lib/api"
import { cn } from "@/lib/utils"

// Modular Components
import { AboutTab } from "./components/AboutTab"
import { SessionsTab } from "./components/SessionsTab"
import { BatchesTab } from "./components/BatchesTab"
import { StudentsTab } from "./components/StudentsTab"
import { StudyTab } from "./components/StudyTab"
import { TeachersTab, StaffTab } from "./components/TeachersAndStaff"
import { CRsTab, BannersTab, ContactsTab } from "./components/ExtraTabs"
import { AlumniTab } from "./components/AlumniTab"
import { RoutineTab } from "./components/RoutineTab"

type TabType = "overview" | "sessions" | "batches" | "students" | "study" | "teachers" | "staff" | "crs" | "banners" | "contacts" | "alumni" | "routines"

interface TabData {
  sessions: Session[]; batches: Batch[]; students: Student[]
  study: Semester[]; teachers: Teacher[]; staff: Staff[]
  crs: CR[]; banners: Banner[]; contacts: EmergencyContact[]; alumni: Alumni[]; routines: Routine[]
}

interface DepartmentDetailClientProps {
  department: Department
  university: University
  initialBanners: Banner[]
  universityId: string
  departmentId: string
}

export default function DepartmentDetailClient({
  department,
  university,
  initialBanners,
  universityId,
  departmentId
}: DepartmentDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize from URL
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get("tab") as TabType) || "overview")
  const [tabData, setTabData] = useState<TabData>({
    sessions: [], batches: [], students: [], study: [],
    teachers: [], staff: [], crs: [], banners: initialBanners, contacts: [], alumni: [], routines: []
  })
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set(initialBanners.length > 0 ? ["banners"] : []))

  // Sync URL when tab changes internally
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("tab", tab)
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }, [router, searchParams])

  const loadTabData = useCallback(async (tab: TabType, force = false) => {
    if (tab === "overview" || !departmentId) return
    if (!force && loadedTabs.has(tab)) return

    try {
      let patch: Partial<TabData> = {}
      switch (tab) {
        case "sessions": patch = { sessions: await api.sessions.getAllByDepartment(departmentId) }; break
        case "batches": patch = { batches: await api.batches.getAllByDepartment(departmentId) }; break
        case "students":
          const [bList, sList] = await Promise.all([
            api.batches.getAllByDepartment(departmentId),
            api.students.getAllByDepartment(departmentId)
          ])
          patch = { batches: bList, students: sList }; break
        case "study": {
          const [semList, batchList] = await Promise.all([
            api.semesters.getAllByDepartment(departmentId),
            loadedTabs.has("batches") ? Promise.resolve(tabData.batches) : api.batches.getAllByDepartment(departmentId),
          ])
          patch = { study: semList, batches: batchList }; break
        }
        case "teachers": patch = { teachers: await api.teachers.getAllByDepartment(departmentId) }; break
        case "staff": patch = { staff: await api.staffs.getAllByDepartment(departmentId) }; break
        case "crs": patch = { crs: await api.crs.getAllByDepartment(departmentId) }; break
        case "banners": patch = { banners: await api.banners.getAllByDepartment(departmentId) }; break
        case "contacts": patch = { contacts: await api.emergencyContacts.getAllByDepartment(universityId, departmentId) }; break
        case "alumni": patch = { alumni: await api.alumni.getAllByDepartment(universityId, departmentId) }; break
        case "routines": patch = { routines: await api.routines.getAllByDepartment(universityId, departmentId) }; break
      }
      setTabData((prev) => ({ ...prev, ...patch }))
      setLoadedTabs((prev) => new Set([...prev, tab]))
    } catch (e) {
      console.error(`Failed to load tab ${tab}:`, e)
    }
  }, [departmentId, loadedTabs])

  useEffect(() => { loadTabData(activeTab) }, [activeTab, loadTabData])

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "sessions", label: "Sessions", icon: Clock },
    { id: "batches", label: "Batches", icon: Layers },
    { id: "students", label: "Students", icon: Users },
    { id: "study", label: "Study", icon: BookOpen },
    { id: "teachers", label: "Teachers", icon: UserSquare2 },
    { id: "staff", label: "Staff", icon: Briefcase },
    { id: "crs", label: "CRs", icon: GraduationCap },
    { id: "banners", label: "Banners", icon: Megaphone },
    { id: "contacts", label: "Contacts", icon: Phone },
    { id: "alumni", label: "Alumni", icon: Users2 },
    { id: "routines", label: "Routines", icon: CalendarDays },
  ]

  return (
    <div className="space-y-8 pb-32">
      {/* Header - Unified with University Style */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/universities/${universityId}`} className="rounded-full border p-2 hover:bg-accent transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card p-2 shadow-sm">
              {department.logo_url ? (
                <img src={department.logo_url} alt={department.name} className="h-full w-full object-contain" />
              ) : (
                <GraduationCap className="h-8 w-8 text-muted-foreground opacity-20" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight md:text-2xl lg:text-3xl leading-tight">{department.name}</h1>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-black text-primary uppercase tracking-tighter">{department.acronym}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-bold text-primary/80 uppercase tracking-tighter text-[11px]">
                  <School className="h-3.5 w-3.5" /> {university?.name}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CalendarDays className="h-3.5 w-3.5" /> Est. {department.established_year || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Sticky */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-8 bg-background/80 backdrop-blur-md border-b px-4 md:px-8 overflow-x-auto scrollbar-hide ">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const count = (tabData as any)[tab.id]?.length
            const isAct = activeTab === tab.id
            return (
              <button 
                key={tab.id} 
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-black tracking-tight transition-all whitespace-nowrap border-b-2 -mb-px uppercase",
                  isAct ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black tracking-tighter",
                    isAct ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Modular Tab Panels ─── */}
      <main className="min-h-[50vh] animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "overview" && <AboutTab department={department} university={university} />}
        {activeTab === "sessions" && <SessionsTab sessions={tabData.sessions} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("sessions", true)} />}
        {activeTab === "batches" && <BatchesTab batches={tabData.batches} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("batches", true)} />}
        {activeTab === "students" && <StudentsTab batches={tabData.batches} universityId={universityId} departmentId={departmentId} onBatchesRefresh={() => loadTabData("batches", true)} />}
        {activeTab === "study" && <StudyTab study={tabData.study} universityId={universityId} departmentId={departmentId} batches={tabData.batches} onRefresh={() => loadTabData("study", true)} />}
        {activeTab === "teachers" && <TeachersTab teachers={tabData.teachers} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("teachers", true)} />}
        {activeTab === "staff" && <StaffTab staff={tabData.staff} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("staff", true)} />}
        {activeTab === "crs" && <CRsTab crs={tabData.crs} />}
        {activeTab === "banners" && <BannersTab banners={tabData.banners} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("banners", true)} />}
        { activeTab === "contacts" && <ContactsTab contacts={tabData.contacts} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("contacts", true)} />}
        {activeTab === "alumni" && <AlumniTab alumni={tabData.alumni} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("alumni", true)} />}
        {activeTab === "routines" && <RoutineTab routines={tabData.routines} universityId={universityId} departmentId={departmentId} onRefresh={() => loadTabData("routines", true)} />}
      </main>
    </div>
  )
}
