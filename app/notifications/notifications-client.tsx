"use client"

import { useState } from "react"
import {
  Plus,
  Bell,
  MoreVertical,
  Trash2,
  CheckCheck,
  Globe,
  Users,
  GraduationCap,
  Building2,
  User,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { api, AppNotification } from "@/lib/api"
import { ConfirmDelete } from "../universities/[id]/departments/[...slug]/components/SharedUI"

interface NotificationsClientProps {
  initialNotifications: AppNotification[]
}

const typeStyles: Record<string, string> = {
  routineUpdate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  studyMaterial: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  notice: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  exam: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  event: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
}

const scopeIcons: Record<string, React.ReactNode> = {
  university: <Globe className="h-3 w-3" />,
  department: <Building2 className="h-3 w-3" />,
  batch: <GraduationCap className="h-3 w-3" />,
  user: <User className="h-3 w-3" />,
}

export default function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.notifications.delete(deleteId)
      setNotifications(prev => prev.filter(n => n.id !== deleteId))
      setDeleteId(null)
    } catch {
      alert("Failed to delete notification")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">Manage push notifications sent to users.</p>
        </div>
        <Link
          href="/notifications/add"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all active:scale-95 w-max whitespace-nowrap flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Send Notification
        </Link>
      </div>

      {notifications.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No notifications yet</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">
            Create your first push notification to send to users.
          </p>
          <Link href="/notifications/add" className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4" /> Send Notification
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="group flex items-start gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-sm border-border/60"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>

              {notification.image_url && (
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={notification.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm leading-tight">
                        {notification.title}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${typeStyles[notification.type] || typeStyles.general}`}>
                        {notification.type.replace(/([A-Z])/g, ' $1').trim() || 'General'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notification.body}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(notification.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      {notification.scope && (
                        <span className="flex items-center gap-1">
                          {scopeIcons[notification.scope] || <Globe className="h-3 w-3" />}
                          {notification.scope}
                        </span>
                      )}
                      {notification.target_id && (
                        <span className="flex items-center gap-1 text-primary">
                          Target: {notification.target_id}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Sent to {notification.recipient_count} {notification.recipient_count === 1 ? "user" : "users"}
                        {" · "}
                        <CheckCheck className="h-3 w-3" />
                        {notification.read_count} read
                      </span>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setActiveMenu(activeMenu === notification.id ? null : notification.id)}
                      className="rounded-full p-1.5 hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {activeMenu === notification.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 top-8 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              setDeleteId(notification.id)
                              setActiveMenu(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDelete
        open={!!deleteId}
        label="notification"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
