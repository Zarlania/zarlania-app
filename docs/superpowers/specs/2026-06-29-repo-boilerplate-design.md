# Repo Boilerplate Design — zarlania-app (Angular frontend)

**Date:** 2026-06-29
**Status:** Approved (brainstorming)
**Scope:** Establish the repository's engineering boilerplate — governance, doc tooling,
quality gates, CI, release automation, and deploy config — by porting the proven shell from
`zarlania-api` and re-authoring the stack-specific pieces for the Angular frontend. Also
bring the app's framework/toolchain to current latest-stable. **No app feature work.**

This repo is **live in production**: merges to `master` deploy to <https://zarlania.com>.
Everything here is built to that standard from day one — quality code, DRY/SOLID, tests,
no committed secrets.

---

## 1. Goal & guiding principles

`zarlania-app` currently has only an Angular hello-world POC and minimal scaffolding. The
sibling backend `zarlania-api` (Java/Spring Boot) has a mature repository shell: ADR system,
reference-doc system, Python-based doc tooling, lint/security gates, issue-driven governance,
SemVer-on-merge release automation, and Render/Docker deploy-as-code. This work brings the
same engineering rigor to the frontend.

Principles:

- **Port, don't reinvent.** The language-agnostic machinery (doc tooling, lint configs,
  governance docs, `.claude` skills) is copied verbatim. Only stack-specific pieces are
  re-authored.
- **Parity in spirit, not in language.** The frontend gets the same *governance* (ADRs,
  issue workflow, release-every-merge, quality gates) realized with Angular/npm tooling.
- **Latest stable, low Dependabot churn.** Pin to current-latest versions up front so the
  repo opens with a quiet dependency queue, not a backlog of major bumps.
- **No app behavior change.** The app stays the hello-world POC. The only app-touching work
  is the framework upgrade and the Karma→Jest swap — toolchain/versions, not behavior.

---

## 2. Approach

**Hybrid: copy the language-agnostic parts verbatim, re-author the stack-specific parts.**
Rejected alternatives: "copy everything then strip Java" (leaves Java assumptions in
CLAUDE.md/CI/ADRs) and "author everything fresh" (wasteful — the doc tooling and lint
configs are identical regardless of language).

---

## 3. Component inventory

### 3.1 Port verbatim (language-agnostic)

Copied from `zarlania-api` with at most trivial find/replace (`API`→`app`, backend→frontend,
`api.zarlania.com`→`zarlania.com`):

- **`.claude/skills/`** — `adr-create/`, `adr-search/`, `adr-tags/` (SKILL.md each).
- **Python doc tooling under `scripts/`** — `adr`, `ref` (bash launchers); Python packages
  `doc_core/`, `adr_tool/`, `ref_tool/` including their `tests/`. Unchanged: these tools
  operate on Markdown ADR/reference files and are language-neutral.
- **`pyproject.toml`** — pytest/ruff config for the doc tooling. Copied as-is: `testpaths` /
  `pythonpath` keep `adr_tool`, `ref_tool`, `doc_core`, and `release_tool` (the release tool
  stays in this repo — see §3.2 — so its tests remain in scope).
- **`requirements-dev.txt`** — pyyaml, pytest, pytest-cov, ruff, pre-commit (versions
  copied as-is; already Dependabot-current in the API).
- **Lint configs** — `.markdownlint.yaml`, `.markdownlintignore`, `.yamllint.yaml`.
- **`.github/`** — `CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md`, `dependabot.yml`,
  `ISSUE_TEMPLATE/{bug_report,feature_request,chore,config}.yml`. `dependabot.yml` is
  re-authored (§3.2) because its ecosystems differ.
- **Governance docs** — `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`,
  `SUPPORT.md` (light find/replace).
- **ADR/reference scaffolding** — `docs/adrs/{_template.md,_tags.md,README.md}` and
  `docs/reference/{_template.md,_tags.md,README.md}`. The reference dir starts with **no
  content docs** (authored as real behavior lands, like the API did).

### 3.2 Re-author for the Angular stack

- **`CLAUDE.md`** — same structure and non-negotiables as the API's, retargeted: stack is
  Angular/TypeScript/npm/nginx-on-Docker; tests are Jest; the release version lives in
  `package.json` `"version"`; production URL is `https://zarlania.com`; deploy-on-merge
  warning preserved. ADR/reference/spec-vs-law sections and the `docs/ai-prompts/` policy
  carry over unchanged in spirit.
