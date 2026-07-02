# Visual Foundation (Plan 3 of 3): Auth POC Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder signup/login/home pages with a working POC flow: a real signup form that creates an account against the backend, a mock login, and a themed home that shows the created account — all demonstrating the theme across forms and an app shell.

**Architecture:** `ApiService` gains `createAccount()` hitting `POST /accounts`; typed `Account`/`User`/`Organization` models mirror the API DTOs. `SignupComponent` is a reactive form that validates at the boundary, calls the API, and on success navigates to `/home` passing the returned account via router navigation state. `LoginComponent` is a mock (no API) that navigates to `/home`. `HomeComponent` reads the account from navigation state and renders a themed welcome + a non-functional MTG teaser; with no state it shows a generic welcome. There is no real session — refreshing `/home` does not persist identity (documented POC limitation).

**Tech Stack:** Angular 22 (standalone, signals, `OnPush`), Angular Reactive Forms, Angular Router, RxJS, `HttpClient`, Jest.

**Spec:** `docs/superpowers/specs/2026-07-01-landing-page-and-theming-design.md` (§6). **Issue:** #12. **Branch:** `feat/12-landing-page-and-theming` (Plans 1–2 already on it at `a3b87a8`).

## Global Constraints

- **Angular style:** every component `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush`, signals; selector prefix `app-` kebab (ESLint-enforced).
- **Theme tokens only:** all colors/spacing/radii reference the CSS custom properties from Plan 1 (`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`) — no raw hex.
- **Tests:** co-located `*.spec.ts`, Jest via jest-preset-angular; assert observable behavior through the rendered DOM / injected services, not mock-interaction internals (spying on `Router.navigate` and faking `ApiService` are the accepted boundary seams). Run one file: `npx jest <path>`. Full gate: `npm run test:ci` (≥80% coverage), `npm run lint`, `npm run build`.
- **API endpoint (verbatim):** `POST` to `${environment.apiBaseUrl}/accounts` with JSON body `{ email, username }`; success is `201` with body `Account`.
- **Model field names (verbatim, mirror the API DTOs):** `User { id: string; email: string; username: string }`; `Organization { id: string; name: string; type: 'PERSONAL' | 'GENERAL' }`; `Account { user: User; personalOrganization: Organization }`; `CreateAccountRequest { email: string; username: string }`.
- **Signup boundary validation (verbatim, mirror the API):** email required + valid email format + max length **320**; username required + max length **100**.
- **Login is a mock:** it must NOT call `ApiService` or any HTTP; valid submit simply navigates to `/home`.
- **Home reads router navigation state** (`history.state.account`); no session persistence — a refresh loses it (acceptable POC limitation).
- **Routes already exist** (Plan 1): `/signup`, `/login`, `/home` lazy-load these components. This plan replaces the component bodies only — no route changes.
- **ADR note:** the three ADRs (SSG, theming, router) are authored in the single pre-PR cleanup, not in this plan.

---

### Task 1: Account models + `ApiService.createAccount`

**Files:**
- Create: `src/app/api.models.ts`
- Modify: `src/app/api.service.ts`
- Test: `src/app/api.service.spec.ts` (append)

**Interfaces:**
- Consumes: existing `ApiService` (`src/app/api.service.ts`), `environment.apiBaseUrl`.
- Produces:
  - `src/app/api.models.ts` exporting `User`, `OrganizationType`, `Organization`, `Account`, `CreateAccountRequest` (exact shapes in Global Constraints).
  - `ApiService.createAccount(request: CreateAccountRequest): Observable<Account>` — `POST ${baseUrl}/accounts`.

- [ ] **Step 1: Write the failing test**

Append to `src/app/api.service.spec.ts` (add imports `import { Account } from './api.models';` at the top). Add inside the existing `describe('ApiService', …)`:

