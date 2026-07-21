import type { Preview } from '@storybook/react-vite'

// Global styles and design tokens, so stories render exactly as the app does.
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo'  — report violations in the Storybook UI only
      // 'error' — fail the build on violations
      // 'off'   — skip accessibility checks
      test: 'todo',
    },
  },
}

export default preview
