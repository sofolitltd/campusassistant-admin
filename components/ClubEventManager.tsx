"use client"

import { useState, useEffect } from "react"
import {
  CalendarClock,
  Plus,
  Trash2,
  Loader2,
  MapPin,
  Bell,
} from "lucide-react"
import { api, ClubEvent } from "@/lib/api"
import { Field, inputCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

interface ClubEventManagerProps {
  clubId: string
}

export function ClubEventManager({ clubId }: ClubEventManagerProps) {
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [publishNow, setPublishNow] = useState(false)

  useEffect(() => {
    api.clubEvents.getByClub(clubId)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clubId])

  async function handleAdd() {
    if (!title.trim() || !startAt) {
      alert("Title and start date/time are required.")
      return
    }
    if (publishNow && !confirm("This will immediately push a notification to everyone following this club. Continue?")) {
      return
    }
    setAdding(true)
    try {
      const created = await api.clubEvents.create({
        club_id: clubId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : undefined,
        is_published: publishNow,
      })
      setEvents(prev => [...prev, created].sort((a, b) => a.start_at.localeCompare(b.start_at)))
      setTitle(""); setDescription(""); setLocation(""); setStartAt(""); setEndAt(""); setPublishNow(false)
    } catch (err: any) {
      alert(`Failed to add event: ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return
    setDeletingId(id)
    try {
      await api.clubEvents.delete(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err: any) {
      alert(`Failed to delete event: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 font-semibold text-primary mb-2">
        <CalendarClock className="h-5 w-5" />
        <h2>Events ({events.length})</h2>
      </div>

      <div className="rounded-lg border border-dashed p-4 space-y-3 bg-muted/10">
        <Field label="Title" required>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual General Meeting" className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Starts" required>
            <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ends">
            <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Location">
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Auditorium, Building 2" className={inputCls} />
        </Field>

        <label className="flex items-start gap-2 cursor-pointer rounded-md bg-amber-50 dark:bg-amber-900/10 p-2.5 border border-amber-200 dark:border-amber-900/30">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={e => setPublishNow(e.target.checked)}
            className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-xs">
            <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
              <Bell className="h-3 w-3" /> Publish &amp; notify followers
            </span>
            <span className="text-muted-foreground">Sends a one-time push notification to everyone following this club. Cannot be undone.</span>
          </span>
        </label>

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Event
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No events yet.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-3 rounded-lg border bg-background p-3">
              <div className="flex-shrink-0 flex flex-col items-center justify-center h-12 w-12 rounded-md bg-muted text-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  {new Date(event.start_at).toLocaleString(undefined, { month: "short" })}
                </span>
                <span className="text-sm font-bold leading-none">
                  {new Date(event.start_at).getDate()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span>{new Date(event.start_at).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                  {event.location && (
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{event.location}</span>
                  )}
                  <span className={`rounded-full px-1.5 py-0.5 font-bold uppercase ${event.is_published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {event.is_published ? "Notified" : "Draft"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(event.id)}
                disabled={deletingId === event.id}
                className="rounded-full p-1.5 text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
              >
                {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
