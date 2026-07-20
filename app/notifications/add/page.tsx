"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { api } from "@/lib/api"
import { inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

const NOTIFICATION_TYPES = [
  { value: "general", label: "General" },
  { value: "routineUpdate", label: "Routine Update" },
  { value: "studyMaterial", label: "Study Material" },
  { value: "notice", label: "Notice" },
  { value: "exam", label: "Exam" },
  { value: "event", label: "Event" },
]

const SCOPES = [
  { value: "university", label: "University" },
  { value: "department", label: "Department" },
  { value: "batch", label: "Batch" },
  { value: "user", label: "User" },
]

export default function AddNotificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "general",
    scope: "university",
    target_id: "",
    action_route: "",
  })

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.scope !== "university" && !form.target_id) {
      alert("Target ID is required when scope is batch, department, or user.")
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        body: form.body,
        type: form.type,
        scope: form.scope,
        data: {} as Record<string, unknown>,
      }
      if (form.target_id) payload.target_id = form.target_id
      if (form.action_route) {
        (payload.data as Record<string, unknown>).action_route = form.action_route
      }
      const result = await api.notifications.create(payload) as { count?: number }
      if (!result?.count) {
        alert("No matching users were found for the given scope/target — no notification was sent.")
        return
      }
      router.push("/notifications")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send notification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8 pb-32 md:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="rounded-full p-2 hover:bg-accent transition-colors border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Send Notification</h1>
            <p className="text-muted-foreground">Send a push notification to users.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Content</h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Exam Schedule Updated"
              value={form.title}
              onChange={e => update("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Body <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              className={`${inputCls} min-h-[100px] resize-y`}
              placeholder="Notification message content..."
              value={form.body}
              onChange={e => update("body", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Type <span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                className={selectCls}
                value={form.type}
                onChange={e => update("type", e.target.value)}
              >
                {NOTIFICATION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Scope <span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                className={selectCls}
                value={form.scope}
                onChange={e => update("scope", e.target.value)}
              >
                {SCOPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Targeting</h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target ID</label>
            <input
              className={inputCls}
              placeholder="Leave empty for University-wide; enter batch/department/user ID"
              value={form.target_id}
              onChange={e => update("target_id", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Required when scope is batch, department, or user.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Action Route</label>
            <input
              className={inputCls}
              placeholder="e.g. /routine, /study, /notice/123"
              value={form.action_route}
              onChange={e => update("action_route", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Deep link route users navigate to when tapping the notification.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/notifications"
            className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold hover:bg-muted transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </form>
    </div>
  )
}
