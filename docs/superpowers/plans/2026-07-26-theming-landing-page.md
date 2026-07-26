# Theming & Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-07-25-theming-landing-page-design.md`
**Depends on:** nothing backend-side; implementable in parallel with backend specs 2–4.

**Goal:** React Router v7 framework mode with a prerendered, SEO-complete landing page; a registry-based light/dark theme system with no flash of wrong theme; brand assets; and `/login`–`/signup` stubs.

**Architecture:** `react-router.config.ts` runs `ssr: false` + `prerender: ['/']`, so the build emits real landing HTML. Theme ids live in one registry module; an inline head script stamps `data-theme` before paint and a `ThemeProvider` takes over after hydration; both consume the same pure `resolveTheme` logic. All colors are semantic CSS custom properties in `src/index.css`.

**Tech Stack:** React 19, React Router 7 (`react-router`, `@react-router/dev`), Vite 8, Vitest + Testing Library, Storybook 10 (+a11y).

## Global Constraints

- `npm run verify` (typecheck, lint --max-warnings 0, format:check, test with 80% line/branch/function/statement coverage) must pass before any commit is declared done; lint-staged runs Prettier automatically on commit.
- Every new component ships a colocated `*.stories.tsx`; tests query by role/label only; every interactive element keyboard-operable.
- Styling: plain CSS custom properties in `src/index.css`; components reference only semantic tokens (`--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-contrast`, `--color-border`, `--radius`, `--shadow`) — never a raw color value in a component file. Both palettes must pass WCAG AA (checked per story by the a11y addon).
- Theme ids (exact): `light`, `dark`. localStorage key: `zarlania-theme`. `data-theme` attribute on `<html>`.
- Route paths (exact): `/`, `/login`, `/signup`, `*` (404). Only `/` is prerendered.
- No third-party network anything at runtime: fonts are self-hosted woff2 in `public/fonts/`.
- Branch/commit/PR rules as the repo defines: branch `<ISSUE>-<slug>`, commits `#<ISSUE> <type>: …`, PR needs `Closes #<ISSUE>` + a release label.
- The version field in `package.json` stays `0.0.0`.

---

### Task 0: Tracking issue and branch

- [ ] **Step 1:**

```bash
gh issue create --title "feat: theme system and prerendered landing page" --label feature --body "$(cat <<'EOF'
### Problem

The app is a hello-world shell: no routing, no theming, and a landing page that crawlers see as an empty div.

### Proposed solution

Implement docs/superpowers/specs/2026-07-25-theming-landing-page-design.md: React Router v7 framework mode with build-time prerender of /, a registry-based light/dark theme system with no-flash init, the wizards-and-dragons landing page with full SEO metadata, brand assets, and /login + /signup stubs.

### Alternatives considered

Library-mode router with a separate prerender plugin; meta-tags-only SEO — rejected in the spec's decisions log.

### Is this a breaking change?

No — backwards compatible

### Additional context

Spec 5 of 7 (chain starts in Zarlania/zarlania-api#26).

### Before submitting

- [x] I searched existing issues and discussions and this is not a duplicate.
- [x] I agree to follow this project's Code of Conduct.
EOF
)"
git fetch origin master && git checkout -b <ISSUE>-theming-landing origin/master
```

---

### Task 1: Brand assets

**Files:**
- Create: `public/favicon.ico`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, `public/og-image.jpg`, `public/site.webmanifest`, `public/robots.txt`
- Create: `docs/assets/original-generated-image.png`
- (`public/favicon.svg` already exists.)

- [ ] **Step 1: Copy the assets from the api repo's prompt folder (they are gitignored there)**

```bash
SRC=~/workspace/zarlania-api/docs/ai-prompts
cp "$SRC"/favicon.ico "$SRC"/icon-192.png "$SRC"/icon-512.png \
   "$SRC"/apple-touch-icon.png "$SRC"/og-image.jpg public/
mkdir -p docs/assets && cp "$SRC"/original-generated-image.png docs/assets/
```

- [ ] **Step 2: Manifest and robots**

`public/site.webmanifest`:

```json
{
  "name": "Zarlania",
  "short_name": "Zarlania",
  "description": "Discover, organize, and manage your collections with Zarlania.",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": "/",
  "display": "standalone"
}
```

`public/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://zarlania.com/sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add public docs/assets
git commit -m "#<ISSUE> feat: add brand icons, manifest, robots, and the tracked source image"
```

---

