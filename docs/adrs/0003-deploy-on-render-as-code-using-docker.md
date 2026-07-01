---
id: '0003'
name: Deploy on Render as code using Docker
description: Codifies the Render web service in render.yaml with a Docker image, autoDeploy
  from master, and healthcheck on /, replacing hand-configured dashboard-only setup.
status: accepted
date_proposed: '2026-06-29'
date_accepted: '2026-06-29'
date_invalidated: null
author: stimothy
supersedes: []
superseded_by: []
tags:
- build
- deployment
---
# ADR-0003: Deploy on Render as code using Docker

<!-- adr-meta:start -->
| Field | Value |
| --- | --- |
| ID | 0003 |
| Name | Deploy on Render as code using Docker |
| Description | Codifies the Render web service in render.yaml with a Docker image, autoDeploy from master, and healthcheck on /, replacing hand-configured dashboard-only setup. |
| Status | accepted |
| Date proposed | 2026-06-29 |
| Date accepted | 2026-06-29 |
| Date invalidated | — |
| Author | stimothy |
| Supersedes | — |
| Superseded by | — |
| Tags | build, deployment |
<!-- adr-meta:end -->

## Context and Problem Statement

The POC frontend was configured by hand in the Render dashboard, leaving the deployment
undocumented and unreviewable. As the repo moves toward a production-shaped baseline we
want the deployment captured in the repo and reproducible locally.

## Decision Drivers

- Deployment configuration should be reviewable, not click-ops only.
- Every merge to `master` must ship to production automatically with no manual step.
- Local development should run the app the same way it runs in production.
- The service must be reachable at `https://zarlania.com` (Squarespace apex DNS).

## Considered Options

- `render.yaml` Blueprint (deploy-as-code) with Docker runtime (chosen).
- Dashboard-only configuration.
- A different host/PaaS (Fly.io, Vercel, Netlify, etc.).

## Decision Outcome

Chosen option: **codify the Render web service in `render.yaml`** (Docker runtime,
`autoDeploy` on pushes to `master`, healthcheck path `/`). The `Dockerfile` uses a
multi-stage build (Node build → nginx serve) to produce a minimal static-serving image
that listens on `$PORT` as injected by Render. DNS is Squarespace apex pointing to
Render — no CDN layer at launch.

Every merge to `master` triggers exactly one Render deploy (no post-merge bump commit
ever), which is consistent with the one-merge-one-release rule in ADR-0006.

### Consequences

- Good: reproducible, reviewed deploy config; `master` → production is automatic;
  local/prod parity via Docker; deployment changes go through PR review.
- Bad: free-tier Render cold-starts on idle; some settings (secret env values) must
  still be applied out of band in the Render dashboard.

## Links

- ADR-0002: Angular + nginx-on-Docker build (`package.json`, `Dockerfile`)
- ADR-0006: one merge = one release = one deploy
- `render.yaml`, `Dockerfile`