```typescript
  it('POSTs to /accounts and returns the created account', () => {
    const request = { email: 'aldric@realm.com', username: 'aldric' };
    const account: Account = {
      user: { id: 'u1', email: 'aldric@realm.com', username: 'aldric' },
      personalOrganization: { id: 'o1', name: "Aldric's Hoard", type: 'PERSONAL' },
    };

    let result: Account | undefined;
    service.createAccount(request).subscribe((a) => (result = a));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/accounts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(account);

    expect(result).toEqual(account);
  });

  it('propagates an error when account creation fails', () => {
    let errored = false;
    service.createAccount({ email: 'dupe@realm.com', username: 'taken' }).subscribe({
      error: () => (errored = true),
    });
    httpMock
      .expectOne(`${environment.apiBaseUrl}/accounts`)
      .flush(null, { status: 409, statusText: 'Conflict' });
    expect(errored).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/api.service.spec.ts`
Expected: FAIL — `./api.models` does not exist and `service.createAccount` is not a function.

- [ ] **Step 3: Create the models**

Create `src/app/api.models.ts`:

```typescript
/** Frontend mirrors of the backend identity DTOs (POST /accounts response). */

export interface User {
  id: string;
  email: string;
  username: string;
}

export type OrganizationType = 'PERSONAL' | 'GENERAL';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
}

export interface Account {
  user: User;
  personalOrganization: Organization;
}

export interface CreateAccountRequest {
  email: string;
  username: string;
}
```

- [ ] **Step 4: Add `createAccount` to `ApiService`**

In `src/app/api.service.ts`, add the import and the method. The import line (after the existing `environment` import):

```typescript
import { Account, CreateAccountRequest } from './api.models';
```

Add this method to the `ApiService` class (after `getApiInfo`):

```typescript
  /** Creates an account (a user + their personal organization) via POST /accounts. */
  createAccount(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/accounts`, request);
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/app/api.service.spec.ts`
Expected: PASS (existing `getApiInfo` test + 2 new ones).

- [ ] **Step 6: Commit**

```bash
git add src/app/api.models.ts src/app/api.service.ts src/app/api.service.spec.ts
git commit -m "feat: add createAccount and account models to ApiService (#12)"
```

---

### Task 2: SignupComponent (real form)

**Files:**
- Modify (replace): `src/app/features/auth/signup/signup.component.ts`
- Test: `src/app/features/auth/signup/signup.component.spec.ts`

**Interfaces:**
- Consumes: `ApiService.createAccount` + `Account`/`CreateAccountRequest` (Task 1); `Router`; `ReactiveFormsModule`.
- Produces: `SignupComponent` (selector `app-signup`) — a reactive form (email, username) that on valid submit calls `createAccount` and navigates to `/home` with `{ state: { account } }`; shows inline errors.

- [ ] **Step 1: Write the failing test**

Create `src/app/features/auth/signup/signup.component.spec.ts`:

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SignupComponent } from './signup.component';
import { ApiService } from '../../../api.service';
import { Account } from '../../../api.models';

const account: Account = {
  user: { id: 'u1', email: 'aldric@realm.com', username: 'aldric' },
  personalOrganization: { id: 'o1', name: "Aldric's Hoard", type: 'PERSONAL' },
};

function setup(api: Partial<ApiService>) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiService, useValue: api }],
  });
  const fixture = TestBed.createComponent(SignupComponent);
  const router = TestBed.inject(Router);
  const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture.detectChanges();
  return { fixture, navSpy };
}

function type(fixture: ComponentFixture<SignupComponent>, name: string, value: string): void {
  const input = fixture.nativeElement.querySelector(
    `input[formControlName="${name}"]`,
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<SignupComponent>): void {
  (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('SignupComponent', () => {
  it('disables submit until the form is valid', () => {
    const { fixture } = setup({ createAccount: jest.fn() });
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    type(fixture, 'email', 'aldric@realm.com');
    type(fixture, 'username', 'aldric');
    expect(button.disabled).toBe(false);
  });

  it('creates the account and navigates to /home with the account in state', () => {
    const createAccount = jest.fn().mockReturnValue(of(account));
    const { fixture, navSpy } = setup({ createAccount });
    type(fixture, 'email', 'aldric@realm.com');
    type(fixture, 'username', 'aldric');
    submit(fixture);
    expect(createAccount).toHaveBeenCalledWith({
      email: 'aldric@realm.com',
      username: 'aldric',
    });
    expect(navSpy).toHaveBeenCalledWith(['/home'], { state: { account } });
  });

  it('shows a taken message on 409 and does not navigate', () => {
    const createAccount = jest
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const { fixture, navSpy } = setup({ createAccount });
    type(fixture, 'email', 'dupe@realm.com');
    type(fixture, 'username', 'taken');
    submit(fixture);
    expect(fixture.nativeElement.textContent).toContain('already taken');
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('shows a generic error on other failures', () => {
    const createAccount = jest
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { fixture } = setup({ createAccount });
    type(fixture, 'email', 'a@realm.com');
    type(fixture, 'username', 'aldric');
    submit(fixture);
    expect(fixture.nativeElement.textContent).toContain('went wrong');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/features/auth/signup/signup.component.spec.ts`