### Task 2: React Router v7 framework mode

**Files:**
- Modify: `package.json` (deps + scripts), `vite.config.ts`, `render.yaml` (publish dir), `.gitignore` (`.react-router/`, `build/`)
- Create: `react-router.config.ts`, `src/root.tsx`, `src/routes.ts`, `src/routes/landing.tsx` (placeholder filled by Task 4)
- Delete: `index.html`, `src/App.tsx`, `src/App.test.tsx`, `src/App.stories.tsx`, `src/App.css`, `src/main.tsx`
- Test: `src/root.test.tsx`

**Interfaces:**
- Produces: the route tree every later task plugs into; `src/root.tsx` exports `Layout` (full HTML document — head metadata home) and default `Root` (`<Outlet />`); `src/routes.ts` uses `@react-router/dev/routes` config format. Build output: `build/client/` (static site). Scripts: `dev` = `react-router dev`, `build` = `tsc -b && react-router build`, `preview` = `vite preview --outDir build/client`.

- [ ] **Step 1: Install and configure**

```bash
npm install react-router
npm install -D @react-router/dev
```

`react-router.config.ts`:

```ts
import type { Config } from '@react-router/dev/config'

export default {
  appDirectory: 'src',
  // Static host: no server. The listed routes are baked to real HTML at build
  // time; everything else is client-rendered behind the render.yaml rewrite.
  ssr: false,
  prerender: ['/'],
} satisfies Config
```

`vite.config.ts` — swap the React plugin for the framework plugin, except under Vitest and Storybook, which drive their own React pipelines:

```ts
import { reactRouter } from '@react-router/dev/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [process.env.VITEST || process.env.STORYBOOK ? react() : reactRouter()],
  // …server/preview/test blocks unchanged, except coverage.exclude: replace
  // 'src/main.tsx' with 'src/routes.ts' (pure config, no logic)…
})
```

`src/routes.ts`:

```ts
import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/landing.tsx'),
  route('login', 'routes/login.tsx'),
  route('signup', 'routes/signup.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
```

(`login.tsx`/`signup.tsx`/`not-found.tsx` are one-line placeholders here — `export default function Login() { return <main><h1>Login</h1></main> }` etc. — replaced in Task 5; `landing.tsx` likewise a `<main><h1>Zarlania</h1></main>` placeholder until Task 4.)

`src/root.tsx`:

```tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import './index.css'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return <Outlet />
}
```

`package.json` script changes: `"dev": "react-router dev"`, `"build": "tsc -b && react-router build"`, `"preview": "vite preview --outDir build/client"`. Add `.react-router/` and `build/` to `.gitignore`. `render.yaml`: change the static publish path from `dist` to `build/client` (read the file first; adjust the key that points at `dist`).

- [ ] **Step 2: Root smoke test**

`src/root.test.tsx` — render the route tree with `createRoutesStub` from `react-router` (stub in the landing placeholder) and assert the landing heading renders; this keeps `root.tsx` in coverage.

- [ ] **Step 3: Verify everything still runs**

```bash
npm run verify && npm run build
ls build/client/index.html
```

