"use client"

import { useState, useEffect, useCallback } from "react"
import {
  MessageSquare, Bug, Sparkles, Lightbulb, AlertTriangle,
  ChevronLeft, ChevronRight, Check, X, Reply
} from "lucide-react"
import { api, FeedbackItem } from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border bg-card shadow-sm overflow-hidden", className)}>{children}</div>
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "indigo" | "danger" }) {
  const cls = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    indigo: "bg-info-subtle text-info",
    danger: "bg-destructive-subtle text-destructive",
  }[variant]
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", cls)}>{children}</span>
}

const categoryMeta: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  bug: { icon: Bug, label: "Bug Report", color: "text-destructive bg-destructive-subtle" },
  feature: { icon: Sparkles, label: "Feature Request", color: "text-info bg-info-subtle" },
  suggestion: { icon: Lightbulb, label: "Suggestion", color: "text-warning bg-warning-subtle" },
  complaint: { icon: AlertTriangle, label: "Complaint", color: "text-warning bg-warning-subtle" },
  general: { icon: MessageSquare, label: "General", color: "text-muted-foreground bg-muted-foreground/10" },
}

function statusColor(status: string): string {
  switch (status) {
    case "resolved": return "success"
    case "reviewed": return "indigo"
    default: return "warning"
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "resolved": return "Resolved"
    case "reviewed": return "Reviewed"
    default: return "Pending"
  }
}

function ReplyModal({
  open, onClose, feedback, onSuccess
}: {
  open: boolean; onClose: () => void; feedback: FeedbackItem | null; onSuccess: () => void
}) {
  const [reply, setReply] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && feedback) {
      setReply(feedback.admin_reply || "")
      setStatus(feedback.status)
    }
  }, [open, feedback])

  if (!open || !feedback) return null
  const item = feedback

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.feedback.update(item.id, {
        status,
        admin_reply: reply,
      })
      onSuccess(); onClose()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const meta = categoryMeta[feedback.category] || categoryMeta.general

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Reply className="h-5 w-5 text-primary" /> Reply to Feedback
        </h2>

        <div className="mb-4 p-3 rounded-sm bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <meta.icon className={cn("h-4 w-4", meta.color.split(" ")[0])} />
            <span className="text-sm font-bold">{feedback.subject}</span>
          </div>
          <p className="text-xs text-muted-foreground">{feedback.message}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{feedback.user?.first_name} {feedback.user?.last_name}</span>
            <span>·</span>
            <span>{new Date(feedback.created_at).toLocaleDateString("en-GB")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</label>
            <div className="flex gap-2">
              {["pending", "reviewed", "resolved"].map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={cn("px-3 py-1.5 text-[10px] font-bold border rounded-sm hover:bg-muted transition-all",
                    status === s && "bg-primary border-primary text-white")}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Reply</label>
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              rows={4}
              className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Write your response..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-sm border py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Saving..." : "Save Reply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FeedbackClient() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [replyTarget, setReplyTarget] = useState<FeedbackItem | null>(null)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const filters = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "resolved", label: "Resolved" },
  ]

  const loadData = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(newOffset) })
      if (filterStatus) params.set("status", filterStatus)
      const res = await api.feedback.getAll(params.toString())
      setFeedbacks(res.data)
      setTotalCount(res.count)
      setOffset(newOffset)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { loadData(0) }, [loadData])

  const goToPage = (page: number) => loadData((page - 1) * PAGE_SIZE)

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3"><MessageSquare className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">User Feedback</h1>
            <p className="text-sm text-muted-foreground">Review, reply, and manage user feedback submissions.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
        {filters.map(f => (
          <button key={f.value} onClick={() => { setFilterStatus(f.value); setOffset(0) }}
            className={cn("px-4 py-2 text-sm font-bold transition-all rounded-sm",
              filterStatus === f.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">User</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Category</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Subject</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {feedbacks.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground italic">No feedback submissions found.</td></tr>
                ) : (
                  feedbacks.map(f => {
                    const meta = categoryMeta[f.category] || categoryMeta.general
                    return (
                      <tr key={f.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs uppercase">
                              {f.user?.first_name?.[0] || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{f.user?.first_name} {f.user?.last_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{f.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest", meta.color)}>
                            <meta.icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 max-w-[250px]">
                          <p className="font-bold text-sm truncate">{f.subject}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{f.message}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("en-GB")}</td>
                        <td className="px-4 py-4"><Badge variant={statusColor(f.status) as any}>{statusLabel(f.status)}</Badge></td>
                        <td className="px-4 py-4 text-right pr-6">
                          <button onClick={() => setReplyTarget(f)}
                            className="rounded-full p-2 hover:bg-info-subtle hover:text-info transition-all text-muted-foreground"
                            title="Reply"
                          >
                            <Reply className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
              className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
            ><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => goToPage(p)}
                className={`min-w-[36px] h-9 rounded-sm text-sm font-bold transition-all ${p === currentPage ? "bg-primary text-primary-foreground shadow-sm" : "border hover:bg-accent"}`}
              >{p}</button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
              className="rounded-sm border p-2 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
            ><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </Card>

      <ReplyModal open={!!replyTarget} onClose={() => setReplyTarget(null)} feedback={replyTarget} onSuccess={() => loadData(offset)} />
    </div>
  )
}
