---
id: '0010'
name: Adopt the Angular Router with a standalone app shell
description: 'Introduce the Angular Router with lazy standalone route components and a single app-shell (header, theme toggle, router-outlet, footer), organizing feature code feature-first with core and shared areas for cross-cutting concerns.'
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
# ADR-0010: Adopt the Angular Router with a standalone app shell

<!-- adr-meta:start -->
| Field | Value |
| --- | --- |
| ID | 0010 |
| Name | Adopt the Angular Router with a standalone app shell |
| Description | Introduce the Angular Router with lazy standalone route components and a single app-shell (header, theme toggle, router-outlet, footer), organizing feature code feature-first with core and shared areas for cross-cutting concerns. |
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

The app grew from a single hello-world component into a multi-page product (landing, signup,
login, home, and a 404). It previously had no router. We need a routing model and a consistent
page structure that scales as features are added, consistent with the standalone-component,
signals, `OnPush` conventions from ADR-0002 and the code-quality rules in ADR-0004.

## Decision Drivers

- Multiple pages sharing persistent chrome (header, navigation, theme toggle, footer).
- Standalone-components architecture — no NgModules.
- Code should scale feature-first with clear boundaries between features and cross-cutting concerns.
- Keep the initial bundle small by lazy-loading routes.

## Considered Options

- Angular Router + a standalone app-shell + lazy `loadComponent` routes, feature-first folders (chosen).
- A single root component with manual view switching.
- NgModule-based routing (`RouterModule.forRoot`).

## Decision Outcome

Chosen: **adopt the Angular Router via `provideRouter(routes)` in the application config, with
routes lazy-loading standalone components through `loadComponent`.** A single app-shell
(`AppComponent`) renders the persistent header (logo, nav, theme toggle, auth links), a `<main>`
containing the `<router-outlet>`, and the footer; feature pages render inside the outlet. Code is
organized **feature-first**: each feature owns a directory under `features/<name>/` with its
component, template, styles, and spec co-located; cross-cutting concerns live in `core/` (services)
and `shared/` (reusable UI primitives).

**Binding rules:**

- Routing uses standalone components and `provideRouter` — no `RouterModule.forRoot` or NgModules.
- Persistent chrome lives once in the app-shell layout; it is not duplicated per page.
- New pages are added as lazy `loadComponent` routes with their code under `features/`.

### Consequences

- Good: small initial bundle via lazy routes; consistent chrome across pages; clear feature
  boundaries; idiomatic modern Angular.
- Bad: the app-shell is a shared touch-point that must be kept lean; per-feature folders add a
  little structure overhead for very small pages (accepted).

## Links

- ADR-0002: Adopt Angular, npm, and nginx-on-Docker for the frontend
- ADR-0004: Enforce code quality and security gates (feature-first, standalone, OnPush)
- ADR-0009: Theme via CSS custom-property tokens (the theme toggle lives in the shell)
- Spec: `docs/superpowers/specs/2026-07-01-landing-page-and-theming-design.md` (§3)
