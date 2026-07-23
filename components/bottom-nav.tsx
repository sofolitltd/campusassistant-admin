"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  CreditCard,
  School,
  Settings,
  Phone,
  Bell,
  Sparkles,
  Users2,
  Landmark,
  ShoppingBag,
  Handshake,
  PackageSearch,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dash",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Unis",
    href: "/universities",
    icon: School,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Banners",
    href: "/banners",
    icon: ImageIcon,
  },
  {
    title: "Subs",
    href: "/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Notify",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Helps",
    href: "/contacts",
    icon: Phone,
  },
  {
    title: "Skills",
    href: "/skills",
    icon: Sparkles,
  },
  {
    title: "Clubs",
    href: "/clubs",
    icon: Users2,
  },
  {
    title: "Assoc",
    href: "/associations",
    icon: Landmark,
  },
  {
    title: "Market",
    href: "/marketplace",
    icon: ShoppingBag,
  },
  {
    title: "L&F",
    href: "/lost-and-found",
    icon: PackageSearch,
  },
  {
    title: "Career",
    href: "/career",
    icon: Briefcase,
  },
  {
    title: "Contrib",
    href: "/contributors",
    icon: Handshake,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center gap-1 overflow-x-auto border-t bg-card px-2 pb-safe md:hidden scrollbar-hide"
      onWheel={(e) => {
        e.currentTarget.scrollLeft += e.deltaY
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] flex-shrink-0 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "fill-current/10")} />
            <span className="text-[10px] font-medium">{item.title}</span>
            {isActive && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
