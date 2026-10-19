"use client"

import { useEffect, useState } from "react"
import { api, EmergencyContact, University } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Modal, inputCls, selectCls } from "@/app/universities/[id]/departments/[...slug]/components/SharedUI"
import { CONTACT_CATEGORIES } from "@/app/universities/[id]/departments/[...slug]/components/ContactModal"
import { AlertCircle, CheckCircle2, Loader2, Upload, XCircle } from "lucide-react"

const FIELDS = ["title", "designation", "description", "phone", "email", "category", "target_scope", "is_verified", "logo_url"] as const
const CATEGORY_VALUES = CONTACT_CATEGORIES.map(c => c.value)

type RowStatus = "ready" | "duplicate" | "invalid" | "saving" | "saved" | "failed"

interface Row {
  data: Partial<EmergencyContact>
  status: RowStatus
  message?: string
}

// Several offices can share one PABX number (with different extensions), so
// a duplicate means same title *and* same phone, not phone alone.
const dedupeKey = (c: Partial<EmergencyContact>) =>
  `${(c.title || "").trim().toLowerCase()}|${(c.phone || "").replace(/\D/g, "")}`

// Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes and newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") { row.push(field); field = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some(f => f.trim())) rows.push(row)
      row = []
    } else field += ch
  }
  row.push(field)
  if (row.some(f => f.trim())) rows.push(row)
  return rows
}

function parseInput(text: string): Record<string, unknown>[] {
  const trimmed = text.trim()
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : [parsed]
  }
  const [header, ...lines] = parseCsv(trimmed)
  if (!header) return []
  const keys = header.map(h => h.trim().toLowerCase())
  return lines.map(cells => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? "").trim()])))
}

function toContact(raw: Record<string, unknown>, universityId: string): Partial<EmergencyContact> {
  const str = (k: string) => (raw[k] == null ? "" : String(raw[k]).trim())
  const verified = raw.is_verified
  // Picking a university in the modal overrides any per-row scope.
  return {
    title: str("title"),
    designation: str("designation"),
    description: str("description"),
    phone: str("phone"),
    email: str("email"),
    category: str("category") || "Other",
    target_scope: universityId ? "University" : str("target_scope") || "National",
    is_verified: typeof verified === "boolean" ? verified : ["true", "1", "yes"].includes(String(verified ?? "true").toLowerCase()),
    logo_url: str("logo_url"),
    targets: universityId ? [{ university_id: universityId }] : [],
  } as Partial<EmergencyContact>
}

function validate(c: Partial<EmergencyContact>): string | null {
  if (!c.title) return "Missing title"
  if (!c.phone) return "Missing phone"
  if (!CATEGORY_VALUES.includes(c.category || "")) return `Unknown category "${c.category}"`
  if (c.target_scope === "University" && !c.targets?.length) return "Pick a university above for University scope"
  // Department contacts need per-row department targets — use the single Add Contact form for those.
  if (c.target_scope !== "National" && c.target_scope !== "University") return `Unsupported scope "${c.target_scope}"`
  return null
}

async function fetchAllContacts(): Promise<EmergencyContact[]> {
  const all: EmergencyContact[] = []
  for (let offset = 0; ; offset += 100) {
    const page = await api.emergencyContacts.getAll(`limit=100&offset=${offset}`)
    all.push(...page)
    if (page.length < 100) return all
  }
}