Expected: verify green; `build/client/index.html` exists and contains `<h1>` (placeholder) — the prerender pipeline works before any real content exists.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "#<ISSUE> feat: adopt React Router framework mode with prerender"
```

---

### Task 3: The theme system

**Files:**
- Create: `src/theme/themes.ts`, `src/theme/resolveTheme.ts`, `src/theme/themeInitScript.ts`, `src/theme/ThemeProvider.tsx`, `src/theme/ThemeToggle.tsx` (+ `.stories.tsx`)
- Modify: `src/index.css`, `src/root.tsx`, `.storybook/preview.tsx`
- Test: `src/theme/resolveTheme.test.ts`, `src/theme/themeInitScript.test.ts`, `src/theme/ThemeProvider.test.tsx`, `src/theme/ThemeToggle.test.tsx`

**Interfaces:**
- Produces:
  - `themes.ts`: `export type ThemeId = 'light' | 'dark'`; `export interface Theme { id: ThemeId; mode: 'light' | 'dark'; label: string }`; `export const THEMES: readonly Theme[]` (light → "Daylight Hall", dark → "Ember Keep"); `export const THEME_STORAGE_KEY = 'zarlania-theme'`; `export const DEFAULT_DARK: ThemeId = 'dark'`, `DEFAULT_LIGHT: ThemeId = 'light'`.
  - `resolveTheme.ts`: `export function resolveTheme(stored: string | null, systemPrefersDark: boolean): ThemeId` — stored value that matches a registered id wins; otherwise system preference maps to the default theme of that mode.
  - `themeInitScript.ts`: `export const themeInitScript: string` — an IIFE string that must implement exactly `resolveTheme`'s decision table inline (storage key and ids interpolated from the constants so they cannot drift) and set `document.documentElement.dataset.theme`.
  - `ThemeProvider.tsx`: context `{ themeId: ThemeId; setTheme(id: ThemeId): void }` via `export function useTheme()`; on mount syncs from the DOM attribute; follows the `prefers-color-scheme` media query **only while nothing is stored**; `setTheme` stamps the attribute + persists.
  - `ThemeToggle.tsx`: button labelled "Switch to dark theme"/"Switch to light theme" (aria-label), rendering ☾/☀ text glyphs; disabled-free, keyboard-native.

- [ ] **Step 1: Failing tests for the brain**

`resolveTheme.test.ts` — the whole decision table: `('dark', false) → 'dark'`; `('light', true) → 'light'`; `(null, true) → 'dark'`; `(null, false) → 'light'`; `('bogus', true) → 'dark'` (unknown falls back to system). `themeInitScript.test.ts` — for each of those five cases: set `localStorage`/mock `matchMedia`, `new Function(themeInitScript.replace(/^<script>|<\/script>$/g, ''))()` — wait, the constant is the bare IIFE (no tags) — execute it, assert `document.documentElement.dataset.theme` equals `resolveTheme`'s answer for the same inputs (the agreement test that stops drift).

- [ ] **Step 2: Implement brain + script, pass those tests**

`themeInitScript.ts`:

```ts
import { DEFAULT_DARK, DEFAULT_LIGHT, THEMES, THEME_STORAGE_KEY } from './themes'

const ids = JSON.stringify(THEMES.map((t) => t.id))

export const themeInitScript = `(function () {
  var stored = null;
  try { stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch (e) {}
  var ids = ${ids};
  var theme = ids.indexOf(stored) >= 0
    ? stored
    : (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? ${JSON.stringify(DEFAULT_DARK)}
        : ${JSON.stringify(DEFAULT_LIGHT)});
  document.documentElement.dataset.theme = theme;
})();`
```

Wire into `root.tsx`'s `<head>`, first thing after charset: `<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />` plus `<meta name="color-scheme" content="light dark" />`.

- [ ] **Step 3: Tokens**

Replace `src/index.css`'s color values with the two token blocks (keep the existing reset). Exact hex values are the implementer's choice **subject to** WCAG AA on every token pairing used (`text` on `surface`, `text` on `surface-raised`, `accent-contrast` on `accent`, `text-muted` on `surface` at large-text minimum) — the moods: dark `ember keep` (near-black basalt `--color-surface`, warm ember accent), light `stone & library` (warm parchment surface, aged-wood browns, same ember accent family). Structure:

```css
:root[data-theme='light'] {
  color-scheme: light;
  --color-surface: /* warm parchment */;
  --color-surface-raised: …;
  --color-text: …;
  --color-text-muted: …;
  --color-accent: …;
  --color-accent-contrast: …;
  --color-border: …;
  --radius: 8px;
  --shadow: 0 1px 3px rgb(0 0 0 / 0.2);
}
:root[data-theme='dark'] { color-scheme: dark; /* same token names, ember/basalt values */ }
body { background: var(--color-surface); color: var(--color-text); }
```

- [ ] **Step 4: Provider + toggle + Storybook toolbar, with tests**

`ThemeProvider.test.tsx`: renders children; `setTheme('dark')` stamps `data-theme` and persists to localStorage; with nothing stored, firing the mocked media-query change event flips the attribute; after an explicit choice the media event is ignored. `ThemeToggle.test.tsx`: click toggles the attribute; the accessible name flips; Space/Enter work (userEvent keyboard). `.storybook/preview.tsx`: add a `globalTypes.theme` toolbar (`light`/`dark`) and a decorator setting `document.documentElement.dataset.theme` from the global — stories render inside `ThemeProvider`.

- [ ] **Step 5: Verify + commit**

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: registry-based theme system with no-flash init"
```

---

### Task 4: The landing page

