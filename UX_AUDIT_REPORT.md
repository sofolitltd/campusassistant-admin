# Campus Assistant Admin — UX/UI/Product Design Audit

**Reviewed by:** Senior Product Designer (AI-assisted code audit)
**Date:** 2026-07-23
**Scope:** `campusassistant-admin` — Next.js internal admin portal (universities, users, marketplace, banners, subscriptions, clubs/associations, notifications, contacts, contributors)
**Method:** Static review of layout, navigation, list/table, form, and modal code across 114 components/pages. No live click-through was performed — findings are traced to specific files/lines so engineering can verify quickly.

---

## TL;DR

The product has a strong visual foundation (clean type scale, consistent card/table shells, nice micro-interactions like hover states and skeleton-free but tasteful transitions) but was clearly built feature-by-feature without a shared component library or interaction contract. The result is an admin tool that **looks like one product but behaves like six**. The highest-impact issues aren't decoration — they're **dead controls that look clickable but do nothing** (Edit/Ban/Unban in the Users table, notification bell, mobile search icon, Logout, Settings), **native browser dialogs** (`alert()`/`confirm()` in 30+ files) standing in for real UI, and **zero accessibility semantics** anywhere in the app.

---

## 1. Critical — Non-functional controls ("UI that lies")

These are the most damaging findings because they erode trust: an admin clicks something that looks actionable and nothing happens, with no error, no feedback, silence.

| Control | Location | Behavior |
|---|---|---|
| **Edit User** | `app/users/users-client.tsx:309-314` | Menu item closes the dropdown only. No navigation, no API call. |
| **Ban / Unban User** | `app/users/users-client.tsx:316-330` | Same — closes menu, never calls an API. Status badge can never actually change from this screen. |
| **Logout** | `components/sidebar.tsx:144-151` | `<button>` with no `onClick` at all. |
| **Settings** | `components/sidebar.tsx:135-143` | Links to `/settings`; `app/settings/` exists but contains **no files** — 404 in production. |
| **Notification bell** | `components/topbar.tsx:20-23` | No `onClick`; permanently shows an unread-dot that can never be cleared. |
| **Mobile search icon** | `components/topbar.tsx:17-19` | No `onClick` — the only way to search on mobile is invisible. |
| **Topbar search input** | `components/topbar.tsx:8-15` | Not wired to any state, route, or handler at all — decorative only, and duplicates per-page search bars that *do* work (Universities, Users). |

**Recommendation:** Treat this as a P0 punch list before anything else in this report. Either wire these up or visually demote them (disabled state, "coming soon" tooltip) so admins stop trying.

---

## 2. Feedback patterns are inconsistent and partly pre-web

- **Native `alert()`** is used for error handling in ~30 files (e.g. `app/universities/universities-client.tsx:43`, `components/ProductForm.tsx:236`, `app/banners/banners-client.tsx:49`). This blocks the JS thread, can't be styled, ignores dark mode, and is jarring in a modern app that otherwise has a custom `ConfirmDelete` modal.
- **Native `confirm()`** is used for destructive/important actions in `components/AssociationEventManager.tsx`, `components/ClubEventManager.tsx`, `components/SkillVideoManager.tsx`, and `app/subscriptions/subscriptions-client.tsx:502` — while Users, Universities, and Banners use a bespoke `ConfirmDelete` modal (`app/universities/[id]/departments/[...slug]/components/SharedUI.tsx`) for the *same class of action* (delete). Two competing confirmation systems exist side by side.
- There is **no toast/snackbar system** anywhere. Success states (saved, deleted, uploaded) have no consistent acknowledgment beyond a redirect or silent state update.

**Recommendation:** Standardize on one confirmation modal (the existing `ConfirmDelete` is a good base — extend it to a generic `ConfirmAction`) and one non-blocking toast component. Delete every `alert()`/`confirm()` call once replaced — this is a mechanical, low-risk cleanup with high perceived-quality payoff.

---

## 3. Accessibility: effectively absent

- **Zero `aria-*` attributes** across all 114 `.tsx` files in `app/` and `components/`. Icon-only buttons (context menus, delete, collapse sidebar, upload, remove image) have no accessible name for screen readers.
- **Status is communicated by color alone** in several places: user Active/Banned dot (`app/users/users-client.tsx:288-296`), banner Active/Draft pill, subscription status pills on the dashboard. No icon or text-only fallback for colorblind users beyond the label that happens to sit next to the dot (good), but the dot itself and several badges (e.g. priority, plan tier) rely purely on hue.
- **No focus trapping or `Escape`-to-close** in any modal (`ConfirmDelete`, delete-user modal, department modals like `BannerModal`, `SessionModal`, etc.) — keyboard users can tab out of an open modal into the page behind it.
- **Dropdown menus** (context menu on Universities/Banners/Users cards) are plain `<div>`s with `onClick`, not `role="menu"`/`role="menuitem"`, and aren't reachable or dismissible via keyboard except by clicking elsewhere.
- Text at **8–10px** (`text-[8px]`, `text-[9px]`, `text-[10px]` — used extensively, e.g. `app/users/users-client.tsx:212,232,238`) is below comfortable/legible size for body text and will fail readability expectations for admins doing sustained data review, especially on external monitors at 100% zoom.

