# Visual Foundation (Plan 1 of 3): App Shell & Theming — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single POC `AppComponent` with a routed app shell (header + footer + `<router-outlet>`) and a complete light/dark theming system (semantic CSS tokens, OS-default, 2-way toggle, persisted, no flash on load), plus a placeholder branding logo.

**Architecture:** A signals-based `ThemeService` owns the current theme, syncing a `data-theme` attribute on `<html>` and `localStorage`. A tiny inline script in `index.html` sets the initial theme before Angular boots (no flash). The root `AppComponent` becomes a standalone shell hosting the Angular Router; feature pages are lazy-loaded standalone components (placeholders here, fleshed out in Plans 2–3).

**Tech Stack:** Angular 22 (standalone components, signals, `OnPush`), Angular Router, TypeScript 6, Jest (`jest-preset-angular`), CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-07-01-landing-page-and-theming-design.md` (§3 architecture, §4 theming, §7 emblem placeholder). **Issue:** #12. **Branch:** `feat/12-landing-page-and-theming` (already checked out).

## Global Constraints

- **Angular style:** every component is `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush`, uses signals; services `@Injectable({ providedIn: 'root' })` or provided at the right scope.
- **Component selector prefix:** `app-`, kebab-case (enforced by ESLint `@angular-eslint/component-selector`).
- **Tests:** co-located `*.spec.ts`, Jest via `jest-preset-angular`. Run one file with `npx jest <path>`. Assert observable behavior through the public surface, not internals or mock interactions.
- **Coverage floor:** ≥80% branches/functions/lines/statements (`jest.config.ts`, measured over `src/app/**/*.ts`). Full run: `npm run test:ci`.
- **Lint/format:** `npm run lint` (ESLint + Prettier) must pass; pre-commit hooks run automatically.
- **No committed secrets.** Frequent commits — one per task.
- **Theme storage key (verbatim, shared by service and inline script):** `zarlania-theme`.
- **`data-theme` values (verbatim):** `dark` | `light`. Default when unresolved: `dark`.

---

### Task 1: ThemeService (theme logic)

**Files:**
- Create: `src/app/core/theme/theme.service.ts`
- Test: `src/app/core/theme/theme.service.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export type Theme = 'light' | 'dark';`
  - `export const THEME_STORAGE_KEY = 'zarlania-theme';`
  - `export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme;`
  - `class ThemeService { readonly theme: Signal<Theme>; setTheme(theme: Theme): void; toggle(): void; }`

- [ ] **Step 1: Write the failing test**

Create `src/app/core/theme/theme.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ThemeService, resolveInitialTheme, THEME_STORAGE_KEY } from './theme.service';

function stubMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('resolveInitialTheme', () => {
  it('prefers a valid stored value over OS preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to OS preference when nothing valid is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
    expect(resolveInitialTheme('bogus', true)).toBe('dark');
  });
});

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to the OS preference when nothing is stored', () => {
    stubMatchMedia(true);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('uses the stored theme over the OS preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    stubMatchMedia(true);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
  });

  it('setTheme updates the signal, persists, and sets the data-theme attribute', () => {
    stubMatchMedia(false);
    const service = TestBed.inject(ThemeService);
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggle flips between dark and light', () => {
    stubMatchMedia(true);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    service.toggle();
    expect(service.theme()).toBe('light');
    service.toggle();
    expect(service.theme()).toBe('dark');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/core/theme/theme.service.spec.ts`
Expected: FAIL — cannot resolve `./theme.service` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/app/core/theme/theme.service.ts`:

```typescript
import { Injectable, Signal, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'zarlania-theme';

/** Pure resolution shared conceptually with the no-flash inline script in index.html. */
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return prefersDark ? 'dark' : 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly current = signal<Theme>(this.readInitial());
  readonly theme: Signal<Theme> = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  setTheme(theme: Theme): void {
    this.current.set(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.apply(theme);
  }

  toggle(): void {
    this.setTheme(this.current() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    return resolveInitialTheme(stored, prefersDark);
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/core/theme/theme.service.spec.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/theme/theme.service.ts src/app/core/theme/theme.service.spec.ts
git commit -m "feat: add ThemeService for light/dark theming (#12)"
```

---

### Task 2: Design tokens stylesheet + no-flash init

**Files:**
- Modify: `src/styles.css` (currently only a comment)
- Modify: `src/index.html`
- Test: `src/app/core/theme/theme-init.spec.ts`

**Interfaces:**
- Consumes: `ThemeService` (Task 1).
- Produces: global CSS custom properties per `data-theme`; the no-flash inline script. No new TS exports.

- [ ] **Step 1: Write the failing test**

Create `src/app/core/theme/theme-init.spec.ts` (verifies the service applies a theme attribute on construction — the wiring the shell relies on):

```typescript
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('theme initialization', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('sets a data-theme attribute as soon as the service is constructed', () => {
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    TestBed.inject(ThemeService);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/core/theme/theme-init.spec.ts`
Expected: FAIL — `data-theme` is not present before injection but the assertion `hasAttribute === false` then `=== 'dark'` requires the service; it fails only if the service is broken. If Task 1 is complete this test PASSES immediately — that is acceptable for this integration guard. If it errors on import, fix the import path.

> Note: this task's real deliverable is the token stylesheet and inline script (not unit-testable directly). The test above locks the construction-time wiring. Steps 3a–3c add the visual foundation.

- [ ] **Step 3a: Write the design tokens into `src/styles.css`**

Replace the entire contents of `src/styles.css` with:

```css
/* Global design tokens. Components reference semantic tokens only — never raw hex. */
:root,
:root[data-theme='dark'] {
  --color-bg: #15110f;
  --color-surface: #221a17;
  --color-border: #302420;
  --color-action: #e2622a;
  --color-action-hover: #f0883e;
  --color-accent: #55d6c6;
  --color-brand: #eeb03a;
  --color-text: #ece3d8;
  --color-text-muted: #9d8f86;
  --color-on-action: #15110f;
  --focus-ring: #55d6c6;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 34px;
  --font-sans:
    system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

:root[data-theme='light'] {
  --color-bg: #f3edde;
  --color-surface: #e8e0cc;
  --color-border: #dcd1b6;
  --color-action: #276b48;
  --color-action-hover: #2f7d55;
  --color-accent: #1f8a7d;
  --color-brand: #b0872a;
  --color-text: #29291f;
  --color-text-muted: #6d6047;
  --color-on-action: #f3edde;
  --focus-ring: #1f8a7d;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  line-height: 1.5;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

a {
  color: var(--color-accent);
}

:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

- [ ] **Step 3b: Add the no-flash inline script to `src/index.html`**

Replace the full contents of `src/index.html` with (note `data-theme="dark"` default on `<html>` and the inline script in `<head>`):

```html
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <title>Zarlania — Command every collection you own</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="Catalog, index, and track the value of your card collections in one vault — starting with Magic: The Gathering."
    />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
    <script>
      // No-flash theme init: runs before first paint. Mirrors ThemeService's
      // resolution; key must stay in sync with THEME_STORAGE_KEY ('zarlania-theme').
      (function () {
        try {
          var t = localStorage.getItem('zarlania-theme');
          if (t !== 'light' && t !== 'dark') {
            t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          document.documentElement.setAttribute('data-theme', t);
        } catch (e) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      })();
    </script>
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

- [ ] **Step 3c: Run the theme-init test**

Run: `npx jest src/app/core/theme/theme-init.spec.ts`
Expected: PASS.

- [ ] **Step 4: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds (no template/style errors). It is fine that `app-root` still renders the old POC — the shell is replaced in Task 6.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/index.html src/app/core/theme/theme-init.spec.ts
git commit -m "feat: add theme design tokens and no-flash init (#12)"
```

---

### Task 3: ThemeToggleComponent

**Files:**
- Create: `src/app/shared/theme-toggle/theme-toggle.component.ts`
- Test: `src/app/shared/theme-toggle/theme-toggle.component.spec.ts`

**Interfaces:**
- Consumes: `ThemeService` (Task 1).
- Produces: `class ThemeToggleComponent` with selector `app-theme-toggle`.

- [ ] **Step 1: Write the failing test**

Create `src/app/shared/theme-toggle/theme-toggle.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../core/theme/theme.service';

function stubMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('ThemeToggleComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    stubMatchMedia(true); // OS prefers dark
  });

  it('renders a labelled button reflecting the current (dark) theme', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
  });

  it('toggles the theme when clicked', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    const service = TestBed.inject(ThemeService);
    fixture.detectChanges();
    expect(service.theme()).toBe('dark');

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(service.theme()).toBe('light');
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'Switch to dark theme',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/shared/theme-toggle/theme-toggle.component.spec.ts`
Expected: FAIL — cannot resolve `./theme-toggle.component`.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/shared/theme-toggle/theme-toggle.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle"
      [attr.aria-label]="label()"
      (click)="onToggle()"
    >
      {{ icon() }}
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        background: var(--color-surface);
        color: var(--color-brand);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        width: 36px;
        height: 36px;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly icon = computed(() => (this.themeService.theme() === 'dark' ? '☾' : '☀'));
  readonly label = computed(() =>
    this.themeService.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
  );

  onToggle(): void {
    this.themeService.toggle();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/shared/theme-toggle/theme-toggle.component.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/theme-toggle/
git commit -m "feat: add theme-toggle component (#12)"
```

---

### Task 4: LogoComponent (placeholder emblem)

**Files:**
- Create: `src/app/shared/logo/logo.component.ts`
- Test: `src/app/shared/logo/logo.component.spec.ts`

**Interfaces:**
- Consumes: theme tokens (`--color-brand`, `--color-action`).
- Produces: `class LogoComponent` with selector `app-logo` and a signal input `label` (default `'Zarlania'`). This is the single swappable branding slot (spec §7); final art replaces the inner SVG only.

- [ ] **Step 1: Write the failing test**

Create `src/app/shared/logo/logo.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LogoComponent } from './logo.component';

@Component({
  standalone: true,
  imports: [LogoComponent],
  template: `<app-logo [label]="'Zarlania home'" />`,
})
class HostComponent {}

describe('LogoComponent', () => {
  it('renders an accessible SVG mark with the provided label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement.querySelector('.logo');
    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Zarlania home');
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/shared/logo/logo.component.spec.ts`
Expected: FAIL — cannot resolve `./logo.component`.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/shared/logo/logo.component.ts` (placeholder = simplified "Staff & Coiled Dragon" mark; fills use theme tokens so it themes automatically):

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" role="img" [attr.aria-label]="label()">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <path d="M32 5 L38 12 L32 20 L26 12 Z" fill="var(--color-brand)" />
        <line
          x1="32"
          y1="21"
          x2="32"
          y2="57"
          stroke="var(--color-brand)"
          stroke-width="3.4"
          stroke-linecap="round"
        />
        <path
          d="M30 55 C 21 55 21 47 30 47 C 41 47 41 37 30 37 C 20 37 20 28 31 27"
          fill="none"
          stroke="var(--color-action)"
          stroke-width="3.6"
          stroke-linecap="round"
        />
        <path
          d="M31 27 C 30 22 33 18.5 38 19 L35 22 L40.5 22.5 C 39 26.5 34 28 31 27 Z"
          fill="var(--color-action)"
        />
      </svg>
    </span>
  `,
  styles: [
    `
      .logo {
        display: inline-flex;
        align-items: center;
      }
    `,
  ],
})
export class LogoComponent {
  readonly label = input('Zarlania');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/shared/logo/logo.component.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/logo/
git commit -m "feat: add placeholder logo component (#12)"
```

---

### Task 5: Router + placeholder feature pages

**Files:**
- Create: `src/app/features/landing/landing.component.ts`
- Create: `src/app/features/auth/signup/signup.component.ts`
- Create: `src/app/features/auth/login/login.component.ts`
- Create: `src/app/features/home/home.component.ts`
- Create: `src/app/features/not-found/not-found.component.ts`
- Create: `src/app/app.routes.ts`
- Modify: `src/app/app.config.ts`
- Test: `src/app/app.routes.spec.ts`

**Interfaces:**
- Consumes: nothing external.
- Produces:
  - `export const routes: Routes` (in `app.routes.ts`).
  - Five standalone components: `LandingComponent` (`app-landing`), `SignupComponent` (`app-signup`), `LoginComponent` (`app-login`), `HomeComponent` (`app-home`), `NotFoundComponent` (`app-not-found`). These are placeholders; Plans 2–3 replace the bodies of landing/auth/home. Each renders an `<h1>` so routing is verifiable.

- [ ] **Step 1: Write the failing test**

Create `src/app/app.routes.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { routes } from './app.routes';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
class RootHarness {}

async function navigateAndRead(path: string): Promise<string> {
  const fixture = TestBed.createComponent(RootHarness);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(path);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement.textContent as string;
}

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('renders the landing page at the root path', async () => {
    expect(await navigateAndRead('/')).toContain('Zarlania');
  });

