---
id: '0002'
name: Adopt Angular, npm, and nginx-on-Docker for the frontend
description: Build the Zarlania SPA with Angular and TypeScript, manage dependencies
  via npm, and serve the production build via nginx in a multi-stage Docker image.
status: accepted
date_proposed: '2026-06-29'
date_accepted: '2026-06-29'
date_invalidated: null
author: stimothy
supersedes: []
superseded_by: []
tags:
- architecture
- build
---
# ADR-0002: Adopt Angular, npm, and nginx-on-Docker for the frontend

<!-- adr-meta:start -->
| Field | Value |
| --- | --- |
| ID | 0002 |
| Name | Adopt Angular, npm, and nginx-on-Docker for the frontend |
| Description | Build the Zarlania SPA with Angular and TypeScript, manage dependencies via npm, and serve the production build via nginx in a multi-stage Docker image. |
| Status | accepted |
| Date proposed | 2026-06-29 |
| Date accepted | 2026-06-29 |
| Date invalidated | — |
| Author | stimothy |
| Supersedes | — |
| Superseded by | — |
| Tags | architecture, build |
<!-- adr-meta:end -->

## Context and Problem Statement

`zarlania-app` is a single-page application (SPA) that consumes the `zarlania-api`
backend. We need to choose a frontend framework, a dependency manager, and a production
serving strategy that are consistent with the team's existing skills, give a small and
deployable artefact, and integrate cleanly with the Render Docker deployment decided in
ADR-0003.

## Decision Drivers

- The team is building a public product SPA and needs a mature, opinionated framework
  with strong TypeScript support and a long-term support track.
- Production build must be static files served efficiently, with no Node.js runtime
  dependency in production.
- The build pipeline must be reproducible and containerised end-to-end.
- Dependency management must be standard and Dependabot-compatible.

## Considered Options

- Angular + TypeScript + npm + multi-stage Node/nginx Docker (chosen).
- React + Vite (smaller framework footprint, but no opinionated structure).
- Vue.js (smaller ecosystem for SPA scaffolding).

## Decision Outcome

Chosen: **Angular with TypeScript, npm as the package manager, and a multi-stage Docker
image (Node build stage → nginx serve stage listening on `$PORT`).**

The Angular CLI (`ng`) handles scaffolding, builds, and testing. npm manages all
dependencies; `package.json` is the single authoritative manifest. The production image
runs nginx to serve the pre-built static bundle — no Node.js process in the runtime
container.

**Version-agnostic clause (binding):** Concrete versions (Angular, TypeScript, Node,
nginx, etc.) live in `package.json` and `Dockerfile` and are bumped routinely via
Dependabot and `ng update`. A version bump — including a major — never requires a new
ADR. Only changing the framework *choice* (e.g. migrating away from Angular) does.

### Consequences

- Good: strong conventions, CLI tooling, and TypeScript integration out of the box;
  static serving via nginx is efficient and minimal; single-binary Docker image is
  portable across Render and local environments.
- Bad: Angular's opinionated structure means more ceremony for small features; the
  framework's release cadence requires periodic major upgrades (mitigated by Dependabot
  and `ng update`).

## Links

- ADR-0003: deploy on Render via Docker (`render.yaml`)
- `package.json`, `Dockerfile`
