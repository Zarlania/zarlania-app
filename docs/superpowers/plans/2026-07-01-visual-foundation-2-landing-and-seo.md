# Visual Foundation (Plan 2 of 3): Landing Page & SEO/SSG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder landing page with the full marketing landing (hero, features, how-it-works, supported collections, CTA, footer), give it real SEO metadata, and prerender the public route to static HTML at build time (SSG) while keeping the nginx-static deploy.

**Architecture:** `LandingComponent` becomes a real page composed of sections, using the theme tokens from Plan 1. SEO comes from Angular's `Title`/`Meta` services (baked into the prerendered HTML) plus `robots.txt`/`sitemap.xml` static assets. Static prerendering is enabled via `@angular/ssr` with `outputMode: "static"` and per-route render modes so only the public landing route prerenders; app routes (`/signup`, `/login`, `/home`) stay client-rendered. No runtime Node server — the build emits static files that the existing nginx container serves.

**Tech Stack:** Angular 22 (standalone, signals, `OnPush`), `@angular/ssr` (build-time prerender only), Angular Router, Jest, nginx-on-Docker.

**Spec:** `docs/superpowers/specs/2026-07-01-landing-page-and-theming-design.md` (§5 landing page; §2 rendering decision). **Issue:** #12. **Branch:** `feat/12-landing-page-and-theming` (Plan 1 already merged onto it at `fddca63`).

## Global Constraints

- **Angular style:** every component `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush`, signals; selector prefix `app-` kebab (ESLint-enforced).
- **Theme tokens only:** all colors/spacing/radii reference the CSS custom properties from Plan 1 (`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`) — no raw hex in components.
- **Tests:** co-located `*.spec.ts`, Jest via jest-preset-angular; assert observable behavior through the rendered DOM / public services, not mocks. Run one file: `npx jest <path>`. Full gate: `npm run test:ci` (≥80% coverage), `npm run lint`, `npm run build`.
- **Section order (verbatim, spec §5):** Hero → Features → How it works → Supported collections → CTA band → Footer.
- **Exactly one `<h1>` on the landing page** (the hero headline).
- **Header anchors:** the shell header links `#features` and `#how-it-works` (Plan 1) must resolve to real sections on the landing — the landing's Features section has `id="features"` and How-it-works has `id="how-it-works"`.
- **SEO title (verbatim):** `Zarlania — Command every collection you own`
- **SEO description (verbatim):** `Catalog, index, and track the value of your card collections in one vault — starting with Magic: The Gathering.`
- **Canonical/site origin (verbatim):** `https://zarlania.com`
- **First supported collection (verbatim):** `Magic: The Gathering`; others shown as "soon": Pokémon TCG, Coins, Books, Movies.
- **Rendering:** the `/` route prerenders to static HTML at build; `/signup`, `/login`, `/home` remain client-rendered; NO runtime Node server (nginx serves static files per ADR-0003).
- **Deploy invariant:** the Docker build must continue to serve the app on `$PORT`; the prerendered output must land where the Dockerfile copies from (`dist/zarlania-app/browser`).
- **ADR note:** the SSG/prerender decision is architecturally significant. Per the issue-#12 decision, its ADR (and the Router/theming ADRs) are authored in a single pre-PR cleanup, NOT in this plan.

---

### Task 1: Landing page sections

**Files:**
- Modify (replace body): `src/app/features/landing/landing.component.ts`
- Test (replace): `src/app/features/landing/landing.component.spec.ts`

**Interfaces:**
- Consumes: `RouterLink` (from `@angular/router`); theme tokens from `src/styles.css`.
- Produces: `LandingComponent` (selector `app-landing`) rendering all six sections; Features section carries `id="features"`, How-it-works carries `id="how-it-works"`; the hero + CTA primary buttons are `routerLink="/signup"` anchors.

- [ ] **Step 1: Write the failing test**

