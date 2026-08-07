# Auth Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-07-26-auth-flows-design.md`
**Depends on:** spec 5's implementation merged; backend spec 2 live (for real use — development and tests run against MSW).

**Goal:** The typed API client + TanStack Query data layer, in-memory session with silent cookie refresh, signup → verify → login flows mapped to the backend's error codes, and the authenticated app shell with the personal home.

**Architecture:** One fetch wrapper owns base URL, bearer header, RFC 9457 parsing into `ApiError`, and single-flight refresh-on-401. Server state lives in TanStack Query; the only client state is `SessionProvider` (in-memory access token + status). Protected routes are a layout route; public routes never block on session resolution.

**Tech Stack:** adds `@tanstack/react-query`; dev-adds `msw`.

## Global Constraints

- Plan 5's Global Constraints apply (verify gate, stories for every component, role/label queries, semantic tokens only, commit format).
- Base URL: `import.meta.env.VITE_ZARLANIA_API_URL` (exists in `.env.example`). Auth requests use `credentials: 'include'`.
- The access token lives in one module's memory — never in localStorage/sessionStorage/cookies readable by JS.
- Backend contract constants (exact, from the api specs): cookie is server-managed; endpoints `POST /auth/register|verify|resend|login|refresh|logout`, `GET /users/me`; error codes `auth.username-taken` — no: the register 409 code is `auth.username-taken`, unverified `auth.email-unverified`, bad login `auth.invalid-credentials`, throttle `auth.throttled`, invalid verify token `auth.invalid-token`, validation `validation.failed`. Problem bodies carry `code` and optionally `errors` (field → message).
- Validation mirrored client-side: username `[a-z0-9-]{3,30}`, password 12–128. The api enforces the
  128 ceiling on **login** as well as register, so an over-long password there is `400 validation.failed`
  with `errors.password`, not a 401.
- Throttled routes (all per client IP, `auth.throttled`): register 5/min, login 10/min, resend 3/min,
  **verify 10/min**, refresh 30/min, **logout 60/min**, csrf 60/min. Every `/auth` route is throttled, so
  any of them can answer `429`. Responses carry `Retry-After` in whole seconds, readable cross-origin.
- Routes added (exact): `/check-your-email`, `/verify-email`, `/home`; `/login` + `/signup` replace their stubs. Only `/` stays prerendered.
- Session statuses (exact union): `'unknown' | 'authenticated' | 'anonymous'`.

---

### Task 0: Tracking issue and branch

- [ ] **Step 1:**

```bash
gh issue create --title "feat: signup, email verification, login, and the authenticated home" --label feature --body "$(cat <<'EOF'
### Problem

The app has stub auth pages and no way to talk to the API, hold a session, or show a signed-in home.

### Proposed solution

Implement docs/superpowers/specs/2026-07-26-auth-flows-design.md: typed API client with single-flight refresh, TanStack Query data layer, in-memory session restored silently from the httpOnly refresh cookie, signup/verify/login/logout pages mapped to the backend's problem codes, and the authenticated app shell with the personal home.

### Alternatives considered

Hand-rolled hooks; Redux Toolkit + RTK Query; Web Storage tokens — rejected in the spec's decisions log.

### Is this a breaking change?

No — backwards compatible

### Additional context

Spec 6 of 7.

### Before submitting

- [x] I searched existing issues and discussions and this is not a duplicate.
- [x] I agree to follow this project's Code of Conduct.
EOF
)"
git fetch origin master && git checkout -b <ISSUE>-auth-flows origin/master
```

---

### Task 1: API client with single-flight refresh

**Files:**
- Create: `src/api/token.ts`, `src/api/ApiError.ts`, `src/api/client.ts`
- Create: `src/test/msw/handlers.ts`, `src/test/msw/server.ts`; modify `src/test/setup.ts`
- Test: `src/api/client.test.ts`

