"use client"

import * as React from "react"
import Link from "next/link"

import { getAdmin } from "@/lib/auth"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase() || "A"
}

/** Avatar chip that links to /settings — the admin's own account page. */
export function ProfileAvatar({ className }: { className?: string }) {
  const [admin, setAdmin] = React.useState<ReturnType<typeof getAdmin>>(null)

  // getAdmin() reads document.cookie, so it only resolves client-side.
  React.useEffect(() => {
    setAdmin(getAdmin())
  }, [])

  return (
    <Link
      href="/settings"
      title={admin?.name ?? "Account"}
      className={className}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
        {admin ? initials(admin.name) : "…"}
      </div>
    </Link>
  )
}
