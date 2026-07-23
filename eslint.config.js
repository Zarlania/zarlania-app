import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importX from 'eslint-plugin-import-x'
import storybook from 'eslint-plugin-storybook'
import vitest from '@vitest/eslint-plugin'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'

// Flat config, "strong" tier. Layered deliberately:
//   1. base non-type-aware rules on every TS/TSX file
//   2. type-aware rules only on files a tsconfig actually covers
//   3. narrow overrides for stories and tests
// Type-aware linting (no-floating-promises, no-misused-promises, no-unsafe-*)
// needs the TypeScript program, so it is scoped to files in tsconfig.app.json
// (src/**) and tsconfig.node.json (vite.config.ts). Files in no project
// (.storybook/**, *.d.ts) get the non-type-aware layer only — running a
// type-aware rule on them would error, not lint.
export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'storybook-static'],
  },

  // ---- Base: every TS/TSX file ----
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      jsxA11y.flatConfigs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      // App code runs in the browser; config and tooling files run under Node.
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // One consistent import order, autofixable. Blank line between groups and
      // alphabetised within each keeps diffs small and merges clean.
      'import-x/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  },

  // ---- Type-aware: only files a tsconfig covers ----
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ---- Storybook ----
  ...storybook.configs['flat/recommended'],

  // Stories and tests legitimately export non-components; Fast Refresh does not
  // apply to them, so its export rule is noise here.
  {
    files: [
      '**/*.stories.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      'src/test/**',
      '.storybook/**',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // ---- Test files ----
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    extends: [
      testingLibrary.configs['flat/react'],
      jestDom.configs['flat/recommended'],
    ],
    plugins: { vitest },
    languageOptions: {
      globals: { ...vitest.environments.env.globals },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      // Cleanup is called explicitly in src/test/setup.ts rather than relying on
      // @testing-library/react's implicit auto-cleanup. That is a deliberate
      // "explicit over magic" choice, so the rule that assumes auto-cleanup is
      // off for test files.
      'testing-library/no-manual-cleanup': 'off',
    },
  },
)