**Recommendation:** This isn't "nice to have" polish — for an internal tool used daily, accessibility gaps become productivity friction even for sighted, non-disabled users (no keyboard-only workflows, no screen-reader fallback if someone's on a laptop trackpad issue, etc.). Minimum bar: `aria-label` on all icon-only buttons, `Escape`+focus-trap on modals via a shared `<Modal>` primitive, bump smallest text to 11–12px minimum for anything that isn't a decorative tag/badge.

---

## 4. Navigation & information architecture

- **Sidebar (12 items) vs. bottom nav (7 items)** are two independently maintained lists (`components/sidebar.tsx:28-89` vs `components/bottom-nav.tsx:17-53`). On mobile, **Skills, Clubs, Associations, Marketplace, and Contributors are completely unreachable** — there's no "More" overflow item, so five of twelve top-level sections don't exist on a phone.
- **No breadcrumbs** anywhere except one deeply nested screen (`course-detail-client.tsx`). The URL structure goes at least 7 levels deep (`/universities/[id]/departments/[deptId]/courses/[levelId]/[courseId]/chapters/[chapterId]`) with no consistent trail back up. An admin who lands on a chapter via a shared link has no way to see what university/department/course they're in without reading the breadcrumb on that one screen (if present) or using browser back.
- **Sidebar collapse state doesn't persist** (`components/sidebar.tsx:93` — plain `useState`, no `localStorage`) — it resets to expanded on every navigation/reload since it's client component-local state that unmounts... actually since Sidebar lives in the root layout it should persist across client-side nav, but any full reload resets it. Minor, but easy to fix with one `localStorage` line.
- **Marketplace has no landing page** — `/marketplace` immediately redirects to `/marketplace/merchants` (`app/marketplace/page.tsx`), meaning the sidebar's "Marketplace" nav item silently becomes "Merchants." An admin scanning the sidebar for "Products" or "Orders" has to already know they're sub-tabs of Merchants.

**Recommendation:** Unify nav config into one source of truth with a `showInBottomNav`/priority flag; add a "More" sheet for overflow items on mobile. Add a shared breadcrumb component driven by route segments for anything nested past 2 levels.

---

## 5. Design system consistency

- **Border-radius tokens are all set to `0px`** (`app/globals.css:24-29`, `--radius-sm/md/lg/xl/2xl/full: 0px`), yet components throughout use `rounded-full`, `rounded-xl`, `rounded-lg`, `rounded-md` extensively expecting soft rounded corners (avatars meant to render as circles, cards meant to have soft corners, pill-shaped status badges). Depending on how Tailwind v4 resolves these theme tokens, this either **silently squares off every "rounded" and "pill" element in the app** (avatars, badges, buttons) or is dead config that no one intended to ship. Either way it's a footgun: **the CSS explicitly says "no radius anywhere" while ~90% of components are visually designed around soft radii.** This needs a decision, not a default.
- **Two competing corner-radius languages coexist in the component code itself**, independent of the token bug above: newer screens (Users table modal, Subscriptions) use `rounded-sm` for a sharper, denser look; older/other screens (Dashboard, Universities, Banners) use `rounded-xl`/`rounded-lg`/`rounded-full` for a softer look. This reads as two different products stitched together.
- **Currency formatting is inconsistent**: `"1,000 TK"` (Dashboard, Orders, Subscriptions) vs `"৳1,000"` (Products list) vs the label `"Price (৳)"` in the Product form while the same product's price displays as `"TK"` elsewhere. Pick one symbol and one position (prefix vs. suffix) sitewide.
- **Casing/tone inconsistency**: some UI uses all-caps micro-labels (`EXPLORE`, `PREVIOUS`, `NEXT`, `UNIVERSITY ACTIVE`) heavily, others use sentence case buttons ("Save Changes", "Add Banner") — both are fine individually but the split isn't rule-based, it looks like whoever wrote that screen's mood that day.
- **Empty states** are visually different per screen (Universities uses a light dashed box with a "Try refreshing" link; Banners uses a heavier dashed box with an icon-in-circle and a CTA button; Users uses a plain centered search icon + text). None follow a shared empty-state component, so the "personality" of the product shifts screen to screen.

**Recommendation:** Resolve the radius token question first (it may be actively breaking the intended look). Then extract shared primitives: `<StatusBadge>`, `<EmptyState>`, `<Money amount=… />`, `<Modal>`, `<DropdownMenu>` — most of this app's inconsistency comes from every screen hand-rolling the same five patterns.

---

## 6. Forms & data entry

