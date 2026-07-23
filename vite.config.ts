// defineConfig comes from vitest/config, not vite, so that the `test` block
// below type checks under `tsc -b`.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // `host: true` binds 0.0.0.0 so the dev server is reachable from outside
    // the container when running under Docker Compose.
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      // `json-summary` and `json` are what the CI action reads to build the
      // coverage comment on pull requests; the others are for humans.
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      // Everything matching `include` is reported, whether or not a test
      // imported it — so an untested file counts against coverage rather than
      // being silently skipped. (Vitest 4 does this by default; in v3 it was
      // the `all` option.)
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.config.*',
        '**/*.d.ts',
        // Stories are documentation, not logic. They are exercised by the
        // Storybook build in CI rather than by unit tests.
        '**/*.stories.tsx',
        'src/test/**',
        'src/main.tsx',
        'dist/**',
      ],
      // The build fails below these. Keep in step with the JaCoCo threshold in
      // zarlania-api so both repositories hold the same bar.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
