---
id: '0005'
name: Require issue-driven contribution workflow
description: Issue-driven branches/PRs enforced in CI, with templates, CODEOWNERS,
  and branch protection on master.
status: accepted
date_proposed: '2026-06-29'
date_accepted: '2026-06-29'
date_invalidated: null
author: stimothy
supersedes: []
superseded_by: []
tags:
- governance
- process
---
# ADR-0005: Require issue-driven contribution workflow

<!-- adr-meta:start -->
| Field | Value |
| --- | --- |
| ID | 0005 |
| Name | Require issue-driven contribution workflow |
| Description | Issue-driven branches/PRs enforced in CI, with templates, CODEOWNERS, and branch protection on master. |
| Status | accepted |
| Date proposed | 2026-06-29 |
| Date accepted | 2026-06-29 |
| Date invalidated | — |
| Author | stimothy |
| Supersedes | — |
| Superseded by | — |
| Tags | governance, process |
<!-- adr-meta:end -->

## Context and Problem Statement

`master` deploys to production, so every change must be traceable to an issue, reviewed,
and gated. The workflow must be enforced, not merely documented.

## Decision Drivers

- Traceability: every change ties to a GitHub issue.
- Consistent branch/PR naming that tooling can parse.
- Owner review and protected `master` before anything ships.

## Considered Options

- Issue-driven workflow enforced by a CI governance check (chosen).
- Convention-by-documentation only (not enforced).

## Decision Outcome

Chosen: **issue-driven workflow.** Branches are `type/<issue#>-slug`; PR titles
reference `#<issue>`; a CI "governance" job fails any human PR that references no issue
(Dependabot exempt). Issue templates (bug/feature/chore) and a PR template carry the
issue-ref, release-label, ADR, and secrets checklists. `CODEOWNERS` is `* @stimothy`.
`master` is protected (require PR, passing checks, 1 codeowner approval, no direct
pushes) — configured manually in GitHub and documented in `README.md`/`CONTRIBUTING.md`.

### Consequences

- Good: every change is traceable, reviewed, and gated; branch naming is
  machine-checkable.
- Bad: branch protection is manual GitHub state, not code — it must be kept in sync by
  hand.

## Links

- `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`,
  `.github/CODEOWNERS`, `CONTRIBUTING.md`
