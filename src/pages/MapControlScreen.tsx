import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import { useMowerStore, PROPERTY_BOUNDARY, NO_GO_ZONES } from '../store/mowerStore'
import {
  haversineMeters,
  pathLengthMeters,
  positionAlongPath,
} from '../lib/geoUtils'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER: LatLngExpression = [39.32, -75.926]
const DEFAULT_ZOOM = 17

/** Small test path inside boundary for "Simulate Drive" (demo). */
const SIMULATE_PATH = (() => {
  const c = { lat: 39.32, lng: -75.926 }
  const d = 0.0012
  return [
    { lat: c.lat - d, lng: c.lng - d },
    { lat: c.lat - d, lng: c.lng + d },
    { lat: c.lat + d, lng: c.lng + d },
    { lat: c.lat + d, lng: c.lng - d },
    { lat: c.lat - d, lng: c.lng - d },
  ]
})()

const mowerIcon = L.divIcon({
  html: '<span style="font-size:28px;line-height:1">🚜</span>',
  className: 'mower-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function MapCenterUpdater({
  position,
}: {
  position: { latitude: number; longitude: number } | null
}) {
  const map = useMap()
  if (position) {
    map.setView([position.latitude, position.longitude], map.getZoom())
  }
  return null
}

export function MapControlScreen() {
  const {
    isConnected,
    batteryPercent,
    lastKnownPosition,
    mowingStatus,
    progressPercent,
    currentPath,
    mowingPosition,
    toastMessage,
    isRecording,
    recordedPath,
    startRecording,
    stopRecording,
    addPositionToPath,
    clearRecordedPath,
    setLastKnownPosition,
    startMowing,
    stopMowing,
    pauseMowing,
  } = useMowerStore()

  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [simulateDrive, setSimulateDrive] = useState(false)
  const simulateIndexRef = useRef(0)

  const canStartMowing =
    isConnected &&
    batteryPercent >= 20 &&
    recordedPath.length >= 2 &&
    mowingStatus !== 'mowing'
  const isMowing = mowingStatus === 'mowing'

  const markerPosition =
    isMowing && mowingPosition ? mowingPosition : lastKnownPosition

  // When position updates and we're recording, add to path (store applies min-distance filter)
  useEffect(() => {
    if (isRecording && lastKnownPosition) {
      addPositionToPath(lastKnownPosition)
    }
  }, [
    isRecording,
    lastKnownPosition?.latitude,
    lastKnownPosition?.longitude,
    addPositionToPath,
  ])

  // Simulate Drive: fake position updates along test path (demo only)
  useEffect(() => {
    if (!simulateDrive || !isRecording) return
    const interval = setInterval(() => {
      const idx = simulateIndexRef.current % SIMULATE_PATH.length
      const p = SIMULATE_PATH[idx]
      setLastKnownPosition({ latitude: p.lat, longitude: p.lng })
      simulateIndexRef.current = idx + 1
    }, 1200)
    return () => clearInterval(interval)
  }, [simulateDrive, isRecording, setLastKnownPosition])

  const boundaryLatLng = useMemo(
    () => PROPERTY_BOUNDARY.map((p) => [p.lat, p.lng] as LatLngExpression),
    []
  )
  const noGoLatLngs = useMemo(
    () =>
      NO_GO_ZONES.map((zone) =>
        zone.map((p) => [p.lat, p.lng] as LatLngExpression)
      ),
    []
  )

  // Recorded path: blue polyline (dashed when recording)
  const recordedPathLatLng = useMemo(
    () =>
      recordedPath.map((p) => [p.lat, p.lng] as LatLngExpression),
    [recordedPath]
  )

  // When mowing: full path in blue; covered portion in green
  const totalPathLen =
    currentPath.length >= 2 ? pathLengthMeters(currentPath) : 0
  const coveredLen =
    totalPathLen > 0 ? (progressPercent / 100) * totalPathLen : 0
  const currentPathLatLng = useMemo(
    () => currentPath.map((p) => [p.lat, p.lng] as LatLngExpression),
    [currentPath]
  )
  const coveredPathLatLng = useMemo(() => {
    if (currentPath.length < 2 || coveredLen <= 0) return []
    const out: LatLngExpression[] = [
      [currentPath[0].lat, currentPath[0].lng],
    ]
    let d = 0
    for (let i = 1; i < currentPath.length; i++) {
      const segLen = haversineMeters(
        currentPath[i - 1].lat,
        currentPath[i - 1].lng,
        currentPath[i].lat,
        currentPath[i].lng
      )
      if (d + segLen >= coveredLen) {
        const pos = positionAlongPath(currentPath, coveredLen)
        if (pos) out.push([pos.lat, pos.lng])
        break
      }
      d += segLen
      out.push([currentPath[i].lat, currentPath[i].lng])
    }
    return out
  }, [currentPath, coveredLen])

  const center: LatLngExpression = markerPosition
    ? [markerPosition.latitude, markerPosition.longitude]
    : DEFAULT_CENTER

  const handleClearPath = () => {
    if (recordedPath.length > 0) clearRecordedPath()
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
        Mowing map &amp; control
      </h2>

      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-lg border border-slate-600">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full min-h-[280px]"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterUpdater position={markerPosition} />

          <Polygon
            positions={boundaryLatLng}
            pathOptions={{
              color: '#22c55e',
              weight: 2,
              fillColor: '#22c55e',
              fillOpacity: 0.08,
            }}
          />
          {noGoLatLngs.map((positions, i) => (
            <Polygon
              key={i}
              positions={positions}
              pathOptions={{
                color: '#ef4444',
                weight: 2,
                fillColor: '#ef4444',
                fillOpacity: 0.25,
              }}
            />
          ))}

          {/* Recorded path: blue, dashed when recording */}
          {recordedPathLatLng.length > 1 && !isMowing && (
            <Polyline
              positions={recordedPathLatLng}
              pathOptions={{
                color: '#3b82f6',
                weight: 3,
                opacity: 0.9,
                dashArray: isRecording ? '8, 6' : undefined,
              }}
            />
          )}

          {/* When mowing: full path blue, covered portion green */}
          {isMowing && currentPathLatLng.length > 1 && (
            <>
              <Polyline
                positions={currentPathLatLng}
                pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.7 }}
              />
              {coveredPathLatLng.length > 1 && progressPercent > 0 && (
                <Polyline
                  positions={coveredPathLatLng}
                  pathOptions={{
                    color: '#22c55e',
                    weight: 4,
                    opacity: 0.95,
                  }}
                />
              )}
            </>
          )}

          {markerPosition && (
            <Marker
              position={[markerPosition.latitude, markerPosition.longitude]}
              icon={mowerIcon}
            />
          )}
        </MapContainer>

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-lg border border-red-500 bg-slate-900/95 px-4 py-2.5">
            <span
              className="h-3 w-3 animate-pulse rounded-full bg-red-500"
              aria-hidden
            />
            <span className="text-sm font-semibold text-red-200">
              Recording path – drive the mower
            </span>
          </div>
        )}

        {/* Battery / connection (top right) */}
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-slate-500'
            }`}
          />
          <span className="text-sm font-medium text-slate-200">
            {batteryPercent}%
          </span>
        </div>

        {/* Not connected overlay */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/80">
            <p className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">
              Mower not connected – connect first
            </p>
          </div>
        )}
      </div>

      {/* Record path section */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Record path
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isRecording
                ? 'border-red-500 bg-red-600 text-white hover:bg-red-500'
                : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isRecording ? 'Stop recording' : 'Start recording path'}
          </button>
          {isRecording && (
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-lg border border-red-500 bg-slate-800 px-4 py-2.5 text-sm font-medium text-red-200 hover:bg-slate-700"
            >
              Stop
            </button>
          )}
          {recordedPath.length > 0 && !isRecording && (
            <button
              type="button"
              onClick={handleClearPath}
              className="rounded-lg border border-slate-500 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600"
            >
              Clear path
            </button>
          )}
        </div>
      </div>

      {/* Simulate Drive (demo) */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Demo:</span>
        <button
          type="button"
          onClick={() => setSimulateDrive((s) => !s)}
          disabled={!isRecording}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            simulateDrive && isRecording
              ? 'border-red-500 bg-red-500/20 text-red-300'
              : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 disabled:opacity-50'
          }`}
        >
          {simulateDrive && isRecording ? 'Simulating…' : 'Simulate drive'}
        </button>
      </div>

      {/* Progress when mowing or paused */}
      {(isMowing || mowingStatus === 'paused') && (
        <div className="flex items-center gap-4 rounded-lg border border-slate-600 bg-slate-800/80 p-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-slate-600"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(progressPercent / 100) * (2 * Math.PI * 16)} ${2 * Math.PI * 16}`}
                className="text-emerald-500 transition-[stroke-dasharray] duration-300"
              />
            </svg>
            <span className="absolute text-xs font-bold tabular-nums text-slate-100">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200">
              {mowingStatus === 'paused' ? 'Paused' : 'Mowing in progress'}
            </p>
            <p className="text-xs text-slate-400">Recorded path</p>
          </div>
        </div>
      )}

      {/* Start / Stop mowing */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowStartConfirm(true)}
          disabled={!canStartMowing}
          className={`min-h-[56px] flex-1 rounded-xl px-6 py-4 text-base font-semibold transition-colors min-w-[140px] ${
            canStartMowing
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'cursor-not-allowed bg-slate-700 text-slate-500'
          }`}
        >
          Start mowing
        </button>
        <button
          type="button"
          onClick={isMowing ? pauseMowing : stopMowing}
          disabled={
            !isConnected ||
            (mowingStatus !== 'mowing' && mowingStatus !== 'paused')
          }
          className="min-h-[56px] rounded-xl border border-slate-500 bg-slate-700 px-6 py-4 text-base font-semibold text-slate-200 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMowing ? 'Pause' : 'Stop'}
        </button>
      </div>

      {/* Confirm start modal */}
      {showStartConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-start-title"
          >
            <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-xl">
              <h3
                id="confirm-start-title"
                className="text-lg font-semibold text-slate-100"
              >
                Start mowing?
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Mow along the recorded path ({recordedPath.length} points)?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStartConfirm(false)}
                  className="flex-1 rounded-lg border border-slate-500 bg-slate-700 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStartConfirm(false)
                    startMowing()
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Start
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Toast: Mowing complete */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-lg border border-emerald-500 bg-slate-800 px-5 py-3 shadow-lg">
          <p className="text-sm font-semibold text-slate-100">{toastMessage}</p>
        </div>
      )}
    </div>
  )
}
