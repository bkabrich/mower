import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapControlScreen } from './MapControlScreen'
import { useMowerStore } from '../store/mowerStore'


const mockSetView = vi.fn()
const mockGetZoom = vi.fn(() => 17)

vi.mock('react-leaflet', () => ({
  MapContainer: ({
    center,
    children,
  }: {
    center: [number, number]
    children: ReactNode
  }) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: (props: { position: [number, number] }) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(props.position)}
    />
  ),
  Polygon: (props: { positions: unknown[]; pathOptions?: object }) => (
    <div
      data-testid="polygon"
      data-positions={JSON.stringify(props.positions)}
      data-color={props.pathOptions && (props.pathOptions as { color?: string }).color}
    />
  ),
  Polyline: (props: { positions: unknown[]; pathOptions?: object }) => (
    <div
      data-testid="polyline"
      data-positions={JSON.stringify(props.positions)}
      data-dash-array={
        props.pathOptions && (props.pathOptions as { dashArray?: string }).dashArray
      }
    />
  ),
  useMap: () => ({
    setView: mockSetView,
    getZoom: mockGetZoom,
  }),
}))

vi.mock('leaflet', () => ({
  default: {
    divIcon: (opts: { html?: string; className?: string }) => ({
      options: opts,
      createIcon: () => document.createElement('div'),
    }),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

vi.mock('../store/mowerStore', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../store/mowerStore')>()
  return {
    ...mod,
    NO_GO_ZONES: [
      [
        { lat: 39.319, lng: -75.925 },
        { lat: 39.319, lng: -75.924 },
        { lat: 39.32, lng: -75.924 },
        { lat: 39.32, lng: -75.925 },
      ],
    ],
  }
})

function resetStore() {
  const s = useMowerStore.getState()
  s.stopMowing()
  s.stopRecording()
  s.clearRecordedPath()
  s.setConnected(false)
  s.setBattery(72)
  s.setProgressPercent(0)
  s.setCurrentPath([])
  s.setMowingPosition(null)
  s.setToastMessage(null)
  useMowerStore.setState({ mowingStatus: 'idle' })
}

describe('MapControlScreen', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('renders heading Mowing map & control', () => {
    render(<MapControlScreen />)
    expect(
      screen.getByRole('heading', { name: /mowing map.*control/i })
    ).toBeInTheDocument()
  })

  it('renders map container', () => {
    render(<MapControlScreen />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
  })

  it('renders property boundary polygon', () => {
    render(<MapControlScreen />)
    const polygons = screen.getAllByTestId('polygon')
    expect(polygons.length).toBeGreaterThanOrEqual(1)
    const boundary = polygons.find(
      (el) => (el as HTMLElement).dataset.color === '#22c55e'
    )
    expect(boundary).toBeInTheDocument()
  })

  it('renders no-go zone polygons when NO_GO_ZONES has entries', () => {
    render(<MapControlScreen />)
    const polygons = screen.getAllByTestId('polygon')
    const noGo = polygons.find(
      (el) => (el as HTMLElement).dataset.color === '#ef4444'
    )
    expect(noGo).toBeInTheDocument()
  })

  it('shows Mower not connected overlay when not connected', () => {
    render(<MapControlScreen />)
    expect(
      screen.getByText(/mower not connected – connect first/i)
    ).toBeInTheDocument()
  })

  it('hides overlay when connected', () => {
    useMowerStore.getState().setConnected(true)
    render(<MapControlScreen />)
    expect(
      screen.queryByText(/mower not connected – connect first/i)
    ).not.toBeInTheDocument()
  })

  it('shows battery percentage in badge', () => {
    render(<MapControlScreen />)
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('shows Start recording path button when not recording', () => {
    render(<MapControlScreen />)
    expect(
      screen.getByRole('button', { name: /start recording path/i })
    ).toBeInTheDocument()
  })

  it('toggles to Stop recording when Start recording is clicked', async () => {
    const user = userEvent.setup()
    render(<MapControlScreen />)
    await user.click(
      screen.getByRole('button', { name: /start recording path/i })
    )
    expect(
      screen.getByRole('button', { name: /stop recording/i })
    ).toBeInTheDocument()
  })

  it('shows Recording path – drive the mower when recording', async () => {
    const user = userEvent.setup()
    render(<MapControlScreen />)
    await user.click(
      screen.getByRole('button', { name: /start recording path/i })
    )
    expect(
      screen.getByText(/recording path – drive the mower/i)
    ).toBeInTheDocument()
  })

  it('shows Stop button when recording', async () => {
    const user = userEvent.setup()
    render(<MapControlScreen />)
    await user.click(
      screen.getByRole('button', { name: /start recording path/i })
    )
    const recordSection = screen.getByText('Record path').parentElement
    expect(
      within(recordSection!).getByRole('button', { name: /^stop$/i })
    ).toBeInTheDocument()
  })

  it('shows Clear path button when path exists and not recording', () => {
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    expect(
      screen.getByRole('button', { name: /clear path/i })
    ).toBeInTheDocument()
  })

  it('Clear path button clears recorded path when clicked', async () => {
    const user = userEvent.setup()
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    await user.click(screen.getByRole('button', { name: /clear path/i }))
    expect(useMowerStore.getState().recordedPath).toEqual([])
  })

  it('Simulate drive button is disabled when not recording', () => {
    render(<MapControlScreen />)
    const btn = screen.getByRole('button', { name: /simulate drive/i })
    expect(btn).toBeDisabled()
  })

  it('Start mowing button is disabled when not connected', () => {
    render(<MapControlScreen />)
    const btn = screen.getByRole('button', { name: /start mowing/i })
    expect(btn).toBeDisabled()
  })

  it('Start mowing button is disabled when recorded path has fewer than 2 points', () => {
    useMowerStore.getState().setConnected(true)
    useMowerStore.getState().setBattery(80)
    render(<MapControlScreen />)
    const btn = screen.getByRole('button', { name: /start mowing/i })
    expect(btn).toBeDisabled()
  })

  it('Start mowing opens confirmation modal when conditions met', async () => {
    const user = userEvent.setup()
    useMowerStore.getState().setConnected(true)
    useMowerStore.getState().setBattery(80)
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    await user.click(screen.getByRole('button', { name: /start mowing/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/start mowing\?/i)).toBeInTheDocument()
    expect(screen.getByText(/recorded path \(2 points\)/i)).toBeInTheDocument()
  })

  it('modal Cancel closes without starting mowing', async () => {
    const user = userEvent.setup()
    useMowerStore.getState().setConnected(true)
    useMowerStore.getState().setBattery(80)
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    await user.click(screen.getByRole('button', { name: /start mowing/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useMowerStore.getState().mowingStatus).toBe('idle')
  })

  it('modal Start starts mowing and closes modal', async () => {
    const user = userEvent.setup()
    useMowerStore.getState().setConnected(true)
    useMowerStore.getState().setBattery(80)
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    await user.click(screen.getByRole('button', { name: /start mowing/i }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^start$/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useMowerStore.getState().mowingStatus).toBe('mowing')
  })

  it('Stop button is disabled when idle', () => {
    useMowerStore.getState().setConnected(true)
    render(<MapControlScreen />)
    const stopBtn = screen.getByRole('button', { name: /^(pause|stop)$/i })
    expect(stopBtn).toBeDisabled()
  })

  it('shows Mowing in progress and progress percent when mowing', () => {
    useMowerStore.setState({
      mowingStatus: 'mowing',
      progressPercent: 45,
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    expect(screen.getByText(/mowing in progress/i)).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('shows Paused when status is paused', () => {
    useMowerStore.setState({
      mowingStatus: 'paused',
      progressPercent: 30,
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    expect(screen.getByText(/^paused$/i)).toBeInTheDocument()
  })

  it('shows toast when toastMessage is set', () => {
    useMowerStore.getState().setToastMessage('Mowing complete!')
    render(<MapControlScreen />)
    expect(screen.getByText('Mowing complete!')).toBeInTheDocument()
  })

  it('renders marker when position is available', () => {
    render(<MapControlScreen />)
    expect(screen.getByTestId('marker')).toBeInTheDocument()
  })

  it('Start mowing is disabled when battery below 20%', () => {
    useMowerStore.getState().setConnected(true)
    useMowerStore.getState().setBattery(15)
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    expect(screen.getByRole('button', { name: /start mowing/i })).toBeDisabled()
  })

  it('Simulate drive is enabled when recording', async () => {
    const user = userEvent.setup()
    render(<MapControlScreen />)
    await user.click(
      screen.getByRole('button', { name: /start recording path/i })
    )
    const simBtn = screen.getByRole('button', { name: /simulate drive/i })
    expect(simBtn).not.toBeDisabled()
  })

  it('Simulate drive button shows Simulating… when active during recording', async () => {
    const user = userEvent.setup()
    render(<MapControlScreen />)
    await user.click(
      screen.getByRole('button', { name: /start recording path/i })
    )
    await user.click(screen.getByRole('button', { name: /simulate drive/i }))
    expect(
      screen.getByRole('button', { name: /simulating…/i })
    ).toBeInTheDocument()
  })



  it('renders Record path section label', () => {
    render(<MapControlScreen />)
    expect(screen.getByText('Record path')).toBeInTheDocument()
  })

  it('renders Demo section with Simulate drive button', () => {
    render(<MapControlScreen />)
    expect(screen.getByText('Demo:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /simulate drive/i })).toBeInTheDocument()
  })

  it('renders recorded path polyline when path has 2+ points and not mowing', () => {
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    const polylines = screen.queryAllByTestId('polyline')
    expect(polylines.length).toBeGreaterThanOrEqual(1)
  })

  it('renders polylines when mowing with path and progress', () => {
    useMowerStore.setState({
      mowingStatus: 'mowing',
      progressPercent: 50,
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    const polylines = screen.getAllByTestId('polyline')
    expect(polylines.length).toBeGreaterThanOrEqual(1)
  })

  it('renders green covered segment when mowing with progress in multi-segment path', () => {
    useMowerStore.setState({
      mowingStatus: 'mowing',
      progressPercent: 65,
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
        { lat: 39.32004, lng: -75.925 },
      ],
    })
    render(<MapControlScreen />)
    const polylines = screen.getAllByTestId('polyline')
    expect(polylines.length).toBeGreaterThanOrEqual(2)
  })

  it('Pause button shows Pause when mowing', () => {
    useMowerStore.setState({
      mowingStatus: 'mowing',
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })

  it('Stop recording via Stop button ends recording', async () => {
    const user = userEvent.setup()
    render(<MapControlScreen />)
    await user.click(
      screen.getByRole('button', { name: /start recording path/i })
    )
    const recordSection = screen.getByText('Record path').parentElement
    await user.click(
      within(recordSection!).getByRole('button', { name: /^stop$/i })
    )
    expect(useMowerStore.getState().isRecording).toBe(false)
  })

  it('uses DEFAULT_CENTER when lastKnownPosition is null', () => {
    useMowerStore.getState().setLastKnownPosition(null)
    render(<MapControlScreen />)
    const container = screen.getByTestId('map-container')
    const center = JSON.parse(container.getAttribute('data-center') ?? '[]')
    expect(center).toEqual([39.32, -75.926])
  })

  it('does not render marker when lastKnownPosition is null', () => {
    useMowerStore.getState().setLastKnownPosition(null)
    render(<MapControlScreen />)
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('map container receives center from marker position when set', () => {
    useMowerStore.getState().setLastKnownPosition({
      latitude: 40.1,
      longitude: -76.2,
    })
    render(<MapControlScreen />)
    const container = screen.getByTestId('map-container')
    const center = JSON.parse(container.getAttribute('data-center') ?? '[]')
    expect(center).toEqual([40.1, -76.2])
  })

  it('recorded path polyline is dashed when recording', () => {
    useMowerStore.setState({
      isRecording: true,
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    const polylines = screen.getAllByTestId('polyline')
    const dashed = polylines.find(
      (el) => (el as HTMLElement).getAttribute('data-dash-array') === '8, 6'
    )
    expect(dashed).toBeInTheDocument()
  })

  it('mowing at 0% progress shows only blue path not green covered segment', () => {
    useMowerStore.setState({
      mowingStatus: 'mowing',
      progressPercent: 0,
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    const polylines = screen.getAllByTestId('polyline')
    expect(polylines.length).toBe(1)
  })

  it('Start mowing is disabled when already mowing', () => {
    useMowerStore.getState().setConnected(true)
    useMowerStore.getState().setBattery(80)
    useMowerStore.setState({
      mowingStatus: 'mowing',
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    expect(screen.getByRole('button', { name: /start mowing/i })).toBeDisabled()
  })

  it('modal shows recorded path point count', async () => {
    const user = userEvent.setup()
    useMowerStore.getState().setConnected(true)
    useMowerStore.getState().setBattery(80)
    useMowerStore.setState({
      recordedPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
        { lat: 39.32004, lng: -75.925 },
      ],
    })
    render(<MapControlScreen />)
    await user.click(screen.getByRole('button', { name: /start mowing/i }))
    expect(screen.getByText(/recorded path \(3 points\)/i)).toBeInTheDocument()
  })

  it('clicking Stop when paused calls stopMowing', async () => {
    const user = userEvent.setup()
    useMowerStore.getState().setConnected(true)
    useMowerStore.setState({
      mowingStatus: 'paused',
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    const stopBtn = screen.getByRole('button', { name: /^stop$/i })
    await user.click(stopBtn)
    expect(useMowerStore.getState().mowingStatus).toBe('stopped')
  })

  it('clicking Pause when mowing calls pauseMowing', async () => {
    const user = userEvent.setup()
    useMowerStore.getState().setConnected(true)
    useMowerStore.setState({
      mowingStatus: 'mowing',
      currentPath: [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32002, lng: -75.926 },
      ],
    })
    render(<MapControlScreen />)
    await user.click(screen.getByRole('button', { name: /pause/i }))
    expect(useMowerStore.getState().mowingStatus).toBe('paused')
  })
})
