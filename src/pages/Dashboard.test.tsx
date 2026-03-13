import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from './Dashboard'

// Mock leaflet so map tests don't require DOM canvas
vi.mock('../components/MowerMap', () => ({
  MowerMap: ({ position }: { position: { latitude: number; longitude: number } | null }) => (
    <div data-testid="mower-map">
      {position ? `Map at ${position.latitude}, ${position.longitude}` : 'Map (no position)'}
    </div>
  ),
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Map section heading', () => {
    render(<Dashboard />)
    expect(screen.getByRole('heading', { name: /map/i })).toBeInTheDocument()
  })

  it('renders Battery section heading', () => {
    render(<Dashboard />)
    expect(screen.getByRole('heading', { name: /battery/i })).toBeInTheDocument()
  })

  it('renders Status section heading', () => {
    render(<Dashboard />)
    expect(screen.getByRole('heading', { name: /status/i })).toBeInTheDocument()
  })

  it('renders the mower map with initial position', () => {
    render(<Dashboard />)
    const map = screen.getByTestId('mower-map')
    expect(map).toBeInTheDocument()
    expect(map).toHaveTextContent(/38\.29.*-122\.28/)
  })

  it('displays battery gauge with initial percentage', () => {
    render(<Dashboard />)
    expect(screen.getByLabelText(/battery 72%/i)).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('displays status: Disconnected, idle, 0.0 m/s', () => {
    render(<Dashboard />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(screen.getByText('0.0 m/s')).toBeInTheDocument()
  })

  it('renders Simulate GPS update button', () => {
    render(<Dashboard />)
    expect(screen.getByRole('button', { name: /simulate gps update/i })).toBeInTheDocument()
  })

  it('updates map position when Simulate GPS update is clicked', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    const map = screen.getByTestId('mower-map')
    const initialText = map.textContent

    await user.click(screen.getByRole('button', { name: /simulate gps update/i }))

    // Position should change (random offset applied)
    expect(map.textContent).not.toBe(initialText)
    expect(map.textContent).toMatch(/Map at -?\d+\.\d+, -?\d+\.\d+/)
  })

  it('matches snapshot', () => {
    const { container } = render(<Dashboard />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
