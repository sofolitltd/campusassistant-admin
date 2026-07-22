"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, Store, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { title: "Merchants", href: "/marketplace/merchants", icon: Store },
  { title: "Products", href: "/marketplace/products", icon: Package },
]

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3"><ShoppingBag className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Campus Marketplace</h1>
          <p className="text-sm text-muted-foreground">Manage merchants and the products they sell.</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
        {tabs.map(tab => {
          const active = pathname?.startsWith(tab.href)
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