export function BulkImportModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [input, setInput] = useState("")
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [universityId, setUniversityId] = useState("")

  useEffect(() => {
    if (open && !universities.length) {
      api.universities.getAll("limit=100").then(setUniversities).catch(console.error)
    }
  }, [open, universities.length])

  function reset() {
    setInput("")
    setRows(null)
    setError("")
    setUniversityId("")
  }

  function handleClose() {
    if (importing) return
    if (rows?.some(r => r.status === "saved")) onSuccess()
    reset()
    onClose()
  }

  async function handlePreview() {
    setError("")
    let parsed: Record<string, unknown>[]
    try {
      parsed = parseInput(input)
    } catch (err: any) {
      return setError(`Could not parse input: ${err.message}`)
    }
    if (!parsed.length) return setError("No rows found")

    setChecking(true)
    try {
      const existing = new Set((await fetchAllContacts()).map(dedupeKey))
      const seen = new Set<string>()
      setRows(parsed.map(raw => {
        const data = toContact(raw, universityId)
        const invalid = validate(data)
        if (invalid) return { data, status: "invalid", message: invalid }
        const key = dedupeKey(data)
        if (existing.has(key)) return { data, status: "duplicate", message: "Already exists" }
        if (seen.has(key)) return { data, status: "duplicate", message: "Repeated in this import" }
        seen.add(key)
        return { data, status: "ready" }
      }))
    } catch (err: any) {
      setError(err.message || "Failed to check existing contacts")
    } finally {
      setChecking(false)
    }
  }

  async function handleImport() {
    if (!rows) return
    setImporting(true)
    const next = [...rows]
    // Sequential on purpose: keeps per-row status accurate and avoids hammering the backend.
    for (let i = 0; i < next.length; i++) {
      if (next[i].status !== "ready" && next[i].status !== "failed") continue
      next[i] = { ...next[i], status: "saving", message: undefined }
      setRows([...next])
      try {
        await api.emergencyContacts.create(next[i].data)
        next[i] = { ...next[i], status: "saved" }
      } catch (err: any) {
        next[i] = { ...next[i], status: "failed", message: err.message || "Failed" }
      }
      setRows([...next])
    }
    setImporting(false)
  }

  const counts = (rows ?? []).reduce<Record<RowStatus, number>>(
    (acc, r) => ({ ...acc, [r.status]: acc[r.status] + 1 }),
    { ready: 0, duplicate: 0, invalid: 0, saving: 0, saved: 0, failed: 0 },
  )
  const pending = counts.ready + counts.failed

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Import Contacts" className="sm:max-w-3xl">
      <div className="flex flex-col">
        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive-subtle rounded-sm border border-destructive/30">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {!rows ? (
            <>
              <p className="text-sm text-muted-foreground">
                Paste a JSON array or CSV with a header row. Fields: <code className="text-xs">{FIELDS.join(", ")}</code>.
                Only <b>title</b> and <b>phone</b> are required; verified defaults to true.
                Category must be one of: {CATEGORY_VALUES.join(", ")}.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Visibility</label>
                <select value={universityId} onChange={e => setUniversityId(e.target.value)} className={selectCls}>
                  <option value="">National — everyone (or per-row target_scope)</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>University — {u.name}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={14}
                className={cn(inputCls, "font-mono text-xs")}
                placeholder={'[\n  { "title": "National Emergency Service", "phone": "999", "category": "Security" }\n]'}
              />
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2 py-1 rounded bg-info-subtle text-info">{counts.ready} ready</span>
                <span className="px-2 py-1 rounded bg-success-subtle text-success">{counts.saved} saved</span>
                <span className="px-2 py-1 rounded bg-warning-subtle text-warning">{counts.duplicate} duplicate (skipped)</span>
                <span className="px-2 py-1 rounded bg-destructive-subtle text-destructive">{counts.invalid + counts.failed} invalid / failed</span>
              </div>
              <div className="rounded-sm border overflow-x-auto max-h-[50vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-left text-muted-foreground sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-bold">Title</th>
                      <th className="px-3 py-2 font-bold">Phone</th>
                      <th className="px-3 py-2 font-bold">Category</th>
                      <th className="px-3 py-2 font-bold">Scope</th>
                      <th className="px-3 py-2 font-bold">Verified</th>
                      <th className="px-3 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-medium">{r.data.title || "—"}</td>
                        <td className="px-3 py-2 font-mono">{r.data.phone || "—"}</td>
                        <td className="px-3 py-2">{r.data.category}</td>
                        <td className="px-3 py-2">{r.data.target_scope}</td>
                        <td className="px-3 py-2">{r.data.is_verified ? "Yes" : "No"}</td>
                        <td className="px-3 py-2">
                          <StatusCell row={r} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="border-t bg-muted/30 p-4 px-6 flex justify-end gap-2 shrink-0">
          {rows ? (
            <>
              <button type="button" onClick={() => setRows(null)} disabled={importing} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors disabled:opacity-50">
                Back
              </button>
              <button type="button" onClick={handleImport} disabled={importing || pending === 0} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary-gradient text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? "Importing..." : `Import ${pending} contact${pending === 1 ? "" : "s"}`}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-sm border bg-background hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handlePreview} disabled={checking || !input.trim()} className="px-4 py-2 text-sm font-medium rounded-sm bg-primary-gradient text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {checking && <Loader2 className="h-4 w-4 animate-spin" />}
                Preview
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

function StatusCell({ row }: { row: Row }) {
  switch (row.status) {
    case "ready":
      return <span className="text-info font-bold">Ready</span>
    case "saving":
      return <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving</span>
    case "saved":
      return <span className="flex items-center gap-1 text-success font-bold"><CheckCircle2 className="h-3 w-3" /> Saved</span>
    case "duplicate":
      return <span className="text-warning font-bold" title={row.message}>Skip · {row.message}</span>
    default:
      return <span className="flex items-center gap-1 text-destructive font-bold"><XCircle className="h-3 w-3" /> {row.message}</span>
  }
}
