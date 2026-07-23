# CLAUDE.md

Guidance for AI coding agents working in this repository. This file is the
canonical set of agent instructions; `AGENTS.md` points here.

## What this is

`zarlania-app` is the open-source web client for Zarlania — a React single-page
application written in TypeScript. The backend lives in a separate repository,
[Zarlania/zarlania-api](https://github.com/Zarlania/zarlania-api).

> **Status: early scaffolding.** The app renders a single hello-world page. There
> is no routing, state management, or API integration yet.
>
> **PLACEHOLDER — expand as the project takes shape:** routing structure, state
> management approach, API client and error-handling conventions, design system
> and component library, authentication flow, and internationalisation.

## Stack

| Concern    | Choice                                          |
| ---------- | ----------------------------------------------- |
| Language   | TypeScript 6                                    |
| Framework  | React 19                                        |
| Build      | Vite 8                                          |
| Testing    | Vitest and Testing Library, 80% coverage floor  |
| Docs/UI    | Storybook 10, with the a11y addon               |
| Linting    | ESLint (flat config)                            |
| Formatting | Prettier                                        |
| Container  | Docker, with Compose for local development      |
| Hosting    | Render Static Site, configured in `render.yaml` |

## Commands

| Command                   | Purpose                                                                           |
| ------------------------- | --------------------------------------------------------------------------------- |
| `npm run verify`          | Type check, lint, format check, and test with coverage. **This is what CI runs.** |
| `npm run dev`             | Dev server with hot reload on port 5173.                                          |
| `npm test`                | Tests once, without the coverage gate.                                            |
| `npm run test:coverage`   | Tests with coverage; fails below 80%.                                             |
| `npm run lint:fix`        | Fix auto-fixable lint problems.                                                   |
| `npm run format`          | Format with Prettier. Run before committing.                                      |
| `npm run build`           | Type check and build to `dist/`.                                                  |
| `npm run storybook`       | Component workshop on port 6006.                                                  |
| `npm run build-storybook` | Static Storybook build. CI runs this on every PR.                                 |

Run `npm run verify` before declaring any change complete.

## Layout

```text
src/
  main.tsx          Entry point; mounts <App /> into #root
  App.tsx           Root component
  App.test.tsx      Tests, colocated with the component they cover
  App.stories.tsx   Storybook stories, colocated with the component
  index.css         Design tokens and global styles
  test/setup.ts     Vitest setup
.storybook/         Storybook configuration
public/             Static assets copied verbatim into the build
```

Tests and stories are colocated with the code they cover — `Foo.tsx` sits next to
`Foo.test.tsx` and `Foo.stories.tsx`, not in parallel `__tests__` or `stories`
trees.

## Engineering principles

These are the standards this repository holds itself to. Code that violates them
should be fixed, not extended.

### Legible to both humans and agents

Someone — person or model — should be able to open a file and understand it
without reading the rest of the codebase.

- **Names state intent.** `isLoadingCollections`, not `flag`. `fetchCollection`,
  not `doIt`. A name that needs a comment to explain it is the wrong name.
- **No magic values.** Extract literals to named constants near the top of the
  module or into a `constants.ts`.
- **Comments explain _why_, never _what_.** The code already says what it does.
  Comment the non-obvious constraint, trade-off, or reason a simpler approach
  does not work.
- **Keep files small and focused.** A component file past roughly 200 lines is a
  signal to split. One exported component per file.
- **Types are documentation.** Prefer explicit prop and return types. Never
  reach for `any` — use `unknown` and narrow it.
- **Shallow control flow.** Prefer early returns over nested conditionals.

### DRY — do not repeat yourself

- Extract duplicated logic into a named function, a custom hook, or a shared
  component. Duplicated _knowledge_ is the problem, not duplicated characters.
- **Wait for the third occurrence.** Two similar-looking blocks are often
  coincidence; abstracting them prematurely creates a wrong abstraction that is
  harder to unwind than the duplication was. A wrong abstraction costs more than
  a little repetition.
- Configuration, constants, and types have exactly one home. If a value must
  match something in `zarlania-api`, comment the coupling at both ends.

### SOLID

Applied to React and TypeScript rather than classes:

- **Single responsibility.** A component either renders UI or orchestrates
  logic — not both. Push data fetching, subscriptions, and derived state into
  custom hooks so the component body stays declarative.
- **Open/closed.** Extend behaviour through props, composition, and `children`
  rather than by adding another branch to an existing component. When you find
  yourself adding a third boolean prop that changes rendering, extract variants.
- **Liskov substitution.** Components sharing an interface must be
  interchangeable. A wrapper around `<button>` must still accept the events and
  ARIA attributes a caller reasonably expects.
- **Interface segregation.** Props should be the narrow set a component actually
  uses. Pass `name` and `count`, not an entire `collection` object, when those
  are all it reads.
- **Dependency inversion.** Components depend on abstractions, not concrete
  implementations. API access belongs behind a module or hook, so components can
  be tested without stubbing `fetch` at the network level.

## Conventions

- **Formatting and linting are not judgement calls.** Prettier and ESLint decide;
  `npm run verify` fails on deviation. Do not hand-format.
- Function components with hooks only. No class components.
- Query in tests by accessible role or label, not by test ID. A test that breaks
  when markup is refactored was testing markup, not behaviour.
- Styling uses plain CSS with the custom properties defined in `index.css`. Add
  new design tokens there rather than hardcoding colours in a component.
- Every interactive element must be reachable and operable by keyboard. The
  Storybook a11y addon catches most violations before review.
- **Every new component ships with a story.** A story is the cheapest way for a
  reviewer or an agent to see a component in isolation, and it documents the
  props that actually matter. Stories are excluded from coverage — they are
  documentation, and CI verifies them by building Storybook.
- Read configuration from `import.meta.env.VITE_*`. Never hardcode a URL that
  differs between environments.

## Workflow rules that CI enforces

These are not suggestions. The `PR Lint` workflow fails the build on every rule
below except the issue-template one, which no workflow can check — GitHub does
not expose which template an issue was filed from.

1. **Every change requires a tracking issue.** If there is no issue, one must be
   created before opening a pull request.
2. **Every issue is filed from a template** in `.github/ISSUE_TEMPLATE/` — bug
   report, feature request, or chore. Keep the template's title prefix
   (`bug:`, `feat:`, `chore:`), fill in every section it defines rather than
   substituting freeform prose, and keep the labels it applies. Blank issues are
   disabled, so an issue opened through the UI already conforms; one created
   through the API or `gh issue create` must be written to match the template by
   hand. This is a review expectation, not a CI check — nothing fails the build
   if you skip it, which is exactly why it is written down here.
3. **Branch name:** `<issue-number>-<slug>`, e.g. `42-add-collection-list`.
4. **Pull request title:** `#<issue-number> <type>: <description>`, e.g.
   `#42 feat: add collection list`. Types: `feat`, `fix`, `chore`, `docs`,
   `refactor`, `perf`, `test`, `build`, `ci`, `style`, `revert`.
5. **Pull request body** must contain `Closes #<issue-number>`.
6. All three issue references must match, and the issue must be open.
7. Never commit directly to `master`.
8. Apply a `major`, `minor` or `patch` label — it sets the released version.
   The `Release label present` job fails without one.
9. Test coverage must stay at or above 80%.

## Versioning

The `version` field in `package.json` is deliberately frozen at `0.0.0`. **Git
tags are the only source of truth for versions.** Do not bump it; merging to
`master` cuts a release automatically, and the release notes are the changelog
(there is no `CHANGELOG.md`).

## Things to be careful about

- **`VITE_` variables are public.** They are inlined into the JavaScript bundle at
  build time. Never put a secret in one.
- The app deploys as a Render **Static Site**, not a container. The `Dockerfile`
  is for local development and CI validation only — changing it does not change
  what is deployed. Production behaviour comes from `render.yaml`.
- SPA routing depends on the rewrite rule in `render.yaml`. Without it, a hard
  refresh on any sub-path returns 404.
- Do not add a `CHANGELOG.md`. Release notes replace it.
- Do not commit secrets — Gitleaks scans every push and the full history weekly.
