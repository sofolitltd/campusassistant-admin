"use client"

import React, { useEffect, useMemo, useState } from "react"
import { api, Batch, ResourceAuthor, ResourceAuthorRole, Student, Teacher } from "@/lib/api"
import { Link2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<ResourceAuthorRole, string> = {
  lecture: "Lecture",
  writer: "Written by",
  source: "Book",
}

// One line for the legacy `creator`/`subtitle` text that older app versions
// show: writers and books first, then the lecture's teacher.
export function authorsLine(authors: ResourceAuthor[]): string {
  const names = (role: ResourceAuthorRole) => authors.filter((a) => a.role === role).map((a) => a.name.trim()).filter(Boolean)
  return [...names("writer"), ...names("source"), ...names("lecture")].join(", ")
}

// Card credit: "By Hridoy, Sojol · Lecture: Najnin Sarker · Book: Davison".
export function creditLine(authors: ResourceAuthor[] | undefined): string {
  if (!authors?.length) return ""
  const names = (role: ResourceAuthorRole) => authors.filter((a) => a.role === role).map((a) => a.name).join(", ")
  return [
    names("writer") && `By ${names("writer")}`,
    names("lecture") && `Lecture: ${names("lecture")}`,
    names("source") && `Book: ${names("source")}`,
  ].filter(Boolean).join(" · ")
}

// Edits a note's credited authors: the teacher whose lecture it is, the
// students who wrote it, plain names for people not in the lists, or the
// textbook it summarises. Linked rows point at a teacher/student profile.
export function ResourceAuthorsEditor({ departmentId, batches, value, onChange }: {
  departmentId: string
  batches: Batch[]
  value: ResourceAuthor[]
  onChange: (authors: ResourceAuthor[]) => void
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    if (!departmentId) return
    api.teachers.getAll(`department_id=${departmentId}`).then(setTeachers).catch(() => {})
    api.students.getAll(`department_id=${departmentId}`).then(setStudents).catch(() => {})
  }, [departmentId])

  const batchName = useMemo(() => new Map(batches.map((b) => [b.id, b.name])), [batches])

  function update(i: number, patch: Partial<ResourceAuthor>) {
    onChange(value.map((a, j) => (j === i ? { ...a, ...patch } : a)))
  }

  const inputCls = "w-full rounded-sm border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none transition-all"

  return (
    <div className="space-y-2">
      {value.map((a, i) => (
        <div key={i} className="flex items-start gap-2">
          <select
            value={a.role}
            onChange={(e) => update(i, { role: e.target.value as ResourceAuthorRole, teacher_id: null, student_id: null, name: "" })}
            className="w-28 shrink-0 rounded-sm border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {(Object.keys(ROLE_LABELS) as ResourceAuthorRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>

          <div className="flex-1 min-w-0">
            {a.role === "lecture" && (
              <TeacherPicker teachers={teachers} author={a} onChange={(p) => update(i, p)} inputCls={inputCls} />
            )}
            {a.role === "writer" && (
              <StudentPicker students={students} batchName={batchName} author={a} onChange={(p) => update(i, p)} inputCls={inputCls} />
            )}
            {a.role === "source" && (
              <input value={a.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Book, e.g. Davison" className={inputCls} />
            )}
          </div>

          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="shrink-0 rounded-sm p-2 text-muted-foreground hover:bg-destructive-subtle hover:text-destructive transition-all"
            aria-label="Remove author"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, { role: value.some((a) => a.role === "writer") ? "lecture" : "writer", name: "" }])}
        className="w-full flex items-center justify-center gap-2 rounded-sm border border-dashed border-muted-foreground/20 bg-muted/5 px-4 py-2 text-sm font-bold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
      >
        <Plus className="h-4 w-4" /> Add author
      </button>
    </div>
  )
}

// A teacher from the department, or "Other" for a former teacher typed by name.
function TeacherPicker({ teachers, author, onChange, inputCls }: {
  teachers: Teacher[]; author: ResourceAuthor; onChange: (p: Partial<ResourceAuthor>) => void; inputCls: string
}) {
  const [other, setOther] = useState(!author.teacher_id && !!author.name)
  if (other) {
    return (
      <div className="flex gap-2">
        <input value={author.name} onChange={(e) => onChange({ name: e.target.value, teacher_id: null })} placeholder="Teacher's name" className={inputCls} autoFocus />
        <button type="button" onClick={() => { setOther(false); onChange({ name: "" }) }} className="shrink-0 text-xs font-bold text-primary hover:underline">List</button>
      </div>
    )
  }
  return (
    <select
      value={author.teacher_id ?? ""}
      onChange={(e) => {
        if (e.target.value === "__other") { setOther(true); onChange({ teacher_id: null, name: "" }); return }
        const t = teachers.find((t) => t.id === e.target.value)
        onChange({ teacher_id: t?.id ?? null, name: t?.name ?? "" })
      }}
      className={inputCls}
    >
      <option value="">Select teacher…</option>
      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}{t.designation ? ` · ${t.designation}` : ""}</option>)}
      <option value="__other">Other (not in the list)…</option>
    </select>
  )
}

// Search the department's students by name; text that isn't picked from the
// list is saved as a plain name (an old senior who isn't in the list).
function StudentPicker({ students, batchName, author, onChange, inputCls }: {
  students: Student[]; batchName: Map<string, string>; author: ResourceAuthor
  onChange: (p: Partial<ResourceAuthor>) => void; inputCls: string
}) {
  const [focused, setFocused] = useState(false)
  const q = author.name.trim().toLowerCase()
  const matches = !author.student_id && q.length >= 2
    ? students.filter((s) => s.name?.toLowerCase().includes(q)).slice(0, 8)
    : []

  if (author.student_id) {
    const s = students.find((s) => s.id === author.student_id)
    return (
      <div className="flex items-center gap-2 rounded-sm border bg-primary/5 px-3 py-2 text-sm">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate font-bold">{author.name}</span>
        {s && <span className="truncate text-xs text-muted-foreground">{batchName.get(s.batch_id) ?? ""}</span>}
        <button type="button" onClick={() => onChange({ student_id: null })} className="ml-auto shrink-0 text-muted-foreground hover:text-destructive" aria-label="Unlink student">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        value={author.name}
        onChange={(e) => onChange({ name: e.target.value })}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search a student, or type a name"
        className={inputCls}
      />
      {focused && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-sm border bg-card shadow-lg">
          {matches.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange({ student_id: s.id, name: s.name }); setFocused(false) }}
                className={cn("flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted")}
              >
                <span className="truncate font-bold">{s.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{batchName.get(s.batch_id) ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!!q && matches.length === 0 && focused && (
        <p className="mt-1 text-[10px] text-muted-foreground">Not in the list: saved as a name only.</p>
      )}
    </div>
  )
}
