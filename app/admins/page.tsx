"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Admin } from "@/lib/api"
import { Shield, Plus, Trash2, Key, Pencil, Loader2, X } from "lucide-react"

export default function AdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [passwordModal, setPasswordModal] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [editModal, setEditModal] = useState<{ id: string; name: string } | null>(null)
  const [editName, setEditName] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")

  async function load() {
    try {
      const data = await api.admins.getAll()
      setAdmins(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this admin?")) return
    setDeleting(id)
    try {
      await api.admins.delete(id)
      setAdmins((prev) => prev.filter((a) => a.id !== id))
    } catch {
      alert("Failed to delete admin")
    } finally {
      setDeleting(null)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordModal) return
    setPasswordLoading(true)
    setPasswordError("")
    try {
      await api.admins.changePassword(passwordModal.id, newPassword)
      setPasswordModal(null)
      setNewPassword("")
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editModal) return
    setEditLoading(true)
    setEditError("")
    try {
      const updated = await api.admins.update(editModal.id, { name: editName })
      setAdmins((prev) => prev.map((a) => (a.id === editModal.id ? updated : a)))
      setEditModal(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update admin")
    } finally {
      setEditLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admins</h1>
          <p className="text-sm text-muted-foreground">Manage admin accounts</p>
        </div>
        <button
          onClick={() => router.push("/admins/add")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Admin
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Shield className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  No admins found
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{admin.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{admin.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => { setEditModal({ id: admin.id, name: admin.name }); setEditName(admin.name) }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Edit name"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPasswordModal({ id: admin.id, name: admin.name })}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Change password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      disabled={deleting === admin.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                      title="Delete admin"
                    >
                      {deleting === admin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {passwordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setPasswordModal(null); setNewPassword(""); setPasswordError("") }} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Change Password</h2>
              <button
                onClick={() => { setPasswordModal(null); setNewPassword(""); setPasswordError("") }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Updating password for <strong>{passwordModal.name}</strong>
            </p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="text-sm font-medium">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setPasswordModal(null); setNewPassword(""); setPasswordError("") }}
                  className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {passwordLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Admin</h2>
              <button
                onClick={() => setEditModal(null)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {editLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
