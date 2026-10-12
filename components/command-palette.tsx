"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { flatNavItems } from "@/lib/nav-items"

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

function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return flatNavItems
    return flatNavItems.filter((item) => item.title.toLowerCase().includes(q))
  }, [query])

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
            placeholder="Search menu..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No menu item matches &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.href}
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
                <span>{item.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