**Files:**
- Create: `src/components/SiteHeader.tsx`, `SiteFooter.tsx`, `Hero.tsx`, `VaultCard.tsx`, `HowItWorks.tsx` (+ one `.stories.tsx` each)
- Create: `src/content/vaults.ts`, `src/content/site.ts`
- Replace: `src/routes/landing.tsx`
- Create: `public/fonts/` (two self-hosted woff2), `scripts/generate-sitemap.mjs`, `public/sitemap.xml` output wiring
- Modify: `src/index.css` (font-face + type scale), `package.json` (`build` gains the sitemap step)
- Test: `src/routes/landing.test.tsx`, component tests per component

**Interfaces:**
- Produces: `vaults.ts` — `export interface Vault { id: string; title: string; blurb: string }` and `export const VAULTS: readonly Vault[]` with six entries (trading cards, movies, books, coins, comics, board games) whose blurbs tease future powers (decks & playtesting; locations & wish lists; …) in the medieval voice. `site.ts` — `SITE_NAME`, `SITE_URL = 'https://zarlania.com'`, `SITE_DESCRIPTION`. `SiteHeader` (public variant: logo link home, `ThemeToggle`, "Enter" → `/login`, "Create account" → `/signup`); spec 6 later feeds it a session — today it takes no props.

- [ ] **Step 1: Fonts**

Download two OFL-licensed families as latin-subset woff2 and commit: Cinzel (display, headings) and Inter (body) — e.g. from the google/fonts GitHub repo releases. Place as `public/fonts/cinzel-latin.woff2`, `public/fonts/inter-latin.woff2`; `@font-face` in `index.css` with `font-display: swap`; `<link rel="preload" as="font" …crossOrigin="anonymous">` for both in `root.tsx`.

- [ ] **Step 2: Failing landing test**

`landing.test.tsx` (via `createRoutesStub`): one `h1` containing "Zarlania"; links named "Create account" (→ `/signup`) and "Enter" (→ `/login`); all six vault titles render as `h3`s under an `h2` "The Vaults" section; an `h2` "How it works" with three ordered steps.

- [ ] **Step 3: Build the page**

`landing.tsx` composes Header/Hero/Vaults/HowItWorks/Footer. The `meta` export (React Router route `meta`) returns: title "Zarlania — A keep for your collections", description (`SITE_DESCRIPTION`), canonical link `SITE_URL`, `og:title/description/image/url/type`, `twitter:card = summary_large_image`. JSON-LD `WebSite` + `Organization` via a `<script type="application/ld+json">` with `JSON.stringify` of a typed object constant. Copy is written in the medieval voice ("Every hoard deserves a keep…") but headings stay literal enough for search ("Organize your trading cards, movies, books…" appears in real text). Hero, VaultCard, HowItWorks, SiteFooter each ≤ ~80 lines, semantic tokens only.

- [ ] **Step 4: Sitemap generation**

`scripts/generate-sitemap.mjs` — reads the prerendered route list (hardcoding `['/']` is wrong the day a public page joins; import the same list): keep a `src/content/publicRoutes.ts` exporting `export const PUBLIC_ROUTES = ['/']`, consumed by BOTH `react-router.config.ts` (`prerender: [...PUBLIC_ROUTES]`) and the script. The script writes `build/client/sitemap.xml` with `<urlset>` entries `SITE_URL + path`. `package.json`: `"build": "tsc -b && react-router build && node scripts/generate-sitemap.mjs"`.

- [ ] **Step 5: Verify, build, eyeball, commit**

```bash
npm run verify && npm run build
grep -o '<h1[^>]*>[^<]*' build/client/index.html   # real hero heading in static HTML
grep -c 'og:image' build/client/index.html          # ≥ 1
npm run preview                                     # optional human look at http://localhost:4173
git add -A
git commit -m "#<ISSUE> feat: prerendered landing page with vaults, SEO metadata, and fonts"
```

---

### Task 5: Stubs, 404, error boundary

**Files:**
- Replace: `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/not-found.tsx`
- Modify: `src/root.tsx` (`ErrorBoundary` export)
- Test: `src/routes/stubs.test.tsx`

**Interfaces:** Produces the pages spec 6 replaces wholesale. Each stub: `SiteHeader` + an in-theme card: login — h1 "The gates open soon", body "Sign-in is being forged. Return shortly, traveler." + link back home; signup mirrors it ("Account creation is being forged…"). `not-found.tsx`: h1 "Lost in the halls" + home link, `meta` sets title "Not found — Zarlania". `root.tsx` exports `ErrorBoundary` per React Router conventions (`useRouteError`), rendering the same in-theme shell with "Something broke its seal" and a reload link — inside the `Layout` document so theming still applies.

