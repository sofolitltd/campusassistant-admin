"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Settings, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { endSession } from "@/lib/auth"

interface NavFooterProps {
  isCollapsed?: boolean
  onNavigate?: () => void
}

/** Settings + Logout, shared by the desktop Sidebar and the mobile drawer. */
export function NavFooter({ isCollapsed = false, onNavigate }: NavFooterProps) {
  const router = useRouter()

  async function handleLogout() {
    await endSession()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="shrink-0 border-t p-4">
      <Link
        href="/settings"
        onClick={onNavigate}
        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Settings className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")} />
        {!isCollapsed && <span>Settings</span>}
      </Link>
      <button
        onClick={handleLogout}
        className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogOut className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")} />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </div>
  )
}
