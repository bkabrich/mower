import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusIndicators } from './StatusIndicators'

describe('StatusIndicators', () => {
  it('shows Connected when connected is true', () => {
    render(<StatusIndicators mode="idle" speed={0} connected={true} />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows Disconnected when connected is false', () => {
    render(<StatusIndicators mode="idle" speed={0} connected={false} />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('displays mode: idle', () => {
    render(<StatusIndicators mode="idle" speed={0} connected={false} />)
    expect(screen.getByText('idle')).toBeInTheDocument()
  })

  it('displays mode: teleop', () => {
    render(<StatusIndicators mode="teleop" speed={0} connected={false} />)
    expect(screen.getByText('teleop')).toBeInTheDocument()
  })

  it('displays mode: auto', () => {
    render(<StatusIndicators mode="auto" speed={0} connected={false} />)
    expect(screen.getByText('auto')).toBeInTheDocument()
  })

  it('displays speed with one decimal (m/s)', () => {
    render(<StatusIndicators mode="idle" speed={1.23} connected={false} />)
    expect(screen.getByText('1.2 m/s')).toBeInTheDocument()
  })

  it('displays speed 0.0 when zero', () => {
    render(<StatusIndicators mode="idle" speed={0} connected={false} />)
    expect(screen.getByText('0.0 m/s')).toBeInTheDocument()
  })

  it('renders Connection, Mode, and Speed labels', () => {
    render(<StatusIndicators mode="idle" speed={0} connected={false} />)
    expect(screen.getByText('Connection')).toBeInTheDocument()
    expect(screen.getByText('Mode')).toBeInTheDocument()
    expect(screen.getByText('Speed')).toBeInTheDocument()
  })

  it('matches snapshot when disconnected and idle', () => {
    const { container } = render(<StatusIndicators mode="idle" speed={0} connected={false} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot when connected and teleop', () => {
    const { container } = render(<StatusIndicators mode="teleop" speed={2.5} connected={true} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
