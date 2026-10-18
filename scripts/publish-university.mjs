#!/usr/bin/env node
// Publishes a university folder (data/universities/<slug>/) to the backend.
//
//   node scripts/publish-university.mjs data/universities/jagannath-university            # dry run
//   node scripts/publish-university.mjs data/universities/jagannath-university --publish  # write
//
// Options:
//   --publish       actually create records (default is a dry run that only reads)
//   --update        also PUT changed fields of an existing university and its departments
//   --prune-contacts  permanently delete this university's contacts that are no longer in contacts.json
//   --replace-logo  with --update, re-upload the university logo even if one is set
//   --api <url>     backend base URL (default: API_URL / NEXT_PUBLIC_API_URL from .env.local)
//
// Credentials (env or .env.local): API_KEY, plus either ADMIN_TOKEN or
// ADMIN_EMAIL + ADMIN_PASSWORD (logs in via /auth/admin-login).
//
// Idempotent: everything is matched by slug (contacts by title+phone) and
// skipped if it already exists (or patched, with --update), so re-running
// after a partial failure is safe.

import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const dir = args.find(a => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--api")
const PUBLISH = args.includes("--publish")
const UPDATE = args.includes("--update")
const PRUNE_CONTACTS = args.includes("--prune-contacts")
const REPLACE_LOGO = args.includes("--replace-logo")

if (!dir) {
  console.error("Usage: node scripts/publish-university.mjs <folder> [--publish] [--update] [--api <url>]")
  process.exit(1)
}

try { process.loadEnvFile(".env.local") } catch { /* optional */ }

const apiFlag = args.indexOf("--api")
const API = (apiFlag >= 0 ? args[apiFlag + 1] : process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY
if (!API || !API_KEY) {
  console.error("Missing API URL or API_KEY (set in .env.local or pass --api).")
  process.exit(1)
}

const slugify = (val) =>
  String(val).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")

// Keys starting with "_" (e.g. "_source", "_note") are notes for humans, never sent.
const stripNotes = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith("_")))

function readJson(name, fallback) {
  const file = path.join(dir, name)
  if (!fs.existsSync(file)) return fallback
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (err) {
    console.error(`✖ ${file}: ${err.message}`)
    process.exit(1)
  }
}

let token = process.env.ADMIN_TOKEN

async function login() {
  if (token) return
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    // A dry run can still read the public resources; only contacts need a login.
    if (!PUBLISH) return console.log("(no admin credentials: dry run cannot check existing contacts)\n")
    console.error("Set ADMIN_TOKEN, or ADMIN_EMAIL + ADMIN_PASSWORD, to log in.")
    process.exit(1)
  }
  const res = await call("POST", "/auth/admin-login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { noAuth: true })
  token = res.access_token
}

