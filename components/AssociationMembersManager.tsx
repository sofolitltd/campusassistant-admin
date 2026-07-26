"use client"

import { useState, useEffect } from "react"
import { Users, Check, X, Loader2 } from "lucide-react"
import { api, AssociationMemberSummary } from "@/lib/api"

interface AssociationMembersManagerProps {
  associationId: string
}

export function AssociationMembersManager({ associationId }: AssociationMembersManagerProps) {
  const [members, setMembers] = useState<AssociationMemberSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => {
    api.associations.getPendingMembers(associationId)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [associationId])

  async function handleApprove(userId: string) {
    setActingId(userId)
    try {
      await api.associations.approveMember(associationId, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch (err: any) {
      alert(`Failed to approve member: ${err.message}`)
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(userId: string) {
    if (!confirm("Reject this join request?")) return
    setActingId(userId)
    try {
      await api.associations.rejectMember(associationId, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch (err: any) {
      alert(`Failed to reject member: ${err.message}`)
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 font-semibold text-primary mb-2">
        <Users className="h-5 w-5" />
        <h2>Pending Join Requests ({members.length})</h2>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : members.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No pending join requests.</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-3 rounded-lg border bg-background p-3">
              <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0 border">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-primary/5 text-xs font-bold uppercase">
                    {member.first_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{member.first_name} {member.last_name}</p>
              </div>
              <button
                type="button"
                onClick={() => handleApprove(member.user_id)}
                disabled={actingId === member.user_id}
                className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all flex-shrink-0"
              >
                {actingId === member.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleReject(member.user_id)}
                disabled={actingId === member.user_id}
                className="rounded-full p-1.5 text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
