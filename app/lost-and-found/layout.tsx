"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PackageSearch, LayoutList, Layers, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { title: "Items", href: "/lost-and-found", icon: LayoutList },
  { title: "Categories", href: "/lost-and-found/categories", icon: Layers },
  { title: "Reports", href: "/lost-and-found/reports", icon: Flag },
]

export default function LostAndFoundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3"><PackageSearch className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Lost &amp; Found Portal</h1>
          <p className="text-sm text-muted-foreground">Moderate reported items, manage categories, and resolve abuse reports.</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
        {tabs.map(tab => {
          const active = tab.href === "/lost-and-found"
            ? pathname === tab.href
            : pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn("flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-sm",
                active ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.title}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
