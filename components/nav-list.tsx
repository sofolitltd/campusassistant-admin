"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { navStructure, isNavGroup, type NavGroup } from "@/lib/nav-items"

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.items.some((item) => item.href === pathname)
}

interface NavListProps {
  /** Icon-only rail mode (desktop sidebar collapsed state). */
  isCollapsed?: boolean
  /** Called whenever a leaf link is actually navigated to — lets a drawer
   * close itself on tap without closing when just toggling a group open. */
  onNavigate?: () => void
}

export function NavList({ isCollapsed = false, onNavigate }: NavListProps) {
  const pathname = usePathname()
  // Explicit open/close per group, keyed by title. A group the user hasn't
  // touched yet (no key present) defaults to open when it contains the
  // active route, so navigating into a section expands it automatically
  // without permanently locking it open once the user collapses it.
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    {}
  )

  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
      {navStructure.map((entry) => {
        if (!isNavGroup(entry)) {
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === entry.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <entry.icon
                className={cn("h-5 w-5 flex-shrink-0", isCollapsed ? "mr-0" : "mr-3")}
              />
              {!isCollapsed && <span>{entry.title}</span>}
            </Link>
          )
        }

        const isActiveGroup = groupContainsPath(entry, pathname)
        const isOpen = entry.title in openGroups
          ? openGroups[entry.title]
          : isActiveGroup

        if (isCollapsed) {
          // Icon rail has no room for an accordion — jump straight to the
          // group's first item instead.
          return (
            <Link
              key={entry.title}
              href={entry.items[0].href}
              title={entry.title}
              onClick={onNavigate}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActiveGroup
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <entry.icon className="h-5 w-5 flex-shrink-0" />
            </Link>
          )
        }

        return (
          <div key={entry.title}>
            <button
              type="button"
              onClick={() =>
                setOpenGroups((prev) => ({ ...prev, [entry.title]: !isOpen }))
              }
              className={cn(
                "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActiveGroup && !isOpen
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <entry.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">{entry.title}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="mt-1 space-y-1 border-l pl-3">
                {entry.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