- **No inline field-level validation feedback.** Required fields rely on native HTML `required` only (`components/ProductForm.tsx:255`); errors surface as a top-level `alert()` after submit fails server-side, not next to the offending field.
- **Image upload has no client-side size/type guard before upload** (`components/ProductForm.tsx:163-171`) despite the helper text promising "Max 5MB" — a user only discovers an oversized file when the upload request fails.
- **`TargetSelector`** (audience targeting in `ProductForm`, similarly duplicated for other forms) is a fairly complex nested expand/collapse university→department picker with no search/filter — for a school with 50+ universities this will be painful to scroll and scan. It's also re-implemented per form (comment at `ProductForm.tsx:21-24` explicitly references "SkillForm's TargetSelector" as a **second, separate implementation** of the same concept) — duplicated logic, duplicated bugs.
- **Destructive vs. safe actions aren't visually differentiated by weight** consistently — e.g. in the Product form, "Cancel" and "Create Product" are both full-width flex-1 buttons of near-equal visual weight side by side; the primary action doesn't dominate as much as it should for a form that's the main task of the screen.

**Recommendation:** Extract one shared `<TargetSelector>` component (add a search box + "select all/none" while at it), add basic client-side file validation before the network call, and move error display to be field-adjacent where the API returns field-level errors.

---

## 7. Tables & data-heavy screens (Users, Subscriptions, Orders)

- The Users table (`app/users/users-client.tsx`) is information-dense and genuinely well thought out for scanability (student/teacher context cards embedded per row) — this is a strength worth preserving as a pattern.
- However: **no column sorting**, **no bulk selection/bulk actions**, and **filter button is a no-op** (`Filter` button at `users-client.tsx:129-132` has no `onClick`/no filter panel).
- **Search re-navigates the whole route on every keystroke** (`handleSearch` calls `router.push` immediately, `users-client.tsx:63-72`) with only a cosmetic 300ms spinner that isn't tied to the actual request lifecycle (`setTimeout(() => setIsSearching(false), 300)` — this fires on a timer, not on the response). On a large user base this means a server round-trip per character typed, and the loading indicator is lying about when the data actually arrived.
- Pagination controls (`Previous`/`Next`) have no page-jump / "go to page" for large datasets, and no indication of total pages beyond text.

**Recommendation:** Debounce search input (e.g. 300–400ms of no typing, not per-keystroke) before pushing the route, and drive the spinner from the actual `router` transition state (Next's `useTransition`) rather than a fixed timer. Add sort-by-column headers and a real filter panel since the button already promises one.

---

## 8. Mobile & responsive coverage

- Covered above (nav parity) — worth restating as its own risk: **5 of 12 sections are admin-portal-inaccessible on mobile**, which matters if any admin/moderator workflow (e.g. approving a merchant, moderating a club) is expected to happen from a phone.
- Tables (Users, Subscriptions) rely on `overflow-x-auto` with no responsive card-view fallback — on mobile this becomes a wide horizontally-scrolling table, which is usable but not pleasant for a 6-column, avatar-heavy table.

---

## 9. Dark mode

A complete, well-built dark theme exists in `app/globals.css:56-76` (`.dark` class with full token overrides) but **there is no UI control anywhere in the app to enable it**, and no `prefers-color-scheme` media-query wiring found. This is a fully-built, invisible feature — either surface it (a simple toggle in the topbar next to the avatar) or remove the dead CSS to reduce maintenance surface.

---

## Priority punch list

**P0 — Trust-breaking, fix first**
1. Wire up or visibly disable: Edit User, Ban/Unban User, Logout, Settings link, notification bell, mobile search icon, topbar search input.
2. Resolve the `--radius-*: 0px` vs. `rounded-*` class conflict in `globals.css` — confirm intended look and fix the token file.

**P1 — Consistency & core UX debt**
3. Replace `alert()`/`confirm()` (30+ call sites) with one shared confirm-modal + toast system.
4. Fix search-on-every-keystroke (debounce) and tie loading spinners to real request state, starting with Users/Universities.
5. Unify sidebar/bottom-nav config; add mobile overflow menu for the 5 missing sections.
6. Standardize currency formatting (`৳` vs `TK`) and empty-state component sitewide.

**P2 — Quality & accessibility baseline**
7. Add `aria-label`s to icon-only buttons; add focus-trap + Escape-to-close to all modals via a shared `<Modal>` primitive.
8. Add breadcrumbs for any route nested more than 2 levels deep.
9. Bump minimum body/label text size off `text-[8px]`/`text-[9px]` where it's conveying real information (not purely decorative tags).
10. Consolidate the duplicated `TargetSelector` implementations; add search to it.
11. Either ship a dark-mode toggle or remove the unused `.dark` theme.

---

## What's already working well (keep doing this)

- Consistent card/shadow/spacing rhythm on list screens (Universities, Banners) — pleasant hover states, tasteful `animate-in` transitions, no gratuitous motion.
- The Users table's embedded role-context cards (student batch/session, teacher designation/PhD) are a genuinely strong pattern for scanning heterogeneous data without extra clicks — worth reusing as a formal `<RoleContextCard>` primitive.
- The `ConfirmDelete` shared component (`SharedUI.tsx`) is the right idea — it just needs to become the *only* confirmation mechanism instead of one of two.
- Dashboard stat cards and the growth chart are clean, legible, and appropriately restrained (no chart-junk).
