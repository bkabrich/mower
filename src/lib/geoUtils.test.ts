import { describe, it, expect } from 'vitest'
import {
  haversineMeters,
  RECORD_MIN_DISTANCE_M,
  shouldAddPoint,
  pathLengthMeters,
  positionAlongPath,
  type LatLngPoint,
} from './geoUtils'

describe('haversineMeters', () => {
  it('returns 0 for same point', () => {
    expect(haversineMeters(39.32, -75.926, 39.32, -75.926)).toBe(0)
  })

  it('returns positive distance for two different points', () => {
    const d = haversineMeters(39.32, -75.926, 39.321, -75.926)
    expect(d).toBeGreaterThan(0)
    expect(d).toBeLessThan(5000)
  })

  it('is symmetric (A to B equals B to A)', () => {
    const a = haversineMeters(39.32, -75.926, 40, -76)
    const b = haversineMeters(40, -76, 39.32, -75.926)
    expect(a).toBe(b)
  })

  it('returns ~111km for 1 degree latitude at mid-latitudes', () => {
    const d = haversineMeters(39, -75, 40, -75)
    expect(d).toBeGreaterThan(110_000)
    expect(d).toBeLessThan(112_000)
  })
})

describe('RECORD_MIN_DISTANCE_M', () => {
  it('is 1.5', () => {
    expect(RECORD_MIN_DISTANCE_M).toBe(1.5)
  })
})

describe('shouldAddPoint', () => {
  it('returns true when new point is far enough away', () => {
    expect(
      shouldAddPoint(39.32, -75.926, 39.32002, -75.926)
    ).toBe(true)
  })

  it('returns false when new point is too close', () => {
    expect(
      shouldAddPoint(39.32, -75.926, 39.320001, -75.926)
    ).toBe(false)
  })

  it('uses custom minM when provided', () => {
    expect(
      shouldAddPoint(39.32, -75.926, 39.32001, -75.926, 0.5)
    ).toBe(true)
    expect(
      shouldAddPoint(39.32, -75.926, 39.320001, -75.926, 10)
    ).toBe(false)
  })

  it('returns true when at or over min distance', () => {
    const lat2 = 39.32 + 2 / 111_320
    expect(shouldAddPoint(39.32, -75.926, lat2, -75.926, 1.5)).toBe(true)
  })
})

describe('pathLengthMeters', () => {
  it('returns 0 for empty array', () => {
    expect(pathLengthMeters([])).toBe(0)
  })

  it('returns 0 for single point', () => {
    expect(pathLengthMeters([{ lat: 39.32, lng: -75.926 }])).toBe(0)
  })

  it('returns segment length for two points', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.32002, lng: -75.926 },
    ]
    const len = pathLengthMeters(points)
    expect(len).toBeGreaterThan(0)
    expect(len).toBe(haversineMeters(39.32, -75.926, 39.32002, -75.926))
  })

  it('returns sum of segment lengths for three or more points', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.32002, lng: -75.926 },
      { lat: 39.32004, lng: -75.925 },
    ]
    const len = pathLengthMeters(points)
    const expected =
      haversineMeters(39.32, -75.926, 39.32002, -75.926) +
      haversineMeters(39.32002, -75.926, 39.32004, -75.925)
    expect(len).toBe(expected)
  })
})

describe('positionAlongPath', () => {
  it('returns null for empty path', () => {
    expect(positionAlongPath([], 0)).toBeNull()
    expect(positionAlongPath([], 100)).toBeNull()
  })

  it('returns first point for single-point path', () => {
    const p = { lat: 39.32, lng: -75.926 }
    expect(positionAlongPath([p], 0)).toEqual(p)
    expect(positionAlongPath([p], 100)).toEqual(p)
  })

  it('returns first point when distance <= 0', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.321, lng: -75.926 },
    ]
    expect(positionAlongPath(points, 0)).toEqual({ lat: 39.32, lng: -75.926 })
    expect(positionAlongPath(points, -1)).toEqual({ lat: 39.32, lng: -75.926 })
  })

  it('returns position partway along first segment', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.321, lng: -75.926 },
    ]
    const totalLen = haversineMeters(39.32, -75.926, 39.321, -75.926)
    const half = positionAlongPath(points, totalLen / 2)
    expect(half).not.toBeNull()
    expect(half!.lat).toBeCloseTo(39.3205, 4)
    expect(half!.lng).toBe(-75.926)
  })

  it('returns second point when distance equals first segment length', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.321, lng: -75.926 },
    ]
    const totalLen = haversineMeters(39.32, -75.926, 39.321, -75.926)
    const end = positionAlongPath(points, totalLen)
    expect(end).toEqual({ lat: 39.321, lng: -75.926 })
  })

  it('returns last point when distance exceeds path length (past end)', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.32002, lng: -75.926 },
    ]
    const result = positionAlongPath(points, 1_000_000)
    expect(result).toEqual({ lat: 39.32002, lng: -75.926 })
  })

  it('returns last point when distance exactly equals total path length', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.32002, lng: -75.926 },
    ]
    const totalLen = pathLengthMeters(points)
    const result = positionAlongPath(points, totalLen)
    expect(result).toEqual(points[1])
  })

  it('handles position in second segment for three-point path', () => {
    const points: LatLngPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.32002, lng: -75.926 },
      { lat: 39.32004, lng: -75.925 },
    ]
    const seg1 = haversineMeters(
      points[0].lat,
      points[0].lng,
      points[1].lat,
      points[1].lng
    )
    const result = positionAlongPath(points, seg1 + 1)
    expect(result).not.toBeNull()
    expect(result!.lat).toBeGreaterThanOrEqual(points[1].lat)
    expect(result!.lng).toBeGreaterThanOrEqual(-75.926)
  })

  it('uses t=1 when segment length is zero (degenerate segment)', () => {
    const a = { lat: 39.32, lng: -75.926 }
    const b = { lat: 39.321, lng: -75.926 }
    const points: LatLngPoint[] = [a, b, b]
    const totalLen = pathLengthMeters(points)
    const result = positionAlongPath(points, totalLen)
    expect(result).not.toBeNull()
    expect(result).toEqual(b)
  })
})