**Interfaces:**
- Produces:
  - `token.ts`: module-scoped store — `getAccessToken(): string | null`, `setAccessToken(token: string | null): void`. Nothing else may hold the token.
  - `ApiError.ts`: `export class ApiError extends Error { readonly status: number; readonly code: string; readonly fieldErrors: Record<string, string> }` with `code` defaulting `'unknown'` when the body has none.
  - `client.ts`: `export async function apiFetch<T>(path: string, options?: { method?: string; body?: unknown; auth?: boolean }): Promise<T>` — JSON in/out (204 → `undefined as T`); `auth: true` adds `Authorization: Bearer` and `credentials: 'include'` and, on a 401, awaits `refreshAccessToken()` (single-flight: one shared in-flight promise) then retries exactly once; `export async function refreshAccessToken(): Promise<boolean>` — `POST /auth/refresh` with credentials, on 200 stores the new token and returns true, else clears the token and returns false. Sending a stale `Authorization` header alongside is harmless — the api ignores bearer tokens on its public paths — so no code here needs to strip it.

- [ ] **Step 1: MSW harness**

```bash
npm install -D msw
npm install @tanstack/react-query
```

`server.ts`: `export const server = setupServer(...handlers)`; `setup.ts` gains `beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))`, `afterEach(() => { server.resetHandlers(); setAccessToken(null) })`, `afterAll(() => server.close())`. Default `handlers.ts`: parameterizable helpers the flow tests reuse — `export function problem(status: number, code: string, extra?: object)` building `HttpResponse.json({ code, ...extra }, { status })`.

- [ ] **Step 2: Failing client tests**

`client.test.ts`: 200 JSON round-trip; problem body → throws `ApiError` with `status`/`code`/`fieldErrors`; `auth: true` sends the bearer header; **single-flight**: handler returns 401 for the current token then 200 after `/auth/refresh` (which is counted) — fire three concurrent `apiFetch` calls → exactly one refresh request observed, all three succeed; refresh returning 401 → original `ApiError` propagates and token store is null.

- [ ] **Step 3: Implement, pass, commit**

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: typed API client with single-flight refresh"
```

---

### Task 2: Session provider and query wiring

**Files:**
- Create: `src/api/queries/users.ts` (`useMe`), `src/api/queries/auth.ts` (mutations: `useLogin`, `useRegister`, `useVerifyEmail`, `useResendVerification`, `useLogout`)
- Create: `src/auth/SessionProvider.tsx`, `src/auth/useSession.ts`, `src/auth/jwt.ts`
- Modify: `src/root.tsx` (wrap `Outlet` in `QueryClientProvider` + `SessionProvider` + `ThemeProvider`)
- Test: `src/auth/SessionProvider.test.tsx`, `src/auth/jwt.test.ts`

**Interfaces:**
- Produces:
  - Types `src/api/types.ts`: `MeResponse { user: { id: string; email: string; username: string; emailVerified: boolean }; organization: { id: string; name: string; type: 'PERSONAL' | 'GENERAL' } }`, `TokenResponse { accessToken: string }`.
  - `jwt.ts`: `export function tokenExpiryMillis(jwt: string): number | null` — base64url-decode the payload, `exp * 1000`; null on any parse failure.
  - `SessionProvider`: context value `{ status: 'unknown' | 'authenticated' | 'anonymous'; user: MeResponse['user'] | null; organization: MeResponse['organization'] | null; loginWithToken(accessToken: string): Promise<void>; logout(): Promise<void> }`. Boot effect: `refreshAccessToken()` → true → fetch `/users/me` → `authenticated`; false → `anonymous`. `loginWithToken`: store token, fetch me, set state (used by the login page). `logout`: `POST /auth/logout` (auth), clear token, `queryClient.clear()`, state → `anonymous`. Proactive refresh: after any token set, `setTimeout` at `expiry − 60_000` (skip when null/past) calling `refreshAccessToken()`; timer cleared on replacement/unmount.
  - `useSession()` — throws outside the provider.

- [ ] **Step 1: Failing tests**

`jwt.test.ts`: valid fabricated JWT (`header.payload.sig` with `{"exp": 1000}` base64url) → `1_000_000`; garbage → null. `SessionProvider.test.tsx` (MSW): refresh 200 + me 200 → status walks `unknown → authenticated`, user populated; refresh 401 → `anonymous`; `logout` clears (assert a subsequent `getAccessToken()` null, query cache emptied via a spy on `queryClient.clear`); fake timers: token with exp 5 min out → advancing 4 min+1s triggers exactly one refresh call.

- [ ] **Step 2: Implement, wire `root.tsx`, pass, commit**

`QueryClient` defaults: `retry: false` for mutations, `retry: 1` + `staleTime: 30_000` for queries (constants at top of the module).

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: in-memory session with silent restore and proactive refresh"
```

