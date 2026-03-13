import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MowerMap } from './MowerMap'

const mockMarker = vi.fn(() => null)
const mockPopup = vi.fn(() => null)
const mockTileLayer = vi.fn(() => null)
const mockUseMap = vi.fn()

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
  TileLayer: (props: object) => {
    mockTileLayer(props)
    return <div data-testid="tile-layer" />
  },
  Marker: (props: { position: [number, number]; children?: ReactNode }) => {
    mockMarker(props)
    return (
      <div data-testid="marker" data-position={JSON.stringify(props.position)}>
        {props.children}
      </div>
    )
  },
  Popup: (props: { children?: ReactNode }) => {
    mockPopup(props)
    return <div data-testid="popup">{props.children}</div>
  },
  useMap: () => mockUseMap(),
}))

describe('MowerMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMap.mockReturnValue({
      setView: vi.fn(),
      getZoom: () => 16,
    })
  })

  it('renders Leaflet map container', () => {
    render(<MowerMap position={null} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders TileLayer', () => {
    render(<MowerMap position={null} />)
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
    expect(mockTileLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      })
    )
  })

  it('uses default center when position is null', () => {
    render(<MowerMap position={null} />)
    const container = screen.getByTestId('map-container')
    const center = JSON.parse(container.getAttribute('data-center') ?? '[]')
    expect(center).toEqual([38.29, -122.28])
  })

  it('uses position as center when position is provided', () => {
    render(
      <MowerMap position={{ latitude: 45.5, longitude: -120.1 }} />
    )
    const container = screen.getByTestId('map-container')
    const center = JSON.parse(container.getAttribute('data-center') ?? '[]')
    expect(center).toEqual([45.5, -120.1])
  })

  it('does not render marker when position is null', () => {
    render(<MowerMap position={null} />)
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
    expect(mockMarker).not.toHaveBeenCalled()
  })

  it('renders marker with correct position when position is provided', () => {
    render(
      <MowerMap position={{ latitude: 40.2, longitude: -122.5 }} />
    )
    expect(screen.getByTestId('marker')).toBeInTheDocument()
    expect(mockMarker).toHaveBeenCalledWith(
      expect.objectContaining({
        position: [40.2, -122.5],
      })
    )
    const marker = screen.getByTestId('marker')
    expect(marker.getAttribute('data-position')).toBe(JSON.stringify([40.2, -122.5]))
  })

  it('renders Popup with mower position text when marker is present', () => {
    render(
      <MowerMap position={{ latitude: 40, longitude: -122 }} />
    )
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(screen.getByText('Mower position')).toBeInTheDocument()
  })

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <MowerMap position={null} className="custom-map-class" />
    )
    const wrapper = container.querySelector('.custom-map-class')
    expect(wrapper).toBeInTheDocument()
  })

  it('matches snapshot with position', () => {
    const { container } = render(
      <MowerMap position={{ latitude: 38.29, longitude: -122.28 }} />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
