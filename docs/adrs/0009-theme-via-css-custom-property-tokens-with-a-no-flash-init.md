---
id: 0009
name: Theme via CSS custom-property tokens with a no-flash init
description: 'Define light and dark theming as semantic CSS custom-property tokens switched by a data-theme attribute on the document root, with a pre-boot inline script that sets the initial theme before first paint to avoid a flash.'
status: proposed
date_proposed: '2026-07-01'
date_accepted: null
date_invalidated: null
author: stimothy
supersedes: []
superseded_by: []
tags:
- architecture
---
# ADR-0009: Theme via CSS custom-property tokens with a no-flash init

<!-- adr-meta:start -->
| Field | Value |
| --- | --- |
| ID | 0009 |
| Name | Theme via CSS custom-property tokens with a no-flash init |
| Description | Define light and dark theming as semantic CSS custom-property tokens switched by a data-theme attribute on the document root, with a pre-boot inline script that sets the initial theme before first paint to avoid a flash. |
| Status | proposed |
| Date proposed | 2026-07-01 |
| Date accepted | — |
| Date invalidated | — |
| Author | stimothy |
| Supersedes | — |
| Superseded by | — |
| Tags | architecture |
<!-- adr-meta:end -->

## Context and Problem Statement

The app supports light and dark themes that must respect the user's OS preference, be toggleable
on every page, persist the last explicit choice, and never flash the wrong theme on load.
Components must not hard-code colors, so re-theming stays a single-source token change rather than
a component-wide hunt. We need a theming mechanism that satisfies all of this with minimal
dependencies and that works with the prerendered landing page (ADR-0008).

## Decision Drivers

- One source of truth for colors (and spacing/radii); components reference semantic tokens only.
- Respect `prefers-color-scheme`, allow an explicit user override, and persist it.
- No flash of the wrong theme before Angular boots — including on prerendered HTML.
- Lean: no CSS-in-JS or component-library theming dependency.

## Considered Options

- CSS custom properties + a `data-theme` attribute + a pre-boot inline script (chosen).
- A CSS-in-JS / component-library theming system.
- Per-component SCSS theme mixins.

## Decision Outcome

Chosen: **semantic CSS custom properties defined once in global styles, one block per
`:root[data-theme='<mode>']`, switched by a `data-theme` attribute on the document root.** A
signals-based `ThemeService` owns the current theme, keeping the `data-theme` attribute,
`localStorage`, and the OS preference in sync; it is SSR-safe and fails soft on storage errors. A
tiny inline script in `index.html` runs before first paint (before Angular boots), resolving
stored choice → OS preference → default `dark`, and sets `data-theme` immediately to prevent a
flash. Prerendered HTML ships with a `dark` default that the inline script corrects on the client
before paint.

**Binding rules:**

- Component styles reference semantic tokens (`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`)
  only — no raw hex/rgb in component styles.
- Theme is switched via the `data-theme` attribute on the document root, never per-component theme
  classes.
- The pre-boot inline script and `ThemeService` must share the same storage key and resolution
  rules so they never disagree.

### Consequences

- Good: instant, flash-free theming; re-theming is a token edit; zero runtime dependency; works
  cleanly with prerendering.
- Bad: the theme-resolution logic is necessarily duplicated between the inline script (which cannot
  import application code) and `ThemeService` — accepted and kept in sync by convention, with the
  storage key as a shared constant.

## Links

- ADR-0002: Adopt Angular, npm, and nginx-on-Docker for the frontend
- ADR-0008: Prerender public routes to static HTML for SEO (default-theme interaction)
- Spec: `docs/superpowers/specs/2026-07-01-landing-page-and-theming-design.md` (§4)