Expected: FAIL — the placeholder `SignupComponent` has no form, no `button[type="submit"]`, no API call.

- [ ] **Step 3: Write the implementation**

Replace the contents of `src/app/features/auth/signup/signup.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth">
      <h1>Create your vault</h1>
      <p class="sub">Start cataloging in minutes.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" autocomplete="email" />
          @if (showError('email')) {
            <span class="field-error">Enter a valid email (max 320 characters).</span>
          }
        </label>

        <label class="field">
          <span>Username</span>
          <input type="text" formControlName="username" autocomplete="username" />
          @if (showError('username')) {
            <span class="field-error">A username is required (max 100 characters).</span>
          }
        </label>

        @if (errorMessage()) {
          <p class="form-error" role="alert">{{ errorMessage() }}</p>
        }

        <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
          {{ submitting() ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="alt">Already have one? <a routerLink="/login">Log in</a></p>
    </section>
  `,
  styles: [
    `
      .auth {
        max-width: 24rem;
        margin: 0 auto;
        padding: var(--space-8) var(--space-6);
      }
      .sub {
        color: var(--color-text-muted);
        margin: 0 0 var(--space-6);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        margin-bottom: var(--space-4);
      }
      .field span {
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
      .field input {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-2) var(--space-3);
        color: var(--color-text);
        font: inherit;
      }
      .field-error,
      .form-error {
        color: var(--color-action);
        font-size: 0.78rem;
      }
      .form-error {
        margin: 0 0 var(--space-3);
      }
      .btn-primary {
        width: 100%;
        background: var(--color-action);
        color: var(--color-on-action);
        border: none;
        border-radius: var(--radius-md);
        padding: var(--space-3);
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .alt {
        margin-top: var(--space-4);
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    username: ['', [Validators.required, Validators.maxLength(100)]],
  });

  showError(control: 'email' | 'username'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set('');
    this.api.createAccount(this.form.getRawValue()).subscribe({
      next: (account) => {
        void this.router.navigate(['/home'], { state: { account } });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(
          err.status === 409
            ? 'That email or username is already taken.'
            : 'Something went wrong creating your vault. Please try again.',
        );
      },
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/features/auth/signup/signup.component.spec.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/auth/signup/
git commit -m "feat: build the signup form against POST /accounts (#12)"
```

---

### Task 3: LoginComponent (mock)

**Files:**
- Modify (replace): `src/app/features/auth/login/login.component.ts`
- Test: `src/app/features/auth/login/login.component.spec.ts`

**Interfaces:**
- Consumes: `Router`, `ReactiveFormsModule`. Deliberately does NOT inject `ApiService`.
- Produces: `LoginComponent` (selector `app-login`) — email + password form; valid submit navigates to `/home`; no HTTP.

- [ ] **Step 1: Write the failing test**

Create `src/app/features/auth/login/login.component.spec.ts`:

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';

function setup() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(LoginComponent);
  const router = TestBed.inject(Router);
  const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture.detectChanges();
  return { fixture, navSpy };
}

