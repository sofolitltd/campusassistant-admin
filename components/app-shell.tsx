"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"
import { getToken } from "@/lib/auth"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname === "/login"
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const token = getToken()
    if (!token && !isAuthPage) {
      router.push("/login")
    } else if (token && isAuthPage) {
      router.push("/")
    }
  }, [mounted, pathname, router, isAuthPage])

  if (!mounted) {
    return (
      <div className="flex h-full w-full">
        {isAuthPage ? children : null}
      </div>
    )
  }

  const token = getToken()

  if (!token && !isAuthPage) return null
  if (token && isAuthPage) return null

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