- [ ] **Step 1: Failing tests → implement → verify → commit**

`stubs.test.tsx`: `/login` and `/signup` render their h1s and a home link; unknown path renders the 404 h1. Then:

```bash
npm run verify
git add -A
git commit -m "#<ISSUE> feat: in-theme login/signup stubs, 404, and error boundary"
```

---

### Task 6: Prerender guard in CI

**Files:**
- Create: `scripts/check-prerender.mjs`
- Modify: `package.json`, and the CI workflow that runs on PRs (inspect `.github/workflows/` — add a build job to the existing verify/test workflow if none builds the app)

**Interfaces:** Produces the regression guard: a build whose `index.html` lost the real content fails CI.

- [ ] **Step 1: The check**

`scripts/check-prerender.mjs`:

```js
import { readFileSync } from 'node:fs'

const html = readFileSync('build/client/index.html', 'utf8')
const required = ['<h1', 'og:image', 'application/ld+json', 'data-theme']
// data-theme is stamped by the inline script at runtime, not present in static
// HTML — assert the script itself instead:
const checks = [
  ['landing heading', html.includes('<h1')],
  ['open graph image', html.includes('og:image')],
  ['structured data', html.includes('application/ld+json')],
  ['theme init script', html.includes('prefers-color-scheme')],
]
const failed = checks.filter(([, ok]) => !ok)
if (failed.length > 0) {
  console.error('Prerender check failed:', failed.map(([name]) => name).join(', '))
  process.exit(1)
}
console.log('Prerender check passed.')
```

(Remove the unused `required` line before committing — shown here only to contrast what NOT to assert.) `package.json`: `"check:prerender": "node scripts/check-prerender.mjs"`, and `build` becomes `tsc -b && react-router build && node scripts/generate-sitemap.mjs && node scripts/check-prerender.mjs`.

- [ ] **Step 2: CI**

Read `.github/workflows/` — if the PR workflow lacks an `npm run build` step, add one after the verify step of the existing test job (same Node setup, `npm ci` already done):

```yaml
      - name: Build (prerender + guard)
        run: npm run build
```

- [ ] **Step 3: Verify + commit**

```bash
npm run build && npm run verify
git add -A
git commit -m "#<ISSUE> ci: guard the prerendered landing HTML in the build"
```

---

### Task 7: Reference docs, gates, PR

- [ ] **Step 1: Reference doc**

Invoke `creating-reference-docs` (this repo has the same tooling): **Theming and routing** — the theme registry contract (ids, storage key, `data-theme`, adding a theme = token block + registry entry + picker upgrade), the no-flash init script and its agreement test, semantic token list, RR7 framework mode + `PUBLIC_ROUTES`/prerender/sitemap coupling, the build-output move to `build/client`, and the prerender guard.

- [ ] **Step 2: Gates + PR**

```bash
npm run verify && npm run build && python3 docs/tooling/references_cli.py validate
git push -u origin <ISSUE>-theming-landing
gh pr create --title "#<ISSUE> feat: theme system and prerendered landing page" --label minor --body "$(cat <<'EOF'
Implements docs/superpowers/specs/2026-07-25-theming-landing-page-design.md — React Router v7 framework mode with build-time prerender, the registry-based light/dark theme system with no-flash init, the landing page with full SEO metadata and self-hosted fonts, brand assets, stubs, and the CI prerender guard.

Closes #<ISSUE>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review (completed at authoring)

- **Spec coverage:** RR7 + prerender + route skeleton → 2; assets incl. tracked source image → 1; registry/no-flash/preference model/tokens/moods → 3; landing content/meta/JSON-LD/robots/sitemap/fonts/CWV → 4 (+1 robots); stubs/404/error boundary → 5; prerender guard → 6; reference doc → 7. Storybook theme toolbar → 3. Coverage exclusions updated → 2.
- **Placeholders:** hex values are deliberately implementation-chosen *with a testable constraint* (WCAG AA pairings, a11y addon) — the spec assigns that choice to implementation; everything else is concrete.
- **Type consistency:** `ThemeId`/`THEMES`/`THEME_STORAGE_KEY` single-homed in `themes.ts`, consumed by script, provider, toggle, stories; `PUBLIC_ROUTES` single-homed, consumed by config + sitemap; `SiteHeader` prop-free today (spec 6 extends it).
