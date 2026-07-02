# Zarlania App

Angular 22 frontend for [zarlania.com](https://zarlania.com), served via nginx inside a
Docker container and deployed to Render.

## Development server

```bash
npm start        # or: ng serve
```

Opens at `http://localhost:4200/`. The app reloads automatically on source changes.

## Local full stack (Docker Compose)

Runs this app and [zarlania-api](https://github.com/Zarlania/zarlania-api) together in
containers, wired for local testing. Requires the API checked out as a sibling directory
(or set `ZARLANIA_API_DIR`).

```bash
docker compose up --build
```

App: `http://localhost:4200` · API: `http://localhost:8080`. See the reference doc
(`./scripts/ref find "docker compose"`) for how the wiring works.

## Build

```bash
npm run build
```

Artifacts land in `dist/`.

## Unit tests

```bash
npm test          # Jest in watch mode
npm run test:ci   # Jest with coverage + 80 % gate (used in CI)
```

## Lint / format

```bash
npm run lint
```

## Local quality gate

```bash
./scripts/setup-dev      # one-time: venv + dev deps + git hooks
./scripts/check          # fast pre-commit checks on all files
./scripts/check --full   # also runs lint, test:ci, and build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
