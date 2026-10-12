"use client"

import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"

import { NavList } from "./nav-list"
import { NavFooter } from "./nav-footer"

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
}

/** Replaces the old bottom-nav on phones: a hamburger-triggered drawer that
 * carries the same grouped nav the desktop Sidebar uses, instead of trying
 * to cram every section into a handful of fixed bottom tabs. */
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r bg-card shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <Link href="/" onClick={onClose} className="flex items-center">
            <div className="rounded-sm bg-white px-1.5 py-0.5">
              <Image src="/splash.png" alt="Campus Assistant" width={96} height={32} priority />
            </div>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <NavList onNavigate={onClose} />
        <NavFooter onNavigate={onClose} />
      </div>
    </div>
  )
}
