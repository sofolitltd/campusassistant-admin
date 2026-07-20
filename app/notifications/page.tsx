import { Suspense } from "react"
import { api } from "@/lib/api"
import NotificationsClient from "./notifications-client"
import { Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  let notifications: Awaited<ReturnType<typeof api.notifications.getAll>> = []
  try {
    notifications = await api.notifications.getAll()
  } catch {
    // API unavailable during build — render empty
  }

  return (
    <Suspense fallback={
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">Loading Notifications...</p>
      </div>
    }>
      <NotificationsClient initialNotifications={notifications} />
    </Suspense>
  )
}