Replace the contents of `src/app/features/landing/landing.component.spec.ts` with:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  function render() {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders exactly one h1 (the hero headline)', () => {
    const el = render();
    const h1s = el.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toContain('Command every collection');
  });

  it('has Features and How-it-works sections with anchor ids matching the header nav', () => {
    const el = render();
    expect(el.querySelector('section#features')).toBeTruthy();
    expect(el.querySelector('section#how-it-works')).toBeTruthy();
  });

  it('uses semantic section landmarks for each content block', () => {
    const el = render();
    // hero, features, how-it-works, collections, cta = 5 sections
    expect(el.querySelectorAll('section').length).toBeGreaterThanOrEqual(5);
  });

  it('primary calls-to-action link to signup', () => {
    const el = render();
    const signupLinks = Array.from(el.querySelectorAll('a')).filter(
      (a) => a.getAttribute('href') === '/signup',
    );
    expect(signupLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('names Magic: The Gathering as the first supported collection', () => {
    const el = render();
    expect(el.textContent).toContain('Magic: The Gathering');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/features/landing/landing.component.spec.ts`
Expected: FAIL — the current placeholder `LandingComponent` has no `section#features`, no `/signup` link, etc.

- [ ] **Step 3: Write the implementation**

Replace the contents of `src/app/features/landing/landing.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <p class="eyebrow">Your collection, mastered</p>
      <h1>Command every collection you own.</h1>
      <p class="lead">
        Catalog, index, and track the value of your card collections in one vault — starting with
        Magic: The Gathering, with more worlds to come.
      </p>
      <div class="cta-row">
        <a class="btn-primary" routerLink="/signup">Create your vault</a>
        <a class="btn-ghost" href="#how-it-works">See how it works</a>
      </div>
    </section>

    <section id="features" class="section">
      <p class="eyebrow">Features</p>
      <h2>Everything a collector needs</h2>
      <p class="section-sub">Built for people who take their collections seriously.</p>
      <ul class="cards">
        <li class="card">
          <h3>Index deeply</h3>
          <p>Organize by set, rarity, condition, and printing — down to the detail.</p>
        </li>
        <li class="card">
          <h3>Track value</h3>
          <p>Watch what your hoard is worth as prices shift over time.</p>
        </li>
        <li class="card">
          <h3>One home, many worlds</h3>
          <p>Start with MTG; expand into every collection you keep.</p>
        </li>
      </ul>
    </section>

    <section id="how-it-works" class="section">
      <p class="eyebrow">How it works</p>
      <h2>From pile to vault in three steps</h2>
      <ol class="steps">
        <li><span class="step-n">1</span>Create your free vault</li>
        <li><span class="step-n">2</span>Add your cards &amp; sets</li>
        <li><span class="step-n">3</span>Track, organize &amp; grow</li>
      </ol>
    </section>

    <section class="section">
      <p class="eyebrow">Collections</p>
      <h2>Starting with Magic: The Gathering</h2>
      <p class="section-sub">More collectibles are on the way.</p>
      <ul class="collections">
        <li class="chip chip-active">Magic: The Gathering</li>
        <li class="chip chip-soon">Pokémon TCG · soon</li>
        <li class="chip chip-soon">Coins · soon</li>
        <li class="chip chip-soon">Books · soon</li>
        <li class="chip chip-soon">Movies · soon</li>
      </ul>
    </section>

    <section class="section cta-band">
      <h2>Your vault is waiting.</h2>
      <p class="section-sub">Create an account and start cataloging in minutes.</p>
      <a class="btn-primary" routerLink="/signup">Sign up free</a>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.7rem;
        color: var(--color-accent);
        margin: 0 0 var(--space-2);
      }
      .hero {
        padding: var(--space-8) var(--space-6);
        max-width: 60rem;
      }
      .hero h1 {
        font-size: 2.4rem;
        line-height: 1.15;
        margin: 0 0 var(--space-3);
      }
      .lead {
        font-size: 1.05rem;
        color: var(--color-text-muted);
        max-width: 42ch;
        margin: 0 0 var(--space-6);
      }
      .cta-row {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
      }
      .btn-primary {
        background: var(--color-action);
        color: var(--color-on-action);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 700;
        text-decoration: none;
      }
      .btn-ghost {
        border: 1px solid var(--color-accent);
        color: var(--color-accent);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 600;
        text-decoration: none;
      }
      .section {
        padding: var(--space-8) var(--space-6);
        border-top: 1px solid var(--color-border);
      }
      .section h2 {
        font-size: 1.5rem;
        margin: 0 0 var(--space-2);
      }
      .section-sub {
        color: var(--color-text-muted);
        margin: 0 0 var(--space-6);
      }
      .cards {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        gap: var(--space-4);
      }
      .card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
      }
      .card h3 {
        margin: 0 0 var(--space-2);
      }
      .card p {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.9rem;
      }
      .steps {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: var(--space-4);
      }
      .steps li {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .step-n {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid var(--color-brand);
        color: var(--color-brand);
        font-weight: 700;
      }
      .collections {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .chip {
        padding: var(--space-2) var(--space-3);
        border-radius: 999px;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        font-size: 0.85rem;
      }
      .chip-active {
        border-color: var(--color-action);
        color: var(--color-action-hover);
      }
      .chip-soon {
        opacity: 0.6;
        font-style: italic;
      }
      .cta-band {
        text-align: center;
      }
      .cta-band .btn-primary {
        display: inline-block;
        margin-top: var(--space-4);
      }
    `,
  ],
})
export class LandingComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/features/landing/landing.component.spec.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/landing/landing.component.ts src/app/features/landing/landing.component.spec.ts
git commit -m "feat: build out the landing page sections (#12)"
```

---

### Task 2: Landing SEO metadata

**Files:**
- Modify: `src/app/features/landing/landing.component.ts`
- Modify: `src/app/features/landing/landing.component.spec.ts`

**Interfaces:**
- Consumes: `Title`, `Meta` from `@angular/platform-browser`.
- Produces: `LandingComponent` sets the document title and meta tags (description, canonical, Open Graph, Twitter) on init — these get baked into the prerendered HTML in Task 5.

- [ ] **Step 1: Write the failing test**

Add these tests to `src/app/features/landing/landing.component.spec.ts` (append inside the existing `describe`, and add the imports `import { Title, Meta } from '@angular/platform-browser';` at the top):

```typescript
  it('sets the SEO document title', () => {
    render();
    expect(TestBed.inject(Title).getTitle()).toBe('Zarlania — Command every collection you own');
  });

  it('sets description and social meta tags', () => {
    render();
    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="description"')?.content).toBe(
      'Catalog, index, and track the value of your card collections in one vault — starting with Magic: The Gathering.',
    );
    expect(meta.getTag('property="og:title"')?.content).toBe(
      'Zarlania — Command every collection you own',
    );
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/features/landing/landing.component.spec.ts`
Expected: FAIL — `LandingComponent` does not set Title/Meta yet.

- [ ] **Step 3: Write the implementation**

In `src/app/features/landing/landing.component.ts`, update the class (and its imports/decorator) so the component sets metadata on construction. Change the import line and the class body:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
```

Replace `export class LandingComponent {}` with:

```typescript
export class LandingComponent {
  private static readonly TITLE = 'Zarlania — Command every collection you own';
  private static readonly DESCRIPTION =
    'Catalog, index, and track the value of your card collections in one vault — starting with Magic: The Gathering.';
  private static readonly ORIGIN = 'https://zarlania.com';

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle(LandingComponent.TITLE);
    this.meta.updateTag({ name: 'description', content: LandingComponent.DESCRIPTION });
    this.meta.updateTag({ property: 'og:title', content: LandingComponent.TITLE });
    this.meta.updateTag({ property: 'og:description', content: LandingComponent.DESCRIPTION });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: LandingComponent.ORIGIN });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: LandingComponent.TITLE });
    this.meta.updateTag({ name: 'twitter:description', content: LandingComponent.DESCRIPTION });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/features/landing/landing.component.spec.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/landing/landing.component.ts src/app/features/landing/landing.component.spec.ts
git commit -m "feat: add SEO title and social meta to the landing page (#12)"
```

---

### Task 3: Enrich the shell footer (global, dynamic year)

**Files:**
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.spec.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: the shell `<footer>` gains a brand line, Product (Features, How it works) and Account (Sign up, Log in) link groups, and a copyright whose year is `new Date().getFullYear()` (resolves the Plan 1 hardcoded-year finding). Footer is global (all routes).

- [ ] **Step 1: Write the failing test**

Add these tests to `src/app/app.component.spec.ts` (inside the existing `describe('AppComponent (shell)')`, which already stubs `matchMedia` and provides the router):

```typescript
  it('footer shows the current year dynamically', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const footer: HTMLElement = fixture.nativeElement.querySelector('footer');
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
  });

  it('footer links to signup and login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const footerHrefs = Array.from(
      fixture.nativeElement.querySelectorAll('footer a'),
    ).map((a) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(footerHrefs).toContain('/signup');
    expect(footerHrefs).toContain('/login');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/app.component.spec.ts`
Expected: FAIL — the current footer has no links and a hardcoded year.

- [ ] **Step 3: Write the implementation**

In `src/app/app.component.ts`, add a `year` field to the class:

```typescript
export class AppComponent {
  readonly year = new Date().getFullYear();
}
```

Replace the existing `<footer class="site-footer">…</footer>` block in the template with:

```html
    <footer class="site-footer">
      <div class="footer-brand">
        <app-logo />
        <span>&copy; {{ year }} Zarlania</span>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <div class="footer-group">
          <span class="footer-heading">Product</span>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </div>
        <div class="footer-group">
          <span class="footer-heading">Account</span>
          <a routerLink="/signup">Sign up</a>
          <a routerLink="/login">Log in</a>
        </div>
      </nav>
    </footer>
```

Replace the `.site-footer` style rule with:

```css
      .site-footer {
        padding: var(--space-6);
        border-top: 1px solid var(--color-border);
        color: var(--color-text-muted);
        font-size: 0.85rem;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-6);
        align-items: flex-start;
      }
      .footer-brand {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .footer-links {
        display: flex;
        gap: var(--space-6);
        margin-left: auto;
      }
      .footer-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      .footer-heading {
        color: var(--color-text);
        font-weight: 600;
      }
      .footer-links a {
        color: var(--color-text-muted);
        text-decoration: none;
      }
```

(The `<app-logo>` and `RouterLink` are already imported by `AppComponent` from Plan 1 — no import changes needed.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/app.component.spec.ts`
Expected: PASS (all shell tests, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add src/app/app.component.ts src/app/app.component.spec.ts
git commit -m "feat: enrich shell footer with links and dynamic year (#12)"
```

---

### Task 4: robots.txt and sitemap.xml

**Files:**
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Test: `src/app/seo-assets.spec.ts`

**Interfaces:**
- Consumes: `angular.json` already globs `public/**` into the build output (`dist/zarlania-app/browser`), so these ship as static files served at `/robots.txt` and `/sitemap.xml`.
- Produces: crawler directives + a sitemap pointing at the site origin.

- [ ] **Step 1: Write the failing test**

Create `src/app/seo-assets.spec.ts` (a lightweight guard that the assets exist and reference the site origin):

```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = join(__dirname, '..', '..', 'public');

describe('SEO static assets', () => {
  it('robots.txt allows crawling and points at the sitemap', () => {
    const robots = readFileSync(join(publicDir, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Sitemap: https://zarlania.com/sitemap.xml');
  });

  it('sitemap.xml lists the landing URL', () => {
    const sitemap = readFileSync(join(publicDir, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://zarlania.com/</loc>');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/seo-assets.spec.ts`
Expected: FAIL — the files do not exist yet (`ENOENT`).

- [ ] **Step 3: Create the assets**

`public/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://zarlania.com/sitemap.xml
```

`public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zarlania.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/seo-assets.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add public/robots.txt public/sitemap.xml src/app/seo-assets.spec.ts
git commit -m "feat: add robots.txt and sitemap.xml (#12)"
```

---

### Task 5: Static prerender (SSG) of the public route

> **Nature of this task (read first):** unlike the others, this is a **schematic-driven configuration** task, not verbatim transcription. Angular's SSR wiring is version-specific, so you will run the official `@angular/ssr` schematic to generate the correct server files for the installed Angular version, then make targeted edits to force **static output** (no runtime server) and per-route render modes, and prove the result with concrete verification gates. If a generated file differs from the target snippets below, **reconcile imports/APIs with the actually-installed `@angular/ssr`** and keep the described end-state and the verification outcomes. If you cannot reach the end-state (e.g. the build won't produce prerendered HTML), STOP and report BLOCKED with the exact error — do not ship a half-configured SSR setup to this production repo.

**Files:**
- Modify: `angular.json` (build target: add `server`, `outputMode`, `prerender`; keep browser output path)
- Modify: `package.json` (adds `@angular/ssr`; done by the schematic)
- Create: `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts` (generated/edited)
- Modify: `Dockerfile` only if the prerendered output path changes (verify first)
- Test: `src/app/app.routes.server.spec.ts`

**Interfaces:**
- Consumes: `routes` (`src/app/app.routes.ts`) and `appConfig` (`src/app/app.config.ts`) from Plan 1.
- Produces: a build that prerenders `/` to static HTML under `dist/zarlania-app/browser/` while `/signup`, `/login`, `/home` render on the client; `serverRoutes` config exported from `app.routes.server.ts`.

- [ ] **Step 1: Add `@angular/ssr` via the official schematic (non-interactive)**

Run: `npx ng add @angular/ssr --skip-confirmation`
Expected: installs `@angular/ssr` (pinned to the Angular 22 line), creates `src/main.server.ts`, `src/app/app.config.server.ts`, a server routes file, and updates `angular.json`/`package.json`. It may also create an express `src/server.ts` and set `outputMode`/`ssr` for server rendering — the next steps convert this to static-only.

Inspect what it generated:
Run: `git status --short && git diff --stat`

- [ ] **Step 2: Write the failing test (server route render modes)**

Create `src/app/app.routes.server.spec.ts` (asserts the landing prerenders and app routes are client-rendered). Reconcile the import path (`./app.routes.server`) and the `RenderMode` enum with the installed `@angular/ssr` if they differ:

```typescript
import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

function modeFor(path: string): RenderMode | undefined {
  return serverRoutes.find((r) => r.path === path)?.renderMode;
}

describe('server routes', () => {
  it('prerenders the public landing route', () => {
    expect(modeFor('')).toBe(RenderMode.Prerender);
  });

  it('client-renders the app routes (no prerender of stateful pages)', () => {
    expect(modeFor('signup')).toBe(RenderMode.Client);
    expect(modeFor('login')).toBe(RenderMode.Client);
    expect(modeFor('home')).toBe(RenderMode.Client);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest src/app/app.routes.server.spec.ts`
Expected: FAIL — the generated server routes file does not yet export `serverRoutes` with these explicit per-route modes (the schematic default is usually a single `{ path: '**', renderMode: RenderMode.Prerender }`).

- [ ] **Step 4: Configure static, per-route rendering**

Edit `src/app/app.routes.server.ts` so it exports explicit render modes (target end-state; reconcile the import with the installed package):

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'signup', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'home', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
```

Ensure `src/app/app.config.server.ts` wires these server routes into the server config (the schematic typically generates `provideServerRendering(withRoutes(serverRoutes))` for Angular 19+; if it generated a bare `provideServerRendering()`, add `withRoutes(serverRoutes)` importing both from `@angular/ssr`). The file's end-state:

```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

In `angular.json`, under the build target's `options`, set static output (no runtime server) and keep the existing browser output path. The relevant keys:

```json
"outputMode": "static",
"server": "src/main.server.ts",
"prerender": true
```

If the schematic added an `"ssr": { "entry": "src/server.ts" }` key to the build options, remove it (static mode needs no runtime server entry) and delete the generated `src/server.ts` if present — this repo deploys static files via nginx (ADR-0003), not a Node server.

- [ ] **Step 5: Run the server-routes test to verify it passes**

Run: `npx jest src/app/app.routes.server.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Verify the build prerenders the landing to static HTML**

Run: `npm run build`
Then verify the landing shipped as prerendered static HTML (not an empty SPA shell):
Run: `grep -l "Command every collection" dist/zarlania-app/browser/index.html`
Expected: prints `dist/zarlania-app/browser/index.html` (the hero `<h1>` text is present in the static file). Also confirm the SEO title is baked in:
Run: `grep -c "Command every collection you own" dist/zarlania-app/browser/index.html`
Expected: at least `1` (title/meta present in the prerendered `<head>`).

If the prerendered output landed somewhere other than `dist/zarlania-app/browser/` (e.g. a `prerendered-routes` or `server` sibling), inspect `dist/zarlania-app/` and confirm the static HTML that nginx will serve is under `browser/`. If it is not, update the `Dockerfile` `COPY --from=build /app/dist/zarlania-app/browser /usr/share/nginx/html` line to the correct static-output directory, and note the change.

- [ ] **Step 7: Run the full gate**

Run: `npm run test:ci && npm run lint && npm run build`
Expected: all tests pass with ≥80% coverage; ESLint/Prettier clean; build succeeds and prerenders `/`.

> Coverage note: if the generated `src/main.server.ts` / `src/server.ts` count against coverage and drag it below 80%, exclude the server bootstrap files from coverage in `jest.config.ts`'s `collectCoverageFrom` (they are framework bootstrap, not app logic) — e.g. add `'!src/main.server.ts'` and `'!src/app/app.config.server.ts'`. Do NOT lower the 80% threshold.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: prerender the public landing route as static HTML (SSG) (#12)"
```

---

## Manual verification (end of Plan 2)

- [ ] `npm start`, open `/`: the full landing renders (hero, features, how-it-works, collections, CTA), themed; the header `Features` / `How it works` links scroll to the matching sections; both "Create your vault" / "Sign up free" buttons navigate to `/signup`.
- [ ] Toggle theme on the landing → all sections re-theme; reload → no flash.
- [ ] View source (or `curl` the prerendered `dist/.../browser/index.html`) → the hero copy and `<title>`/meta are present in the raw HTML (crawlable without JS).
- [ ] `/signup`, `/login`, `/home` still load (client-rendered); an unknown path still shows the 404.
- [ ] (If Docker is available) `docker build -t zarlania-app:p2 .` then run with `-e PORT=8080 -p 8080:8080`; `curl -s localhost:8080/` returns the prerendered landing; `curl -s localhost:8080/robots.txt` and `/sitemap.xml` return the assets.

## Self-review (spec coverage for this plan's slice)

- Spec §5 landing sections + order → Task 1. ✓
- Spec §5 header anchors resolve to sections → Task 1 (`id="features"`, `id="how-it-works"`). ✓
- Spec §5 SEO (title, meta description, OG/Twitter) → Task 2. ✓
- Spec §5 robots.txt + sitemap → Task 4. ✓
- Spec §2/§5 prerender to static HTML, nginx-static preserved, app routes client-rendered → Task 5. ✓
- Footer content (spec §5) + resolves Plan 1's hardcoded-year finding → Task 3. ✓
- Deferred (per issue-#12 decision): the SSG/prerender ADR + Router/theming ADRs are authored in the single pre-PR cleanup, not here.

## Remaining after this plan

**Plan 3 — Auth POC flow:** `ApiService.createAccount(email, username)` + `Account`/`User`/`Organization` models; real `SignupComponent` (reactive form, boundary validation, `POST /accounts` → `/home`, inline errors); mock `LoginComponent` (→ `/home`, no API); real `HomeComponent` (shows account + personal org from router state after signup; MTG teaser).

**Pre-PR cleanup:** author the three ADRs (SSG/prerender, theming tokens + no-flash, Router + app-shell) via `adr-create` + `./scripts/adr check`; sweep the remaining deferred Minors; `release:minor` label + `./scripts/bump-version bump minor`; open the `#12` PR.
