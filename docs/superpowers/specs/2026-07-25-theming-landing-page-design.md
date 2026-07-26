# Design: theming and the landing page

- **Issue:** [#42](https://github.com/Zarlania/zarlania-app/issues/42)
- **Date:** 2026-07-25
- **Applies to:** `Zarlania/zarlania-app` only.
- **Spec chain:** 5 of 7 — the first frontend spec. Predecessor:
  [spec 4 — admin and machine tokens](https://github.com/Zarlania/zarlania-api/blob/master/docs/superpowers/specs/2026-07-25-admin-machine-tokens-design.md)
  in `zarlania-api` (the full seven-part decomposition is in spec 1 there).
  Successor: spec 6, *auth flows* (written after this one; it references this
  spec). This spec has no backend dependency and may be implemented in
  parallel with backend specs 2–4.

## Purpose

Give the app its face and its bones: a theme system built to be re-skinned in
one place, a search-engine-real landing page in the wizards-and-dragons
voice, the brand assets, and the routing skeleton every later page hangs on.
POC-level content, production-level structure.

## Scope

Delivered: theme registry + light/dark themes + no-flash init + toggle,
React Router v7 adoption with build-time prerender, the landing page with
full SEO metadata, `/login`–`/signup` stub pages, an in-theme 404 and error
boundary, and the brand assets. Stub pages are replaced wholesale by spec 6;
landing copy is explicitly refinable later.

## Architecture (chosen approach)

**React Router v7 framework mode with build-time prerender** — the app is a
Render Static Site (no server, so no SSR); RR7's supported
`ssr: false` + `prerender: ['/']` combination makes the build emit
`dist/index.html` containing the real landing markup. Crawlers get full HTML
with no JavaScript; users get the same HTML, hydrated into the SPA. Every
other route stays client-rendered behind the existing `render.yaml` rewrite
rule.

Rejected: a library-mode router plus a separate Vite prerender plugin (two
tools that must be kept agreeing) and meta-tags-only with no prerender
(non-Google crawlers and link previews see an empty shell).

- **Route skeleton:** `root.tsx` layout (theme init + meta live here);
  `/` landing (prerendered); `/login` and `/signup` stubs ("the gates open
  soon", in-theme) so the landing CTAs navigate somewhere real and spec 5 can
  deploy before the backend is live; `*` in-theme 404. Replaces the
  hello-world `App.tsx` scaffolding outright.
- **Unchanged conventions:** plain CSS custom properties (no Tailwind —
  `index.css` is the token home), colocated tests/stories, Storybook + a11y
  addon, the 80% coverage gate.

## Brand assets

From the maintainer's generated set (currently only in the api repo's
gitignored `ai-prompts/`):

- Into `public/`, wired into head metadata: `favicon.svg`, `favicon.ico`,
  `icon-192.png` + `icon-512.png` (+ a web manifest),
  `apple-touch-icon.png`, `og-image.jpg` (OpenGraph/Twitter card).
- **`original-generated-image.png` is committed to `docs/assets/`** — brand
  source material, git-tracked so it is never lost, but not a served asset
  and not in the bundle.

## Theme system

- **Single source of truth:** all colors (plus shared radii/shadows) are CSS
  custom properties in `index.css`, one block per theme under
  `:root[data-theme="<id>"]`. Components reference only semantic tokens
  (`--color-surface`, `--color-text`, `--color-accent`, `--color-border`, …)
  — never a raw hex. A palette change is one file.
- **A theme registry, not a boolean** (future-proofing chosen deliberately):
  `data-theme` carries a theme *id* — today exactly `light` and `dark` — and
  each registered theme declares its base mode (light/dark), which drives
  `color-scheme`, `theme-color`, and the system-preference mapping. Adding an
  optional theme later is: one token block + one registry entry + upgrading
  the toggle to a picker. Persistence already stores the id; the no-flash
  script already reads whatever id is stored. Today ships two themes and a
  simple toggle.
- **No flash of wrong theme:** a tiny inline `<script>` in `<head>` — before
  any paint or bundle — reads `localStorage`, falls back to
  `prefers-color-scheme`, stamps `data-theme` on `<html>`. Required, not
  optional: the prerendered HTML arrives before React exists. Its decision
  logic is a pure module shared with the React side so the two cannot drift.
- **Preference model:** default = system preference, followed *live* via the
  media-query listener, until the user explicitly picks; an explicit choice
  persists to `localStorage` and wins thereafter. The toggle is a small
  accessible component (button with pressed state, keyboard operable) in the
  shared header.
- **The two moods as palette:** dark = **fire and stone** — deep
  charcoal/basalt surfaces, warm ember accent, firelight interactive states.
  Light = **stone, wood, library** — warm parchment/limestone surfaces,
  aged-wood browns, a deep ember accent shared across themes for continuity.
  Not pictures of castles — color that *feels* like the places. Both
  palettes must pass WCAG AA; exact hex values are chosen at implementation
  against that gate (the Storybook a11y addon checks per story).

## Landing page

**Content, in the medieval voice** (POC copy, refined later):

- Hero — Zarlania as the keep where collectors' treasures are kept safe:
  logo, one-line promise, CTAs *Create account* → `/signup` and *Enter* →
  `/login`.
- "Vaults" section — 4–6 cards from the product vision (trading cards,
  movies, books, coins, …), each teasing future powers (decks, playtesting,
  wish lists, locations).
- "How it works" strip — create your account → claim your vault → catalog
  your hoard.
- Footer — GitHub repos and the usual small links.

All real prerendered HTML with a proper `h1`–`h3` outline — that outline *is*
the SEO work.

**Metadata:** unique title/description per route via RR7's meta API;
canonical URL; OpenGraph + Twitter card on `og-image.jpg`; JSON-LD
`WebSite` + `Organization`; `robots.txt` (allow all, point at sitemap); a
build-generated `sitemap.xml` listing public routes only; icons + manifest
as above.

**Performance as SEO:** prerendered HTML wins most of it; fonts are
**self-hosted woff2** (a medieval-flavored display face for headings, a
plain readable body face — no third-party font CDN), preloaded,
`font-display: swap`; below-the-fold imagery lazy. Target: green Core Web
Vitals on the landing route.

## Error handling

An in-theme root error boundary (React Router `errorElement`) and the 404
route. Nothing else exists to fail yet; API errors arrive with spec 6.

## Testing

- **Component/unit (Vitest + Testing Library, by role/label):** the theme
  brain as a pure module — explicit choice beats system, system followed
  live until a choice exists, choice persists, unknown stored id falls back
  safely; the toggle (keyboard, pressed state, persistence); the landing's
  heading outline and CTAs; stubs and 404 render in-theme.
- **Prerender guard in CI:** after `npm run build`, assert
  `dist/index.html` contains the landing `<h1>` and the OG/meta tags — the
  point of this spec, protected against regressing to an empty `#root`
  shell by a future config change.
- **Storybook:** every new component ships a story (hero, vault card, theme
  toggle, header, footer, stub page) with a theme-switch toolbar; the a11y
  addon enforces contrast and keyboard rules per story.
- **Coverage:** the 80% gate stands.

## Decisions log

| Decision | Choice | Alternatives rejected |
| -------- | ------ | --------------------- |
| SEO on static hosting | RR7 framework mode, `ssr: false` + prerender | Library router + prerender plugin; meta-tags only |
| Theme mechanism | Registry of theme ids on `data-theme`, semantic tokens | Light/dark boolean baked into components |
| Theme count now | Exactly `light` + `dark`, simple toggle | Shipping multiple optional themes already |
| No-flash strategy | Inline head script + shared pure module | React-only theming (flashes on prerendered HTML) |
| Styling | Plain CSS custom properties in `index.css` | Tailwind / CSS-in-JS (against repo convention) |
| Fonts | Self-hosted woff2, preloaded | Third-party font CDN |
| Auth CTAs | Stub `/login` + `/signup` pages now | Dead links until spec 6; hiding CTAs |
| Source image | Committed to `docs/assets/` | Leaving it untracked in `ai-prompts/` |
