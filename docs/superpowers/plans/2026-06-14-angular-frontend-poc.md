# Zarlania Frontend POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Angular SPA that fetches a message from the live backend and renders it, dockerized with nginx listening on Render's `$PORT`, and deployed at `https://zarlania.com`.

**Architecture:** Standalone Angular app at repo root. An `ApiService` reads the API base URL from environment config and GETs the backend; `AppComponent` renders loading/success/error states. A multi-stage Dockerfile builds the static bundle with Node and serves it via nginx, whose config is templated with `envsubst` so it listens on Render's injected `$PORT`. Render deploys the Docker image from GitHub on push to `master`; Squarespace DNS points the apex at Render.

**Tech Stack:** Angular 19 (standalone, signals), TypeScript, Karma/Jasmine (local tests only), Docker (node:20-alpine → nginx:1.27-alpine), Render (Web Service / Docker), Squarespace Domains.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/api.service.ts` | `getMessage()` — GET the configured base URL, return `message` |
| `src/app/api.service.spec.ts` | Unit tests for `ApiService` |
| `src/app/app.component.ts` | Root component: calls service, renders loading/success/error |
| `src/app/app.component.spec.ts` | Unit tests for `AppComponent` |
| `src/app/app.config.ts` | App providers (adds `provideHttpClient()`) |
| `src/environments/environment.ts` | Prod config: `apiBaseUrl: https://api.zarlania.com` |
| `src/environments/environment.development.ts` | Dev config: same `apiBaseUrl` |
| `Dockerfile` | Multi-stage build (node → nginx) |
| `nginx.conf.template` | nginx server block with `listen ${PORT};` + SPA fallback |
| `docker-entrypoint.sh` | `envsubst` the template, then start nginx |
| `.dockerignore` | Exclude `node_modules`, `dist`, etc. from build context |

---

## Task 1: Scaffold the Angular project at repo root

**Files:**
- Create: entire Angular project at repo root via the CLI

- [ ] **Step 1: Generate the project into a temp dir (avoids collisions with existing root files)**

Run from repo root:
```bash
npx -y @angular/cli@19 new zarlania-app \
  --directory tmp-ng \
  --routing=false \
  --style=css \
  --ssr=false \
  --skip-git \
  --package-manager=npm \
  --defaults
```
Expected: project created under `tmp-ng/` with `package.json`, `angular.json`, `src/`, and `node_modules/` installed.

- [ ] **Step 2: Move generated files (including dotfiles) into repo root, then remove temp dir**

```bash
shopt -s dotglob
mv tmp-ng/* .
shopt -u dotglob
rmdir tmp-ng
```
Note: this overwrites the placeholder root `README.md` and adds Angular's `.gitignore`/`.editorconfig`. `LICENSE` and `docs/` are untouched.

- [ ] **Step 3: Confirm the project name and dist path**

Run:
```bash
grep -m1 '"outputPath"' angular.json
```
Expected: an entry under project `zarlania-app` (the built bundle will land in `dist/zarlania-app/browser`). If the project name differs, note it — the Dockerfile `COPY --from=build` path in Task 6 must match.

- [ ] **Step 4: Generate environment files**

```bash
npx ng generate environments
```
Expected: creates `src/environments/environment.ts` and `src/environments/environment.development.ts`, and wires the `fileReplacements` in `angular.json`.

- [ ] **Step 5: Verify the default app builds and serves**

```bash
npm run build
```
Expected: build succeeds, output in `dist/zarlania-app/browser`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Angular 19 project at repo root"
```

---

## Task 2: Configure the API base URL in environment files

**Files:**
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.development.ts`

- [ ] **Step 1: Set the prod environment**

Replace the contents of `src/environments/environment.ts` with:
```ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.zarlania.com',
};
```

- [ ] **Step 2: Set the development environment**

Replace the contents of `src/environments/environment.development.ts` with:
```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.zarlania.com',
};
```

- [ ] **Step 3: Commit**

```bash
git add src/environments/environment.ts src/environments/environment.development.ts
git commit -m "feat: add apiBaseUrl to environment config"
```

---

