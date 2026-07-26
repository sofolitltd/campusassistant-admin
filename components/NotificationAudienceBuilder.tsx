"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { api, University, Department, Batch } from "@/lib/api"
import { selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"

export interface TargetRow {
  id: string
  universityId: string
  universityName: string
  departmentId?: string
  departmentName?: string
  batchId?: string
  batchName?: string
}

interface NotificationAudienceBuilderProps {
  rows: TargetRow[]
  onChange: (rows: TargetRow[]) => void
}

// Lets an admin build an arbitrary mix of target rows — a whole university,
// a whole department, or one specific batch — freely combined across
// different universities in the same send. Each "Add" appends one row at
// whatever depth the draft cascade is currently at, then resets the draft so
// a different university can be picked next.
export function NotificationAudienceBuilder({ rows, onChange }: NotificationAudienceBuilderProps) {
  const [universities, setUniversities] = useState<University[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [universityId, setUniversityId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [batchId, setBatchId] = useState("")

  useEffect(() => {
    if (universities.length === 0) {
      api.universities.getAll().then(setUniversities).catch(console.error)
    }
  }, [universities.length])

  useEffect(() => {
    if (universityId) {
      api.departments.getAllByUniversity(universityId).then(setDepartments).catch(console.error)
    }
  }, [universityId])

  useEffect(() => {
    if (departmentId) {
      api.batches.getAllByDepartment(departmentId).then(setBatches).catch(console.error)
    }
  }, [departmentId])

  function resetDraft() {
    setUniversityId("")
    setDepartmentId("")
    setBatchId("")
    setDepartments([])
    setBatches([])
  }

  function addRow() {
    if (!universityId) return
    const uni = universities.find(u => u.id === universityId)
    if (!uni) return
    const dept = departmentId ? departments.find(d => d.id === departmentId) : undefined
    const batch = batchId ? batches.find(b => b.id === batchId) : undefined

    const duplicate = rows.some(r =>
      r.universityId === universityId &&
      r.departmentId === dept?.id &&
      r.batchId === batch?.id
    )
    if (!duplicate) {
      onChange([...rows, {
        id: `${universityId}-${dept?.id || ""}-${batch?.id || ""}-${Date.now()}`,
        universityId,
        universityName: uni.name,
        departmentId: dept?.id,
        departmentName: dept?.name,
        batchId: batch?.id,
        batchName: batch?.name,
      }])
    }
    resetDraft()
  }

  function removeRow(id: string) {
    onChange(rows.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          className={selectCls}
          value={universityId}
          onChange={e => { setUniversityId(e.target.value); setDepartmentId(""); setBatchId(""); setDepartments([]); setBatches([]) }}
        >
          <option value="">-- University --</option>
          {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select
          className={selectCls}
          value={departmentId}
          disabled={!universityId}
          onChange={e => { setDepartmentId(e.target.value); setBatchId(""); setBatches([]) }}
        >
          <option value="">-- Department (optional) --</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          className={selectCls}
          value={batchId}
          disabled={!departmentId}
          onChange={e => setBatchId(e.target.value)}
        >
          <option value="">-- Batch (optional) --</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={!universityId}
        className="rounded-lg border-2 border-dashed px-4 py-2 text-sm font-bold hover:bg-accent/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Add to audience
      </button>

      {rows.length > 0 ? (
        <div className="space-y-1.5">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="text-sm font-medium">
                {r.universityName}
                {r.departmentName && <> &rarr; {r.departmentName}</>}
                {r.batchName && <> &rarr; {r.batchName}</>}
              </span>
              <button
                type="button"
                onClick={() => removeRow(r.id)}
                className="rounded-full p-1 hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground font-medium">
          No targets added yet — pick a university above (and optionally a department/batch), then click &quot;Add to audience.&quot; Add as many rows as you need, mixing across different universities freely.
        </p>
      )}
    </div>
  )
}
