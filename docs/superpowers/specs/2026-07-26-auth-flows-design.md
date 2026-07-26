# Design: auth flows

- **Issue:** [#42](https://github.com/Zarlania/zarlania-app/issues/42)
- **Date:** 2026-07-26
- **Applies to:** `Zarlania/zarlania-app` only.
- **Spec chain:** 6 of 7. Predecessor:
  [spec 5 — theming and the landing page](2026-07-25-theming-landing-page-design.md)
  (the full seven-part decomposition is in spec 1, in `zarlania-api`).
  Successor: spec 7, *org flows* (written after this one; it references this
  spec). Depends on backend spec 2 —
  [users, personal organizations, and core authentication](https://github.com/Zarlania/zarlania-api/blob/master/docs/superpowers/specs/2026-07-25-users-personal-orgs-core-auth-design.md)
  — being live.

## Purpose

Turn spec 5's stubs into the real thing: signup with the email-verification
loop, login, silent session restoration on the httpOnly refresh cookie, and
the authenticated app shell with the personal-org home page. Also introduces
the app's data layer — the typed API client and TanStack Query — which every
later feature builds on.

## Scope

Delivered: the API client + data layer, `AuthContext` session model, route
protection, `/signup`, `/check-your-email`, `/verify-email`, `/login`,
logout, and the protected `/home` with the authenticated app shell.

Out of scope: org switching and all multi-org UI (spec 7 — the session here
is always the personal org), password reset (future — the backend flow does
not exist yet either), OAuth buttons (future), refining POC copy/layout.

## Data layer (chosen approach)

**TanStack Query + one typed fetch wrapper.** Server state lives in TanStack
Query (caching, retries, invalidation, loading/error states); the only
client state is a small `AuthContext`. No global store. Rejected:
hand-rolled hooks + context (re-implements caching/dedup the moment
collections arrive) and Redux Toolkit + RTK Query (a store discipline for an
app whose client state is one session object).

- `src/api/client.ts` — typed fetch wrapper: attaches the access token,
  `credentials: 'include'` on auth calls (spec 2's CORS + cookie model),
  parses RFC 9457 problem responses into a typed `ApiError` keyed by the
  backend's stable codes, and on a 401 performs a **single-flight refresh**
  (concurrent 401s share one `/auth/refresh`, then each retries once).
- `src/api/queries/` — TanStack Query hooks per endpoint (`useMe`,
  `useLogin`, `useRegister`, …).
- Base URL from **`VITE_ZARLANIA_API_URL`** (already in `.env.example`;
  `http://localhost:8080` locally, `https://api.zarlania.com` in prod).

## Session model

- The access token lives **in memory only** (`AuthContext`) — never in any
  Web Storage; that is the point of spec 2's httpOnly-cookie decision.
  Session status: `unknown → authenticated | anonymous`.
- **Boot:** one silent `POST /auth/refresh` — 200 → token in memory,
  `GET /users/me` populates the session; 401 → anonymous. **Public routes
  never wait on this**: the prerendered landing renders instantly and its
  header swaps CTAs when the session resolves; protected routes show a brief
  in-theme loading state until the session is known.
- **Refresh choreography:** proactive refresh ~1 minute before the token's
  `exp`, so active sessions never see a 401; the single-flight reactive path
  covers the rest. A failed refresh flips the session to anonymous.
- **Route protection:** a protected layout route wraps everything private —
  anonymous users redirect to `/login?next=<path>`; login honors `next`;
  authenticated users visiting `/login` or `/signup` bounce to `/home`.

## Pages and form UX

- **`/signup`** — email, username, password + confirmation. Client-side
  validation mirrors spec 2's rules (username 3–30 `[a-z0-9-]`, password
  12–128) with inline on-blur messages, a password length/strength meter,
  and a show/hide toggle. Submit → the enumeration-safe `202` → route to
  `/check-your-email`.
- **`/check-your-email`** — the raven has flown: shows the destination
  address, hosts the **resend** button (throttle `429` rendered as "wait a
  moment").
- **`/verify-email`** — target of the emailed link (spec 2:
  `zarlania.com/verify-email?token=…`). Posts the token on mount: success →
  verified message + **Log in** CTA (the API deliberately does not mint a
  session on verify — the token traveled through email); failure →
  expired/invalid message with a re-entry path to resend (enter email →
  resend flow).
- **`/login`** — one identifier field (email or username) + password. Code
  mapping: uniform bad-credentials copy on `401` (never says which field),
  dedicated unverified state on `auth.email-unverified` offering resend,
  `429` → "the gates need a moment." Honors `?next=`.
- **Logout** — header menu action: `POST /auth/logout`, clear the in-memory
  token, **drop all TanStack Query caches** (nothing private survives into
  an anonymous session), land on `/`.
- **Centralized error mapping:** one module translates `ApiError` codes →
  user-facing copy — medieval voice where it fits, plain where clarity wins;
  comprehension is never sacrificed for flavor. Unknown codes fall back to a
  generic message; raw codes never leak into the UI.

## Personal home (POC)

- **`/home`** (protected) — the landing spot after login or a restored
  session: the user's personal-org home.
- **Authenticated app shell**, introduced here and inherited by spec 7 and
  the vault work: header with logo (→ `/home`), current-org indicator (the
  personal org's name — spec 7 turns it into the switcher), spec 5's theme
  toggle, and a user menu (username, Log out). The shell is a layout route;
  future authenticated pages compose into it.
- **Content:** a grid of **vault cards** — the same vault types the landing
  advertises (trading cards, movies, books, coins, …) as in-theme
  "coming soon" cards, visibly locked, non-navigating; a welcome line greets
  the user by username. The card list is a static in-code constant —
  deliberately not an API call; no vault domain exists to ask.
- **POC boundary:** layout, empty states, and copy are refine-later. Fixed:
  the shell's structure — header, org indicator, user menu as stable,
  accessible landmarks — because spec 7 builds directly on them.

## Testing

**MSW** intercepts at the network layer, so client + TanStack Query +
components are exercised together against realistic RFC 9457 bodies.

- **Client & session units:** problem-parsing into typed errors;
  single-flight refresh (three concurrent 401s → exactly one refresh, three
  retries); refresh failure → anonymous; proactive pre-expiry refresh under
  fake timers; logout wipes token and query caches.
- **Flow tests (Testing Library + MSW):** signup → check-your-email with
  address shown; taken-username 409 inline; login → home greeting; login
  unverified → resend → throttled wait message; verify-email success and
  expired paths; protected redirect to `/login?next=` honored round-trip;
  authenticated `/login` visit bounces home.
- **Accessibility:** every form error associated via `aria-describedby` and
  announced; queries by role/label; stories for all new components (form
  fields with error states, password meter, app shell, vault card,
  check-email page) under both themes, a11y addon gating.
- **Spec 5's prerender guard keeps passing** — auth work must not disturb
  the landing's static HTML.
- **Coverage:** the 80% gate stands.

## Decisions log

| Decision | Choice | Alternatives rejected |
| -------- | ------ | --------------------- |
| Data layer | TanStack Query + typed fetch wrapper | Hand-rolled hooks; Redux Toolkit + RTK Query |
| Access-token home | Memory only (`AuthContext`) | Any Web Storage (defeats the cookie model) |
| Session boot | Silent refresh, public routes never blocked | Auth gate before first paint (hurts landing/SEO) |
| 401 handling | Single-flight refresh + one retry, plus proactive timer | Per-request refresh (stampede); reactive-only |
| Verify → session | Log-in CTA after verify (no auto-session) | Minting a session from an emailed token |
| Logout hygiene | Token + full query-cache wipe | Trusting cache keys to scope private data |
| Error copy | Central code→copy module, clarity over flavor | Per-component messages; raw codes in UI |
| Home content | Static vault-card constant | Inventing a premature vaults API |