## Task 3: ApiService (TDD)

**Files:**
- Create: `src/app/api.service.ts`
- Test: `src/app/api.service.spec.ts`
- Modify: `src/app/app.config.ts` (add `provideHttpClient()`)

- [ ] **Step 1: Write the failing test**

Create `src/app/api.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs the configured base URL and returns the message field', () => {
    let result: string | undefined;
    service.getMessage().subscribe((msg) => (result = msg));

    const req = httpMock.expectOne(environment.apiBaseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'Hello from Zarlania API v2' });

    expect(result).toBe('Hello from Zarlania API v2');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: FAIL — cannot find module `./api.service`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/app/api.service.ts`:
```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  getMessage(): Observable<string> {
    return this.http
      .get<MessageResponse>(this.baseUrl)
      .pipe(map((res) => res.message));
  }
}
```

- [ ] **Step 4: Add `provideHttpClient()` to the app config**

Edit `src/app/app.config.ts` so the providers array includes `provideHttpClient()`. The file should look like:
```ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
  ],
};
```
Note: keep any other providers the scaffold already added; just add the `provideHttpClient()` import and entry.

- [ ] **Step 5: Run the test, verify it passes**

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api.service.ts src/app/api.service.spec.ts src/app/app.config.ts
git commit -m "feat: add ApiService that fetches backend message"
```

---

## Task 4: AppComponent renders loading/success/error (TDD)

**Files:**
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.spec.ts`
- Delete: `src/app/app.component.html`, `src/app/app.component.css` (replaced by inline template)

- [ ] **Step 1: Write the failing tests**

Replace the contents of `src/app/app.component.spec.ts` with:
```ts
import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { AppComponent } from './app.component';
import { ApiService } from './api.service';

function setup(apiMock: Partial<ApiService>) {
  TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [{ provide: ApiService, useValue: apiMock }],
  });
  return TestBed.createComponent(AppComponent);
}

describe('AppComponent', () => {
  it('shows loading initially', () => {
    const fixture = setup({ getMessage: () => NEVER });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading');
  });

  it('shows the message on success', () => {
    const fixture = setup({
      getMessage: () => of('Hello from Zarlania API v2'),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Hello from Zarlania API v2',
    );
  });

  it('shows an error message on failure', () => {
    const fixture = setup({
      getMessage: () => throwError(() => new Error('fail')),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Could not reach the API',
    );
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: FAIL — AppComponent does not yet inject `ApiService` / render these states.

- [ ] **Step 3: Implement the component**

Replace the contents of `src/app/app.component.ts` with:
```ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: sans-serif; text-align: center; padding: 4rem;">
      @if (loading()) {
        <p>Loading…</p>
      } @else if (error()) {
        <p>Could not reach the API.</p>
      } @else {
        <h1>{{ message() }}</h1>
      }
    </main>
  `,
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  error = signal(false);
  message = signal('');

  ngOnInit(): void {
    this.api.getMessage().subscribe({
      next: (msg) => {
        this.message.set(msg);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
```

- [ ] **Step 4: Delete the now-unused template/style files**

```bash
rm src/app/app.component.html src/app/app.component.css
```

