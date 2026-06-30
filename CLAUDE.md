# CLAUDE.md — Zarlania App

AI entry point for this repo. **This is a live, public service: merges to `master`
deploy to production at <https://zarlania.com>.** Work carefully.

## Non-negotiables

- **Never commit secrets.** No credentials, tokens, or keys in any commit. Secrets live
  only in Render environment variables and local `.env` (git-ignored).
- **ADRs are law.** Code may not contradict an accepted ADR without a new ADR that
  supersedes it. See `docs/adrs/0001-record-architecture-decisions.md`.
- **Every change ties to a GitHub issue.** Branch `type/<issue#>-slug`; PR title
  references `#<issue>`.

## Stack

Angular 22 / TypeScript 6 / npm / multi-stage Node-24 + nginx Docker serving the
static bundle on `$PORT`. For the stack and version-adoption rationale see ADR-0002
(`./scripts/adr show 0002`).

## Code quality & structure

Keep this codebase clean as it grows from scaffolding into real features. These are
judgment-level rules; formatting, style, and the ≥ 80% coverage floor are already enforced by
the build — don't restate them, and never silence them (see below). See ADR-0004.

- Practice **DRY** and **SOLID**. Prefer small, single-responsibility units; refactor
  duplication instead of copying it.
- **Tests prove behavior.** Write the test first; assert observable behavior through the
  public surface, not mock interactions or internals. The ≥ 80% coverage gate measures
  quantity — it does not prove a test is meaningful.
- **Fail fast; prefer immutability.** Validate configuration and external input at the
  boundary and fail early. Prefer immutable data, signals, and constructor-injected
  services over mutable state.
- **Don't silence the gates to go green.** Fix the root cause rather than adding ESLint
  disable comments, skipped tests, or a lowered coverage threshold. A genuine tool bug
  gets a documented exception — an issue plus a compensating test.
- **Keep dependencies lean.** Prefer Angular and the standard library before reaching for
  a new package. A new major dependency (or other architecturally significant choice) is
  an ADR, not a casual `npm install`.
- **Organize by feature first.** Each feature owns its directory and contains its
  component, template, styles, and spec co-located. Use standalone components and
  inject services at the appropriate scope. Keep cross-cutting concerns (shared UI
  primitives, core services, interceptors, guards) in their own dedicated areas rather
  than scattered at the app root. Prefer signals and `OnPush` change detection; embrace
  reactive patterns (RxJS observables for async, signals for derived state).
- This is intent, not a rigid tree: use judgment, follow the established structure once it
  exists, and don't over-engineer (YAGNI).

## Releases (every merge ships)

Every merge to `master` cuts exactly one SemVer release. The version lives in
`package.json` `"version"` and is bumped **inside the PR** (never after merge — that
would double-deploy). See ADR-0006 (`./scripts/adr show 0006`).

When opening a PR:

1. Choose the bump from the change: breaking = `major`, feature = `minor`, fix/chore =
   `patch`. Apply the matching `release:<kind>` label (no label = `patch`).
2. Run `./scripts/bump-version bump <kind>` to set `package.json` to the next version.
3. CI's "Release version bump" check verifies the version matches the label vs. the latest
   release tag; on merge, `release.yml` tags `v<version>` and cuts the GitHub Release.

## Working with ADRs (save tokens)

To find an ADR or check whether a decision exists, **use the `adr-search` skill / the
CLI — do not scan `docs/adrs/` by hand**:

- `./scripts/adr list` / `./scripts/adr find "<query>"` / `./scripts/adr show <id>`

To create one, use the `adr-create` skill. For tags, use `adr-tags`. Run
`./scripts/adr check` after any ADR change.

## Working with reference docs

`docs/reference/` holds **living explanatory docs** — how the system behaves — distinct from
ADRs (immutable decisions) and `docs/superpowers/` (implementation-time specs/plans). They
are editable and updated in place; see ADR-0007.

Use the CLI — **do not hand-scan `docs/reference/`**:

- `./scripts/ref list` / `./scripts/ref find "<query>"` / `./scripts/ref show <id>`
- `./scripts/ref new --title "<title>" --tags <t1,t2>` to author one; `./scripts/ref check`
  after any change.

Decide when to consult or author a reference doc as the situation warrants. No content lives
in CLAUDE.md.

When a change alters documented behavior, update the relevant reference doc (or author a new
one) **as part of that change** — reference docs are living and must not drift from the code.

Reference docs document **behavior and rules**, not implementation contracts. Do not duplicate
Angular component APIs, service signatures, or other in-code documentation in a reference doc.

## Specs and plans are implementation-time only — not law

`docs/superpowers/` holds specs and plans. They guide a change **while it is being built**:
during implementation, and during the spec review of that same change, follow the spec/plan
relevant to the work in progress so nothing is missed. This is the normal flow
(brainstorm → spec → plan → implement → review the work against that plan's spec) and this
rule does not change it.

Once a change is merged to `master`, its spec and plan become **historical record only** —
not law, and not a standard to code against. The authoritative sources are the **ADRs and
the actual code**. Concretely:

- When implementing or reviewing change B, do **not** flag it for diverging from an earlier
  change A's spec or plan — those are frozen history. Judge B against the ADRs, the code,
  and B's own spec/plan.
- Dismiss any review comment that asks to edit a spec or plan file to match the code. Once
  merged they are not living documents. If a decision actually changed, that is a **new
  ADR**, not a spec edit.

## AI prompt scratch files (`docs/ai-prompts/`)

`docs/ai-prompts/` is the user's private scratchpad: `.md` files the **user** writes to
draft prompts outside the terminal, then hands to the Claude CLI to read on demand. The
directory is **git-ignored** (see `.gitignore`) and exempt from all linters/hooks (see
`.pre-commit-config.yaml`) — it never gets committed.

Treat these files as **input you read only when the user explicitly points you at one**.
They are **not** documentation, decision records, specs, or law — they say nothing about how
the code should function. Concretely:

- **Never** consult `docs/ai-prompts/` when investigating the codebase, answering questions
  about how things work, or reviewing/implementing changes. The authoritative sources remain
  the ADRs and the code.
- **Never** reference these files from code, ADRs, README, or any committed file, and never
  cite them as a reason for a change.
- Read one only when the user names it (e.g. "use `docs/ai-prompts/foo.md`"); otherwise
  ignore the directory entirely.
