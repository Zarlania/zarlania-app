# Landing Page, Theming Foundation & Branding Emblem — Design

**Date:** 2026-07-01
**Status:** Approved (brainstorming)
**Issue:** [#12](https://github.com/Zarlania/zarlania-app/issues/12)
**Scope:** Establish the app's **visual identity and theming foundation**, demonstrated across a
representative POC page flow: a prerendered SEO landing page, a real signup, a mock login, and a
placeholder authenticated home. This pass is about **theme, style, and feel** — not final UX or
built-out features.

This repo is **live in production**: merges to `master` deploy to <https://zarlania.com>. All work
here is built to that standard — DRY/SOLID, TDD, ≥80% coverage, no committed secrets.

---

## 1. Goal & guiding principles

The app today is a single `AppComponent` that fetches and displays the backend API version. It has
no routing, no theming, and an empty `styles.css`. This work lays the **visual foundation** the
project will build on as it grows, and proves it across the page types that matter (a marketing
page, forms, and an app shell).

Principles:

- **Foundation first, features later.** Nail the design system + theming; demonstrate it on POC
  pages. Collection spaces and real auth are explicitly out of scope (later passes).
- **Feature-first, standalone, signals, OnPush** — consistent with CLAUDE.md / ADR-0004 and the
  existing code.
- **Semantic tokens, not scattered hexes.** Components reference semantic CSS custom properties;
  re-theming is a token change, not a component hunt.
- **Lean dependencies.** Prefer Angular + the standard library. The emblem is hand-vectorized SVG,
  not a new dependency.
- **Fail fast at the boundary.** Validate form input before calling the API.

---

## 2. Approach

**Chosen: foundation + landing + real signup + mock login (scope "B+").** Rejected alternatives:
"foundation + landing only" (doesn't exercise the theme across a form or app shell) and "full
skeleton flow incl. dashboard + MTG space" (over-invests in flows the user wants to design later).

**Rendering — prerender/SSG for public pages.** The landing route is prerendered to static HTML at
build time (Angular `prerender`), still served by the existing nginx-static container on `$PORT` —
no runtime Node server. App routes (signup/login/home) stay client-rendered. Rejected: full SSR
(replaces the nginx-static deploy model — overkill for essentially-static marketing pages) and
client-only SPA (weakest for crawl/index despite modern JS rendering).

---

## 3. Architecture & structure

Introduce the Angular Router (none today) and an app-shell layout, replacing the single
`AppComponent`.

**Routes:**

| Path | Page | Rendering |
|---|---|---|
| `/` | Landing | Prerendered (SEO) |
| `/signup` | Signup (real `POST /accounts`) | Client |
| `/login` | Login (mock) | Client |
| `/home` | Placeholder "you're in" home | Client |
| `**` | Themed 404 | Client |

**Feature-first structure:**

```
src/app/
  core/            ThemeService, ApiService, app config
  shared/          UI primitives: logo, button, card, form-field, theme-toggle
  layout/          app shell: header (logo + nav + theme toggle) + footer
  features/
    landing/       landing page + section sub-components
    auth/          signup/ + login/  (component + template + styles + spec co-located)
    home/          placeholder authenticated home
    not-found/     404
  app.routes.ts
```

All standalone components, `OnPush`, signals, services injected at the appropriate scope. Header and
footer (with the theme toggle) live in the shell so the toggle is present on every route.

**Architecturally-significant decisions → ADRs** (authored via `adr-create` during implementation,
since "ADRs are law"):

1. **Prerendering/SSG for SEO** — changes the build; preserves the nginx-static deploy.
2. **Theming via CSS custom-property tokens + no-flash convention** — cross-cutting; may fold in a
   design-tokens note.
3. **Adopt Angular Router + app-shell layout** — repo-wide structural convention.

---

## 4. Theming system

**Design tokens.** One set of semantic CSS custom properties, themed by a `data-theme` attribute on
`<html>`. Components reference semantic tokens only (e.g. `--color-action`, `--color-surface`),
never raw hexes.

| Token | Dark — "Ember & Rune II" | Light — "Vellum & Sage" |
|---|---|---|
| `--color-bg` | `#15110f` | `#f3edde` |
| `--color-surface` | `#221a17` | `#e8e0cc` |
| `--color-border` | `#302420` | `#dcd1b6` |
| `--color-action` (primary) | `#e2622a` (ember) | `#276b48` (forest) |
| `--color-accent` (arcane) | `#55d6c6` (teal) | `#1f8a7d` (teal) |
| `--color-brand` (gold) | `#eeb03a` | `#b0872a` |
| `--color-text` | `#ece3d8` | `#29291f` |
| `--color-text-muted` | `#9d8f86` | `#6d6047` |

Derived tokens — hover/active shades, focus-ring color, radii, spacing scale, typography scale — are
defined once alongside these. The primary **action color intentionally differs per mode** (warm
ember in dark, forest green in light); the **gold brand** and **teal arcane accent** carry across
both modes to keep one identity.

**Behavior (the four requirements):**

1. **Respects OS preference** — first visit with no stored choice follows `prefers-color-scheme`.
2. **Toggleable on every page** — a **2-way** toggle (light ↔ dark) in the shell header; an explicit
   choice overrides the OS default.
3. **Remembers last choice** — persisted to `localStorage`; restored on next visit.
4. **No flash on load** — a tiny **inline** script in `index.html` runs before first paint (before
   Angular boots), reads the stored choice (or OS preference), and sets `data-theme` immediately. A
   signal-based `ThemeService` is the source of truth once the app is running and keeps the DOM
   attribute, the signal, and `localStorage` in sync.

**Prerender interaction.** Prerendered HTML has no OS/localStorage at build time, so it ships with a
sensible default (`data-theme="dark"`); the inline script corrects it before paint on the client.

---

## 5. Landing page

**Section order:** Header → Hero → Features → How it works → Supported collections → CTA band →
Footer.

- **Header** — logo + nav (Features, How it works) + theme toggle + Log in / Sign up.
- **Hero** — single `<h1>`, value proposition, primary CTA ("Create your vault") + secondary
  ("See how it works").
- **Features** — three cards: index deeply / track value / one home, many worlds.
- **How it works** — three steps (create vault → add cards → track & grow).
- **Supported collections** — MTG active; others (Pokémon, coins, books, movies) marked "soon" to
  convey the vision.
- **CTA band** — final "Sign up free" nudge.
- **Footer** — brand, product/account links, copyright.

Copy is placeholder and will be refined later; this pass fixes structure and feel.

**SEO.** Semantic landmarks (`<header>/<main>/<section>/<footer>`), exactly one `<h1>`, descriptive
`<title>` + meta description, Open Graph/Twitter tags for link previews, `robots.txt` + a sitemap,
and the whole page **prerendered to static HTML** so crawlers get full content without executing JS.

---

## 6. Signup / Login / Home (POC flow)

**`/signup` — real.** Fields **email + username** (exactly what `POST /accounts` accepts; the API
has no password). `ApiService` gains `createAccount(email, username)`.

- **Boundary validation** mirrors the API: email required + valid format + ≤320 chars; username
  required + ≤100 chars. Submit is disabled until valid.
- **On `201 Created`** → navigate to `/home`, carrying the returned `{ user, personalOrganization }`.
- **On error** → inline message: duplicate email/username → "That username is already taken." (or
  email equivalent); network/other → a friendly retry message.

**`/login` — mock.** Email + password fields *for appearance only* (so the flow feels real). No auth
API exists, so the form calls nothing — valid submission simply routes to `/home`. Clearly labeled a
POC placeholder; the password value is never sent or stored.

**`/home` — placeholder "you're in."** A themed welcome. Reached from a real signup, it shows the
created **account** (email) and **personal organization** name from the API response, plus a
non-functional **MTG** teaser card hinting at the collection-space concept. Reached from mock login,
it shows generic placeholder values. Space content is a later pass.

**Known limitation (acceptable for a theme/feel POC):** there is no real session, so `/home` does not
persist identity across a refresh. Documented, not solved, in this pass.

---

## 7. Emblem & branding assets

The emblem — a **dragon fused with a wizard's staff** — is a **swappable asset** behind a
`LogoComponent`. Header, favicon, footer, and social preview all reference that one component/asset
set, so final art is a file swap, not a markup change.

**Two-tier by design:** a **detailed crest** for hero/marketing/large use, and a **simplified mark**
derived from it for small sizes (fine detail is illegible at 16px — favicons must stay simple).

**Production pipeline (image-gen → vectorize):**

1. **Generate** the crest from the prompts below (user runs an image tool; image generation is not
   available in the build/agent environment).
2. **Vectorize/clean** the chosen result to a tidy `logo-full.svg`, and derive a simplified mark.
3. **Export the favicon set** — `favicon.svg`, `favicon.ico` (16/32), `apple-touch-icon.png` (180),
   and an `og-image` — and wire `index.html` + web manifest.
4. **Until final art lands**, a clean hand-authored SVG placeholder (refined concept A or C) fills
   the `LogoComponent` slot so no other work is blocked.

Two compositions to generate (chosen during brainstorming):

- **Concept A — Staff & Coiled Dragon:** a dragon coiled around a gem-topped wizard's staff, head
  rising toward the gem.
- **Concept C — Dragon Roundel:** a dragon curled around a central faceted staff-gem inside a
  heraldic ring.

**Drafted image-gen prompts** (both compositions; dark, light, and simplified variants):

*Concept A — dark:* "A heraldic emblem of a dragon coiled around a wizard's staff topped with a
glowing crystal, dragon and staff fused into one sigil. Flat vector crest style, bold clean shapes,
gold and ember-orange (#eeb03a, #e2622a) on near-black (#15110f). Centered, symmetrical, logo mark,
no text, high contrast, generous negative space."

*Concept A — light:* same composition, "forest-green and gold (#276b48, #b0872a) on warm parchment
(#f3edde)."

*Concept C — dark:* "A circular heraldic medallion: a dragon curled around a central faceted gem
that doubles as a wizard's staff crystal, ring border with small rune ticks. Flat vector crest,
gold and ember-orange (#eeb03a, #e2622a) on near-black (#15110f), app-icon composition, no text,
symmetrical, high contrast."

*Concept C — light:* same composition, "forest-green and gold (#276b48, #b0872a) on warm parchment
(#f3edde)."

*Simplified favicon (either concept):* "A minimal single-color silhouette version of the mark,
extremely simple, readable at 16px, bold shapes only, no fine detail."

---

## 8. Testing & quality

Per ADR-0004 (TDD, behavior-first through the public surface, ≥80% coverage):

- **ThemeService** — defaults to OS preference when nothing is stored; persists an explicit choice;
  restores it on next load; toggles light↔dark. Asserted via the public API and its observable
  effects (`data-theme`, `localStorage`), not internals.
- **No-flash init** — the initial `data-theme` resolves correctly from a stored value vs. OS default
  before boot.
- **Signup** — valid input calls `createAccount` and navigates to `/home`; invalid input blocks
  submit and shows the correct field errors; API errors (duplicate, network) render the correct
  inline message. Tested through the rendered component with a faked `ApiService`.
- **Login (mock)** — submitting routes to `/home` and calls no API.
- **Routing** — each route renders its feature; unknown paths render the 404.
- **Landing** — renders required SEO landmarks (single `<h1>`; `<title>`/meta present).
- **Prerender/build** — CI builds the prerendered output; the existing nginx Docker image serves it
  on `$PORT`; the landing route ships as static HTML.

---

## 9. Process

- Branch `feat/12-landing-page-and-theming`; PR references **#12**.
- **Release: `minor`** (this is a feature) — apply the `release:minor` label and run
  `./scripts/bump-version bump minor` in the PR.
- Author the three ADRs (§3) via `adr-create` during implementation; run `./scripts/adr check`.
- Add/refresh a reference doc for the theming behavior if it warrants living documentation.

---

## 10. Out of scope (explicit)

- Real authentication, sessions, or password handling.
- Built-out collection spaces (MTG or otherwise) beyond the teaser card.
- Final marketing copy.
- A space-selection dashboard (deferred; the vision is noted, not built).
