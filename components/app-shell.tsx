"use client"

import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Sidebar } from "./sidebar"
import { MobileNavDrawer } from "./mobile-nav-drawer"
import { CommandPaletteProvider, SearchTrigger } from "./command-palette"
import { ProfileAvatar } from "./profile-avatar"

// Layout only. Redirecting logged-out visitors is proxy.ts's job now — it runs
// before the page renders and reads the httpOnly session cookie, so there is no
// token check (and no mount flicker) left to do here.
//
// Routes reachable without a session; keep in sync with AUTH_PAGES in proxy.ts.
const AUTH_PAGES = ["/login", "/forgot-password"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <CommandPaletteProvider>
      <Sidebar />
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* The sidebar (and its full nav) is hidden below md — phones get a
            hamburger that opens the same grouped nav in a drawer instead,
            plus a compact (icon-only) search trigger and the account avatar. */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-card px-4 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="rounded-sm bg-white px-1.5 py-0.5">
            <Image src="/splash.png" alt="Campus Assistant" width={90} height={30} priority />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <SearchTrigger compact />
            <ProfileAvatar />
          </div>
        </header>
        {/* Desktop top bar: the sidebar already carries the logo and nav, so
            this is just search + account. */}
        <header className="hidden h-14 shrink-0 items-center justify-end gap-4 border-b bg-card px-4 md:flex md:px-8">
          <SearchTrigger className="w-72" />
          <ProfileAvatar />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 text-foreground">
          <div className="page-wide">{children}</div>
        </main>
      </div>
    </CommandPaletteProvider>
  )
}
