// Shortcuts for reaching a department without clicking through
// Universities → university → department: the command palette searches
// departments (optionally with a tab, e.g. "psy study") and lists the ones
// visited recently.

export const DEPARTMENT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "batches", label: "Batches" },
  { id: "students", label: "Students" },
  { id: "study", label: "Study" },
  { id: "teachers", label: "Teachers" },
  { id: "staff", label: "Staff" },
  { id: "crs", label: "CRs" },
  { id: "banners", label: "Banners" },
  { id: "contacts", label: "Contacts" },
  { id: "alumni", label: "Alumni" },
  { id: "routines", label: "Routines" },
  { id: "notices", label: "Notices" },
] as const

export interface RecentDepartment {
  id: string
  universityId: string
  name: string
  acronym: string
  universityName: string
}

const RECENT_KEY = "recent_departments"
const RECENT_LIMIT = 5

export function departmentHref(universityId: string, departmentId: string, tab?: string) {
  const base = `/universities/${universityId}/departments/${departmentId}`
  return tab && tab !== "overview" ? `${base}?tab=${tab}` : base
}

// localStorage can be unavailable (private window, blocked storage), in
// which case recents are simply empty.
export function getRecentDepartments(): RecentDepartment[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as RecentDepartment[]) : []
  } catch {
    return []
  }
}

export function addRecentDepartment(dept: RecentDepartment) {
  try {
    const rest = getRecentDepartments().filter((d) => d.id !== dept.id)
    localStorage.setItem(RECENT_KEY, JSON.stringify([dept, ...rest].slice(0, RECENT_LIMIT)))
  } catch {
    // ignore — recents are a convenience
  }
}
