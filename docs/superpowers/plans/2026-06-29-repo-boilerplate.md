# Repo Boilerplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `zarlania-app` to the same engineering rigor as `zarlania-api` — ADR/reference systems, Python doc tooling, quality/security gates, issue-driven governance, SemVer-on-merge release automation, and Render/Docker deploy-as-code — while upgrading the app to current latest-stable Angular 22 / TS 6 / Node 24 and swapping Karma→Jest.

**Architecture:** Hybrid port. Language-agnostic machinery (`.claude` skills, Python doc tooling, lint configs, governance docs, ADR/reference scaffolding) is copied verbatim from `../zarlania-api`. Stack-specific pieces (`CLAUDE.md`, CI, `release_tool`, pre-commit, `render.yaml`, dependabot, helper scripts) are re-authored for Angular/npm. The app stays a hello-world POC — only toolchain/versions change.

**Tech Stack:** Angular 22 · TypeScript 6.0 · Node 24 · Jest 30 + jest-preset-angular 17 · ESLint 10 + angular-eslint 22 + Prettier 3.9 · Python doc tooling (pytest/ruff) · pre-commit · GitHub Actions · Render + Docker/nginx.

## Global Constraints

- **Production-live repo.** Merges to `master` deploy to <https://zarlania.com>. Never commit secrets (only Render env vars / git-ignored `.env`). Write DRY/SOLID, test-first.
- **Source of truth for verbatim copies:** sibling repo at `../zarlania-api` (absolute: `/Users/steventimothy/workspace/zarlania-api`).
- **No app behavior changes.** The app remains the existing hello-world POC; only framework/toolchain/versions change.
- **Pinned versions (mutually compatible, latest-stable as of 2026-06-29):** `@angular/core`/`@angular/cli`/`@angular/build` `22.0.4` · `typescript` `6.0.3` (Angular 22 requires `>=6.0 <6.1`) · `rxjs` `7.8.2` · `zone.js` `0.16.2` · Node `24` LTS (`>=24.15.0`) · `eslint` `10.6.0` · `angular-eslint`/`typescript-eslint` `22.0.0`/`8.62.1` · `prettier` `3.9.4` · `jest`/`jest-preset-angular`/`@types/jest` `30.4.2`/`17.0.0`/`30.0.0`.
- **Coverage gate:** Jest `coverageThreshold` global ≥80%; CI also posts a visible coverage PR comment.
- **ADR version-wording rule:** the decision is the stack/approach, not a version. State that concrete versions live in `package.json` and routine bumps (incl. majors) never require a new ADR; only changing the framework *choice* does.
- **Branch/commit discipline:** work on the `chore/repo-boilerplate` branch (already created). Pin GitHub Actions to commit SHAs (copy the SHAs from `../zarlania-api`).
- **Doc-tooling exemptions stay:** `docs/superpowers/` and `docs/ai-prompts/` are excluded from all hooks; `docs/ai-prompts/` is git-ignored.

---

## File Structure

**Copied verbatim (language-agnostic):**
- `.claude/skills/{adr-create,adr-search,adr-tags}/SKILL.md`
- `scripts/{adr,ref}` (bash launchers); `scripts/{doc_core,adr_tool,ref_tool}/**` (+ tests)
- `pyproject.toml`, `requirements-dev.txt`
- `.markdownlint.yaml`, `.markdownlintignore`, `.yamllint.yaml`
- `docs/adrs/{_template.md,_tags.md,README.md}`, `docs/reference/{_template.md,_tags.md,README.md}`
- `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`
- `.github/{CODEOWNERS,PULL_REQUEST_TEMPLATE.md}`, `.github/ISSUE_TEMPLATE/*`

**Re-authored (stack-specific):**
- `scripts/{release_tool/**,bump-version,setup-dev,check}`
- `.pre-commit-config.yaml`, `.github/dependabot.yml`
- `.github/workflows/{ci.yml,release-check.yml,release.yml}`
- `CLAUDE.md`, `render.yaml`, `Dockerfile`
- `docs/adrs/0001…0007-*.md` (authored via the adr tooling)

**App toolchain (modified):**
- `package.json`, `angular.json`, `tsconfig*.json`
- `eslint.config.js`, `.prettierrc`, `.prettierignore`
- `jest.config.ts`, `setup-jest.ts`, `tsconfig.spec.json`
- `src/app/*.spec.ts` (ported to Jest), remove `karma.conf.js` if present

---

## Task ordering & dependencies