---

### Task 3: Route protection and skeleton `/home`

**Files:**
- Modify: `src/routes.ts`
- Create: `src/routes/require-auth.tsx`, `src/routes/redirect-if-auth.tsx`, `src/routes/home.tsx` (skeleton — Task 7 finishes it), `src/routes/check-your-email.tsx` + `verify-email.tsx` placeholders (Tasks 5–6 fill)
- Test: `src/routes/guards.test.tsx`

**Interfaces:**
- Produces `routes.ts`:

```ts
export default [
  index('routes/landing.tsx'),
  layout('routes/redirect-if-auth.tsx', [
    route('login', 'routes/login.tsx'),
    route('signup', 'routes/signup.tsx'),
  ]),
  route('check-your-email', 'routes/check-your-email.tsx'),
  route('verify-email', 'routes/verify-email.tsx'),
  layout('routes/require-auth.tsx', [route('home', 'routes/home.tsx')]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
```

`require-auth.tsx`: `unknown` → in-theme centered "Unsealing…" loading state; `anonymous` → `<Navigate to={'/login?next=' + encodeURIComponent(pathname)} replace />`; `authenticated` → `<Outlet />`. `redirect-if-auth.tsx`: `authenticated` → `/home`; otherwise `<Outlet />` immediately (public pages never block on `unknown`).

- [ ] **Step 1: Failing guard tests → implement → commit**

`guards.test.tsx` (routes stub + MSW): anonymous visiting `/home` lands on login with `next=/home`; authenticated visiting `/login` lands on `/home`; while refresh hangs (MSW delayed), `/home` shows the loading state but `/login` renders instantly.

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: protect private routes behind the session"
```

---

### Task 4: Error copy mapping and form primitives

**Files:**
- Create: `src/errors/errorCopy.ts`
- Create: `src/components/forms/FormField.tsx`, `PasswordField.tsx` (+ stories)
- Test: `src/errors/errorCopy.test.ts`, `src/components/forms/FormField.test.tsx`, `PasswordField.test.tsx`

**Interfaces:**
- Produces:
  - `errorCopy.ts`: `export function messageFor(error: ApiError): string` — table: `auth.invalid-credentials` → "That name or password is not known to the keep."; `auth.email-unverified` → "Your email awaits verification. Check your inbox — or summon a fresh raven below."; `auth.username-taken` → "That name is already claimed."; `auth.throttled` → "The gates need a moment. Try again shortly."; `auth.invalid-token` → "That link has expired or was already used."; `validation.failed` → "Some fields need attention."; anything else → "Something went wrong. Please try again." Codes never leak into the UI.
  - `FormField`: label + input + error slot; error text linked via `aria-describedby` and `aria-invalid`; props `{ label, name, type?, value, error?, autoComplete?, onChange, onBlur? }`. `PasswordField`: wraps it with show/hide toggle (button, aria-label "Show password"/"Hide password") and an optional length meter (12-char minimum bar), `autoComplete` passed through (`new-password` / `current-password` at call sites).

- [ ] **Step 1: Failing tests → implement → commit**

Tests: each mapped code returns its copy, unknown code returns the generic line; `FormField` associates its error with the input (`getByRole('textbox', { name })` has `aria-describedby` pointing at the visible error text); `PasswordField` toggle flips input type and its own accessible name via keyboard.

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: central error copy and accessible form fields"
```

---

### Task 5: Signup and check-your-email

**Files:**
- Replace: `src/routes/signup.tsx`; fill `src/routes/check-your-email.tsx`
- Create: `src/auth/validation.ts`
- Test: `src/routes/signup.test.tsx`

