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

**Everything talks to the backend through `lib/api.ts`.** This single file (~1560 lines) is the source of truth for:
- Every TypeScript interface for backend entities (`University`, `Student`, `Product`, `Club`, `LostFoundItem`, etc.)
- A `fetchWithAuth(endpoint, options)` wrapper that injects headers and throws on non-2xx
- One namespaced `api.<resource>.<verb>()` object per resource (`api.universities.getAll()`, `api.clubs.create()`, ...) — always add new endpoints here rather than calling `fetch` directly from components/pages.

When adding a new backend entity, extend `lib/api.ts` with its interface + CRUD namespace before wiring up any UI.

**File uploads bypass `lib/api.ts`.** `lib/upload-utils.ts` posts multipart `FormData` straight to `${getApiUrl()}/upload` (not through `fetchWithAuth`, since that forces JSON) — use `uploadFile(file, folder)` / `deleteFile(url)` for image/file fields. `lib/image-helper.ts` and `lib/pdf-helper.ts` handle client-side image/PDF processing before upload (e.g. thumbnailing).

### Auth and the backend proxy

Credentials never reach the browser — this is a deliberate hardening pass, not an accident, so don't casually revert it:

- **`proxy.ts`** (project root) is this Next version's renamed `middleware.ts` — see the file's own comment and `node_modules/next/dist/docs/` for why. It's the real auth gate: any page request without an `admin_token` cookie is redirected to `/login`, and it excludes `/api/*` so the login flow can still reach the session endpoint. `components/app-shell.tsx`'s client-side check is cosmetic only.
- **`app/api/session/route.ts`** sets two cookies after login: `admin_token` (httpOnly, holds the real bearer token) and `admin_user` (plain, display identity only — read client-side via `lib/auth.ts`'s `getAdmin()`). `startSession()`/`endSession()` in `lib/auth.ts` POST/DELETE to this route; nothing else should touch these cookies directly.
- **`app/api/backend/[...path]/route.ts`** is a same-origin catch-all proxy to the Go backend. Browser code calls `/api/backend/...` (never the backend host directly); this handler attaches `X-API-Key` (from server-only `API_KEY`) and `Authorization: Bearer <admin_token>` before forwarding, and strips any auth headers the client tried to set itself.
- **`lib/api.ts`'s `getApiUrl()`** picks the right base per context: in the browser it's always `/api/backend`; on the server (Server Components, `getServerToken()`) it talks to the Go backend directly via `API_URL`/`NEXT_PUBLIC_API_URL`, since server code already has the key and can read the cookie itself.
- Image URLs are the one exception: `getFullImageUrl()` builds URLs against the *real* backend origin (`NEXT_PUBLIC_API_URL`), not `getApiUrl()`, because the browser fetches images directly from the backend, not through the proxy.

**Route structure follows a consistent server/client split.** Almost every list route is `app/<resource>/page.tsx` (async Server Component, calls `api.<resource>.getAll()`, wraps a `Suspense` fallback) delegating to `app/<resource>/<resource>-client.tsx` ("use client", holds all interactivity — filtering, modals, mutations). Nested resources follow `app/<resource>/[id]/...` and `add`/`edit/[id]` subroutes for forms. When adding a new section, mirror this pattern (e.g. look at `app/clubs/` as a template — it has list, `[id]` detail, `add`, and `edit/[id]`).

**Shared UI lives in `components/`, not `components/ui/`.** `components/ui/` is a configured-but-empty shadcn (`components.json`, `base-nova` style) mount point — nothing currently imports from `@/components/ui/*`. Reusable pieces (forms, managers, nav) are hand-rolled directly in `components/*.tsx` (e.g. `AssociationForm.tsx`, `ClubEventManager.tsx`, `NotificationAudienceBuilder.tsx`). Form components for a given resource typically bundle create+edit in one component driven by an optional `initialData`/`id` prop.

**Navigation has two independently-maintained lists**: `components/sidebar.tsx` (desktop, all sections) and `components/bottom-nav.tsx` (mobile, subset). If you add a new top-level section, update both, and note the mobile nav will silently omit it unless added there too.

**Styling**: Tailwind v4 (`@tailwindcss/postcss`), `cn()` helper in `lib/utils.ts` (clsx + tailwind-merge). Theme tokens are in `app/globals.css`.

**Colour — one rule: use the semantic classes, never a raw palette class.** `bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`, `bg-destructive`, `text-success`, `bg-warning-subtle`, `text-info`, … The codebase is currently at **zero** raw palette classes (no `bg-red-500`, `text-slate-600`, `bg-emerald-100`); keep it there.
- Roles are CSS variables in `app/globals.css`, defined for light (`:root`) and dark (`.dark`). Naming matches the Flutter app's `AppColors` in `campusassistant/lib/core/theme/app_colors.dart` — one vocabulary, two implementations. Change one, change both.
- Status roles come as a triple: `success` / `success-foreground` / `success-subtle`, and likewise for `warning`, `destructive`, `info`. Use `*-subtle` for tinted fills (badges, banners) and `*-foreground` for content on a solid fill.
- **Don't add `dark:` variants for colour.** Every token already resolves per theme; a `dark:` colour override means you reached for a raw palette value. (`dark:` for non-colour utilities is fine.)
- Brand is teal — `#00796b` light, `#4db6ac` dark. The old near-black slate primary is gone.

## Known rough edges (see `UX_AUDIT_REPORT.md` for full detail; some items there have since been fixed — verify against the code before trusting either doc)

- Several controls are visually present but unwired — e.g. `app/users/users-client.tsx`'s Edit User/Ban User dropdown items only close the menu, and the sidebar's Settings link points at `app/settings/`, which has no files. Sidebar Logout *is* wired (`components/sidebar.tsx` → `endSession()`). Don't assume a button works just because it renders; check for an `onClick`/handler.
- Error/confirm UX is inconsistent: native `alert()`/`confirm()` in ~40 files alongside a bespoke `ConfirmDelete` modal elsewhere (e.g. `app/universities/[id]/departments/[...slug]/components/SharedUI.tsx`). Prefer matching whatever pattern the surrounding file already uses rather than introducing a third approach.
