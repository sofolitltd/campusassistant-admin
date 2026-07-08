"use client"

import { useState, useEffect } from "react"
import { api, Session } from "@/lib/api"
import { Modal, Field, inputCls } from "./SharedUI"
import { Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SessionModalProps {
  open: boolean
  onClose: () => void
  universityId: string
  departmentId: string
  session?: Session | null
  onSuccess: () => void
  existingSessions?: Session[]
}

export function SessionModal({
  open, onClose, universityId, departmentId, session, onSuccess, existingSessions = [],
}: SessionModalProps) {
  const isEdit = !!session
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [startYear, setStartYear] = useState("")
  const [endYear, setEndYear] = useState("")
  const [slug, setSlug] = useState(session?.slug ?? "")
  const [bulkStart, setBulkStart] = useState("")
  const [bulkEnd, setBulkEnd] = useState("")
  const [isActive, setIsActive] = useState(session?.is_active ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      if (session?.name) {
        const [start, end] = session.name.split("-")
        setStartYear(start || "")
        setEndYear(end || "")
      } else {
        setStartYear(""); setEndYear(""); setBulkStart(""); setBulkEnd("")
      }
      setSlug(session?.slug ?? "")
      setIsActive(session?.is_active ?? true); setError(""); setMode("single")
    }
  }, [open, session])

  useEffect(() => {
    if (mode === "single" && !isEdit && startYear && endYear) {
      setSlug(`${startYear}-${endYear}`)
    }
  }, [startYear, endYear, isEdit, mode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")

    try {
      if (mode === "single") {
        const s = startYear.trim()
        const e_year = endYear.trim()
        if (!s || !e_year) throw new Error("Both Start and End years are required")
        if (s.length !== 4 || e_year.length !== 4) throw new Error("Years must be exactly 4 digits (e.g. 2019)")

        const fullName = `${s}-${e_year}`
        if (!isEdit && existingSessions.some((x) => x.name === fullName)) {
          throw new Error(`Session ${fullName} already exists!`)
        }

        const payload = { 
          name: fullName, 
          slug: slug.trim(), 
          university_id: universityId, 
          department_id: departmentId, 
          is_active: isActive 
        }
        if (isEdit) await api.sessions.update(session!.id, payload)
        else await api.sessions.create(payload)
      } else {
        const s = parseInt(bulkStart.trim())
        const e = parseInt(bulkEnd.trim())
        if (isNaN(s) || isNaN(e) || bulkStart.trim().length !== 4 || bulkEnd.trim().length !== 4) throw new Error("Years must be exactly 4 digits")
        if (s >= e) throw new Error("Oldest year must be smaller than newest year")

        const promises = []
        let addedCount = 0
        for (let i = s; i < e; i++) {
          const fullName = `${i}-${i + 1}`
          if (existingSessions.some((x) => x.name === fullName)) continue;

          promises.push(api.sessions.create({
            name: fullName, slug: fullName, university_id: universityId, department_id: departmentId, is_active: isActive
          }))
          addedCount++
        }

        if (addedCount === 0) throw new Error("All sessions in this range already exist!")
        await Promise.all(promises)
      }
      onSuccess(); onClose()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Session" : "Add Session"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div className="flex bg-muted p-1 rounded-sm mb-4">
            <button type="button" onClick={() => setMode("single")} className={cn("flex-1 text-sm py-1.5 rounded-sm font-bold transition-all", mode === "single" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Single Add</button>
            <button type="button" onClick={() => setMode("bulk")} className={cn("flex-1 text-sm py-1.5 rounded-sm font-bold transition-all", mode === "bulk" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Bulk Auto-Generate</button>
          </div>
        )}

        {mode === "single" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Year" required>
                <input type="text" inputMode="numeric" maxLength={4} value={startYear} onChange={(e) => setStartYear(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 2019" className={inputCls} />
              </Field>
              <Field label="End Year" required>
                <input type="text" inputMode="numeric" maxLength={4} value={endYear} onChange={(e) => setEndYear(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 2020" className={inputCls} />
              </Field>
            </div>
            <Field label="Slug">
              <input value={slug} readOnly placeholder="e.g. 2019-2020" className={cn(inputCls, "bg-muted cursor-not-allowed")} />
            </Field>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Oldest Year" required>
              <input type="text" inputMode="numeric" maxLength={4} value={bulkStart} onChange={(e) => setBulkStart(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 2010" className={inputCls} />
            </Field>
            <Field label="Newest Year" required>
              <input type="text" inputMode="numeric" maxLength={4} value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 2024" className={inputCls} />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-between rounded-sm border p-3">
          <span className="text-sm font-medium">Is Active</span>
          <button type="button" onClick={() => setIsActive(!isActive)} className="transition-all">
            {isActive ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 rounded-sm bg-red-50 dark:bg-red-900/20 p-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? "Update" : mode === "bulk" ? "Generate Sessions" : "Add Session"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