**Interfaces:**
- Produces: `validation.ts` — `usernameError(v: string): string | null` (empty → "Choose a name"; pattern `[a-z0-9-]{3,30}` → "3–30 characters: lowercase letters, numbers, hyphens"), `passwordError(v: string): string | null` (length 12–128 → "At least 12 characters"), `emailError(v: string): string | null` (basic `/^\S+@\S+\.\S+$/`). Signup submits `useRegister` → on success `navigate('/check-your-email', { state: { email } })`. Check-your-email reads the email from location state (fallback: an email input so a direct visit still works) and hosts the resend button via `useResendVerification` (success → "The raven has flown again."; `auth.throttled` → mapped copy inline).

- [ ] **Step 1: Failing tests**

`signup.test.tsx` (routes stub + MSW): on-blur validation shows the username rule for "Bad Name!"; a valid submit posts the exact JSON body and lands on check-your-email showing the address; MSW 409 `auth.username-taken` → its copy appears linked to the username field; 400 `validation.failed` with `errors: { password: "too short" }` → field-level message; resend click posts and shows the flew-again line; resend 429 → throttled copy.

- [ ] **Step 2: Implement, pass, commit**

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: signup with mirrored validation and the check-your-email page"
```

---

### Task 6: Verify-email

**Files:** Fill `src/routes/verify-email.tsx`; test `src/routes/verify-email.test.tsx`

**Interfaces:** On mount, reads `?token=` (`useSearchParams`) and fires `useVerifyEmail` once: pending → "Verifying your seal…"; success → "Your seal is verified." + a **Log in** link to `/login` (the API mints no session from an emailed token — spec rationale); failure `auth.invalid-token` → its copy + an email input feeding `useResendVerification`; `auth.throttled` (verify is capped at 10/min per IP) → throttled copy with the resend input still offered, since retrying an expired link a few times is how a real person reaches it; missing token → the failure state directly.

- [ ] **Step 1: Failing tests → implement → commit**

Tests: success path renders the log-in link; 400 path renders expiry copy and the resend input works; 429 path renders throttled copy and still offers resend; no token → failure state without a network call (assert zero handler hits).

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: verify-email landing with resend recovery"
```

---

### Task 7: Login, app shell, personal home

**Files:**
- Replace: `src/routes/login.tsx`; finish `src/routes/home.tsx`
- Create: `src/components/AppShell.tsx`, `src/components/UserMenu.tsx`, `src/components/VaultGrid.tsx` (+ stories); modify `src/components/SiteHeader.tsx` (session-aware CTAs on the landing)
- Test: `src/routes/login.test.tsx`, `src/routes/home.test.tsx`

**Interfaces:**
- Produces:
  - Login form: single "Email or username" field + password; submit → `useLogin` → `loginWithToken(response.accessToken)` → navigate `?next` ?? `/home`. Error mapping: 401 → invalid-credentials copy; 403 `auth.email-unverified` → dedicated block with a resend button (needs the email — shown only when the identifier contains `@`, else prompts for email); 429 → throttled copy; 400 `validation.failed` → field-level message from `errors.password` (the api caps login passwords at 128 like register, so this is reachable here and not only on signup).
  - `AppShell` (the authenticated layout, rendered by `home.tsx` and reused by spec 7): header = logo → `/home`, org indicator (`organization.name`), `ThemeToggle`, `UserMenu` (username button opening a menu with "Log out" — `role="menu"`/`menuitem`, Escape closes, focus returns); `children` below. `VaultGrid`: the six `VAULTS` from spec 5's content module rendered as locked cards ("Coming soon" badge, `aria-disabled`, no link).
  - `home.tsx`: `useSession` greeting "Well met, {username}." + `VaultGrid`.
  - `SiteHeader` gains optional session awareness: when `status === 'authenticated'`, swap "Enter"/"Create account" for a single "Enter your keep" → `/home` (prop-free — it calls `useSession` itself; the landing stays instant because the provider never blocks public rendering).

- [ ] **Step 1: Failing tests**

