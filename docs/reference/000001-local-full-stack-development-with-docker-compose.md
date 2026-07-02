---
id: '000001'
title: Local full-stack development with Docker Compose
description: How docker compose runs the app and zarlania-api together locally and how they are wired
tags:
- architecture
- local-dev
created: '2026-07-01'
updated: '2026-07-01'
related: []
---
# Local full-stack development with Docker Compose

<!-- ref-meta:start -->
| Field | Value |
| --- | --- |
| ID | 000001 |
| Title | Local full-stack development with Docker Compose |
| Description | How docker compose runs the app and zarlania-api together locally and how they are wired |
| Tags | architecture, local-dev |
| Created | 2026-07-01 |
| Updated | 2026-07-01 |
| Related | — |
<!-- ref-meta:end -->

## Overview

`docker compose up --build` at the repo root builds and runs the full stack locally: this
app (nginx, published on `http://localhost:4200`) and
[zarlania-api](https://github.com/Zarlania/zarlania-api) (Spring Boot, published on
`http://localhost:8080`). It mirrors the production topology — two independently deployed
containers — for local end-to-end testing.

## Scope

Covers how the local compose stack is wired and why. It does not cover production
deployment (Render, see ADR-0003) or the `ng serve` inner loop, which remains the fastest
way to iterate on frontend code alone.

## Rules / constraints

- **The API must be checked out as a sibling directory** (`../zarlania-api`). The compose
  file uses it as a build context; override the location with the `ZARLANIA_API_DIR`
  environment variable.
- **The containers never talk to each other.** The app is a static bundle, so all API
  calls originate in the browser and go to the API's published host port. Both services
  therefore publish to `localhost`, and no compose-internal networking is involved.
- **The app is built with the `local` Angular configuration.** Compose passes the
  `BUILD_CONFIGURATION=local` build arg, which swaps in
  `src/environments/environment.local.ts` (`apiBaseUrl: http://localhost:8080`).
  Production builds are unaffected; the Dockerfile defaults to `production`.
- **CORS is set on the API, not the app.** Because calls are cross-origin
  (`localhost:4200` → `localhost:8080`), compose sets
  `ZARLANIA_CORS_ALLOWED_ORIGINS=http://localhost:4200` on the API service. No API code
  changes are required for local dev.
- **The API URL is baked at build time**, so changing it means rebuilding the app image
  (`docker compose build app`); prerendering does not call the API (only the
  client-rendered signup flow does), so an unreachable API during the image build is fine.

## Related

- ADR-0002 (Angular + nginx-on-Docker), ADR-0003 (deploy on Render as code using Docker)
- `docker-compose.yml`, `Dockerfile`, `angular.json` (`local` configuration),
  `src/environments/environment.local.ts`
