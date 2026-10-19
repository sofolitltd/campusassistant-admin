# University data folders

One folder per university, published to the backend with
`scripts/publish-university.mjs`. The folder is the source of truth for the
initial setup; edits after publishing happen in the admin panel.

```
data/universities/<slug>/
  university.json     required
  faculties.json      optional
  departments.json    optional (references faculties by name)
  halls.json          optional
  sessions.json       optional (created for every department)
  contacts.json       optional (University-scoped emergency contacts)
  transports.json     optional
  logo.png            optional (referenced from university.json "logo")
```

Any key starting with `_` (e.g. `"_source"`) is a note for humans and is never sent.
A department with `"_locked": true` is created if missing but never updated, even with
`--update` — use it for departments already curated by hand in the admin panel.

## What a university needs

| File | Field | Required | Notes |
|---|---|---|---|
| university.json | `name` | ✔ | Official English name, unique |
| | `acronym` | ✔ | Unique, e.g. `JnU`, max 20 chars |
| | `slug` | | Defaults to slugified name |
| | `established_year` | | String, e.g. `"2005"` |
| | `total_faculties`, `total_departments`, `total_halls` | | Strings (display only) |
| | `campus_area` | | e.g. `"7.5 acres"` |
| | `about` | | Short paragraph |
| | `address` | | Postal address |
| | `latitude`, `longitude` | | Numbers, for the map pin |
| | `website_url` | | |
| | `logo` | | Local file in the folder (uploaded) or an https URL |
| faculties.json | `name` | ✔ | `slug` optional |
| departments.json | `name` | ✔ | Unique per university |
| | `acronym` | | e.g. `CSE` |
| | `faculty` | | Must match a `name` in faculties.json |
| | `established_year` | | Number |
| | `about`, `website_url`, `logo` | | |
| halls.json | `name` | ✔ | |
| | `formerly` | | Old name (string or array). With `--update` the existing hall is renamed in place, keeping its id |
| sessions.json | — | | Array of names, e.g. `["2023-2024", "2024-2025"]` |
| contacts.json | `title`, `phone` | ✔ | Same shape as the admin Bulk Import; `category` must be one of Administrative, Medical, Security, Fire Service, Transport, Student Service, Other |
| transports.json | `title` | ✔ | `time`, `image` optional |

Not covered here (added later in the admin panel, per department): teachers,
staff, courses, routines, banners, gallery.

## Publishing

Credentials come from `.env.local`: `API_KEY`, plus `ADMIN_EMAIL` and
`ADMIN_PASSWORD` (or a ready `ADMIN_TOKEN`).

```bash
# 1. Dry run against local backend: reads only, prints what would be created
node scripts/publish-university.mjs data/universities/jagannath-university

# 2. Write to local backend
node scripts/publish-university.mjs data/universities/jagannath-university --publish

# 3. Production
node scripts/publish-university.mjs data/universities/jagannath-university \
  --api https://campusassistant.duckdns.org/api/v1 --publish
```

Re-running is safe: existing records (matched by slug, contacts by
title + phone) are skipped. `--update` also patches changed fields of the
university and its departments from the JSON; add `--replace-logo` to
re-upload the university logo. `--prune-contacts` permanently (hard) deletes this university's contacts that are no
longer listed in contacts.json. Always dry-run (omit `--publish`) first.
