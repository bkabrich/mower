import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  useMowerStore,
  PROPERTY_BOUNDARY,
  NO_GO_ZONES,
  type MowerStore,
} from './mowerStore'
import type { GpsFix, PathPoint } from '../types/mower'

/** Short path (~5m) so mowing simulation completes in a few ticks for tests. */
const RECORDED_PATH: PathPoint[] = [
  { lat: 39.32, lng: -75.926 },
  { lat: 39.32002, lng: -75.926 },
  { lat: 39.32004, lng: -75.926 },
]

function getStore(): MowerStore {
  return useMowerStore.getState()
}

function resetStore() {
  const s = getStore()
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

describe('mowerStore', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    resetStore()
    vi.restoreAllMocks()
  })

  describe('exports and initial state', () => {
    it('exports PROPERTY_BOUNDARY with four corners', () => {
      expect(PROPERTY_BOUNDARY).toHaveLength(4)
      PROPERTY_BOUNDARY.forEach((p) => {
        expect(p).toHaveProperty('lat')
        expect(p).toHaveProperty('lng')
      })
    })

    it('exports NO_GO_ZONES as empty array', () => {
      expect(NO_GO_ZONES).toEqual([])
    })

    it('has expected initial state', () => {
      resetStore()
      const s = getStore()
      expect(s.isConnected).toBe(false)
      expect(s.batteryPercent).toBe(72)
      expect(s.mowingStatus).toBe('idle')
      expect(s.progressPercent).toBe(0)
      expect(s.currentPath).toEqual([])
      expect(s.mowingPosition).toBeNull()
      expect(s.toastMessage).toBeNull()
      expect(s.isRecording).toBe(false)
      expect(s.recordedPath).toEqual([])
      expect(s.lastKnownPosition).not.toBeNull()
    })
  })

  describe('setters', () => {
    it('setConnected updates isConnected', () => {
      getStore().setConnected(true)
      expect(getStore().isConnected).toBe(true)
      getStore().setConnected(false)
      expect(getStore().isConnected).toBe(false)
    })

    it('setBattery clamps to 0–100', () => {
      getStore().setBattery(50)
      expect(getStore().batteryPercent).toBe(50)
      getStore().setBattery(150)
      expect(getStore().batteryPercent).toBe(100)
      getStore().setBattery(-10)
      expect(getStore().batteryPercent).toBe(0)
    })

    it('setLastKnownPosition updates position', () => {
      const pos: GpsFix = { latitude: 40, longitude: -76 }
      getStore().setLastKnownPosition(pos)
      expect(getStore().lastKnownPosition).toEqual(pos)
      getStore().setLastKnownPosition(null)
      expect(getStore().lastKnownPosition).toBeNull()
    })

    it('setProgressPercent clamps to 0–100', () => {
      getStore().setProgressPercent(25)
      expect(getStore().progressPercent).toBe(25)
      getStore().setProgressPercent(110)
      expect(getStore().progressPercent).toBe(100)
      getStore().setProgressPercent(-5)
      expect(getStore().progressPercent).toBe(0)
    })

    it('setCurrentPath and setMowingPosition update state', () => {
      getStore().setCurrentPath(RECORDED_PATH)
      expect(getStore().currentPath).toEqual(RECORDED_PATH)
      getStore().setMowingPosition({ latitude: 39.32, longitude: -75.926 })
      expect(getStore().mowingPosition).toEqual({
        latitude: 39.32,
        longitude: -75.926,
      })
    })

    it('setToastMessage updates toastMessage', () => {
      getStore().setToastMessage('Hello')
      expect(getStore().toastMessage).toBe('Hello')
      getStore().setToastMessage(null)
      expect(getStore().toastMessage).toBeNull()
    })
  })

  describe('recording', () => {
    it('startRecording sets isRecording true', () => {
      getStore().startRecording()
      expect(getStore().isRecording).toBe(true)
    })

    it('stopRecording sets isRecording false', () => {
      getStore().startRecording()
      getStore().stopRecording()
      expect(getStore().isRecording).toBe(false)
    })

    it('addPositionToPath does nothing when not recording', () => {
      getStore().addPositionToPath({ latitude: 39.32, longitude: -75.926 })
      expect(getStore().recordedPath).toEqual([])
    })

    it('addPositionToPath adds first point when recording and path empty', () => {
      getStore().startRecording()
      getStore().addPositionToPath({ latitude: 39.32, longitude: -75.926 })
      expect(getStore().recordedPath).toHaveLength(1)
      expect(getStore().recordedPath[0]).toEqual({
        lat: 39.32,
        lng: -75.926,
      })
    })

    it('addPositionToPath adds point when far enough from last', () => {
      getStore().startRecording()
      getStore().addPositionToPath({ latitude: 39.32, longitude: -75.926 })
      // ~2m north so exceeds RECORD_MIN_DISTANCE_M (1.5m)
      getStore().addPositionToPath({
        latitude: 39.32002,
        longitude: -75.926,
      })
      expect(getStore().recordedPath).toHaveLength(2)
    })

    it('addPositionToPath skips point when too close to last', () => {
      getStore().startRecording()
      getStore().addPositionToPath({ latitude: 39.32, longitude: -75.926 })
      getStore().addPositionToPath({ latitude: 39.320001, longitude: -75.926 })
      expect(getStore().recordedPath).toHaveLength(1)
    })

    it('clearRecordedPath clears recorded path', () => {
      getStore().startRecording()
      getStore().addPositionToPath({ latitude: 39.32, longitude: -75.926 })
      getStore().clearRecordedPath()
      expect(getStore().recordedPath).toEqual([])
    })
  })

  describe('startMowing', () => {
    it('does nothing when recordedPath has fewer than 2 points', () => {
      getStore().setConnected(true)
      getStore().startRecording()
      getStore().addPositionToPath({ latitude: 39.32, longitude: -75.926 })
      getStore().stopRecording()
      getStore().startMowing()
      expect(getStore().mowingStatus).toBe('idle')
      expect(getStore().currentPath).toEqual([])
    })

    it('does nothing when recordedPath is empty', () => {
      getStore().startMowing()
      expect(getStore().mowingStatus).toBe('idle')
    })

    it('starts mowing and sets state when recordedPath has 2+ points', () => {
      useMowerStore.setState({ recordedPath: RECORDED_PATH })
      getStore().startMowing()
      expect(getStore().mowingStatus).toBe('mowing')
      expect(getStore().progressPercent).toBe(0)
      expect(getStore().currentPath).toEqual(RECORDED_PATH)
      expect(getStore().mowingPosition).toEqual({
        latitude: RECORDED_PATH[0].lat,
        longitude: RECORDED_PATH[0].lng,
      })
      expect(console.log).toHaveBeenCalledWith(
        '[Mower] Command payload (recorded path):',
        expect.objectContaining({
          command: 'start_mowing',
          pathPoints: RECORDED_PATH.length,
        })
      )
    })
  })

  describe('stopMowing', () => {
    it('sets status to stopped and clears mowing position', () => {
      useMowerStore.setState({ recordedPath: RECORDED_PATH })
      getStore().startMowing()
      expect(getStore().mowingStatus).toBe('mowing')
      getStore().stopMowing()
      expect(getStore().mowingStatus).toBe('stopped')
      expect(getStore().mowingPosition).toBeNull()
    })
  })

  describe('pauseMowing', () => {
    it('sets status to paused', () => {
      useMowerStore.setState({ recordedPath: RECORDED_PATH })
      getStore().startMowing()
      getStore().pauseMowing()
      expect(getStore().mowingStatus).toBe('paused')
    })
  })

  describe('mowing progress simulation', () => {
    const MOWING_INTERVAL_MS = 800

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('advances progress and mowingPosition over time', () => {
      useMowerStore.setState({ recordedPath: RECORDED_PATH })
      getStore().startMowing()
      expect(getStore().progressPercent).toBe(0)
      vi.advanceTimersByTime(MOWING_INTERVAL_MS)
      expect(getStore().progressPercent).toBeGreaterThan(0)
      const posBefore = getStore().mowingPosition
      vi.advanceTimersByTime(MOWING_INTERVAL_MS)
      expect(getStore().progressPercent).toBeGreaterThan(0)
      const posAfter = getStore().mowingPosition
      expect(posAfter).not.toEqual(posBefore)
    })

    it('completes mowing at 100% and sets idle + toast', () => {
      useMowerStore.setState({ recordedPath: RECORDED_PATH })
      getStore().startMowing()
      expect(getStore().mowingStatus).toBe('mowing')
      // RECORDED_PATH is ~4m; at 2m/800ms we need ~2s. Advance 4s so we're past completion but before 3s toast clear.
      vi.advanceTimersByTime(4000)
      expect(getStore().mowingStatus).toBe('idle')
      expect(getStore().progressPercent).toBe(0)
      expect(getStore().mowingPosition).toBeNull()
      expect(getStore().toastMessage).toBe('Mowing complete!')
    })

    it('clears toast after 3s when mowing completes', () => {
      useMowerStore.setState({ recordedPath: RECORDED_PATH })
      getStore().startMowing()
      vi.advanceTimersByTime(4000)
      expect(getStore().toastMessage).toBe('Mowing complete!')
      vi.advanceTimersByTime(3000)
      expect(getStore().toastMessage).toBeNull()
    })

    it('stops advancing when stopMowing is called', () => {
      useMowerStore.setState({ recordedPath: RECORDED_PATH })
      getStore().startMowing()
      vi.advanceTimersByTime(MOWING_INTERVAL_MS)
      const pct = getStore().progressPercent
      getStore().stopMowing()
      vi.advanceTimersByTime(10_000)
      expect(getStore().mowingStatus).toBe('stopped')
      expect(getStore().progressPercent).toBe(pct)
    })
  })

  describe('startMowing with zero-length path', () => {
    it('does not start when path has duplicate points (zero length)', () => {
      const samePointPath: PathPoint[] = [
        { lat: 39.32, lng: -75.926 },
        { lat: 39.32, lng: -75.926 },
      ]
      useMowerStore.setState({ recordedPath: samePointPath })
      getStore().startMowing()
      expect(getStore().mowingStatus).toBe('idle')
    })
  })
})
