import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the app header', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /vineyard mower dashboard/i })).toBeInTheDocument()
  })

  it('renders the main content area', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('matches snapshot', () => {
    const { container } = render(<App />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
