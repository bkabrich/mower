import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard, initialState } from './Dashboard'
import { useMowerStore } from '../store/mowerStore'

// Mock leaflet so map tests don't require DOM canvas
vi.mock('../components/MowerMap', () => ({
  MowerMap: ({ position }: { position: { latitude: number; longitude: number } | null }) => (
    <div data-testid="mower-map">
      {position ? `Map at ${position.latitude}, ${position.longitude}` : 'Map (no position)'}
    </div>
  ),
}))

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

function resetStore() {
  const s = useMowerStore.getState()
  s.setConnected(false)
  s.setBattery(72)
  s.setLastKnownPosition(initialState.gps)
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('renders Map section heading', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /map/i })).toBeInTheDocument()
  })

  it('renders Battery section heading', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /battery/i })).toBeInTheDocument()
  })

  it('renders Status section heading', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /status/i })).toBeInTheDocument()
  })

  it('renders the mower map with initial position', () => {
    renderDashboard()
    const map = screen.getByTestId('mower-map')
    expect(map).toBeInTheDocument()
    expect(map).toHaveTextContent(/39\.32.*-75\.926/)
  })

  it('displays battery gauge with initial percentage', () => {
    renderDashboard()
    expect(screen.getByLabelText(/battery 72%/i)).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('displays status: Disconnected, idle, 0.0 m/s', () => {
    renderDashboard()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(screen.getByText('0.0 m/s')).toBeInTheDocument()
  })

  it('renders Simulate GPS update button', () => {
    renderDashboard()
    expect(screen.getByRole('button', { name: /simulate gps update/i })).toBeInTheDocument()
  })

  it('updates map position when Simulate GPS update is clicked', async () => {
    const user = userEvent.setup()
    renderDashboard()
    const map = screen.getByTestId('mower-map')
    const initialText = map.textContent

    await user.click(screen.getByRole('button', { name: /simulate gps update/i }))

    // Position should change (random offset applied)
    expect(map.textContent).not.toBe(initialText)
    expect(map.textContent).toMatch(/Map at -?\d+\.\d+, -?\d+\.\d+/)
  })

  it('Connect button toggles to Disconnect and shows Connected', async () => {
    const user = userEvent.setup()
    renderDashboard()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /connect/i }))
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('Disconnect button toggles back to Connect and shows Disconnected', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('button', { name: /connect/i }))
    await user.click(screen.getByRole('button', { name: /disconnect/i }))
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('syncs connection state to store when Connect is clicked', async () => {
    const user = userEvent.setup()
    renderDashboard()
    expect(useMowerStore.getState().isConnected).toBe(false)
    await user.click(screen.getByRole('button', { name: /connect/i }))
    expect(useMowerStore.getState().isConnected).toBe(true)
  })

  it('syncs GPS to store when Simulate GPS update is clicked', async () => {
    const user = userEvent.setup()
    renderDashboard()
    const before = useMowerStore.getState().lastKnownPosition
    await user.click(screen.getByRole('button', { name: /simulate gps update/i }))
    const after = useMowerStore.getState().lastKnownPosition
    expect(after).not.toBeNull()
    expect(before).not.toBeNull()
    expect(after?.latitude).not.toBe(before?.latitude)
  })

  it('renders link to Map & mowing control with correct href', () => {
    renderDashboard()
    const link = screen.getByRole('link', { name: /map.*mowing control/i })
    expect(link).toHaveAttribute('href', '/map')
  })

  it('when gps is null, Simulate GPS update keeps gps null', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Dashboard initialState={{ ...initialState, gps: null }} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('mower-map')).toHaveTextContent('Map (no position)')
    await user.click(screen.getByRole('button', { name: /simulate gps update/i }))
    expect(screen.getByTestId('mower-map')).toHaveTextContent('Map (no position)')
  })

  it('matches snapshot', () => {
    const { container } = renderDashboard()
    expect(container.firstChild).toMatchSnapshot()
  })
})