`login.test.tsx`: happy path stores the token (spy via a follow-up authed call in MSW), lands on `/home`; honors `?next=/home` round-trip from the guard; 401/403/429 branches render their copy; 400 `validation.failed` with `errors: { password: … }` shows the field-level message; unverified branch's resend fires for an email identifier. `home.test.tsx`: greeting shows the username; all six vault cards `aria-disabled` with no links; logout via the menu (keyboard: open with Enter, arrow to "Log out", Enter) → lands on `/`, subsequent `/home` visit redirects to login (MSW refresh now 401).

- [ ] **Step 2: Implement, pass, commit**

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: login, the authenticated shell, and the personal home"
```

---

### Task 8: Prerender guard, reference docs, PR

- [ ] **Step 1: Confirm the landing is untouched**

```bash
npm run build
```

Expected: the spec-5 prerender guard still passes (the session-aware `SiteHeader` must not break static rendering — `useSession` returns `unknown` state synchronously during prerender, rendering the anonymous CTAs).

- [ ] **Step 2: Reference doc**

`creating-reference-docs`: **API client and session** — the `apiFetch` contract (auth flag, single-flight refresh, `ApiError` shape), token-in-memory rule and why (httpOnly cookie model), session statuses and boot choreography, proactive refresh timing, `queryClient.clear()` on logout, the error-copy table location, route-guard behavior, and the `VITE_ZARLANIA_API_URL` + `credentials: 'include'` coupling with the api's CORS config (comment the coupling at both ends per repo rule — add the matching comment in the api's reference doc when spec 2 lands if not already there).

- [ ] **Step 3: Gates + PR**

```bash
npm run verify && npm run build && python3 docs/tooling/references_cli.py validate
git push -u origin <ISSUE>-auth-flows
gh pr create --title "#<ISSUE> feat: signup, verification, login, and the authenticated home" --label minor --body "$(cat <<'EOF'
Implements docs/superpowers/specs/2026-07-26-auth-flows-design.md — typed API client with single-flight refresh, TanStack Query data layer, in-memory session with silent restore, signup/check-email/verify/login pages mapped to the backend problem codes, and the authenticated shell with the personal home.

Closes #<ISSUE>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review (completed at authoring)

- **Spec coverage:** data layer + `ApiError` + single-flight → 1; session model/boot/proactive/logout-cache-wipe → 2; guards + public-never-blocks → 3; error-copy module → 4; signup/check-email/resend + enumeration-friendly UX → 5; verify (no auto-session) → 6; login branches, shell, home, session-aware landing header → 7; prerender intact + docs → 8. MSW as the network layer for all flow tests → 1's harness.
- **Placeholders:** none; copy strings are given verbatim where tests assert them.
- **Type consistency:** `MeResponse`/`TokenResponse` single-homed in `types.ts`; session statuses one union; `VAULTS` reused from spec 5's `content/vaults.ts`; `loginWithToken` produced in 2, consumed in 7.

## Amendment — the api's auth as implemented (2026-08-02)

Written before spec 2's implementation (zarlania-api PR #33) settled. These
deltas override the tasks above where they conflict (tracked as issue #45):

- **Task 1's `refreshAccessToken()` must send a CSRF header.**
  `POST /auth/refresh` is CSRF-guarded and answers `403` without one. Add a
  csrf module beside the token store: fetch `GET /auth/csrf` (with
  `credentials: 'include'`) → `{ headerName, token }`, cache both in
  memory, attach on refresh; on a `403` refetch once and retry. The
  single-flight rule extends to the csrf fetch — concurrent refreshes share
  one.
- **Task 2's logout must send the same header** — `POST /auth/logout` is
  the other guarded route. Boot becomes `GET /auth/csrf` →
  `POST /auth/refresh`; the cached pair serves both.
- **MSW tests should assert the header**: refresh and logout handlers
  reject requests missing the header `GET /auth/csrf` named, so a
  regression fails the way production would (403), and the single-flight
  test also observes exactly one csrf fetch.
- The endpoint list on the contract line above is already correct
  (`POST /auth/resend` — the api's spec table briefly said
  `/auth/verify/resend`; the implementation and this plan agree).