- [ ] **Step 5: Run the tests, verify they pass**

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: PASS (all three AppComponent tests + the ApiService test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: render backend message with loading and error states"
```

---

## Task 5: Docker support files

**Files:**
- Create: `.dockerignore`
- Create: `nginx.conf.template`
- Create: `docker-entrypoint.sh`

- [ ] **Step 1: Create `.dockerignore`**

```
node_modules
dist
.git
.angular
.idea
.vscode
```

- [ ] **Step 2: Create `nginx.conf.template`**

`${PORT}` is substituted at container start; `$uri` is left intact for nginx.
```
server {
    listen       ${PORT};
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 3: Create `docker-entrypoint.sh`**

```sh
#!/bin/sh
set -e
: "${PORT:=8080}"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
```

- [ ] **Step 4: Commit**

```bash
git add .dockerignore nginx.conf.template docker-entrypoint.sh
git commit -m "chore: add nginx template and docker entrypoint for \$PORT"
```

---

## Task 6: Dockerfile + local container verification

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create the Dockerfile**

Confirm the `COPY --from=build` path matches the dist path from Task 1 Step 3 (`dist/zarlania-app/browser`).
```dockerfile
# Stage 1: build the Angular bundle
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve with nginx on $PORT
FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=build /app/dist/zarlania-app/browser /usr/share/nginx/html
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
```

- [ ] **Step 2: Build the image**

```bash
docker build -t zarlania-app .
```
Expected: build succeeds through both stages.

- [ ] **Step 3: Run the container simulating Render's injected port**

```bash
docker run --rm -d -e PORT=9000 -p 9000:9000 --name zarlania-app-test zarlania-app
```
Expected: container starts (nginx listening on 9000).

- [ ] **Step 4: Verify it serves the app on the injected port**

```bash
curl -sSf http://localhost:9000/ | grep -o '<app-root></app-root>'
```
Expected: prints `<app-root></app-root>` (the SPA shell). This proves nginx honored `$PORT`.

- [ ] **Step 5: Stop the test container**

```bash
docker stop zarlania-app-test
```

- [ ] **Step 6: Commit**

```bash
git add Dockerfile
git commit -m "feat: multi-stage Dockerfile serving Angular via nginx on \$PORT"
```

---

## Task 7: Push and deploy on Render (interactive — guided)

This task is performed by the user in the Render dashboard with step-by-step guidance. No code; verification is via the live URL.

- [ ] **Step 1: Push `master` to GitHub**

```bash
git push origin master
```
Expected: `Zarlania/zarlania-app` on GitHub now contains the app.

- [ ] **Step 2: Create the Render Web Service**

In the Render dashboard: New → Web Service → connect `Zarlania/zarlania-app` →
- Runtime: **Docker**
- Branch: `master`
- Instance type: **Free**
- Auto-deploy: **On** (deploy on push to `master`)

Render reads the `Dockerfile` and injects `$PORT`; the entrypoint binds nginx to it.

- [ ] **Step 3: Verify the default Render URL works**

After the first deploy finishes, open the `*.onrender.com` URL Render assigns.
Expected: page shows **"Hello from Zarlania API v2"** (live backend call succeeds; CORS `*` is already enabled).

---

## Task 8: Custom domain + DNS (interactive — guided)

Performed by the user across the Render dashboard and Squarespace Domains DNS panel.

- [ ] **Step 1: Add custom domains in Render**

Render service → Settings → Custom Domains → add **`zarlania.com`** and **`www.zarlania.com`**.
Render displays: the **A record IP(s)** for the apex and a **CNAME target** for `www`.

- [ ] **Step 2: Update Squarespace DNS — apex A record(s)**

In Squarespace Domains → `zarlania.com` → DNS settings:
- **Remove** any existing default/parking A records on host `@` (these conflict).
- **Add** an A record per IP Render showed: Host `@`, Type `A`, Value = Render IP.

- [ ] **Step 3: Update Squarespace DNS — www CNAME**

- **Add** a CNAME: Host `www`, Type `CNAME`, Value = the Render CNAME target.

- [ ] **Step 4: Set the www→apex redirect in Render**

In Render Custom Domains, configure `www.zarlania.com` to redirect to the apex `zarlania.com` (apex is canonical).

- [ ] **Step 5: Wait for DNS + TLS**

DNS propagation can take minutes to a couple of hours. Render auto-issues a TLS certificate once it sees the records resolve. Watch the Render Custom Domains panel until both show "Verified" / certificate issued.

- [ ] **Step 6: Final verification**

```bash
curl -sSL https://zarlania.com/ | grep -o 'app-root'
curl -sSI https://www.zarlania.com/ | grep -i location
```
Expected:
- `https://zarlania.com` loads over HTTPS and the browser shows **"Hello from Zarlania API v2"**.
- `https://www.zarlania.com` returns a redirect (`Location: https://zarlania.com/`).

---

## Done criteria

All checkboxes complete and the live site at `https://zarlania.com` renders the backend message over HTTPS, with `www` redirecting to the apex.
