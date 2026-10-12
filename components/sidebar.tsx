"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { NavList } from "./nav-list"
import { NavFooter } from "./nav-footer"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <aside
      className={cn(
        "relative z-50 hidden flex-col border-r bg-card transition-all duration-300 ease-in-out md:flex",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {/* White chip keeps the navy logo readable on the dark theme. */}
          <div className="flex items-center rounded-sm bg-white px-1.5 py-0.5">
            {isCollapsed ? (
              <Image src="/logo.png" alt="Campus Assistant" width={32} height={32} priority />
            ) : (
              <Image src="/splash.png" alt="Campus Assistant" width={108} height={36} priority />
            )}
          </div>
        </Link>
      </div>

      <NavList isCollapsed={isCollapsed} />

      <NavFooter isCollapsed={isCollapsed} />

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  )
}
