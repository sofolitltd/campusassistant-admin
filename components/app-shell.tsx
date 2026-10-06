"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"

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

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 text-foreground">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  )
}
