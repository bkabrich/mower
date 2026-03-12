import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import type { GpsFix } from '../types/mower'
import 'leaflet/dist/leaflet.css'

/** Default center (example vineyard coords). */
const DEFAULT_CENTER: LatLngExpression = [38.29, -122.28]
const DEFAULT_ZOOM = 16

/** Fix default icon path for react-leaflet in bundlers. */
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = defaultIcon

interface MowerMapProps {
  /** Current mower position from GPS; map centers on this when set. */
  position: GpsFix | null
  className?: string
}

/** Updates map view when position changes (e.g. from /gps/fix). */
function MapCenterUpdater({ position }: { position: GpsFix | null }) {
  const map = useMap()
  if (position) {
    map.setView([position.latitude, position.longitude], map.getZoom())
  }
  return null
}

export function MowerMap({ position, className = '' }: MowerMapProps) {
  const center: LatLngExpression = position
    ? [position.latitude, position.longitude]
    : DEFAULT_CENTER

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-600 ${className}`}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="h-full min-h-[280px] w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater position={position} />
        {position && (
          <Marker position={[position.latitude, position.longitude]}>
            <Popup>Mower position</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
