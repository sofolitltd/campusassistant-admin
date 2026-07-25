# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Non-standard Next.js

`AGENTS.md` (imported below) flags that the installed `next` version has breaking changes vs. what you were trained on. **Read `node_modules/next/dist/docs/` before writing Next.js-specific code** (routing, config, data fetching conventions), and follow any deprecation notices you find there rather than assuming standard App Router behavior.

@AGENTS.md

## What this is

Internal admin dashboard (Next.js App Router, React 19, TypeScript) for "Campus Assistant" — manages universities/departments, students/teachers/staff, resources, marketplace, clubs/associations, subscriptions, notifications, etc. It is a pure API client: no database, no auth of its own, no server actions that touch data directly — every read/write goes through a REST backend.

## Commands

- `npm run dev` — start dev server (Turbopack via `next dev`)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- No test suite exists in this repo.
- Package manager: repo has both `bun.lock` and `package-lock.json`; `bun` appears to be the intended one (see `ignoreScripts`/`trustedDependencies` in `package.json`), but either works.

## Environment

Copy `.env.example` to `.env.local`. Two vars matter:
- `NEXT_PUBLIC_API_URL` — backend base URL (defaults to `http://localhost:8080/api/v1` if unset)
- `NEXT_PUBLIC_API_KEY` — sent as `X-API-Key` on every request

## Architecture

**Everything talks to the backend through `lib/api.ts`.** This single file (~1400 lines) is the source of truth for:
- Every TypeScript interface for backend entities (`University`, `Student`, `Product`, `Club`, `LostFoundItem`, etc.)
- A `fetchWithAuth(endpoint, options)` wrapper that injects `X-API-Key` + JSON headers and throws on non-2xx
- One namespaced `api.<resource>.<verb>()` object per resource (`api.universities.getAll()`, `api.clubs.create()`, ...) — always add new endpoints here rather than calling `fetch` directly from components/pages.

When adding a new backend entity, extend `lib/api.ts` with its interface + CRUD namespace before wiring up any UI.

**File uploads bypass `lib/api.ts`.** `lib/upload-utils.ts` posts multipart `FormData` straight to `${API_BASE}/upload` (not through `fetchWithAuth`, since that forces JSON) — use `uploadFile(file, folder)` / `deleteFile(url)` for image/file fields. `lib/image-helper.ts` and `lib/pdf-helper.ts` handle client-side image/PDF processing before upload (e.g. thumbnailing).

**Route structure follows a consistent server/client split.** Almost every list route is `app/<resource>/page.tsx` (async Server Component, calls `api.<resource>.getAll()`, wraps a `Suspense` fallback) delegating to `app/<resource>/<resource>-client.tsx` ("use client", holds all interactivity — filtering, modals, mutations). Nested resources follow `app/<resource>/[id]/...` and `add`/`edit/[id]` subroutes for forms. When adding a new section, mirror this pattern (e.g. look at `app/clubs/` as a template — it has list, `[id]` detail, `add`, and `edit/[id]`).

**Shared UI lives in `components/`, not `components/ui/`.** `components/ui/` is a configured-but-empty shadcn (`components.json`, `base-nova` style) mount point — nothing currently imports from `@/components/ui/*`. Reusable pieces (forms, managers, nav) are hand-rolled directly in `components/*.tsx` (e.g. `AssociationForm.tsx`, `ClubEventManager.tsx`, `NotificationAudienceBuilder.tsx`). Form components for a given resource typically bundle create+edit in one component driven by an optional `initialData`/`id` prop.

**Navigation has two independently-maintained lists**: `components/sidebar.tsx` (desktop, all sections) and `components/bottom-nav.tsx` (mobile, subset). If you add a new top-level section, update both, and note the mobile nav will silently omit it unless added there too.

**Styling**: Tailwind v4 (`@tailwindcss/postcss`), `cn()` helper in `lib/utils.ts` (clsx + tailwind-merge). Theme tokens are in `app/globals.css`.

## Known rough edges (see `UX_AUDIT_REPORT.md` for full detail)

- Several controls are visually present but unwired (e.g. sidebar Logout/Settings, users-table Edit/Ban) — don't assume a button works just because it renders; check for an `onClick`/handler.
- Error/confirm UX is inconsistent: native `alert()`/`confirm()` in many files alongside a bespoke `ConfirmDelete` modal elsewhere. Prefer matching whatever pattern the surrounding file already uses rather than introducing a third approach.
- CSS radius tokens in `app/globals.css` are set to `0px` while most components use `rounded-*` utilities expecting soft corners — be aware this may not render as the component code implies.
