"use client"

import { useState, useEffect } from "react"
import { api, Session, SessionKind, SessionTerm } from "@/lib/api"
import { Modal, Field, inputCls, selectCls } from "../universities/[id]/departments/[...slug]/components/SharedUI"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const TERMS: { value: Exclude<SessionTerm, "">; label: string }[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "autumn", label: "Autumn" },
  { value: "winter", label: "Winter" },
]

interface SessionModalProps {
  open: boolean
  onClose: () => void
  session?: Session | null
  onSuccess: () => void
  existingSessions?: Session[]
}

// Mirrors the API's derived name so duplicates can be skipped client-side.
function sessionName(kind: SessionKind, year: number, term: SessionTerm) {
  if (kind === "academic_year") return `${year}-${year + 1}`
  return `${term.charAt(0).toUpperCase()}${term.slice(1)} ${year}`
}

export function SessionModal({ open, onClose, session, onSuccess, existingSessions = [] }: SessionModalProps) {
  const isEdit = !!session
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [kind, setKind] = useState<SessionKind>("academic_year")
  const [term, setTerm] = useState<SessionTerm>("spring")
  const [startYear, setStartYear] = useState("")
  const [bulkStart, setBulkStart] = useState("")
  const [bulkEnd, setBulkEnd] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setKind(session?.kind ?? "academic_year")
      setTerm(session?.term || "spring")
      setStartYear(session ? String(session.start_year) : "")
      setBulkStart(""); setBulkEnd(""); setError(""); setMode("single")
    }
  }, [open, session])

  const existingNames = new Set(existingSessions.map((s) => s.name))
  const year = parseInt(startYear)
  const preview = startYear.length === 4 ? sessionName(kind, year, kind === "semester" ? term : "") : ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")

    try {
      const payloadTerm: SessionTerm = kind === "semester" ? term : ""
      if (mode === "single") {
        if (startYear.length !== 4) throw new Error("Year must be exactly 4 digits (e.g. 2019)")
        if (preview !== session?.name && existingNames.has(preview)) throw new Error(`Session ${preview} already exists!`)

        const payload = { kind, start_year: year, term: payloadTerm }
        if (isEdit) await api.sessions.update(session!.id, payload)
        else await api.sessions.create(payload)
      } else {
        const s = parseInt(bulkStart)
        const e = parseInt(bulkEnd)
        if (bulkStart.length !== 4 || bulkEnd.length !== 4) throw new Error("Years must be exactly 4 digits")
        if (s > e) throw new Error("From year must not be after To year")

        // Semesters: every term of every year in the range. Academic years:
        // one per start year, so 2010 → 2023 ends at "2023-2024".
        const terms: SessionTerm[] = kind === "semester" ? TERMS.filter((t) => t.value !== "autumn" && t.value !== "winter").map((t) => t.value) : [""]
        const payloads = []
        for (let y = s; y <= e; y++) {
          for (const t of terms) {
            if (!existingNames.has(sessionName(kind, y, t))) payloads.push({ kind, start_year: y, term: t })
          }
        }
        if (!payloads.length) throw new Error("All sessions in this range already exist!")
        await Promise.all(payloads.map((p) => api.sessions.create(p)))
      }
      onSuccess(); onClose()
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save session") }
    finally { setLoading(false) }
  }

  const yearInput = (value: string, set: (v: string) => void, placeholder: string) => (
    <input type="text" inputMode="numeric" maxLength={4} value={value} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} placeholder={placeholder} className={inputCls} />
  )

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Session" : "Add Session"}>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        {!isEdit && (
          <div className="flex bg-muted p-1 rounded-sm mb-4">
            <button type="button" onClick={() => setMode("single")} className={cn("flex-1 text-sm py-1.5 rounded-sm font-bold transition-all", mode === "single" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Single Add</button>
            <button type="button" onClick={() => setMode("bulk")} className={cn("flex-1 text-sm py-1.5 rounded-sm font-bold transition-all", mode === "bulk" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Bulk Generate</button>
          </div>
        )}

        <Field label="Type" required>
          <select value={kind} onChange={(e) => setKind(e.target.value as SessionKind)} className={selectCls}>
            <option value="academic_year">Academic year (e.g. 2019-2020)</option>
            <option value="semester">Semester intake (e.g. Spring 2023)</option>
          </select>
        </Field>

        {mode === "single" ? (
          <div className={cn("grid gap-3", kind === "semester" ? "grid-cols-2" : "grid-cols-1")}>
            {kind === "semester" && (
              <Field label="Term" required>
                <select value={term} onChange={(e) => setTerm(e.target.value as SessionTerm)} className={selectCls}>
                  {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            )}
            <Field label={kind === "semester" ? "Year" : "Start Year"} required>
              {yearInput(startYear, setStartYear, "e.g. 2019")}
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From Year" required>{yearInput(bulkStart, setBulkStart, "e.g. 2010")}</Field>
            <Field label="To Year" required>{yearInput(bulkEnd, setBulkEnd, "e.g. 2024")}</Field>
          </div>
        )}

        {mode === "single" && preview && (
          <p className="text-sm text-muted-foreground">Will be saved as <span className="font-bold text-foreground">{preview}</span></p>
        )}
        {mode === "bulk" && kind === "semester" && (
          <p className="text-xs text-muted-foreground">Creates Spring, Summer and Fall for each year. Add Autumn/Winter terms individually.</p>
        )}

        {error && <p className="text-sm text-destructive rounded-sm bg-destructive-subtle p-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-sm border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-sm bg-primary-gradient px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? "Update" : mode === "bulk" ? "Generate Sessions" : "Add Session"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
