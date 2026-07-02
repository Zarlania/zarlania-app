---
id: 0008
name: Prerender public routes to static HTML for SEO
description: 'Prerender the public landing route to static HTML at build time via @angular/ssr static output, so crawlers get fully-rendered content while the app still deploys as static files on nginx with no runtime Node server.'
status: proposed
date_proposed: '2026-07-01'
date_accepted: null
date_invalidated: null
author: stimothy
supersedes: []
superseded_by: []
tags:
- build
- deployment
---
# ADR-0008: Prerender public routes to static HTML for SEO

<!-- adr-meta:start -->
| Field | Value |
| --- | --- |
| ID | 0008 |
| Name | Prerender public routes to static HTML for SEO |
| Description | Prerender the public landing route to static HTML at build time via @angular/ssr static output, so crawlers get fully-rendered content while the app still deploys as static files on nginx with no runtime Node server. |
| Status | proposed |
| Date proposed | 2026-07-01 |
| Date accepted | — |
| Date invalidated | — |
| Author | stimothy |
| Supersedes | — |
| Superseded by | — |
| Tags | build, deployment |
<!-- adr-meta:end -->

## Context and Problem Statement

The landing page is the primary public, indexable surface of a live product site
(<https://zarlania.com>). As a pure client-rendered SPA, crawlers receive an empty shell and
must execute JavaScript to see any content — slower and less reliable to index. We want strong
SEO for the public marketing content without abandoning the nginx-static deployment model
established in ADR-0002 and ADR-0003.

## Decision Drivers

- Public marketing content must be crawlable and indexable as fully-rendered HTML.
- Keep the nginx-static deploy — no Node.js process in the production runtime (ADR-0002/0003).
- Interactive/authenticated routes (signup, login, home) are not indexable surfaces and need no SEO.
- Minimal added complexity and dependencies.

## Considered Options

- Static prerender (SSG) at build time via `@angular/ssr` with static output (chosen).
- Full server-side rendering (SSR) with a Node server running at request time.
- Client-only SPA with hand-maintained meta tags.

## Decision Outcome

Chosen: **prerender public routes to static HTML at build time using `@angular/ssr` with static
output mode.** Per-route render modes are explicit: the public landing (`/`) prerenders; the
interactive app routes (`/signup`, `/login`, `/home`) and the wildcard render on the client. The
build emits static files into `dist/zarlania-app/browser`, which nginx serves; `index.csr.html`
is the SPA fallback for client routes (`try_files $uri $uri/ /index.csr.html`). No Node.js
runtime process is introduced — production remains nginx serving static files on `$PORT`.
`@angular/ssr` is a build-time dependency only.

**Binding rules:**

- Public, indexable routes are prerendered; interactive/authenticated routes are client-rendered.
- No runtime Node server is added; production stays nginx-static per ADR-0002/0003.
- Any service that executes during prerender must be SSR-safe — no unguarded `window`,
  `localStorage`, or `document` access at construction.

### Consequences

- Good: crawlable HTML for ranking; the static nginx deploy is preserved; fast first paint on the
  landing page.
- Bad: prerendering runs application code under Node at build time, so browser-only APIs must be
  guarded; adds the `@angular/ssr` build dependency and an `index.csr.html` fallback to reason
  about in the nginx config.

## Links

- ADR-0002: Adopt Angular, npm, and nginx-on-Docker for the frontend
- ADR-0003: Deploy on Render as code using Docker
- ADR-0009: Theme via CSS custom-property tokens with a no-flash init (prerender interaction)
- Spec: `docs/superpowers/specs/2026-07-01-landing-page-and-theming-design.md` (§2, §5)
