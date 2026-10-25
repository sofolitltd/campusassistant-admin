"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api, User, UserSubscription } from "@/lib/api"
import { fmtDdMmYy } from "@/lib/utils"
import { EditUserModal } from "../EditUserModal"
import { SubscriptionModal } from "../SubscriptionModal"
import { GrantProModal, GrantProTarget } from "@/components/GrantProModal"
import {
  Mail, Phone, Crown, CalendarDays, Pencil, Trash2, Loader2, AlertTriangle,
  Building2, GraduationCap, Briefcase, Fingerprint, ShieldCheck, XCircle,
  Award, BedDouble,
} from "lucide-react"

function isUserCurrentlyProSub(sub: UserSubscription | null) {
  if (!sub) return false
  if (!sub.end_date) return true
  return new Date(sub.end_date) > new Date()
}

export default function UserDetailClient({ user: initialUser }: { user: User }) {
  const router = useRouter()
  // Live copy — refetched after edits so the page reflects changes instantly.
  const [user, setUser] = useState<User>(initialUser)
  const [sub, setSub] = useState<UserSubscription | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const [editOpen, setEditOpen] = useState(false)
  const [proTarget, setProTarget] = useState<GrantProTarget | null>(null)
  const [subModalOpen, setSubModalOpen] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePermanently, setDeletePermanently] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [userDeleted, setUserDeleted] = useState(false)

  useEffect(() => {
    let cancelled = false
    setSubLoading(true)
    api.subscriptions.getForUser(user.id)
      .then((s) => { if (!cancelled) setSub(s) })
      .catch(() => { if (!cancelled) setSub(null) })
      .finally(() => { if (!cancelled) setSubLoading(false) })
    return () => { cancelled = true }
  }, [user.id, reloadKey])

  async function refetchUser() {
    try {
      const fresh = await api.users.getOne(user.id)
      setUser(fresh)
    } catch {
      // deleted while editing — let refresh() surface the not-found page
    }
    router.refresh()
  }

  function afterSubAction() {
    setReloadKey((k) => k + 1)
    refetchUser()
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError("")
    try {
      await api.users.delete(user.id, deletePermanently)
      setUserDeleted(true)
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  if (userDeleted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-destructive-subtle p-3">
          <Trash2 className="h-6 w-6 text-destructive" />
        </div>
        <p className="font-bold">User deleted</p>
        <p className="text-sm text-muted-foreground">
          {deletePermanently ? "The account was erased permanently." : "The account was deactivated (soft delete)."}
        </p>
        <Link href="/users" className="text-sm font-medium text-primary hover:underline">← Back to Users</Link>
      </div>
    )
  }

  const studentInfo = user.student
  const teacherInfo = user.teacher
  const isStudentRole = user.role === "student"
  const isTeacherRole = user.role === "teacher"

  return (
    <div className="flex flex-col gap-4">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/users" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <span aria-hidden>←</span> Back to Users
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setProTarget({ id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email })} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-muted transition-all shadow-sm">
            <Crown className="h-3.5 w-3.5" /> Make User Pro
          </button>
          <button onClick={() => setSubModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-muted transition-all shadow-sm">
            <CalendarDays className="h-3.5 w-3.5" /> Adjust Expiry
          </button>
          <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-muted transition-all shadow-sm">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={() => { setDeleteOpen(true); setDeletePermanently(false); setDeleteError("") }} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-background px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive-subtle transition-all shadow-sm">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* ── Profile header ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-primary-gradient opacity-20" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-16 w-16 rounded-full border-2 border-background bg-muted shadow-md overflow-hidden flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="User" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-primary/5">
                  <Fingerprint className="h-7 w-7 opacity-50" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black tracking-tight truncate">{user.first_name} {user.last_name}</h1>
                <span className="capitalize text-[9px] font-black px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
                  {user.role.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter ${user.is_active ? "text-success border-success/30 bg-success-subtle" : "text-destructive border-destructive/30 bg-destructive-subtle"}`}>
                  {user.is_active ? "Active" : "Banned"}
                </span>
                {user.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info-subtle px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-info">
                    <ShieldCheck className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 min-w-0 truncate"><Mail className="h-3 w-3 shrink-0" /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /> {user.phone}</span>}
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 shrink-0" /> Registered {fmtDdMmYy(user.created_at) || '—'}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {subLoading ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> loading…</span>
            ) : sub ? (
              isUserCurrentlyProSub(sub) ? (
                <button onClick={() => setSubModalOpen(true)} className="inline-flex flex-col items-center gap-1 rounded-xl bg-primary-gradient px-4 py-2.5 text-primary-foreground hover:opacity-90 transition-all text-left">
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><Crown className="h-3 w-3" /> Pro</span>
                  <span className="text-[10px] font-medium">{sub.end_date ? `till ${fmtDdMmYy(sub.end_date)}` : "Lifetime"}</span>
                </button>
              ) : (
                <button onClick={() => setSubModalOpen(true)} className="inline-flex flex-col items-center gap-1 rounded-xl border border-destructive bg-destructive-subtle px-4 py-2.5 text-destructive hover:opacity-80 transition-all text-left">
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><XCircle className="h-3 w-3" /> Expired</span>
                  <span className="text-[10px] font-medium">{sub.end_date ? fmtDdMmYy(sub.end_date) : ""}</span>
                </button>
              )
            ) : (
              <button onClick={() => setProTarget({ id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email })} className="inline-flex flex-col items-center gap-1 rounded-xl border bg-muted px-4 py-2.5 hover:bg-muted/70 transition-all text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Basic</span>
                <span className="text-[10px] font-medium text-muted-foreground">Click to grant Pro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* ── Left: profile details ───────────────────────────── */}
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">User ID</span>
                <code className="truncate rounded-xs bg-muted px-1.5 py-0.5 text-[10px] font-mono font-bold border">{user.id}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Gender</span>
                <span className="capitalize text-xs font-bold">{user.gender || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Verified</span>
                <span className={`text-xs font-bold ${user.is_verified ? "text-success" : "text-muted-foreground"}`}>{user.is_verified ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Status</span>
                <span className={`text-xs font-bold ${user.is_active ? "text-success" : "text-destructive"}`}>{user.is_active ? "Active" : "Banned"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Joined</span>
                <span className="text-xs font-bold">{fmtDdMmYy(user.created_at) || '—'}</span>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Affiliation</h2>
            <div className="mt-3 flex items-center gap-2 text-sm min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              {user.university || user.university_id ? (
                <span className="font-bold text-primary truncate">{user.university?.name || user.university_id}</span>
              ) : (
                <span className="italic text-muted-foreground">National Access</span>
              )}
              {user.department && (
                <>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-xs font-bold text-muted-foreground truncate">{user.department.name}</span>
                </>
              )}
            </div>
          </section>

          {studentInfo && (
            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-info">
                <GraduationCap className="h-3.5 w-3.5" /> Student Profile
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">ID</span>
                  <code className="rounded-xs bg-info-subtle border border-info/30 px-1.5 py-0.5 text-[10px] font-mono font-black">{studentInfo.student_id}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0">Batch</span>
                  <span className="text-xs font-bold truncate">{studentInfo.batch?.name || studentInfo.batch_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Session</span>
                  <span className="text-xs font-bold truncate">{studentInfo.session?.name || studentInfo.session_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0">Regularity</span>
                  <span className={`text-xs font-bold ${studentInfo.is_regular ? "text-success" : "text-warning"}`}>{studentInfo.is_regular ? "Regular" : "Irregular"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Blood</span>
                  <span className="text-xs font-bold">{studentInfo.blood_group || '—'}</span>
                </div>
                {studentInfo.hall && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0">Hall</span>
                    <span className="flex items-center gap-1 text-xs font-bold truncate"><BedDouble className="h-3 w-3 text-muted-foreground" /> {studentInfo.hall.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">CR</span>
                  <span className="text-xs font-bold">{studentInfo.is_cr ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0">Claimed</span>
                  <span className="text-xs font-bold">{studentInfo.is_claimed ? "Yes" : "No"}</span>
                </div>
              </dl>
            </section>
          )}

          {teacherInfo && (
            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-warning">
                <Briefcase className="h-3.5 w-3.5" /> Teacher Profile
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Rank</span>
                  <span className="text-xs font-bold truncate">{teacherInfo.designation || '—'}</span>
                </div>
                {teacherInfo.phd && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0">PhD</span>
                    <span className="flex items-center gap-1 text-xs font-bold truncate"><Award className="h-3 w-3 text-muted-foreground" /> {teacherInfo.phd}</span>
                  </div>
                )}
              </dl>
            </section>
          )}

          {(isStudentRole || isTeacherRole) && !studentInfo && !teacherInfo && (
            <section className="rounded-xl border border-dashed bg-card p-4 shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-pulse shrink-0" />
              <span className="italic">{isStudentRole ? "Student" : "Teacher"} profile not linked yet — the account will attach automatically after the user claims their profile (email match).</span>
            </section>
          )}
        </div>

        {/* ── Right: subscription + danger zone ───────────────── */}
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Crown className="h-3.5 w-3.5" /> Subscription
              </h2>
              <button onClick={() => setSubModalOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                Adjust
              </button>
            </div>
            {subLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
              </div>
            ) : sub ? (
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Plan</span>
                  <span className="text-xs font-bold capitalize truncate">{sub.plan || 'Pro'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0">Expires</span>
                  <span className="text-xs font-bold">{sub.end_date ? fmtDdMmYy(sub.end_date) : "Lifetime"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-20 shrink-0">Started</span>
                  <span className="text-xs font-bold">{fmtDdMmYy(sub.start_date) || '—'}</span>
                </div>
                {sub.grant_reason && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0">Source</span>
                    <span className="capitalize text-xs font-bold">{sub.grant_reason.replace('_', ' ')}</span>
                  </div>
                )}
              </dl>
            ) : (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>No active subscription — user is on the free (Basic) tier.</span>
                </div>
                <button onClick={() => setProTarget({ id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email })} className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary-gradient px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all">
                  <Crown className="h-3.5 w-3.5" /> Grant Pro
                </button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-destructive/40 bg-card p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone
            </h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {user.is_active ? "Ban" : "Unban"} is not wired up yet — no API support. Soft delete hides the account from lists but keeps the row in the database.
              </p>
              <button onClick={() => { setDeleteOpen(true); setDeletePermanently(false); setDeleteError("") }} className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive-subtle transition-all">
                <Trash2 className="h-3.5 w-3.5" /> Delete User
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {editOpen && (
        <EditUserModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSuccess={() => { setEditOpen(false); refetchUser() }}
        />
      )}
      {proTarget && (
        <GrantProModal
          open
          target={proTarget}
          onClose={() => setProTarget(null)}
          onSuccess={() => { setProTarget(null); afterSubAction() }}
        />
      )}
      {subModalOpen && (
        <SubscriptionModal
          user={user}
          onClose={() => setSubModalOpen(false)}
          onSuccess={() => { setSubModalOpen(false); afterSubAction() }}
        />
      )}
      {deleteOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => { setDeleteOpen(false); setDeletePermanently(false) }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm rounded-sm border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="rounded-full bg-destructive-subtle p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold">Delete User?</h3>
              <p className="text-sm text-muted-foreground">
                Delete <strong>{user.first_name} {user.last_name}</strong> ({user.email})?
              </p>
              <p className="text-sm text-muted-foreground">
                {deletePermanently
                  ? "This removes the account from the database entirely — cannot be undone, and frees the email for reuse."
                  : "This deactivates the account (soft delete) — it disappears from lists, but can be restored from the database if needed."}
              </p>
              <label className="flex w-full items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive-subtle p-3 text-left">
                <input
                  type="checkbox"
                  checked={deletePermanently}
                  onChange={(e) => setDeletePermanently(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-destructive"
                />
                <span className="text-xs font-medium text-destructive">
                  Permanently delete — skip the soft delete and erase this account for good.
                </span>
              </label>
              {deleteError && <p className="text-sm text-destructive bg-destructive-subtle w-full rounded-sm p-2">{deleteError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setDeleteOpen(false); setDeletePermanently(false); setDeleteError("") }} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-sm bg-destructive px-4 py-2.5 text-sm font-bold text-white hover:bg-destructive/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletePermanently ? "Delete Permanently" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
