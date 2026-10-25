import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  CreditCard,
  School,
  Bell,
  Phone,
  Handshake,
  Sparkles,
  Users2,
  ShoppingBag,
  Landmark,
  PackageSearch,
  Briefcase,
  Shield,
  TicketPercent,
  PartyPopper,
  MessageSquare,
  Wallet,
  ScrollText,
  BadgeCheck,
  Smartphone,
  Gift,
  type LucideIcon,
  KeyRound,
} from "lucide-react"

export interface NavLeaf {
  title: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  title: string
  icon: LucideIcon
  items: NavLeaf[]
}

export type NavEntry = NavLeaf | NavGroup

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry
}

// Desktop sidebar structure: a handful of high-frequency sections stay
// top-level, everything else is grouped so the sidebar doesn't need its own
// scrollbar to show every section at once. This is the only nav list: the
// desktop sidebar, the mobile drawer and the command palette all read it.
export const navStructure: NavEntry[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Universities", href: "/universities", icon: School },
  { title: "Users", href: "/users", icon: Users },
  { title: "Verifications", href: "/verifications", icon: BadgeCheck },
  {
    title: "Community",
    icon: Users2,
    items: [
      { title: "Clubs", href: "/clubs", icon: Users2 },
      { title: "Associations", href: "/associations", icon: Landmark },
      { title: "Contributors", href: "/contributors", icon: Handshake },
      { title: "Contacts", href: "/contacts", icon: Phone },
    ],
  },
  {
    title: "Commerce",
    icon: ShoppingBag,
    items: [
      { title: "Marketplace", href: "/marketplace", icon: ShoppingBag },
      { title: "Lost & Found", href: "/lost-and-found", icon: PackageSearch },
      { title: "Career", href: "/career", icon: Briefcase },
    ],
  },
  {
    title: "Monetization",
    icon: Wallet,
    items: [
      { title: "Subscriptions", href: "/subscriptions", icon: CreditCard },
      { title: "Billing", href: "/billing", icon: Wallet },
      { title: "Coupons", href: "/coupons", icon: TicketPercent },
      { title: "Access Grants", href: "/access-grants", icon: PartyPopper },
    ],
  },
  {
    title: "Engagement",
    icon: Bell,
    items: [
      { title: "Banners", href: "/banners", icon: ImageIcon },
      { title: "Skills", href: "/skills", icon: Sparkles },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Feedback", href: "/feedback", icon: MessageSquare },
      { title: "Referrals", href: "/referrals", icon: Gift },
    ],
  },
  {
    title: "System",
    icon: Shield,
    items: [
      { title: "Admins", href: "/admins", icon: Shield },
      { title: "Password Resets", href: "/password-resets", icon: KeyRound },
      { title: "Logs", href: "/logs", icon: ScrollText },
      { title: "App Version", href: "/app-version", icon: Smartphone },
    ],
  },
]

/** Flat list of every navigable leaf, used by the command palette search. */
export const flatNavItems: NavLeaf[] = navStructure.flatMap((entry) =>
  isNavGroup(entry) ? entry.items : [entry]
)