  it('renders the signup page at /signup', async () => {
    expect(await navigateAndRead('/signup')).toContain('Create your vault');
  });

  it('renders the login page at /login', async () => {
    expect(await navigateAndRead('/login')).toContain('Welcome back');
  });

  it('renders the home page at /home', async () => {
    expect(await navigateAndRead('/home')).toContain('Welcome');
  });

  it('renders the not-found page for unknown paths', async () => {
    expect(await navigateAndRead('/nope')).toContain('Page not found');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/app.routes.spec.ts`
Expected: FAIL — cannot resolve `./app.routes`.

- [ ] **Step 3a: Create the five placeholder components**

`src/app/features/landing/landing.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Zarlania</h1>
    <p>Command every collection you own.</p>`,
})
export class LandingComponent {}
```

`src/app/features/auth/signup/signup.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Create your vault</h1>`,
})
export class SignupComponent {}
```

`src/app/features/auth/login/login.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Welcome back</h1>`,
})
export class LoginComponent {}
```

`src/app/features/home/home.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Welcome to your vault</h1>`,
})
export class HomeComponent {}
```

`src/app/features/not-found/not-found.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Page not found</h1>
    <a routerLink="/">Back to home</a>`,
})
export class NotFoundComponent {}
```

- [ ] **Step 3b: Create `src/app/app.routes.ts`**

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
```

- [ ] **Step 3c: Wire the router into `src/app/app.config.ts`**

Replace the contents of `src/app/app.config.ts` with:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withXhr()),
    provideRouter(routes),
  ],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/app.routes.spec.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ src/app/app.routes.ts src/app/app.config.ts src/app/app.routes.spec.ts
git commit -m "feat: add router with lazy placeholder feature pages (#12)"
```

