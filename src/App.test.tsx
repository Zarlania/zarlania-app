import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the greeting', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /hello from zarlania/i }),
    ).toBeInTheDocument()
  })

  it('reports that the application is running', () => {
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(/up and running/i)
  })
})
