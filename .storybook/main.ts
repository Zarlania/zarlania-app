import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    // Flags accessibility violations while a component is being developed,
    // rather than after it ships.
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    // Exposes the component library to AI agents over MCP.
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
}

export default config
