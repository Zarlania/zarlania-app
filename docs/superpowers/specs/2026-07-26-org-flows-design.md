# Design: org flows

- **Issue:** [#42](https://github.com/Zarlania/zarlania-app/issues/42)
- **Date:** 2026-07-26
- **Applies to:** `Zarlania/zarlania-app` only.
- **Spec chain:** 7 of 7 — the final spec. Predecessor:
  [spec 6 — auth flows](2026-07-26-auth-flows-design.md) (the full
  seven-part decomposition is in spec 1, in `zarlania-api`). No successor.
  Depends on backend spec 3 —
  [general organizations, roles, and permissions](https://github.com/Zarlania/zarlania-api/blob/master/docs/superpowers/specs/2026-07-25-general-orgs-roles-permissions-design.md)
  — being live.

## Purpose

Make organizations real in the UI: create a general org, switch between
orgs, see the org-aware home, manage members and roles, and live the
invitation flow from both sides. Closes the seven-spec
account-creation/login/authentication chain.

## Scope

Delivered: the org switcher, create-org, org-aware `/home`, `/members` with
invite/role/remove/leave, and the invitee experience (home section + badge).

Out of scope (per spec 3/4 deferrals): custom roles UI, org rename/delete,
admin UI, notification infrastructure.

## The switcher and session semantics

**Switching is a soft re-login.** Per spec 3, `POST /auth/token` mints a
fresh access JWT and a **new refresh family** for the target org, revoking
the old family. The switcher therefore: calls the endpoint → replaces the
in-memory token → **wipes all TanStack Query caches** (spec 6's logout
hygiene rule: org A's data never bleeds into org B's screens) → navigates to
`/home`. `AuthContext` gains a `currentOrg`.

**Routes stay org-implicit.** `/home` and `/members` always mean the
*current org's* home and members — no org id in the URL. Follows from the
backend's one-active-org-per-session model: `/orgs/{id}/members` would
pretend to offer navigation the token cannot honor, inviting exactly the
cross-org confusion the API forbids. Spec 6's personal home was the
degenerate case; spec 7 makes `/home` org-aware. Accepted trade-off, stated
honestly: no shareable deep links into a specific org — revisit if usage
demands it (the fix is switch-on-navigation, a UX decision for later).

**The switcher** (header, replacing spec 6's static org indicator): lists
memberships from `GET /organizations`, personal org pinned first, roles
shown, invitation count badge, and a **Create organization** entry.

## Pages

- **Create organization** — modal-or-page form (implementation's choice)
  from the switcher: one field, the org name, echoing spec 2's
  username-style rules client-side (same `citext` namespace). Errors:
  `orgs.name-taken` → "that banner is already flown";
  `orgs.quota-exceeded` → the honest limit message. Success → the backend
  made the caller `OWNER` → immediately switch (semantics above) → the new
  org's `/home`.
- **Org-aware `/home`** — the spec 6 shell driven by `currentOrg`: greeting
  names the org (personal home keeps the personal greeting); the same
  static vault-card grid (vaults are org-owned in the data model, so the
  frame is identical). On the **personal** home only, the invitations
  section — "You are summoned": each pending invite shows org, offered
  role, and inviter, with inline Accept/Decline. Accept → refetch
  memberships → offer "enter now" (a switch action); Decline is quiet.
  Expired invitations render disabled with their state named.
- **`/members`** — the current org's members page, linked for general orgs
  only (personal orgs get no link — the backend rejects everything there
  via `orgs.personal-immutable`):
  - The list: username, role, joined date. Rendering is driven by the
    session's `permissions` claim — buttons the API would 403 are simply
    absent — but the API remains the enforcer.
  - `members.manage` holders: **Invite** via exact-username lookup
    (`GET /users?username=` — found → confirm card with role picker;
    not-found says so plainly, no suggestions, honoring the backend's
    privacy stance), pending-invitations list with revoke, and per-member
    role change and remove.
  - Everyone: **Leave** on their own row. The client mirrors spec 3's
    guards for UX (owner-only owner-changes; last-owner lockout as a
    disabled control with an accessible explanation) — but every guard is
    also an error mapping away, because the API is the source of truth.

## Invitee experience (chosen approach)

Home section + switcher badge — visible from anywhere without new chrome.
Rejected: a dedicated `/invitations` page (an extra hop to a mostly-empty
page at this stage) and a header notification bell (chrome for a
notification system that does not exist).

## Error handling

Spec 6's central code→copy module grows: `orgs.name-taken`,
`orgs.quota-exceeded`, `orgs.last-owner`, `orgs.personal-immutable`,
`invitations.already-pending`, `invitations.expired`. Plus spec 3's
`404`-means-no-access rule, mirrored deliberately: a non-member `404`
renders as "this hold is closed to you," never claiming the org does not
exist.

## Testing

MSW + Testing Library on spec 6's foundations.

- **Switch semantics (load-bearing):** switch calls `POST /auth/token`,
  replaces the token, **empties every query cache** (asserted directly —
  org A's member list is gone), lands on `/home` naming org B. A failed
  switch (`404`: membership revoked meanwhile) leaves the current session
  intact with an error toast, then refetches memberships so the dead org
  falls out of the switcher.
- **Flows:** create org → auto-switch → org home. Invite by exact username
  (found → confirm card with role; not-found message). Invitee sees the
  summons with badge count → accept → refetch → "enter now" switches;
  decline clears; revoke removes a pending invite; role change and remove
  reflect; leave forces a switch to the personal org (the token's org just
  lost you).
- **Permission-driven rendering:** the members page under `OWNER` /
  `ADMIN` / `MEMBER` claims — manage controls present or absent
  accordingly; the disabled last-owner control carries its explanation via
  `aria-describedby`, not only a tooltip.
- **Stories:** switcher (badge states), invitation card, member row
  (per-permission variants), create-org form — both themes, a11y addon
  gating.
- **Coverage:** the 80% gate stands.

## Decisions log

| Decision | Choice | Alternatives rejected |
| -------- | ------ | --------------------- |
| Invitee surface | Home section + switcher badge | Dedicated page; notification bell |
| Switch semantics | Soft re-login: new token + family, full cache wipe, land on `/home` | Keeping caches keyed by org; in-place context swap |
| Routing | Org-implicit `/home`, `/members` | Org ids in URLs (`/orgs/{id}/…`) |
| Permission UX | Claim-driven rendering, API enforces | Rendering everything and mapping 403s; client-side enforcement |
| Member lookup UX | Exact-match confirm card, plain not-found | Suggestion lists (violates backend privacy stance) |
| Guard mirroring | Client mirrors last-owner/owner-only guards for UX, maps API errors as truth | Trusting client checks alone; no client mirroring (poor UX) |

## Amendment — the api's auth as implemented (2026-08-02)

Spec 2's implementation (zarlania-api PR #33) shipped scoped CSRF
protection, and the api's spec 3 amendment extends it to the org-switch
route this spec depends on: **`POST /auth/token` authenticates with the
refresh cookie, so it will be CSRF-guarded like `/auth/refresh` and
`/auth/logout`**. The switch call must carry the CSRF token header the
auth-flows session layer already holds (fetched from `GET /auth/csrf` —
see that spec's amendment for the choreography). Without the header the
switch answers `403`.