function type(fixture: ComponentFixture<LoginComponent>, name: string, value: string): void {
  const input = fixture.nativeElement.querySelector(
    `input[formControlName="${name}"]`,
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<LoginComponent>): void {
  (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('LoginComponent (mock)', () => {
  it('navigates to /home on a valid submit', () => {
    const { fixture, navSpy } = setup();
    type(fixture, 'email', 'aldric@realm.com');
    type(fixture, 'password', 'anything');
    submit(fixture);
    expect(navSpy).toHaveBeenCalledWith(['/home']);
  });

  it('does not navigate when the form is invalid', () => {
    const { fixture, navSpy } = setup();
    submit(fixture);
    expect(navSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/features/auth/login/login.component.spec.ts`
Expected: FAIL — the placeholder `LoginComponent` has no form/inputs.

- [ ] **Step 3: Write the implementation**

Replace the contents of `src/app/features/auth/login/login.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth">
      <h1>Welcome back</h1>
      <p class="sub">Log in to your vault.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>

        <button type="submit" class="btn-primary" [disabled]="form.invalid">Log in</button>
      </form>

      <p class="alt">New here? <a routerLink="/signup">Create a vault</a></p>
      <p class="mock-note">
        Mock only — authentication isn't wired up yet; any valid input continues to your vault.
      </p>
    </section>
  `,
  styles: [
    `
      .auth {
        max-width: 24rem;
        margin: 0 auto;
        padding: var(--space-8) var(--space-6);
      }
      .sub {
        color: var(--color-text-muted);
        margin: 0 0 var(--space-6);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        margin-bottom: var(--space-4);
      }
      .field span {
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
      .field input {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-2) var(--space-3);
        color: var(--color-text);
        font: inherit;
      }
      .btn-primary {
        width: 100%;
        background: var(--color-action);
        color: var(--color-on-action);
        border: none;
        border-radius: var(--radius-md);
        padding: var(--space-3);
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .alt {
        margin-top: var(--space-4);
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      .mock-note {
        margin-top: var(--space-3);
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-style: italic;
        opacity: 0.7;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    void this.router.navigate(['/home']);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/features/auth/login/login.component.spec.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/auth/login/
git commit -m "feat: add mock login form that continues to home (#12)"
```

---

### Task 4: HomeComponent (account view + MTG teaser)

**Files:**
- Modify (replace): `src/app/features/home/home.component.ts`
- Test: `src/app/features/home/home.component.spec.ts`

**Interfaces:**
- Consumes: `Account` model (Task 1); browser `history.state` (set by `SignupComponent`'s `router.navigate(['/home'], { state: { account } })`).
- Produces: `HomeComponent` (selector `app-home`) — shows the account holder's username, email, and personal organization when navigation state carries an account; a generic welcome otherwise; always shows the MTG teaser.

- [ ] **Step 1: Write the failing test**

Create `src/app/features/home/home.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { Account } from '../../api.models';

const account: Account = {
  user: { id: 'u1', email: 'aldric@realm.com', username: 'aldric' },
  personalOrganization: { id: 'o1', name: "Aldric's Hoard", type: 'PERSONAL' },
};

function render(): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(HomeComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('HomeComponent', () => {
  afterEach(() => window.history.replaceState({}, ''));

  it('greets the user and shows account + organization from navigation state', () => {
    window.history.replaceState({ account }, '');
    const el = render();
    expect(el.textContent).toContain('Welcome, aldric');
    expect(el.textContent).toContain('aldric@realm.com');
    expect(el.textContent).toContain("Aldric's Hoard");
  });

  it('shows a generic welcome when there is no account in state', () => {
    window.history.replaceState({}, '');
    const el = render();
    expect(el.textContent).toContain('Welcome to your vault');
    expect(el.textContent).not.toContain('aldric@realm.com');
  });

  it('always shows the Magic: The Gathering teaser', () => {
    window.history.replaceState({}, '');
    const el = render();
    expect(el.textContent).toContain('Magic: The Gathering');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/features/home/home.component.spec.ts`
Expected: FAIL — the placeholder `HomeComponent` only renders "Welcome to your vault" and has no account handling or MTG teaser.

- [ ] **Step 3: Write the implementation**

Replace the contents of `src/app/features/home/home.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Account } from '../../api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="home">
      @if (account(); as acc) {
        <h1>Welcome, {{ acc.user.username }}.</h1>
        <p class="sub">Your vault is ready.</p>
        <dl class="account-card">
          <dt>Account</dt>
          <dd>{{ acc.user.email }}</dd>
          <dt>Personal organization</dt>
          <dd>{{ acc.personalOrganization.name }}</dd>
        </dl>
      } @else {
        <h1>Welcome to your vault</h1>
        <p class="sub">Your vault is ready.</p>
      }

      <div class="teaser">
        <span class="teaser-icon" aria-hidden="true">✦</span>
        <div>
          <p class="teaser-title">Magic: The Gathering</p>
          <p class="teaser-sub">Your first collection space — coming soon.</p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .home {
        max-width: 34rem;
        margin: 0 auto;
        padding: var(--space-8) var(--space-6);
      }
      .sub {
        color: var(--color-text-muted);
        margin: 0 0 var(--space-6);
      }
      .account-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin: 0 0 var(--space-4);
      }
      .account-card dt {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-muted);
      }
      .account-card dd {
        margin: 0 0 var(--space-3);
        font-weight: 600;
      }
      .account-card dd:last-child {
        margin-bottom: 0;
      }
      .teaser {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
      }
      .teaser-icon {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--color-surface);
        color: var(--color-brand);
        font-size: 1.2rem;
      }
      .teaser-title {
        margin: 0;
        font-weight: 700;
      }
      .teaser-sub {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class HomeComponent {
  readonly account = signal<Account | null>(HomeComponent.readAccount());

  private static readAccount(): Account | null {
    if (typeof history === 'undefined') {
      return null;
    }
    const state = history.state as { account?: Account } | null;
    return state?.account ?? null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/features/home/home.component.spec.ts`
Expected: PASS (all 3 tests).

- [ ] **Step 5: Run the full gate**

Run: `npm run test:ci && npm run lint && npm run build`
Expected: all tests pass with ≥80% coverage; ESLint/Prettier clean; production build succeeds (still prerenders `/`).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/home/
git commit -m "feat: show created account and MTG teaser on home (#12)"
```

---

## Manual verification (end of Plan 3)

- [ ] `npm start`. From the landing page, click **Create your vault** → `/signup`. The submit button is disabled until both fields are valid (try an invalid email, a >320-char email, an empty username).
- [ ] With the backend reachable (`environment.development` `apiBaseUrl`), submit a fresh email+username → lands on `/home` showing "Welcome, {username}", the email, and the personal organization name, plus the MTG teaser. Toggle the theme on `/home` and `/signup` → both re-theme with no flash.
- [ ] Submit a duplicate username/email → an inline "already taken" message appears and you stay on `/signup`. Simulate the API being down → the generic error message appears.
- [ ] Go to `/login`, submit any valid email+password → lands on `/home` with the generic welcome (no account card) + MTG teaser. Confirm no `/accounts` request is made from the login page (Network tab).
- [ ] Refresh `/home` → generic welcome (documented POC limitation: no session persistence).

## Self-review (spec coverage for this plan's slice)

- Spec §6 signup real form + boundary validation (email ≤320 valid, username ≤100) + `POST /accounts` → `/home` + inline error handling → Tasks 1, 2. ✓
- Spec §6 mock login (email + cosmetic password, no API, → `/home`) → Task 3. ✓
- Spec §6 home shows created account (email + personal org) from state, generic otherwise, MTG teaser → Task 4. ✓
- Spec §6 `ApiService.createAccount` + `Account`/`User`/`Organization` models mirroring the API → Task 1. ✓
- Spec §6 known limitation (no session; refresh loses identity) → documented in manual verification + component behavior. ✓

## Remaining after this plan (pre-PR cleanup, then the #12 PR)

1. **Author the three ADRs** via `adr-create` (+ `./scripts/adr check`):
   - SSG/prerender for SEO (keeps nginx-static deploy).
   - Theming via CSS custom-property tokens + no-flash init.
   - Adopt Angular Router + app-shell layout.
2. **Sweep deferred Minors** (progress ledger): theme-toggle icon sizing tokens; `@types/node` bump; footer heading semantics; any others logged.
3. **Comprehensive whole-branch review** (opus) via superpowers:requesting-code-review over the full `#12` branch, then fix Critical/Important.
4. **Docker smoke test** already passed for Plan 2 — re-run once more after Plan 3 to confirm signup/login/home load in the container.
5. **Release:** apply `release:minor` label, run `./scripts/bump-version bump minor`, open the PR titled referencing `#12`.
6. Use **superpowers:finishing-a-development-branch** to complete the branch.