- **`release_tool`** — the SemVer math (`parse`/`format`/`bump`/`latest_tag_version`/
  `expected_version`) and the CLI surface (`current`/`bump`/`verify`) are **unchanged**.
  Only the version read/write target changes from `pom.xml` `<version>` to `package.json`
  `"version"`:
  - Replace `_POM_VERSION_RE` + `read_pom_version` + `set_pom_version` with JSON-based
    read/write of the top-level `"version"` key (preserving formatting/trailing newline;
    write with `json.dumps(..., indent=2)` + newline, or a targeted regex on the
    `"version"` line to avoid reformatting the whole file — prefer the latter to keep diffs
    minimal and lockstep with npm's own formatting).
  - Rename the CLI `--pom` flag to `--manifest` (default `package.json`).
  - Update `release_tool/tests/` accordingly. Coverage stays ≥80% (enforced by `pyproject`).
- **`.pre-commit-config.yaml`** — keep: trailing-whitespace, end-of-file-fixer, check-yaml,
  check-added-large-files, check-merge-conflict, detect-private-key, gitleaks, ruff +
  ruff-format, markdownlint, shfmt, shellcheck, yamllint, and the local `adr-check` /
  `ref-check` hooks. **Remove** the `java-quality` hook. **Add** a local hook running the
  frontend lint/format gate (`npm run lint` and a Prettier check) scoped to
  `\.(ts|html|scss|css|json)$`. Keep the `exclude` for `docs/(superpowers|ai-prompts)/`.
- **`ci.yml`** — keep the `checks` (Python tooling + pre-commit; runs `SKIP=<fe-hook>
  pre-commit run --all-files` then `pytest --cov`), `secrets` (gitleaks), and `governance`
  (PR references an issue) jobs essentially as-is. **Replace** the Maven `build` +
  `transactional-tests` jobs with a single **frontend** job:
  `npm ci` → `npm run lint` → `npm run test:ci` (Jest, `--coverage`, ≥80% gate) →
  `npm run build`. Node 24 via `actions/setup-node` with npm cache. **Post a coverage PR
  comment** from Jest's output (cobertura/lcov via a coverage-comment action, mirroring the
  API's Python-coverage comment) — visible in every PR — *in addition to* the Jest
  `coverageThreshold` failing the job at <80%. Pin all actions to commit SHAs (matching the
  API).
- **`release-check.yml`** — copied; the only change is the verify step calls
  `python scripts/release_tool/release_cli.py verify "<kind>"` against `package.json`
  (the CLI default `--manifest`). Same label logic (`release:major|minor|patch`).
- **`release.yml`** — copied; tags `v<version>` from `package.json` on merge to `master`
  and cuts the GitHub Release. (Reviewed/adjusted to read the version from `package.json`.)
- **`dependabot.yml`** — ecosystems become `npm` (root) and `pip` (the doc tooling),
  plus `github-actions` and `docker`. Grouping/schedule mirror the API's intent.
- **`scripts/setup-dev`** — re-authored: create `.venv`, install `requirements-dev.txt`,
  `pre-commit install`, then verify the Node toolchain / run `npm ci` (replacing the
  `./mvnw -v` check).
- **`scripts/check`** — re-authored: run `pre-commit run --all-files`; `--full` also runs
  `npm run lint && npm run test:ci && npm run build` (replacing `./mvnw clean verify`).
- **`render.yaml`** — new file: `name: zarlania-app`, `runtime: docker`,
  `dockerfilePath: ./Dockerfile`, `plan: free`, `region: oregon`, `branch: master`,
  `autoDeploy: true`, `healthCheckPath: /` (nginx serves static; no `/actuator/health`).
  No CORS env var.

### 3.3 New work — framework upgrade + Jest migration (the one app-touching task)

Justified by the "latest stable" requirement; mechanical on a hello-world POC.

- **Upgrade Angular 19.2 → 22** via `ng update @angular/core@22 @angular/cli@22`. Replace
  `@angular-devkit/build-angular` with `@angular/build` (Angular 22's builder). Bump
  `rxjs`→7.8.x, `zone.js`→0.16.x, `typescript`→6.0.x.
- **Migrate Karma → Jest.** Remove karma/jasmine devDeps + `karma.conf`; add `jest`,
  `jest-preset-angular`, `@types/jest`, `jsdom`. Add `jest.config.ts` + `setup-jest.ts`,
  set `coverageThreshold` global ≥80%. Update `angular.json` test target (or remove it in
  favor of npm scripts) and `package.json` scripts: `test` (watch), `test:ci`
  (`jest --coverage --ci`), `lint` (eslint). Port the two existing `.spec.ts`
  (`app.component.spec.ts`, `api.service.spec.ts`) to Jest assertions so they pass.
- **Add ESLint + Prettier.** `angular-eslint` 22 + `typescript-eslint` 8.62.x + `eslint`
  10, `eslint.config.js` (flat config); `prettier` 3.9.x + `.prettierrc` + `.prettierignore`.
- **Dockerfile** — bump build stage `node:20-alpine` → `node:24-alpine`. nginx stage and
  `dist/zarlania-app/browser` output path unchanged (verify the builder output path after
  the Angular 22 update; `@angular/build` keeps `browser/`).

### 3.4 Pinned version matrix (current latest-stable, mutually compatible)

| Package | Version | Fixed by |
|---|---|---|
| `@angular/core`, `@angular/cli`, `@angular/build` | 22.0.4 | latest stable |
| `typescript` | 6.0.3 | Angular 22 peer `>=6.0 <6.1` |
| `rxjs` | 7.8.2 | Angular peer `^7.4.0` |
| `zone.js` | 0.16.2 | Angular peer `~0.16.0` |
| Node (Docker base + CI) | 24 LTS (`>=24.15.0`) | Angular 22 engines |
| `eslint` | 10.6.0 | angular-eslint 22 (`^9 || ^10`) |
| `angular-eslint` / `typescript-eslint` | 22.0.0 / 8.62.1 | mutually pinned |
| `prettier` | 3.9.4 | latest |
| `jest` / `jest-preset-angular` / `@types/jest` | 30.4.2 / 17.0.0 / 30.0.0 | jpa17 supports Ng 20–22 + jest 30 |

Python tooling versions (ruff, pytest, pre-commit, etc.) copied from the API as-is.

---

## 4. ADRs to seed (sequential, this repo's own numbering)

Each records a real decision already embodied in the repo or confirmed during brainstorming —
not speculative. **No reference docs are seeded with content; only the empty system.**

| # | Title | Derived from API ADR |
|---|---|---|
| 0001 | Record architecture decisions | 0001 (near-verbatim) |
| 0002 | Adopt Angular, npm, and nginx-on-Docker for the frontend | 0006 |
| 0003 | Deploy on Render as code using Docker | 0005 |
| 0004 | Enforce code quality and security gates | 0007 |
| 0005 | Require issue-driven contribution workflow | 0008 |
| 0006 | Release every merge via in-PR SemVer bump | 0009 |
| 0007 | Record explanatory reference docs as numbered living guides | 0013 |

**Version-wording rule (applies to every ADR):** the *decision* is the stack/approach, not
a concrete version. Where versions appear they are illustrative — "concrete versions live in
`package.json` and are bumped routinely (Dependabot, `ng update`); a version bump, including
a major, never requires a new ADR. Only changing the framework *choice* does." ADR-0002
states this explicitly; other ADRs referencing versions inherit the same wording.

Each ADR is authored via the `adr-create` skill / `./scripts/adr` tooling and validated with
`./scripts/adr check`. Backend-only API ADRs (actuator endpoints, springdoc OpenAPI, CORS
allowlist, JPA/H2/Flyway, Lombok) are **not** ported.

---

## 5. Out of scope / deferred

- **Storybook.** Wanted up front, but `@storybook/angular` (latest 10.4.6 and the 10.5
  alpha) caps Angular at `<22`, requires TypeScript `^5`, and depends on
  `@angular-devkit/build-angular` — all incompatible with Angular 22 / TS 6. **Deferred**
  until Storybook ships Angular 22 support; adding it then is still just boilerplate.
  Tracked as a follow-up.
- **App features / behavior changes** — none. The app stays the hello-world POC.
- **An ADR for backend-API consumption** (the `ApiService`/`environment` base-URL wiring) —
  deferred until that integration is real (currently POC-level; YAGNI).
- **Reference-doc content** — the system is scaffolded empty; docs authored as behavior lands.

---

## 6. Acceptance criteria

- `.claude/skills/`, `scripts/` doc tooling, lint configs, governance docs, `.github/`, and
  ADR/reference scaffolding exist and mirror the API's where language-agnostic.
- `./scripts/adr check` and `./scripts/ref check` pass; `pytest` (doc tooling, incl.
  `release_tool`) passes at ≥80% coverage.
- `npm ci && npm run lint && npm run test:ci && npm run build` all pass on Node 24 with the
  pinned Angular 22 / TS 6 toolchain; Jest enforces ≥80% coverage.
- `pre-commit run --all-files` passes (no `java-quality` hook; frontend lint hook present).
- `./scripts/bump-version current` reads `package.json`; `bump`/`verify` operate on it;
  `release-check.yml` validates the bump against the `release:*` label.
- `render.yaml` deploys the Docker image with `healthCheckPath: /`; `Dockerfile` builds on
  `node:24-alpine`.
- Seven ADRs (0001–0007) exist, validated, with version-agnostic wording.
- The app still builds and serves the existing hello-world POC unchanged in behavior.
