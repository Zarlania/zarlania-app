# Contributing to zarlania-app

Thanks for your interest in contributing. This document describes how to get set
up and the rules that CI enforces.

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## The one rule that surprises people

**Every change must be tracked by an issue, and the issue number must appear in
both the branch name and the pull request title.** The `PR Lint` workflow fails
the build otherwise. This keeps the history traceable back to a stated reason for
each change.

| Thing    | Format                                | Example                         |
| -------- | ------------------------------------- | ------------------------------- |
| Branch   | `<issue-number>-<slug>`               | `42-add-collection-list`        |
| PR title | `#<issue-number> <type>: <desc>`      | `#42 feat: add collection list` |
| PR body  | must contain `Closes #<issue-number>` | `Closes #42`                    |

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`,
`build`, `ci`, `style`, `revert`.

The issue must exist and be open, and all three references must point at the same
issue number.

> Tip: on any issue page, use **Create a branch** in the sidebar. GitHub generates
> a correctly formatted branch name for you.

## Workflow

1. **Find or open an issue.** Use the [issue templates](https://github.com/Zarlania/zarlania-app/issues/new/choose)
   — bug report, feature request, or chore. Keep the title prefix the template
   gives you (`bug:`, `feat:`, `chore:`), answer every section it asks for
   instead of replacing them with freeform prose, and leave the labels it
   applies in place. Creating an issue with `gh issue create` or the API skips
   the template entirely, so write the body to match it by hand. For open-ended
   ideas, start a [discussion](https://github.com/Zarlania/zarlania-app/discussions)
   instead.
2. **Branch off `master`**, naming the branch after the issue.

   ```bash
   git switch master && git pull
   git switch -c 42-add-collection-list
   ```

3. **Make the change**, with tests.
4. **Verify locally** — see below.
5. **Open a pull request** against `master` using the required title format.
6. **Apply a version label** — `major`, `minor` or `patch`. This determines the
   version number of the release your merge produces. Without one it defaults to
   a patch bump.
7. **Address review feedback.** Once approved and green, a maintainer merges.

Direct pushes to `master` are not part of the workflow — all changes go through a
pull request.

## Local setup

Requires Node 24 (see `.nvmrc`).

```bash
git clone https://github.com/Zarlania/zarlania-app.git
cd zarlania-app
nvm use
npm install
npm run dev
```

`npm install` also installs the git pre-commit hook via husky, which lints,
formats, and secret-scans your staged files.

## Before you push

```bash
npm run verify
```

That runs the type checker, linter, format check, and tests — exactly what CI
runs. If it passes locally it should pass in CI.

To fix problems automatically:

```bash
npm run lint:fix
npm run format
```

## Testing and coverage

Tests use [Vitest](https://vitest.dev/) and
[Testing Library](https://testing-library.com/), and live next to the code they
cover (`Foo.tsx` beside `Foo.test.tsx`).

**Coverage must stay at or above 80%** for lines, functions, branches, and
statements. Thresholds are set in `vite.config.ts`; `npm run test:coverage` fails
below them, and every pull request gets a coverage comment.

Query by accessible role or label rather than test IDs:

```tsx
// Good — asserts on what a user perceives.
screen.getByRole('button', { name: /save collection/i })

// Avoid — couples the test to implementation details.
screen.getByTestId('save-btn')
```

## Storybook

Components are developed in [Storybook](https://storybook.js.org/):

```bash
npm run storybook
```

Stories live beside their component (`Foo.tsx` beside `Foo.stories.tsx`).
**Every new component should ship with a story** — it is the fastest way for a
reviewer to see the component in isolation, and the a11y addon surfaces
accessibility problems while you work. CI builds Storybook on every pull request.

Stories are excluded from coverage; they are documentation, verified by the build
rather than by unit tests.

## Code standards

Formatting and linting are handled by Prettier and ESLint, so there is no need to
discuss them in review. Beyond that, this project holds itself to a few
principles — the full version, with examples, is in [CLAUDE.md](CLAUDE.md).

**Legibility.** Code should be understandable in isolation. Names state intent, no
magic values, comments explain _why_ rather than _what_, files stay small and
focused, and types are explicit. `any` is not used — prefer `unknown` and narrow.

**DRY.** Extract duplicated logic into a function, hook, or component. But wait
for the third occurrence: a wrong abstraction is more expensive to unwind than a
little duplication.

**SOLID**, applied to React:

- _Single responsibility_ — a component renders UI or orchestrates logic, not
  both. Push data fetching and derived state into custom hooks.
- _Open/closed_ — extend through props and composition, not by adding another
  branch to an existing component.
- _Liskov substitution_ — components sharing an interface stay interchangeable.
- _Interface segregation_ — props are the narrow set the component actually uses.
- _Dependency inversion_ — depend on abstractions; API access lives behind a
  module so components are testable without stubbing the network.

## Commit messages

Individual commits are not linted — the pull request title is what matters, since
pull requests are squash-merged and the title becomes the commit message and the
release-note entry.

## Reporting security issues

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## Questions

Open a [discussion](https://github.com/Zarlania/zarlania-app/discussions) or see
[SUPPORT.md](SUPPORT.md).
