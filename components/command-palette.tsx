"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2, Search, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { flatNavItems } from "@/lib/nav-items"
import { api, type Department } from "@/lib/api"
import { DEPARTMENT_TABS, departmentHref, getRecentDepartments } from "@/lib/department-jump"

interface CommandPaletteContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommandPaletteContext =
  React.createContext<CommandPaletteContextValue | null>(null)

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return ctx
}

/** The visible "Search... ⌘K" button that opens the palette. Drop this into
 * any header; it only needs the context from CommandPaletteProvider.
 * `compact` renders an icon-only round button instead — for narrow headers
 * (phones) where the full "Search menu... ⌘K" bar doesn't have room and
 * ends up dominating the layout. */
export function SearchTrigger({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { setOpen } = useCommandPalette()
  // Client-only so the ⌘/Ctrl hint never mismatches server-rendered markup.
  const [shortcutLabel, setShortcutLabel] = React.useState("Ctrl K")
  React.useEffect(() => {
    if (navigator.platform.toLowerCase().includes("mac")) setShortcutLabel("⌘K")
  }, [])

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search menu"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className
        )}
      >
        <Search className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search menu...</span>
      <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
        {shortcutLabel}
      </kbd>
    </button>
  )
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      {open && <CommandPaletteModal onClose={() => setOpen(false)} />}
    </CommandPaletteContext.Provider>
  )
}

interface PaletteItem {
  key: string
  title: string
  subtitle?: string
  href: string
  icon: LucideIcon
  group: string
}

interface DeptEntry {
  id: string
  universityId: string
  name: string
  acronym: string
  universityName: string
  haystack: string
}

// Loaded once per page session on first open; ~360 departments is small
// enough to filter client-side.
let deptCache: Promise<DeptEntry[]> | null = null

function loadDepartments(): Promise<DeptEntry[]> {
  if (!deptCache) {
    deptCache = (async () => {
      const [universities, departments] = await Promise.all([
        api.universities.getAll("limit=100"),
        (async () => {
          const all: Department[] = []
          for (let offset = 0; ; offset += 100) {
            const page = await api.departments.getAll(`limit=100&offset=${offset}`)
            all.push(...page)
            if (page.length < 100) break
          }
          return all
        })(),
      ])
      const uniById = new Map(universities.map((u) => [u.id, u]))
      return departments.map((d) => {
        const uni = uniById.get(d.university_id)
        const universityName = uni?.acronym || uni?.name || ""
        return {
          id: d.id,
          universityId: d.university_id,
          name: d.name,
          acronym: d.acronym,
          universityName,
          haystack: `${d.name} ${d.acronym} ${d.slug} ${uni?.acronym ?? ""} ${uni?.name ?? ""}`.toLowerCase(),
        }
      })
    })().catch((e) => {
      deptCache = null
      throw e
    })
  }
  return deptCache
}

// "psy study" → { tab: study, deptTerms: ["psy"] }. The last word only counts
// as a tab when something else is left to match the department.
function parseQuery(q: string) {
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length > 1) {
    const last = words[words.length - 1]
    const tab = DEPARTMENT_TABS.find((t) => t.id.startsWith(last) || t.label.toLowerCase().startsWith(last))
    if (tab) return { tab, deptTerms: words.slice(0, -1) }
  }
  return { tab: undefined, deptTerms: words }
}

function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [departments, setDepartments] = React.useState<DeptEntry[]>([])
  const [recents] = React.useState(getRecentDepartments)

  React.useEffect(() => {
    let cancelled = false
    loadDepartments()
      .then((d) => { if (!cancelled) setDepartments(d) })
      .catch((e) => console.error("Failed to load departments for search:", e))
    return () => { cancelled = true }
  }, [])

  const results = React.useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase()
    const menuItems = flatNavItems
      .filter((item) => !q || item.title.toLowerCase().includes(q))
      .map((item) => ({ key: item.href, title: item.title, href: item.href, icon: item.icon, group: "Menu" }))

    if (!q) {
      const recentItems = recents.map((d) => ({
        key: `recent-${d.id}`,
        title: d.name,
        subtitle: d.universityName,
        href: departmentHref(d.universityId, d.id),
        icon: Building2,
        group: "Recent departments",
      }))
      return [...recentItems, ...menuItems]
    }

    const { tab, deptTerms } = parseQuery(q)
    const deptItems = departments
      .filter((d) => deptTerms.every((t) => d.haystack.includes(t)))
      // Exact acronym first ("psy" → Psychology), then shorter names.
      .sort((a, b) =>
        Number(b.acronym.toLowerCase() === deptTerms[0]) - Number(a.acronym.toLowerCase() === deptTerms[0]) ||
        a.name.length - b.name.length
      )
      .slice(0, 8)
      .map((d) => ({
        key: `dept-${d.id}`,
        title: tab ? `${d.name} → ${tab.label}` : d.name,
        subtitle: d.universityName,
        href: departmentHref(d.universityId, d.id, tab?.id),
        icon: Building2,
        group: "Departments",
      }))
    return [...menuItems, ...deptItems]
  }, [query, departments, recents])

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function onQueryChange(value: string) {
    setQuery(value)
    setActiveIndex(0)
  }

  function go(href: string) {
    router.push(href)
    onClose()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = results[activeIndex]
      if (item) go(item.href)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search menu or department — e.g. psy study"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((item, index) => (
              <React.Fragment key={item.key}>
                {item.group !== results[index - 1]?.group && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    index === activeIndex
                      ? "bg-primary-gradient text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className={cn("ml-auto flex-shrink-0 text-xs", index === activeIndex ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {item.subtitle}
                    </span>
                  )}
                </button>
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
