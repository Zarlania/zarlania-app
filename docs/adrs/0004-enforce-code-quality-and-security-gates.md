---
id: '0004'
name: Enforce code quality and security gates
description: ESLint + Prettier, Jest with a coverage gate, gitleaks secret scanning,
  and prose/shell linters — wired through pre-commit and enforced in CI.
status: accepted
date_proposed: '2026-06-29'
date_accepted: '2026-06-29'
date_invalidated: null
author: stimothy
supersedes: []
superseded_by: []
tags:
- quality
- security
---
# ADR-0004: Enforce code quality and security gates

<!-- adr-meta:start -->
| Field | Value |
| --- | --- |
| ID | 0004 |
| Name | Enforce code quality and security gates |
| Description | ESLint + Prettier, Jest with a coverage gate, gitleaks secret scanning, and prose/shell linters — wired through pre-commit and enforced in CI. |
| Status | accepted |
| Date proposed | 2026-06-29 |
| Date accepted | 2026-06-29 |
| Date invalidated | — |
| Author | stimothy |
| Supersedes | — |
| Superseded by | — |
| Tags | quality, security |
<!-- adr-meta:end -->

## Context and Problem Statement

Every change to a live public service must pass consistent format, lint, static-analysis,
security, and coverage gates — with fast feedback locally and full enforcement in CI
before merge.

## Decision Drivers

- Fast pre-commit hooks (no compilation/tests) so commits stay cheap.
- Authoritative, comprehensive gates in CI before merge/deploy.
- Secrets can never land in a commit.
- One coverage bar for all TypeScript code; gates must never be silenced to go green.

## Considered Options

- ESLint + Prettier + Jest + gitleaks + prose/shell linters in pre-commit/CI split
  (chosen).
- Run everything in pre-commit (too slow; blocks commits on full test suite).
- CI-only (loses fast local feedback).

## Decision Outcome

Chosen gates:

- **Pre-commit (fast, no compilation):** Prettier (formatting), ESLint with
  angular-eslint (lint), gitleaks (secret scanning), markdownlint, yamllint,
  shellcheck/shfmt, `./scripts/adr check`, and hygiene hooks. These run on every
  commit via pre-commit.
- **CI (full enforcement):** All pre-commit hooks (`pre-commit run --all-files`) plus
  Jest with a **≥ 80% line and branch coverage gate**. CI posts coverage results
  inline. Gitleaks also scans the PR commit range in CI.

Gates are never disabled or lowered to make a build go green. The coverage bar is a
floor, not a target.

### Consequences

- Good: fast local loop; strong CI enforcement; secrets blocked at two layers
  (pre-commit staging and CI PR-range scan); coverage visible in CI before merge.
- Bad: coverage-bound tests only surface in CI (slower feedback for those); linter
  configs must be kept current as Angular ESLint evolves.

## Links

- ADR-0002: Angular + TypeScript stack (`package.json`)
- `.pre-commit-config.yaml`, `.github/workflows/ci.yml`
