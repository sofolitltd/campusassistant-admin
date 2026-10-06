"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, LayoutDashboard, CreditCard, Landmark, Undo2, BookOpen, FileText, SlidersHorizontal, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { title: "Overview", href: "/billing", icon: LayoutDashboard, exact: true },
  { title: "Payments", href: "/billing/payments", icon: CreditCard },
  { title: "Payouts", href: "/billing/payouts", icon: Landmark },
  { title: "Refunds", href: "/billing/refunds", icon: Undo2 },
  { title: "Ledger", href: "/billing/ledger", icon: BookOpen },
  { title: "Invoices", href: "/billing/invoices", icon: FileText },
  { title: "Entitlements", href: "/billing/entitlements", icon: SlidersHorizontal },
  { title: "Commission", href: "/billing/commission", icon: Percent },
]

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3"><Wallet className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">Revenue, payments, merchant payouts, refunds, invoices and plan entitlements.</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-full overflow-x-auto md:w-fit">
        {tabs.map(tab => {
          const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn("flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-sm",
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
