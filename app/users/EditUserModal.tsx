"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, X } from "lucide-react"
import { api, User } from "@/lib/api"
import { ROLE_OPTIONS, GENDER_OPTIONS } from "./filters"

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"

interface EditUserModalProps {
  user: User
  onClose: () => void
  onSuccess: () => void
}

export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const originalEmail = (user.email ?? "").toLowerCase()
  const [firstName, setFirstName] = useState(user.first_name ?? "")
  const [lastName, setLastName] = useState(user.last_name ?? "")
  const [email, setEmail] = useState(user.email ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [gender, setGender] = useState(user.gender ?? "")
  const [role, setRole] = useState(user.role ?? "")
  const [isVerified, setIsVerified] = useState(user.is_verified ?? false)
  const [confirmEmailChange, setConfirmEmailChange] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Changing this field changes what the user types in to log in — easy to
  // do by accident while editing other fields, so it gets its own warning
  // and an explicit confirmation before Save will touch it.
  const emailChanged = email.trim().toLowerCase() !== originalEmail

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!firstName.trim()) return setError("First name is required")
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return setError("Email is required")
    if (emailChanged && !confirmEmailChange) {
      return setError("Please confirm the login email change below before saving")
    }

    setSaving(true); setError("")
    try {
      await api.users.update(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        gender,
        role,
        is_verified: isVerified,
      })

      // users.email is the login email; students.email / teachers.email are
      // separate profile-contact columns the backend never keeps in sync
      // (see CLAUDE.md on lib/api.ts) — so a login-email change has to be
      // pushed to the linked profile row too, or the two drift apart.
      if (emailChanged) {
        if (user.student) await api.students.update(user.student.id, { email: normalizedEmail })
        if (user.teacher) await api.teachers.update(user.teacher.id, { email: normalizedEmail })
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-sm border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-sm font-bold">Edit User</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">First Name</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Email <span className="text-muted-foreground/70 font-normal">(login email)</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setConfirmEmailChange(false) }}
              className={inputCls}
            />
          </label>

          {emailChanged && (
            <div className="flex flex-col gap-2 rounded-md border border-warning/30 bg-warning-subtle p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning mt-0.5" />
                <p className="text-xs text-warning">
                  This changes the email <strong>{user.first_name} {user.last_name}</strong> logs in with, from{" "}
                  <strong>{user.email}</strong> to <strong>{email.trim().toLowerCase()}</strong>. They&apos;ll need to
                  use the new email next time they sign in — their password stays the same.
                </p>
              </div>
              <label className="flex items-center gap-2 pl-6 text-xs font-medium text-warning">
                <input
                  type="checkbox"
                  checked={confirmEmailChange}
                  onChange={(e) => setConfirmEmailChange(e.target.checked)}
                  className="h-3.5 w-3.5 accent-warning"
                />
                Yes, change the login email
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gender</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                <option value="">Not set</option>
                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>

          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm font-medium">Verified</span>
            <button type="button" onClick={() => setIsVerified((v) => !v)} className="transition-all">
              <div className={`h-5 w-9 rounded-full p-0.5 transition-colors ${isVerified ? "bg-success" : "bg-muted"}`}>
                <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${isVerified ? "translate-x-4" : ""}`} />
              </div>
            </button>
          </div>

          {error && <p className="text-sm text-destructive rounded-sm bg-destructive-subtle p-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (emailChanged && !confirmEmailChange)}
              className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