async function call(method, endpoint, body, { noAuth = false } = {}) {
  const headers = { "X-API-Key": API_KEY }
  if (!noAuth && token) headers.Authorization = `Bearer ${token}`
  let payload
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json"
    payload = JSON.stringify(body)
  }
  const res = await fetch(`${API}${endpoint}`, { method, headers, body: payload })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${endpoint} → ${res.status} ${text.slice(0, 200)}`)
  return text ? JSON.parse(text) : null
}

async function listAll(resource, query) {
  const all = []
  for (let offset = 0; ; offset += 100) {
    const res = await call("GET", `/${resource}?${query}&limit=100&offset=${offset}`)
    const page = res?.data ?? []
    all.push(...page)
    if (page.length < 100) return all
  }
}

const IMAGE_TYPES = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" }

// `logo` may be a local file inside the folder (uploaded) or an absolute URL (used as-is).
async function resolveLogo(value, folder) {
  if (!value || /^https?:\/\//.test(value)) return value || ""
  const file = path.join(dir, value)
  if (!fs.existsSync(file)) throw new Error(`Logo file not found: ${file}`)
  if (!PUBLISH) return `(upload ${value})`
  // The backend stores the part's Content-Type on R2 as-is; without it the
  // logo is served as application/octet-stream.
  const type = IMAGE_TYPES[path.extname(file).toLowerCase()]
  if (!type) throw new Error(`Unsupported logo type: ${file} (use ${Object.keys(IMAGE_TYPES).join(", ")})`)
  const fd = new FormData()
  fd.append("image", new Blob([fs.readFileSync(file)], { type }), path.basename(file))
  fd.append("folder", folder)
  const res = await call("POST", "/upload", fd)
  return res.file_url || res.url
}

const stats = { created: 0, updated: 0, deleted: 0, skipped: 0, failed: 0 }

// Fields in `wanted` whose value differs from the existing record.
const diff = (existing, wanted) =>
  Object.fromEntries(Object.entries(wanted).filter(([k, v]) => v !== undefined && existing[k] !== v))

// The backend's PUT merges the body over the stored record, so only changed fields are sent.
async function applyUpdate(label, resource, id, changes) {
  const fields = Object.keys(changes)
  if (!fields.length) return
  if (!PUBLISH) {
    stats.updated++
    return console.log(`  ~ ${label} (would update ${fields.join(", ")})`)
  }
  try {
    await call("PUT", `/${resource}/${id}`, changes)
    stats.updated++
    console.log(`  ~ ${label} (updated ${fields.join(", ")})`)
  } catch (err) {
    stats.failed++
    console.log(`  ✖ ${label}: ${err.message}`)
  }
}

async function ensure(label, existing, create) {
  if (existing) {
    stats.skipped++
    console.log(`  = ${label} (exists)`)
    return existing
  }
  if (!PUBLISH) {
    stats.created++
    console.log(`  + ${label} (would create)`)
    return { id: `dry-run:${label}` }
  }
  try {
    const created = await create()
    stats.created++
    console.log(`  + ${label}`)
    return created
  } catch (err) {
    stats.failed++
    console.log(`  ✖ ${label}: ${err.message}`)
    return null
  }
}

async function main() {
  const uni = readJson("university.json")
  if (!uni?.name || !uni?.acronym) {
    console.error(`${dir}/university.json needs at least "name" and "acronym".`)
    process.exit(1)
  }
  const faculties = readJson("faculties.json", [])
  const departments = readJson("departments.json", [])
  const halls = readJson("halls.json", [])
  const sessions = readJson("sessions.json", [])
  const contacts = readJson("contacts.json", [])
  const transports = readJson("transports.json", [])

  console.log(`${PUBLISH ? "PUBLISHING" : "DRY RUN (pass --publish to write)"} → ${API}\n`)
  await login()

  // ── University ───────────────────────────────────────────
  const uniSlug = uni.slug || slugify(uni.name)
  console.log("University")
  const [existingUni] = (await call("GET", `/universities?slug=${encodeURIComponent(uniSlug)}&limit=1`)).data ?? []
  const { logo, ...uniFields } = stripNotes(uni)
  const uniBody = { ...uniFields, slug: uniSlug }
  if (existingUni && UPDATE) {
    const changes = diff(existingUni, uniBody)
    if (logo && (REPLACE_LOGO || !existingUni.logo_url)) changes.logo_url = await resolveLogo(logo, "universities")
    await applyUpdate(uni.name, "universities", existingUni.id, changes)
  }
  const university = await ensure(uni.name, existingUni, async () =>
    call("POST", "/universities", { ...uniBody, logo_url: await resolveLogo(logo, "universities") }))
  if (!university) return
  const uniId = university.id
  const isNew = String(uniId).startsWith("dry-run:")
  const existingOf = async (resource, extra = "") =>
    isNew ? [] : listAll(resource, `university_id=${uniId}${extra}`)

  // ── Faculties ────────────────────────────────────────────
  console.log(`\nFaculties (${faculties.length})`)
  const facultyRows = await existingOf("faculties")
  const facultyIds = new Map() // name or slug → id
  for (const f of faculties) {
    const slug = f.slug || slugify(f.name)
    const found = facultyRows.find(r => r.slug === slug || r.name === f.name)
    const row = await ensure(f.name, found, () => call("POST", "/faculties", { name: f.name, slug, university_id: uniId }))
    if (row) { facultyIds.set(f.name, row.id); facultyIds.set(slug, row.id) }
  }

  // ── Departments (+ per-department sessions) ──────────────
  console.log(`\nDepartments (${departments.length})`)
  const deptRows = await existingOf("departments")
  const deptIds = []
  for (const d of departments) {
    const slug = d.slug || slugify(d.name)
    const facultyId = d.faculty ? facultyIds.get(d.faculty) ?? facultyIds.get(slugify(d.faculty)) : undefined
    if (d.faculty && !facultyId) console.log(`  ! ${d.name}: faculty "${d.faculty}" not in faculties.json`)
    const found = deptRows.find(r => r.slug === slug || r.name === d.name)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logo: deptLogo, faculty: _faculty, ...deptFields } = stripNotes(d)
    const body = {
      ...deptFields,
      slug,
      // Omitted when unknown, so --update never wipes a year set in the admin panel.
      ...(Number(d.established_year) ? { established_year: Number(d.established_year) } : {}),
      ...(facultyId && !String(facultyId).startsWith("dry-run:") ? { faculty_id: facultyId } : {}),
    }
    if (found && d._locked) {
      console.log(`  🔒 ${d.name} (locked, never updated)`)
    } else if (found && UPDATE) {
      const changes = diff(found, body)
      // Only upload when the logo is new to this department, so re-runs don't re-upload.
      if (deptLogo && (/^https?:\/\//.test(deptLogo) ? found.logo_url !== deptLogo : !found.logo_url)) {
        changes.logo_url = await resolveLogo(deptLogo, "departments")
      }
      await applyUpdate(d.name, "departments", found.id, changes)
    }
    const row = await ensure(d.name, found, async () => call("POST", "/departments", {
      ...body,
      university_id: uniId,
      logo_url: await resolveLogo(deptLogo, "departments"),
    }))
    if (row) deptIds.push({ id: row.id, name: d.name })
  }

  if (sessions.length) {
    console.log(`\nSessions (${sessions.length} × ${deptIds.length} departments)`)
    const sessionRows = await existingOf("sessions")
    for (const dept of deptIds) {
      for (const name of sessions) {
        const slug = slugify(name)
        const found = sessionRows.find(r => r.department_id === dept.id && r.slug === slug)
        await ensure(`${dept.name} · ${name}`, found, () =>
          call("POST", "/sessions", { name, slug, university_id: uniId, department_id: dept.id, is_active: true }))
      }
    }
  }

  // ── Halls ────────────────────────────────────────────────
  console.log(`\nHalls (${halls.length})`)
  const hallRows = await existingOf("halls")
  for (const h of halls) {
    const slug = h.slug || slugify(h.name)
    let found = hallRows.find(r => r.slug === slug || r.name === h.name)
    // "formerly": a renamed hall keeps its id (students link to it), so rename
    // the existing row instead of creating a second one.
    const formerly = [].concat(h.formerly ?? [])
    const renamed = !found && hallRows.find(r => formerly.includes(r.name))
    if (renamed) {
      if (UPDATE) await applyUpdate(`${renamed.name} → ${h.name}`, "halls", renamed.id, { name: h.name, slug })
      else console.log(`  ! ${renamed.name} should be renamed to ${h.name} (pass --update)`)
      found = renamed
    }
    await ensure(h.name, found, () =>
      call("POST", "/halls", { name: h.name, slug, university_id: uniId }))
  }

  // ── Transports ───────────────────────────────────────────
  if (transports.length) {
    console.log(`\nTransports (${transports.length})`)
    const transportRows = await existingOf("transports")
    for (const t of transports) {
      await ensure(t.title, transportRows.find(r => r.title === t.title), () =>
        call("POST", "/transports", { title: t.title, time: t.time || "", image: t.image || "", university_id: uniId }))
    }
  }

  // ── Emergency contacts (University scope) ────────────────
  console.log(`\nContacts (${contacts.length})`)
  const contactRows = isNew || !token ? [] : await listAll("emergency-contacts", `university_id=${uniId}&target_scope=University`)
  const key = c => `${String(c.title).trim().toLowerCase()}|${String(c.phone).replace(/\D/g, "")}`
  const existingKeys = new Set(contactRows.map(key))
  if (PRUNE_CONTACTS) {
    const wanted = new Set(contacts.map(key))
    for (const row of contactRows.filter(r => !wanted.has(key(r)))) {
      const label = `${row.title} (${row.phone})`
      if (!PUBLISH) { stats.deleted++; console.log(`  - ${label} (would delete)`); continue }
      try {
        // Hard delete: a pruned contact is stale data, not something to restore.
        await call("DELETE", `/emergency-contacts/${row.id}?permanent=true`)
        stats.deleted++
        console.log(`  - ${label} (deleted)`)
      } catch (err) {
        stats.failed++
        console.log(`  ✖ ${label}: ${err.message}`)
      }
    }
  }
  for (const c of contacts) {
    await ensure(`${c.title} (${c.phone})`, existingKeys.has(key(c)) ? c : null, () => call("POST", "/emergency-contacts", {
      title: c.title,
      designation: c.designation || "",
      description: c.description || "",
      phone: c.phone,
      email: c.email || "",
      category: c.category || "Other",
      is_verified: c.is_verified ?? true,
      logo_url: c.logo_url || "",
      target_scope: "University",
      targets: [{ university_id: uniId }],
    }))
  }

  const verb = PUBLISH ? "" : "would be "
  console.log(`\nDone. ${verb}created: ${stats.created}, ${verb}updated: ${stats.updated}, ${verb}deleted: ${stats.deleted}, unchanged: ${stats.skipped}, failed: ${stats.failed}`)
  if (stats.failed) process.exitCode = 1
}

main().catch(err => {
  console.error(`\n✖ ${err.message}`)
  process.exit(1)
})
