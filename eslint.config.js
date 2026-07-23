import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Flat config. Rules are set explicitly rather than pulled from plugin presets
// so the linted rule set reads in one place and does not drift when a plugin
// reshuffles what its "recommended" preset contains.
export default tseslint.config(
  { ignores: ['dist', 'coverage', 'storybook-static'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      // App code runs in the browser; config and tooling files (vite.config.ts,
      // .storybook/*) run under Node. Both are linted here.
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Fast Refresh only updates a module cleanly when it exports components
      // and nothing else; `allowConstantExport` permits alongside constants.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
