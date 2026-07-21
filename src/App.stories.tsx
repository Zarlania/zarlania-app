import type { Meta, StoryObj } from '@storybook/react-vite'
import App from './App'

const meta = {
  title: 'App/App',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof App>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

// The app is styled for both colour schemes; this story makes the light variant
// reviewable without changing the operating system setting.
export const LightScheme: Story = {
  globals: {
    backgrounds: { value: 'light' },
  },
}
