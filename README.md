# zarlania-app

[![CI](https://github.com/Zarlania/zarlania-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Zarlania/zarlania-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Zarlania/zarlania-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/Zarlania/zarlania-app/actions/workflows/codeql.yml)
[![Gitleaks](https://github.com/Zarlania/zarlania-app/actions/workflows/gitleaks.yml/badge.svg)](https://github.com/Zarlania/zarlania-app/actions/workflows/gitleaks.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official web application for discovering, organizing, and managing collections with Zarlania.

> **Status: early scaffolding.** The app currently renders a single hello-world
> page. Routing, state management, and the API integration are not built yet.

The backend lives in a separate repository: [Zarlania/zarlania-api](https://github.com/Zarlania/zarlania-api).

## Requirements

| Tool   | Version | Notes                                 |
| ------ | ------- | ------------------------------------- |
| Node   | 24+     | See `.nvmrc`; run `nvm use`.          |
| npm    | 10+     | Ships with Node 24.                   |
| Docker | 24+     | Only needed for the Compose workflow. |

## Quick start

```bash
git clone https://github.com/Zarlania/zarlania-app.git
cd zarlania-app
npm install
npm run dev
```

The app runs at <http://localhost:5173>.

### With Docker Compose

```bash
docker compose up                    # dev server with hot reload on :5173
docker compose --profile prod up     # production-like nginx build on :8081
```

## Common tasks

| Command                   | What it does                                                 |
| ------------------------- | ------------------------------------------------------------ |
| `npm run dev`             | Dev server with hot module replacement.                      |
| `npm run verify`          | Type check, lint, format check, and tests. **CI runs this.** |
| `npm test`                | Runs the tests once.                                         |
| `npm run test:watch`      | Runs the tests in watch mode.                                |
| `npm run test:coverage`   | Tests with coverage; fails below 80%.                        |
| `npm run lint:fix`        | Fixes auto-fixable lint problems.                            |
| `npm run format`          | Formats the codebase with Prettier.                          |
| `npm run build`           | Type checks and builds to `dist/`.                           |
| `npm run preview`         | Serves the production build locally.                         |
| `npm run storybook`       | Component workshop at <http://localhost:6006>.               |
| `npm run build-storybook` | Builds the static Storybook to `storybook-static/`.          |

## Configuration

Copy `.env.example` to `.env.local` and adjust.

| Variable       | Default                 | Description                   |
| -------------- | ----------------------- | ----------------------------- |
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the Zarlania API. |

> Only `VITE_`-prefixed variables reach the browser, and they are **baked into
> the bundle at build time**. Treat every one of them as public — never put a
> secret in a `VITE_` variable.

## Project layout

```
src/
  main.tsx          Entry point; mounts <App /> into #root
  App.tsx           Root component
  App.test.tsx      Tests, colocated with the component they cover
  App.stories.tsx   Storybook stories, colocated with the component
  index.css         Design tokens and global styles
  test/setup.ts     Vitest setup — jest-dom matchers and DOM cleanup
.storybook/         Storybook configuration
public/             Static assets copied verbatim into the build
```

Tests sit next to the code they cover, not in a parallel `__tests__` tree.

## Testing and coverage

[Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/).
Coverage must stay at or above **80%** for lines, functions, branches, and
statements — thresholds live in `vite.config.ts` and CI fails below them. Every
pull request gets a coverage comment.

Query by accessible role or label rather than test IDs. A test that survives a
refactor of the markup is testing behaviour; one that breaks was testing markup.

## Storybook

Components are developed and documented in [Storybook](https://storybook.js.org/).

```bash
npm run storybook
```

Stories live beside their component (`App.tsx` beside `App.stories.tsx`). The
[a11y addon](https://storybook.js.org/addons/@storybook/addon-a11y) reports
accessibility violations as you work, and CI builds Storybook on every pull
request so a change that breaks its own documentation fails the build.

New components should ship with a story. It is the fastest way for a reviewer —
or an agent — to see what a component does in isolation.

## Contributing

Contributions are welcome. **Every change needs a tracking issue**, a branch named
`<issue-number>-<slug>`, and a pull request titled `#<issue-number> <type>: <description>`.
CI enforces this. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Support](SUPPORT.md)

## Releases and deployment

Merging to `master` automatically publishes a GitHub Release and deploys to Render.
The version bump comes from the merged pull request's `major`, `minor` or `patch`
label. Release notes serve as the changelog — this repository has no `CHANGELOG.md`.

The app deploys as a Render **Static Site**, configured as code in
[`render.yaml`](render.yaml). The `Dockerfile` is for local development only.

## License

[MIT](LICENSE) © Zarlania