1. Angular 22 / TS 6 upgrade (foundational; CI + Docker depend on a working build)
2. Karma→Jest migration (defines `npm run test:ci`)
3. ESLint + Prettier (defines `npm run lint`)
4. Python doc tooling port (independent; needed by ADRs + pre-commit + CI `checks`)
5. `release_tool` rewrite for `package.json` (needs Task 4's pyproject)
6. ADR/reference scaffolding
7. Author ADRs 0001–0007 (needs Tasks 4 + 6)
8. Lint configs + pre-commit + `setup-dev`/`check` (needs Tasks 3–5)
9. Governance docs
10. `.github` templates + dependabot
11. `render.yaml` + Dockerfile Node bump (needs Task 1)
12. CI workflows (needs Tasks 2,3,4,5,8)
13. `CLAUDE.md` (references everything; last)

---

### Task 1: Upgrade Angular 19→22, TypeScript 6, Node-aligned deps

**Files:**
- Modify: `package.json`, `package-lock.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `src/**` (only auto-migrations from `ng update`)

**Interfaces:**
- Consumes: nothing.
- Produces: a building Angular 22 app on Node 24; `npm run build` emits `dist/zarlania-app/browser/`. Later tasks rely on `npm run build` succeeding and the `browser/` output path.

- [ ] **Step 1: Confirm Node 24 is active**

Run: `node -v`
Expected: `v24.` (≥ `v24.15.0`). If not, install/select Node 24 (e.g. `nvm install 24 && nvm use 24`) before continuing.

- [ ] **Step 2: Run the Angular update (steps through majors)**

```bash
# Angular requires stepping one major at a time
npx @angular/cli@20 update @angular/core@20 @angular/cli@20 --allow-dirty --force
npx @angular/cli@21 update @angular/core@21 @angular/cli@21 --allow-dirty --force
npx @angular/cli@22 update @angular/core@22 @angular/cli@22 --allow-dirty --force
```

Expected: each completes; `ng update` applies schematics/migrations. `--force` is acceptable here because the app is a hello-world POC with no third-party Angular libs.

- [ ] **Step 3: Replace the builder dep and pin remaining versions**

Edit `package.json`: remove `@angular-devkit/build-angular`; ensure `@angular/build@^22.0.4` is present (the migration may add it). Pin: `typescript@~6.0.3`, `rxjs@~7.8.2`, `zone.js@~0.16.2`, all `@angular/*@^22.0.4`. Then:

```bash
npm install
```

Expected: clean install, no peer-dependency errors.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: build succeeds; output written to `dist/zarlania-app/browser/`.

- [ ] **Step 5: Verify it serves the unchanged POC**

Run: `npm start` (then open `http://localhost:4200`, confirm the hello-world renders, then Ctrl-C).
Expected: app serves identically to before the upgrade.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "build: upgrade to Angular 22, TypeScript 6, on Node 24"
```

---

### Task 2: Migrate Karma → Jest

**Files:**
- Create: `jest.config.ts`, `setup-jest.ts`
- Modify: `package.json` (scripts + devDeps), `angular.json` (remove/replace `test` target), `tsconfig.spec.json`
- Remove: `karma.conf.js` (if present), `@types/jasmine`, `jasmine-core`, `karma*` devDeps
- Test: `src/app/app.component.spec.ts`, `src/app/api.service.spec.ts` (ported to Jest)

**Interfaces:**
- Consumes: building app from Task 1.
- Produces: `npm run test:ci` → `jest --coverage --ci` enforcing global ≥80%; `npm test` → watch. Later CI + pre-commit tasks call these scripts.

- [ ] **Step 1: Install Jest toolchain, remove Karma**

```bash
npm install -D jest@30.4.2 jest-preset-angular@17.0.0 @types/jest@30.0.0 jsdom@^26
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine
rm -f karma.conf.js
```

- [ ] **Step 2: Create `setup-jest.ts`**

```ts
import 'jest-preset-angular/setup-jest';
```

- [ ] **Step 3: Create `jest.config.ts`**

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  collectCoverage: false,
  collectCoverageFrom: ['src/app/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts'],
  coverageReporters: ['text', 'lcov', 'cobertura'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};

export default config;
```

- [ ] **Step 4: Point `tsconfig.spec.json` at Jest types**

Edit `tsconfig.spec.json`: set `compilerOptions.types` to `["jest", "node"]` and ensure `include` covers `src/**/*.spec.ts` and `src/**/*.d.ts`. Remove any `jasmine` type reference.

- [ ] **Step 5: Update `package.json` scripts and remove the Angular test target**

In `package.json` `scripts`: set `"test": "jest --watch"` and add `"test:ci": "jest --coverage --ci"`. In `angular.json`, delete the `architect.test` block (Jest runs via the CLI, not `ng test`).

- [ ] **Step 6: Port the existing specs to Jest**

Open `src/app/app.component.spec.ts` and `src/app/api.service.spec.ts`. Replace Jasmine-only constructs with Jest equivalents: `jasmine.createSpyObj(...)` → `{ method: jest.fn() }`; `spyOn(x,'m').and.returnValue(v)` → `jest.spyOn(x,'m').mockReturnValue(v)`; `.and.callFake` → `.mockImplementation`. `HttpClientTestingModule`/`TestBed` APIs are unchanged. Keep assertions behavioral (observable output through the public surface), and ensure they exercise enough of `app.component.ts` / `api.service.ts` to clear the 80% gate.

- [ ] **Step 7: Run the tests with coverage**

Run: `npm run test:ci`
Expected: all specs pass; coverage table prints; global coverage ≥80% (job would fail otherwise). If <80%, extend the ported specs to cover the missing branches before committing.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: migrate from Karma to Jest with 80% coverage gate"
```

---

### Task 3: Add ESLint + Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc`, `.prettierignore`
- Modify: `package.json` (scripts + devDeps)

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `npm run lint` (eslint) and `npm run format:check` (prettier). Pre-commit + CI call these.

- [ ] **Step 1: Add angular-eslint via schematic, then pin**

```bash
npm install -D eslint@10.6.0 angular-eslint@22.0.0 typescript-eslint@8.62.1 prettier@3.9.4
npx ng add angular-eslint --skip-confirmation || true
```

If the schematic does not produce a flat `eslint.config.js`, create it in Step 2.

- [ ] **Step 2: Ensure `eslint.config.js` (flat config) exists**

```js
// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
```

- [ ] **Step 3: Add Prettier config and ignore**

`.prettierrc`:

```json
{ "singleQuote": true, "printWidth": 100, "trailingComma": "all" }
```

`.prettierignore`:

```text
dist
coverage
.angular
node_modules
package-lock.json
docs/superpowers
docs/ai-prompts
```

- [ ] **Step 4: Add scripts**

In `package.json` `scripts`: `"lint": "eslint . && prettier --check ."`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.

- [ ] **Step 5: Format and fix the existing code**

```bash
npm run format
npx eslint . --fix
```

- [ ] **Step 6: Verify lint is clean**

Run: `npm run lint`
Expected: exit 0, no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "build: add ESLint (angular-eslint) and Prettier"
```

---

### Task 4: Port the Python doc tooling

**Files:**
- Create (copy from `../zarlania-api`): `.claude/skills/{adr-create,adr-search,adr-tags}/SKILL.md`; `scripts/{adr,ref}`; `scripts/{doc_core,adr_tool,ref_tool}/**`; `pyproject.toml`; `requirements-dev.txt`

**Interfaces:**
- Consumes: nothing.
- Produces: `./scripts/adr` and `./scripts/ref` CLIs; `pytest` over the doc tooling. ADRs (Task 7), pre-commit (Task 8), and CI `checks` (Task 12) depend on these.

- [ ] **Step 1: Copy the skills and tooling verbatim**

```bash
cd /Users/steventimothy/workspace/zarlania-app
SRC=/Users/steventimothy/workspace/zarlania-api
mkdir -p .claude
cp -R "$SRC/.claude/skills" .claude/skills
cp "$SRC/scripts/adr" "$SRC/scripts/ref" scripts/ 2>/dev/null || (mkdir -p scripts && cp "$SRC/scripts/adr" "$SRC/scripts/ref" scripts/)
cp -R "$SRC/scripts/doc_core" "$SRC/scripts/adr_tool" "$SRC/scripts/ref_tool" scripts/
cp "$SRC/pyproject.toml" "$SRC/requirements-dev.txt" .
find scripts -name __pycache__ -type d -prune -exec rm -rf {} +
chmod +x scripts/adr scripts/ref
```

- [ ] **Step 2: Create the Python dev environment**

```bash
python3 -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements-dev.txt
```

- [ ] **Step 3: Run the doc-tooling tests**

Run: `.venv/bin/pytest`
Expected: all `adr_tool`/`ref_tool`/`doc_core`/`release_tool` tests pass at ≥80% coverage. (`release_tool` tests still assume `pom.xml` here — they are rewritten in Task 5. If they fail now, that is expected; proceed to Step 4 and fix in Task 5. To keep this task green, run `.venv/bin/pytest scripts/adr_tool scripts/ref_tool scripts/doc_core` and confirm those pass.)

- [ ] **Step 4: Verify the ADR/ref CLIs run**

Run: `./scripts/adr --help` and `./scripts/ref --help`
Expected: usage text prints (no scaffolding yet, so `list` will be empty until Task 6).

- [ ] **Step 5: Ensure `.gitignore` ignores the venv and ai-prompts**

Confirm `.gitignore` contains `.venv/` and `docs/ai-prompts/`. Add any missing lines (copy the relevant lines from `$SRC/.gitignore`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "build: port ADR/reference doc tooling and Python dev deps"
```

---

### Task 5: Rewrite `release_tool` to target `package.json`

**Files:**
- Modify: `scripts/release_tool/release.py`, `scripts/release_tool/release_cli.py`
- Create: `scripts/bump-version` (bash launcher)
- Test: `scripts/release_tool/tests/test_release.py`, `scripts/release_tool/tests/test_release_cli.py`

**Interfaces:**
- Consumes: Task 4 (the copied `release_tool` package + pyproject).
- Produces: `release.read_manifest_version(path)`, `release.set_manifest_version(path, v)`, and a CLI (`current`/`bump`/`verify`, default `--manifest package.json`). CI `release-check.yml` / `release.yml` (Task 12) call these. SemVer helpers (`parse_version`/`format_version`/`bump`/`latest_tag_version`/`expected_version`) are unchanged.

- [ ] **Step 1: Write failing tests for manifest read/write**

Replace the `_pom`-based fixtures and pom tests in `tests/test_release.py` with:

```python
def _manifest(tmp_path, version):
    p = tmp_path / "package.json"
    p.write_text(
        textwrap.dedent(
            f"""\
            {{
              "name": "zarlania-app",
              "version": "{version}",
              "private": true
            }}
            """
        ),
        encoding="utf-8",
    )
    return p


def test_read_manifest_version(tmp_path):
    p = _manifest(tmp_path, "1.2.3")
    assert release.read_manifest_version(p) == "1.2.3"


def test_set_manifest_version_round_trips(tmp_path):
    p = _manifest(tmp_path, "1.2.3")
    release.set_manifest_version(p, "2.0.0")
    assert release.read_manifest_version(p) == "2.0.0"
    # other keys/formatting preserved
    assert '"name": "zarlania-app"' in p.read_text(encoding="utf-8")


def test_read_manifest_version_missing_raises(tmp_path):
    p = tmp_path / "package.json"
    p.write_text('{"name": "x"}\n', encoding="utf-8")
    with pytest.raises(ValueError):
        release.read_manifest_version(p)
```

Keep all existing SemVer-math tests (`test_parse_version_*`, `test_bump_*`, `test_latest_tag_version_*`, `test_expected_version_*`) unchanged.

- [ ] **Step 2: Run tests to confirm they fail**

Run: `.venv/bin/pytest scripts/release_tool/tests/test_release.py -q`
Expected: FAIL — `module 'release' has no attribute 'read_manifest_version'`.

- [ ] **Step 3: Implement manifest read/write in `release.py`**

In `scripts/release_tool/release.py`: keep the imports/SemVer helpers. Add `import json` is **not** required (regex-based to preserve formatting). Remove `_POM_VERSION_RE`, `read_pom_version`, `set_pom_version`. Add:

```python
# Matches the top-level "version": "x.y.z" line in package.json (first occurrence),
# rewriting only the value so the file's formatting is preserved exactly.
_VERSION_LINE_RE = re.compile(r'(^\s*"version"\s*:\s*")([^"]*)(")', re.MULTILINE)


def read_manifest_version(manifest_path: str | Path) -> str:
    """Return the top-level "version" from package.json; raise if absent."""
    text = Path(manifest_path).read_text(encoding="utf-8")
    m = _VERSION_LINE_RE.search(text)
    if not m:
        raise ValueError(f'could not find "version" in {manifest_path}')
    return m.group(2).strip()


def set_manifest_version(manifest_path: str | Path, new_version: str) -> None:
    manifest_path = Path(manifest_path)
    text = manifest_path.read_text(encoding="utf-8")
    new_text, n = _VERSION_LINE_RE.subn(
        lambda m: f"{m.group(1)}{new_version}{m.group(3)}", text, count=1
    )
    if n != 1:
        raise ValueError(f'could not rewrite "version" in {manifest_path}')
    manifest_path.write_text(new_text, encoding="utf-8")
```

Update the module docstring's "pom.xml" references to "package.json".

- [ ] **Step 4: Run tests to confirm they pass**

Run: `.venv/bin/pytest scripts/release_tool/tests/test_release.py -q`
Expected: PASS.

- [ ] **Step 5: Update the CLI**

In `scripts/release_tool/release_cli.py`: replace `--pom` (default `pom.xml`) with `--manifest` (default `package.json`); `args.pom` → `args.manifest`; `release.read_pom_version` → `release.read_manifest_version`; `release.set_pom_version` → `release.set_manifest_version`. Update help strings ("pom"→"package.json"). The `current`/`bump`/`verify` command structure and `_git_tags()` are unchanged.

- [ ] **Step 6: Update the CLI tests**

In `tests/test_release_cli.py`: replace `_pom` with the `_manifest` helper from Step 1, change `--pom` to `--manifest`, and `read_pom_version`→`read_manifest_version`. The bump/verify scenarios (tags via `monkeypatch.setattr(release_cli, "_git_tags", ...)`) are otherwise unchanged.

- [ ] **Step 7: Create the `bump-version` launcher**

`scripts/bump-version`:

```bash
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PY="${HERE}/../.venv/bin/python"
if [[ -x "${VENV_PY}" ]]; then
  PY="${VENV_PY}"
else
  PY="python3"
fi
exec "${PY}" "${HERE}/release_tool/release_cli.py" "$@"
```

Then `chmod +x scripts/bump-version`.

- [ ] **Step 8: Verify the full doc-tooling suite + CLI end to end**

```bash
.venv/bin/pytest
./scripts/bump-version current
```

Expected: full `pytest` passes at ≥80%; `bump-version current` prints the version from `package.json` (e.g. `0.0.0`).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: retarget release tooling from pom.xml to package.json"
```

---

### Task 6: Scaffold the ADR and reference-doc systems

**Files:**
- Create (copy): `docs/adrs/{_template.md,_tags.md,README.md}`, `docs/reference/{_template.md,_tags.md,README.md}`

**Interfaces:**
- Consumes: Task 4 (the `adr`/`ref` CLIs).
- Produces: a valid empty ADR/reference system. Task 7 authors ADRs into it.

- [ ] **Step 1: Copy the scaffolding (no content docs)**

```bash
SRC=/Users/steventimothy/workspace/zarlania-api
mkdir -p docs/adrs docs/reference
cp "$SRC/docs/adrs/_template.md" "$SRC/docs/adrs/_tags.md" "$SRC/docs/adrs/README.md" docs/adrs/
cp "$SRC/docs/reference/_template.md" "$SRC/docs/reference/_tags.md" "$SRC/docs/reference/README.md" docs/reference/
```

- [ ] **Step 2: Retarget any API-specific copy**

Open the copied `docs/adrs/README.md` and `docs/reference/README.md`; replace `zarlania-api`/backend/`api.zarlania.com` references with `zarlania-app`/frontend/`zarlania.com`. Leave the `_template.md`/`_tags.md` structure intact.

- [ ] **Step 3: Validate**

Run: `./scripts/adr check && ./scripts/ref check`
Expected: both pass (empty index is valid).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: scaffold ADR and reference-doc systems"
```

---

### Task 7: Author ADRs 0001–0007

**Files:**
- Create: `docs/adrs/0001-record-architecture-decisions.md` … `docs/adrs/0007-record-explanatory-reference-docs-as-numbered-living-guides.md`
- Modify: `docs/adrs/_tags.md` (as the tooling requires)

**Interfaces:**
- Consumes: Tasks 4 + 6.
- Produces: seven accepted ADRs. CLAUDE.md (Task 13) references 0001.

For each ADR below, use the `adr-create` skill (or `./scripts/adr new`) so numbering/tags/format match the tooling, then fill the body. Apply the **ADR version-wording rule** wherever a version is mentioned.

- [ ] **Step 1: 0001 — Record architecture decisions**

Port `../zarlania-api/docs/adrs/0001-record-architecture-decisions.md` near-verbatim (it is the meta-ADR; adjust repo name only).

- [ ] **Step 2: 0002 — Adopt Angular, npm, and nginx-on-Docker for the frontend**

Decision: build the frontend with Angular + TypeScript, manage deps with npm, and serve the production build as static files via nginx in a multi-stage Docker image listening on `$PORT`. Context: SPA for the Zarlania product consuming `zarlania-api`. Include the explicit version-agnostic clause: "Concrete versions (Angular, TypeScript, Node, etc.) live in `package.json`/`Dockerfile` and are bumped routinely via Dependabot and `ng update`; a version bump — including a major — never requires a new ADR. Only changing the framework *choice* does." Reference ADR-0003 for deploy.

- [ ] **Step 3: 0003 — Deploy on Render as code using Docker**

Decision: deploy via `render.yaml` (infra-as-code), Docker runtime, `autoDeploy` from `master`, healthcheck `/`. Derive from API ADR-0005; remove backend specifics (no actuator). Note every merge to `master` ships to production.

- [ ] **Step 4: 0004 — Enforce code quality and security gates**

Decision: ESLint (angular-eslint) + Prettier, Jest with a ≥80% coverage gate, gitleaks secret scanning, markdownlint/yamllint/shellcheck/shfmt, all wired through pre-commit and enforced in CI; don't silence gates to go green. Derive from API ADR-0007.

- [ ] **Step 5: 0005 — Require issue-driven contribution workflow**

Decision: every change ties to a GitHub issue; branch `type/<issue#>-slug`; PR title references `#<issue>`; CI enforces it (Dependabot exempt). Port from API ADR-0008.

- [ ] **Step 6: 0006 — Release every merge via in-PR SemVer bump**

Decision: each merge to `master` cuts exactly one SemVer release; the version lives in `package.json` and is bumped inside the PR via `./scripts/bump-version` selected by the `release:{major,minor,patch}` label; `release-check.yml` verifies it; `release.yml` tags `v<version>` on merge. Derive from API ADR-0009 (s/pom.xml/package.json/).

- [ ] **Step 7: 0007 — Record explanatory reference docs as numbered living guides**

Decision: `docs/reference/` holds living explanatory docs, distinct from ADRs (immutable) and `docs/superpowers/` (implementation-time). Port from API ADR-0013.

- [ ] **Step 8: Validate and commit**

Run: `./scripts/adr check`
Expected: passes; `./scripts/adr list` shows 0001–0007.

```bash
git add -A
git commit -m "docs: add ADRs 0001-0007 establishing repo architecture decisions"
```

---

### Task 8: Lint configs, pre-commit, and helper scripts

**Files:**
- Create (copy): `.markdownlint.yaml`, `.markdownlintignore`, `.yamllint.yaml`
- Create (re-author): `.pre-commit-config.yaml`, `scripts/setup-dev`, `scripts/check`

**Interfaces:**
- Consumes: Tasks 3 (`npm run lint`), 4 (`adr`/`ref` check), 5 (`bump-version`).
- Produces: a passing `pre-commit run --all-files`; `./scripts/setup-dev` and `./scripts/check`.

- [ ] **Step 1: Copy the lint configs**

```bash
SRC=/Users/steventimothy/workspace/zarlania-api
cp "$SRC/.markdownlint.yaml" "$SRC/.markdownlintignore" "$SRC/.yamllint.yaml" .
```

- [ ] **Step 2: Author `.pre-commit-config.yaml`**

Start from `$SRC/.pre-commit-config.yaml`. Keep: the `exclude: '^docs/(superpowers|ai-prompts)/'`, the pre-commit-hooks block, gitleaks, ruff + ruff-format, markdownlint, shfmt (`exclude: ^mvnw$` is irrelevant here — drop it), shellcheck, yamllint, and the local `adr-check`/`ref-check` hooks. **Remove** the `java-quality` hook. **Add** a local frontend hook:

```yaml
      - id: frontend-lint
        name: ESLint + Prettier (frontend)
        entry: npm run lint
        language: system
        files: '\.(ts|html|scss|css|json)$'
        pass_filenames: false
```

- [ ] **Step 3: Re-author `scripts/setup-dev`**

Copy `$SRC/scripts/setup-dev` and replace the Java toolchain check with a Node/npm one:

```bash
echo "==> Verifying Node toolchain and installing npm deps"
if ! node -v >/dev/null 2>&1; then
  echo "WARNING: node not found — Node 24 is required for the frontend gates." >&2
else
  npm ci
fi
```

Keep the venv + `requirements-dev.txt` + `pre-commit install` steps. `chmod +x scripts/setup-dev`.

- [ ] **Step 4: Re-author `scripts/check`**

Copy `$SRC/scripts/check`; replace the `--full` Maven block with:

```bash
if [[ "${FULL}" -eq 1 ]]; then
  echo "==> Running full frontend verify (lint + tests + build)"
  npm run lint && npm run test:ci && npm run build
fi
```

`chmod +x scripts/check`.

- [ ] **Step 5: Install hooks and run everything**

```bash
.venv/bin/pre-commit install
.venv/bin/pre-commit run --all-files --show-diff-on-failure
```

Expected: all hooks pass. Fix any reported issues (formatting, markdownlint) and re-run until green.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "build: add lint configs, pre-commit, and dev helper scripts"
```

---

### Task 9: Governance docs

**Files:**
- Create (copy + light edit): `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the standard community docs referenced by `.github` and CLAUDE.md.

- [ ] **Step 1: Copy and retarget**

```bash
SRC=/Users/steventimothy/workspace/zarlania-api
cp "$SRC/CODE_OF_CONDUCT.md" "$SRC/CONTRIBUTING.md" "$SRC/SECURITY.md" "$SRC/SUPPORT.md" .
```

Then edit each: replace `zarlania-api`→`zarlania-app`, "API"/backend→"app"/frontend, `api.zarlania.com`→`zarlania.com`, and any Maven/Java build instructions in `CONTRIBUTING.md` with the npm equivalents (`npm ci`, `npm run lint`, `npm run test:ci`, `npm run build`, `./scripts/check`).

- [ ] **Step 2: Lint the docs**

Run: `.venv/bin/pre-commit run markdownlint --all-files`
Expected: passes (fix any wrapping/heading issues).

- [ ] **Step 3: Commit**

```bash
git add CODE_OF_CONDUCT.md CONTRIBUTING.md SECURITY.md SUPPORT.md
git commit -m "docs: add governance docs (conduct, contributing, security, support)"
```

---

### Task 10: `.github` templates and Dependabot

**Files:**
- Create (copy): `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/{bug_report.yml,feature_request.yml,chore.yml,config.yml}`
- Create (re-author): `.github/dependabot.yml`

**Interfaces:**
- Consumes: nothing.
- Produces: PR/issue templates and Dependabot config. CI governance (Task 12) references the issue workflow these support.

- [ ] **Step 1: Copy templates**

```bash
SRC=/Users/steventimothy/workspace/zarlania-api
mkdir -p .github/ISSUE_TEMPLATE
cp "$SRC/.github/CODEOWNERS" "$SRC/.github/PULL_REQUEST_TEMPLATE.md" .github/
cp "$SRC"/.github/ISSUE_TEMPLATE/*.yml .github/ISSUE_TEMPLATE/
```

Edit `CODEOWNERS`/templates for any repo-name references.

- [ ] **Step 2: Author `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
  - package-ecosystem: pip
    directory: "/"
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
  - package-ecosystem: docker
    directory: "/"
    schedule:
      interval: weekly
```

- [ ] **Step 3: Validate YAML**

Run: `.venv/bin/pre-commit run yamllint check-yaml --all-files`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add .github
git commit -m "ci: add issue/PR templates, CODEOWNERS, and Dependabot config"
```

---

### Task 11: `render.yaml` and Dockerfile Node bump

**Files:**
- Create: `render.yaml`
- Modify: `Dockerfile`

**Interfaces:**
- Consumes: Task 1 (working `npm run build`).
- Produces: deploy-as-code config + a Node 24 build image.

- [ ] **Step 1: Bump the Docker build stage to Node 24**

In `Dockerfile`, change `FROM node:20-alpine AS build` → `FROM node:24-alpine AS build`. Leave the nginx stage and `dist/zarlania-app/browser` copy path as-is (verify the path matches Task 1's build output).

- [ ] **Step 2: Author `render.yaml`**

```yaml
services:
  - type: web
    name: zarlania-app
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    region: oregon
    branch: master
    healthCheckPath: /
    autoDeploy: true
```

- [ ] **Step 3: Build the image locally**

Run: `docker build -t zarlania-app:test .`
Expected: build succeeds through both stages.

- [ ] **Step 4: Smoke-test the container**

```bash
docker run --rm -e PORT=8080 -p 8080:8080 -d --name zt zarlania-app:test
sleep 2 && curl -fsS http://localhost:8080/ >/dev/null && echo OK
docker stop zt
```

Expected: `OK` (nginx serves `index.html` on `$PORT`).

- [ ] **Step 5: Commit**

```bash
git add render.yaml Dockerfile
git commit -m "ci: add Render deploy config and bump Docker build to Node 24"
```

---

### Task 12: CI workflows

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/release-check.yml`, `.github/workflows/release.yml`

**Interfaces:**
- Consumes: Tasks 2 (`test:ci`), 3 (`lint`), 4 (pytest), 5 (`release_cli`), 8 (pre-commit). 
- Produces: PR gates + release automation.

- [ ] **Step 1: Author `ci.yml`**

Start from `$SRC/.github/workflows/ci.yml`. Keep the `checks` (Python tooling + pre-commit), `secrets` (gitleaks), and `governance` (issue reference) jobs verbatim, except the `checks` lint step skips the frontend hook (`SKIP=frontend-lint pre-commit run --all-files`) since the frontend job runs lint directly. **Replace** the Maven `build` + `transactional-tests` jobs with one `frontend` job:

```yaml
  frontend:
    name: Lint, test & build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write # coverage comment
    steps:
      - uses: actions/checkout@<sha> # copy SHA from API ci.yml
        with:
          persist-credentials: false
      - uses: actions/setup-node@<sha>
        with:
          node-version: "24"
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:ci
      - run: npm run build
      - name: Coverage PR comment
        if: ${{ !cancelled() && github.event_name == 'pull_request' && hashFiles('coverage/cobertura-coverage.xml') != '' }}
        uses: 5monkeys/cobertura-action@<sha> # same action+SHA the API uses
        with:
          path: coverage/cobertura-coverage.xml
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          minimum_coverage: 80
          fail_below_threshold: false
          only_changed_files: false
          report_name: Frontend Coverage
```

Pin every action to the SHA used in `$SRC/.github/workflows/ci.yml`. Keep `permissions: contents: read` at top level.

- [ ] **Step 2: Author `release-check.yml`**

Copy `$SRC/.github/workflows/release-check.yml` verbatim, changing only the final verify step to:

```yaml
      - name: Verify package.json version matches the bump
        run: python scripts/release_tool/release_cli.py verify "${{ steps.bump.outputs.kind }}"
```

(The CLI default `--manifest package.json` needs no flag.)

- [ ] **Step 3: Author `release.yml`**

Copy `$SRC/.github/workflows/release.yml`; change the version-read step to read from `package.json` via `python scripts/release_tool/release_cli.py current` (or `node -p "require('./package.json').version"`), then tag `v<version>` and cut the GitHub Release exactly as the API does. Keep the trigger (`push` to `master`) and permissions.

- [ ] **Step 4: Validate workflow YAML locally**

Run: `.venv/bin/pre-commit run yamllint check-yaml --files .github/workflows/*.yml`
Expected: passes. (Full CI behavior is verified once the PR is opened.)

- [ ] **Step 5: Commit**

```bash
git add .github/workflows
git commit -m "ci: add frontend CI, release-check, and release workflows"
```

---

### Task 13: `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: all prior tasks (it documents them).
- Produces: the AI entry point.

- [ ] **Step 1: Author `CLAUDE.md` from the API's, retargeted**

Start from `$SRC/CLAUDE.md`. Keep the structure and these sections verbatim in spirit: the production-live warning (→ `https://zarlania.com`), Non-negotiables (secrets / ADRs-are-law / issue-per-change), Code quality & structure (DRY/SOLID, test-first, fail-fast, lean deps, feature-first organization — reframed for Angular: components/services/feature modules rather than Java packages), Releases (version in `package.json`, `./scripts/bump-version`, `release:*` labels), Working with ADRs / reference docs (same `./scripts/adr` + `./scripts/ref` CLIs), the specs-and-plans-are-not-law section, and the `docs/ai-prompts/` policy. Replace the **Stack** section with: "Angular 22 / TypeScript 6 / npm / multi-stage Node-24 + nginx Docker. See ADR-0002." Replace Java coverage/gate references with "ESLint + Prettier, Jest ≥80%, pre-commit; see ADR-0004."

- [ ] **Step 2: Lint**

Run: `.venv/bin/pre-commit run markdownlint --files CLAUDE.md`
Expected: passes.

- [ ] **Step 3: Final full verification**

```bash
.venv/bin/pre-commit run --all-files
.venv/bin/pytest
npm run lint && npm run test:ci && npm run build
./scripts/adr check && ./scripts/ref check
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md AI entry point for the frontend repo"
```

---

## Final acceptance (verify before opening the PR)

- [ ] `npm ci && npm run lint && npm run test:ci && npm run build` pass on Node 24; Jest enforces ≥80%.
- [ ] `.venv/bin/pytest` passes at ≥80% (incl. `release_tool` against `package.json`).
- [ ] `.venv/bin/pre-commit run --all-files` passes (no `java-quality`; `frontend-lint` present).
- [ ] `./scripts/bump-version current` reads `package.json`; `./scripts/adr check` and `./scripts/ref check` pass; ADRs 0001–0007 exist.
- [ ] `docker build .` succeeds and the container serves `/` on `$PORT`.
- [ ] `render.yaml` present with `healthCheckPath: /`; `Dockerfile` builds on `node:24-alpine`.
- [ ] Governance docs, `.github` templates, dependabot, and three workflows present.
- [ ] App still serves the unchanged hello-world POC.
- [ ] **Deferred (not in this plan):** Storybook (no Angular 22 support yet); a backend-API-consumption ADR; reference-doc content.
