"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, LayoutList, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { title: "Circulars", href: "/career", icon: LayoutList },
  { title: "Categories", href: "/career/categories", icon: Layers },
]

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3"><Briefcase className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Career</h1>
          <p className="text-sm text-muted-foreground">Post job/exam circulars for students to browse and save.</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
        {tabs.map(tab => {
          const active = tab.href === "/career"
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