---

### Task 6: App shell (header + footer + outlet)

**Files:**
- Modify: `src/app/app.component.ts` (replace POC body with the shell)
- Modify: `src/app/app.component.spec.ts` (replace POC tests with shell tests)

**Interfaces:**
- Consumes: `LogoComponent` (Task 4), `ThemeToggleComponent` (Task 3), `routes` via `RouterOutlet`/`RouterLink`.
- Produces: `AppComponent` shell (selector `app-root`) — header with logo + nav (`Features`, `How it works` in-page anchors), theme toggle, `Log in` / `Sign up` links; `<main>` with `<router-outlet>`; footer.

> Note: `AppComponent` no longer calls `ApiService`. `ApiService.getApiInfo()` and its spec remain (still valid, still covered) and are unused by the shell; Plan 3 adds `createAccount()`.

- [ ] **Step 1: Write the failing test**

Replace the contents of `src/app/app.component.spec.ts` with:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

function stubMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('AppComponent (shell)', () => {
  beforeEach(() => {
    localStorage.clear();
    stubMatchMedia(true);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('renders the brand logo in a header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const header: HTMLElement = fixture.nativeElement.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.querySelector('app-logo')).toBeTruthy();
  });

  it('renders the theme toggle and a router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-theme-toggle')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('links to signup and login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const hrefs = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ).map((a) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/signup');
    expect(hrefs).toContain('/login');
  });

  it('renders a footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('footer')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/app.component.spec.ts`
Expected: FAIL — current `AppComponent` has no `<header>`/`app-logo`/`router-outlet`.

- [ ] **Step 3: Write the shell implementation**

Replace the contents of `src/app/app.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogoComponent } from './shared/logo/logo.component';
import { ThemeToggleComponent } from './shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, LogoComponent, ThemeToggleComponent],
  template: `
    <header class="site-header">
      <a class="brand" routerLink="/">
        <app-logo />
        <span class="brand-name">Zarlania</span>
      </a>
      <nav class="site-nav">
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
      </nav>
      <div class="header-actions">
        <app-theme-toggle />
        <a class="link-login" routerLink="/login">Log in</a>
        <a class="btn-signup" routerLink="/signup">Sign up</a>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer class="site-footer">
      <span>&copy; 2026 Zarlania</span>
    </footer>
  `,
  styles: [
    `
      .site-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-6);
        border-bottom: 1px solid var(--color-border);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        text-decoration: none;
        color: var(--color-text);
      }
      .brand-name {
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .site-nav {
        display: flex;
        gap: var(--space-4);
      }
      .site-nav a {
        color: var(--color-text-muted);
        text-decoration: none;
      }
      .header-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .link-login {
        color: var(--color-text);
        text-decoration: none;
      }
      .btn-signup {
        background: var(--color-action);
        color: var(--color-on-action);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        font-weight: 600;
        text-decoration: none;
      }
      .site-footer {
        padding: var(--space-6);
        border-top: 1px solid var(--color-border);
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class AppComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/app.component.spec.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Run the full suite, lint, and build**

Run:

```bash
npm run test:ci && npm run lint && npm run build
```

Expected: all tests pass with ≥80% coverage; ESLint/Prettier clean; production build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/app.component.ts src/app/app.component.spec.ts
git commit -m "feat: replace POC root with themed app shell (#12)"
```

---

## Manual verification (end of Plan 1)

- [ ] Run `npm start`, open the app. Confirm: dark theme by default, header shows logo + nav + toggle + Log in / Sign up, footer present, and the landing placeholder renders.
- [ ] Click the theme toggle → colors switch instantly; reload → the chosen theme persists with no flash of the other theme.
- [ ] In DevTools, set OS to light mode with cleared `localStorage` → first load is light.
- [ ] Navigate to `/signup`, `/login`, `/home`, and a bogus path → correct placeholder pages render.

## Self-review (spec coverage for this plan's slice)

- Spec §3 router + feature-first structure → Tasks 5, 6. ✓
- Spec §3 shell with header/footer/toggle on every route → Task 6. ✓
- Spec §4 tokens (both palettes, verbatim hex), OS default, 2-way toggle, persistence, no-flash → Tasks 1, 2, 3. ✓
- Spec §7 swappable logo slot (placeholder) → Task 4. ✓
- Deferred to Plans 2–3: real landing content + SEO/SSG (§5), signup/login/home behavior + `ApiService.createAccount` (§6), ADRs (§3, `adr-create` during implementation), final emblem art (§7). These are intentionally out of this plan's scope.

---

## Remaining plans (to be written next)

**Plan 2 — Landing page + SEO/SSG:** flesh out `LandingComponent` with all sections (hero, features, how-it-works, supported collections, CTA, footer content) and in-page anchors; add `Title`/`Meta` (description, Open Graph/Twitter); add `public/robots.txt` + `public/sitemap.xml`; enable prerendering (static output) via `@angular/ssr` schematic + `angular.json` `outputMode: static`; update the Dockerfile/nginx copy path to the prerendered `browser` output; verify the landing route ships as static HTML containing the hero copy. Author the SSG and theming ADRs (`adr-create`).

**Plan 3 — Auth POC flow:** add `ApiService.createAccount(email, username)` + `Account`/`User`/`Organization` models; build the real `SignupComponent` (reactive form, boundary validation mirroring the API: email ≤320 + valid, username ≤100; submit → `createAccount` → navigate `/home` with the returned account; inline error handling for duplicate/network); build the mock `LoginComponent` (email + cosmetic password → navigate `/home`, no API call); build the real `HomeComponent` (shows account email + personal organization from router state after signup, generic placeholders otherwise, plus the non-functional MTG teaser card). Author the router ADR (`adr-create`).

**Release (in whichever PR lands this work):** `release:minor` label + `./scripts/bump-version bump minor`; PR references #12.
