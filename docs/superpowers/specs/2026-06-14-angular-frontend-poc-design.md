# Zarlania Frontend POC — Design

**Date:** 2026-06-14
**Status:** Approved
**Repo:** `Zarlania/zarlania-app` (GitHub, Zarlania org)

## Goal

Prove the end-to-end pattern for the Zarlania frontend: a minimal Angular SPA that
(a) is dockerized, (b) deploys on Render via GitHub auto-deploy, (c) is served at the
apex domain `zarlania.com` over HTTPS, and (d) calls the existing backend and renders
its response. The app content is intentionally trivial — this is infrastructure proof,
not a real app. Keep it lean.

## The backend (already live, no changes needed)

- URL: `https://api.zarlania.com/` (also `https://zarlania-api.onrender.com/`)
- `GET /` returns JSON: `{"message":"Hello from Zarlania API v2"}`
- CORS already enabled: returns `Access-Control-Allow-Origin: *` for GET. Browser
  calls from the frontend origin will work with no backend change.

## Non-goals (YAGNI)

- No routing, no state management, no UI framework/SCSS library.
- No robustness/scaling concerns, no auth, no retries/caching.
- No running unit tests inside the Docker build.

## Architecture

Latest stable Angular, standalone components (no NgModule), generated minimal
(no routing). Two units:

### `ApiService`
- `getMessage()` performs `GET <apiBaseUrl>` and returns the `message` string from
  the JSON response.
- `apiBaseUrl` comes from Angular environment config
  (`src/environments/environment.ts` for prod, `environment.development.ts` for dev),
  **not** hardcoded in a component. Prod value: `https://api.zarlania.com`.

### `AppComponent`
- On init, calls `ApiService.getMessage()`.
- Renders exactly one of three states:
  - **loading** — shows "Loading…"
  - **success** — shows the returned message text
  - **error** — shows a short failure message

That is the entire UI.

## Data flow

`AppComponent` (ngOnInit) → `ApiService.getMessage()` → `HttpClient.get(apiBaseUrl)`
→ map response to `message` → component renders message (or error state on failure).

## Testing (TDD)

Meaningful tests for a trivial app, written test-first:

- **`ApiService`** — using `HttpTestingController`: asserts it issues a GET to the
  configured `apiBaseUrl` and returns the `message` field from the response body.
- **`AppComponent`** — with `ApiService` mocked: renders "Loading…" initially, renders
  the message on success, renders an error message on failure.

Test runner: Angular default (Karma/Jasmine). Tests run **locally** during development.
The Docker build does **not** run tests (keeps image builds fast; avoids Chrome in the
build image).

## Dockerization (Render-style multi-stage)

- **Stage 1 (`node`):** `npm ci` → `ng build` (production) → static bundle in `dist/`.
- **Stage 2 (`nginx`):** copies the built bundle into the nginx html dir.
- **`$PORT` handling:** Render injects a `$PORT` env var the container must listen on.
  Ship `nginx.conf.template` with `listen $PORT;` and SPA fallback
  (`try_files $uri $uri/ /index.html`). A `docker-entrypoint.sh` runs `envsubst` to
  render the template into the real nginx config, then starts nginx in the foreground.
  Without this the Render health check fails (nginx would default to port 80).

## Repo layout

Angular project lives at the **repo root** (Render build context = root):

```
/
  src/
    app/                      (AppComponent, ApiService)
    environments/
      environment.ts          (prod: https://api.zarlania.com)
      environment.development.ts
  Dockerfile                  (multi-stage node -> nginx)
  nginx.conf.template         (listen $PORT; SPA fallback)
  docker-entrypoint.sh        (envsubst -> start nginx)
  package.json
  angular.json
  ...
```

## Deployment

### Render (Web Service, Docker)

- Service type: **Web Service**, runtime **Docker**, connected to `Zarlania/zarlania-app`.
- Auto-deploy on push to `master`.
- Free tier (idle spin-down + ~30s cold start is acceptable for a POC).
- Custom domains: `zarlania.com` (apex, canonical) and `www.zarlania.com` (redirect to apex).
- Render auto-issues TLS once DNS resolves.
- Rationale for Web Service over Static Site: the goal is to *prove dockerization* and
  exercise the multi-stage + `$PORT` pattern reused by the real site later. Static Site
  would be always-on CDN but proves nothing about Docker.

### DNS (Squarespace Domains)

Apex cannot be a CNAME, so:

- Host `@`: remove Squarespace default/parking A records that would conflict; add the
  **A record(s)** pointing to the Render-provided IP(s) shown when the custom domain is
  added.
- Host `www`: add a **CNAME** to the Render-provided target; configure www→apex redirect
  in Render.

These steps are interactive and will be guided through the Render dashboard and
Squarespace DNS panel by the user (who holds the accounts).

## Success criteria

1. `docker build` produces an image; running it locally serves the app on the port given
   by `$PORT`.
2. Local unit tests pass (ApiService + AppComponent).
3. Pushing to `master` triggers a Render deploy that goes live.
4. `https://zarlania.com` loads over HTTPS and displays
   "Hello from Zarlania API v2" (the live backend message).
5. `https://www.zarlania.com` redirects to `https://zarlania.com`.
