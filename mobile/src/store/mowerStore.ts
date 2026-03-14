import { create } from 'zustand'
import type { GpsFix, PathPoint } from '../types/mower'
import {
  shouldAddPoint,
  RECORD_MIN_DISTANCE_M,
  pathLengthMeters,
  positionAlongPath,
} from '../lib/geoUtils'

/** Mowing status for the control screen */
export type MowingStatus = 'idle' | 'mowing' | 'paused' | 'stopped'

/** Property boundary (green box) – four corners in order. Paths and mower stay inside this. */
export const PROPERTY_BOUNDARY: PathPoint[] = [
  { lat: 39.318903, lng: -75.92619 },
  { lat: 39.320263, lng: -75.924727 },
  { lat: 39.32109, lng: -75.92598 },
  { lat: 39.319719, lng: -75.927451 },
]

/** Mower starts at center of property (centroid of boundary). */
const DEFAULT_POSITION: GpsFix = {
  latitude:
    (39.318903 + 39.320263 + 39.32109 + 39.319719) / 4,
  longitude:
    (-75.92619 + -75.924727 + -75.92598 + -75.927451) / 4,
}

/** No-go zones (red). Empty by default so you only see the single green property box. */
export const NO_GO_ZONES: PathPoint[][] = []

/** Mowing simulation: advance this many meters per tick (demo). */
const MOWING_STEP_M = 2
/** Mowing simulation: tick interval (ms). */
const MOWING_INTERVAL_MS = 800

let progressIntervalId: ReturnType<typeof setInterval> | null = null

function clearProgressSimulation() {
  if (progressIntervalId) {
    clearInterval(progressIntervalId)
    progressIntervalId = null
  }
}

export interface MowerStore {
  isConnected: boolean
  batteryPercent: number
  lastKnownPosition: GpsFix | null
  mowingStatus: MowingStatus
  progressPercent: number
  /** Path currently being followed when mowing (copy of recordedPath at start). */
  currentPath: PathPoint[]
  /** Position along path during mowing (for marker); null when idle. */
  mowingPosition: GpsFix | null
  toastMessage: string | null

  /** Recording: when true, positions are appended to recordedPath when they pass min distance. */
  isRecording: boolean
  /** Path recorded by user (drive-and-record). Reused as mowing route. */
  recordedPath: PathPoint[]

  setConnected: (connected: boolean) => void
  setBattery: (percent: number) => void
  setLastKnownPosition: (position: GpsFix | null) => void
  setProgressPercent: (percent: number) => void
  setCurrentPath: (path: PathPoint[]) => void
  setMowingPosition: (position: GpsFix | null) => void
  setToastMessage: (message: string | null) => void

  startRecording: () => void
  stopRecording: () => void
  /** Call when position updates; only appends if isRecording and distance >= threshold. */
  addPositionToPath: (position: GpsFix) => void
  clearRecordedPath: () => void

  startMowing: () => void
  stopMowing: () => void
  pauseMowing: () => void
}

export const useMowerStore = create<MowerStore>((set, get) => ({
  isConnected: false,
  batteryPercent: 72,
  lastKnownPosition: DEFAULT_POSITION,
  mowingStatus: 'idle',
  progressPercent: 0,
  currentPath: [],
  mowingPosition: null,
  toastMessage: null,
  isRecording: false,
  recordedPath: [],

  setConnected: (connected) => set({ isConnected: connected }),
  setBattery: (percent) =>
    set({ batteryPercent: Math.min(100, Math.max(0, percent)) }),
  setLastKnownPosition: (position) => set({ lastKnownPosition: position }),
  setProgressPercent: (percent) =>
    set({ progressPercent: Math.min(100, Math.max(0, percent)) }),
  setCurrentPath: (path) => set({ currentPath: path }),
  setMowingPosition: (position) => set({ mowingPosition: position }),
  setToastMessage: (message) => set({ toastMessage: message }),

  startRecording: () => set({ isRecording: true }),

  stopRecording: () => set({ isRecording: false }),

  addPositionToPath: (position) => {
    const { isRecording, recordedPath } = get()
    if (!isRecording) return
    const { latitude: lat, longitude: lng } = position
    if (recordedPath.length === 0) {
      set({ recordedPath: [{ lat, lng }] })
      return
    }
    const last = recordedPath[recordedPath.length - 1]
    if (shouldAddPoint(last.lat, last.lng, lat, lng, RECORD_MIN_DISTANCE_M)) {
      set({ recordedPath: [...recordedPath, { lat, lng }] })
    }
  },

  clearRecordedPath: () => set({ recordedPath: [] }),

  startMowing: () => {
    const { recordedPath } = get()
    if (recordedPath.length < 2) return

    const pathForMowing = recordedPath.map((p) => ({ lat: p.lat, lng: p.lng }))
    const totalLen = pathLengthMeters(pathForMowing)
    if (totalLen <= 0) return

    const payload = {
      command: 'start_mowing',
      pathPoints: pathForMowing.length,
      timestamp: new Date().toISOString(),
    }
    console.log('[Mower] Command payload (recorded path):', payload)

    clearProgressSimulation()
    const startPos = pathForMowing[0]
    set({
      mowingStatus: 'mowing',
      progressPercent: 0,
      currentPath: pathForMowing,
      mowingPosition: {
        latitude: startPos.lat,
        longitude: startPos.lng,
      },
    })

    let mowingDistance = 0

    progressIntervalId = setInterval(() => {
      const { mowingStatus, progressPercent, currentPath } = get()
      if (mowingStatus !== 'mowing' || currentPath.length < 2) {
        clearProgressSimulation()
        return
      }

      const totalLen = pathLengthMeters(currentPath)
      mowingDistance = Math.min(totalLen, mowingDistance + MOWING_STEP_M)
      const pct = totalLen > 0 ? (mowingDistance / totalLen) * 100 : 100
      const nextPercent = Math.min(100, pct)

      const pos = positionAlongPath(currentPath, mowingDistance)

      set({
        progressPercent: nextPercent,
        mowingPosition: pos
          ? { latitude: pos.lat, longitude: pos.lng }
          : get().mowingPosition,
      })

      if (nextPercent >= 100) {
        clearProgressSimulation()
        set({
          mowingStatus: 'idle',
          progressPercent: 0,
          mowingPosition: null,
          toastMessage: 'Mowing complete!',
        })
        setTimeout(() => get().setToastMessage(null), 3000)
      }
    }, MOWING_INTERVAL_MS)
  },

  stopMowing: () => {
    clearProgressSimulation()
    set({
      mowingStatus: 'stopped',
      mowingPosition: null,
      progressPercent: get().progressPercent,
    })
  },

  pauseMowing: () => {
    clearProgressSimulation()
    set({ mowingStatus: 'paused' })
  },
}))
