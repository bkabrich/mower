import { describe, it, expect } from 'vitest'
import {
  generatePathForPattern,
  clampPathToBoundary,
} from './pathGeneration'
import type { PathPoint } from '../types/mower'

/** Valid quad boundary (produces a non-null frame). */
const QUAD: PathPoint[] = [
  { lat: 39.32, lng: -75.926 },
  { lat: 39.32, lng: -75.92 },
  { lat: 39.318, lng: -75.92 },
  { lat: 39.318, lng: -75.926 },
]

/** Boundary with first two points identical so getBoundaryFrame returns null (fallback path). */
const DEGENERATE_FIRST_EDGE: PathPoint[] = [
  { lat: 39.32, lng: -75.926 },
  { lat: 39.32, lng: -75.926 },
  { lat: 39.318, lng: -75.92 },
  { lat: 39.318, lng: -75.926 },
]

/** Boundary with zero width (all same lng) so w <= 0. */
const ZERO_WIDTH: PathPoint[] = [
  { lat: 39.32, lng: -75.926 },
  { lat: 39.321, lng: -75.926 },
  { lat: 39.319, lng: -75.926 },
]

/** Boundary with zero height (all same lat) so h <= 0. */
const ZERO_HEIGHT: PathPoint[] = [
  { lat: 39.32, lng: -75.926 },
  { lat: 39.32, lng: -75.92 },
  { lat: 39.32, lng: -75.91 },
]

describe('generatePathForPattern', () => {
  it('returns empty array when boundary has fewer than 3 points', () => {
    expect(generatePathForPattern('stripes', [])).toEqual([])
    expect(generatePathForPattern('stripes', [{ lat: 39, lng: -76 }])).toEqual([])
    expect(
      generatePathForPattern('stripes', [
        { lat: 39, lng: -76 },
        { lat: 39.01, lng: -75.99 },
      ])
    ).toEqual([])
  })

  it('returns empty array when boundary has zero or negative width/height', () => {
    expect(generatePathForPattern('stripes', ZERO_WIDTH)).toEqual([])
    expect(generatePathForPattern('stripes', ZERO_HEIGHT)).toEqual([])
  })

  it('returns non-empty path for stripes pattern with valid quad', () => {
    const path = generatePathForPattern('stripes', QUAD)
    expect(path.length).toBeGreaterThan(2)
    path.forEach((p) => {
      expect(p).toHaveProperty('lat')
      expect(p).toHaveProperty('lng')
      expect(typeof p.lat).toBe('number')
      expect(typeof p.lng).toBe('number')
    })
  })

  it('returns non-empty path for spiral pattern with valid quad', () => {
    const path = generatePathForPattern('spiral', QUAD)
    expect(path.length).toBeGreaterThan(2)
    path.forEach((p) => {
      expect(p).toHaveProperty('lat')
      expect(p).toHaveProperty('lng')
    })
  })

  it('returns non-empty path for perimeter pattern with valid quad', () => {
    const path = generatePathForPattern('perimeter', QUAD)
    expect(path.length).toBeGreaterThan(2)
    path.forEach((p) => {
      expect(p).toHaveProperty('lat')
      expect(p).toHaveProperty('lng')
    })
  })

  it('returns non-empty path for random pattern with valid quad', () => {
    const path = generatePathForPattern('random', QUAD)
    expect(path.length).toBe(60)
    path.forEach((p) => {
      expect(p).toHaveProperty('lat')
      expect(p).toHaveProperty('lng')
    })
  })

  it('uses fallback axis-aligned path when first edge is degenerate', () => {
    const path = generatePathForPattern('stripes', DEGENERATE_FIRST_EDGE)
    expect(path.length).toBeGreaterThan(2)
  })

  it('clamps output to boundary bounds', () => {
    const path = generatePathForPattern('stripes', QUAD)
    const lats = path.map((p) => p.lat)
    const lngs = path.map((p) => p.lng)
    const minLat = Math.min(...QUAD.map((p) => p.lat))
    const maxLat = Math.max(...QUAD.map((p) => p.lat))
    const minLng = Math.min(...QUAD.map((p) => p.lng))
    const maxLng = Math.max(...QUAD.map((p) => p.lng))
    const inset = Math.min(0.08 * Math.min(maxLng - minLng, maxLat - minLat), 0.45 * (maxLng - minLng), 0.45 * (maxLat - minLat))
    const margin = 1e-6
    lats.forEach((lat) => {
      expect(lat).toBeGreaterThanOrEqual(minLat + inset - margin)
      expect(lat).toBeLessThanOrEqual(maxLat - inset + margin)
    })
    lngs.forEach((lng) => {
      expect(lng).toBeGreaterThanOrEqual(minLng + inset - margin)
      expect(lng).toBeLessThanOrEqual(maxLng - inset + margin)
    })
  })
})

describe('clampPathToBoundary', () => {
  it('returns path unchanged when boundary has fewer than 3 points', () => {
    const path: PathPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.31, lng: -75.92 },
    ]
    expect(clampPathToBoundary(path, [])).toEqual(path)
    expect(clampPathToBoundary(path, [{ lat: 39, lng: -76 }])).toEqual(path)
    expect(
      clampPathToBoundary(path, [
        { lat: 39, lng: -76 },
        { lat: 39.01, lng: -75.99 },
      ])
    ).toEqual(path)
  })

  it('returns path unchanged when path is empty', () => {
    expect(clampPathToBoundary([], QUAD)).toEqual([])
  })

  it('clamps points outside boundary to inside', () => {
    const path: PathPoint[] = [
      { lat: 39.5, lng: -75.5 },
      { lat: 39.318, lng: -75.924 },
    ]
    const result = clampPathToBoundary(path, QUAD)
    expect(result).toHaveLength(2)
    const minLat = Math.min(...QUAD.map((p) => p.lat))
    const maxLat = Math.max(...QUAD.map((p) => p.lat))
    const minLng = Math.min(...QUAD.map((p) => p.lng))
    const maxLng = Math.max(...QUAD.map((p) => p.lng))
    result.forEach((p) => {
      expect(p.lat).toBeLessThanOrEqual(maxLat)
      expect(p.lat).toBeGreaterThanOrEqual(minLat)
      expect(p.lng).toBeLessThanOrEqual(maxLng)
      expect(p.lng).toBeGreaterThanOrEqual(minLng)
    })
  })

  it('returns points within inset bounds', () => {
    const path: PathPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.319, lng: -75.92 },
    ]
    const result = clampPathToBoundary(path, QUAD)
    expect(result).toHaveLength(2)
    const minLat = Math.min(...QUAD.map((p) => p.lat))
    const maxLat = Math.max(...QUAD.map((p) => p.lat))
    const minLng = Math.min(...QUAD.map((p) => p.lng))
    const maxLng = Math.max(...QUAD.map((p) => p.lng))
    const w = maxLng - minLng
    const h = maxLat - minLat
    const fractionInset = Math.min(w, h) * 0.08
    const inset = Math.min(
      Math.max(0.00015, fractionInset),
      w * 0.45,
      h * 0.45
    )
    result.forEach((p) => {
      expect(p.lat).toBeLessThanOrEqual(maxLat - inset + 1e-6)
      expect(p.lat).toBeGreaterThanOrEqual(minLat + inset - 1e-6)
      expect(p.lng).toBeLessThanOrEqual(maxLng - inset + 1e-6)
      expect(p.lng).toBeGreaterThanOrEqual(minLng + inset - 1e-6)
    })
  })
})

describe('pathGeneration edge cases', () => {
  it('perimeter pattern includes closed boundary then stripes', () => {
    const path = generatePathForPattern('perimeter', QUAD)
    expect(path.length).toBeGreaterThan(5)
  })

  it('spiral pattern with small boundary produces path', () => {
    const smallQuad: PathPoint[] = [
      { lat: 39.32, lng: -75.926 },
      { lat: 39.3205, lng: -75.924 },
      { lat: 39.3195, lng: -75.924 },
      { lat: 39.3195, lng: -75.926 },
    ]
    const path = generatePathForPattern('spiral', smallQuad)
    expect(path.length).toBeGreaterThan(2)
  })

  it('fallback spiral and perimeter with degenerate first edge', () => {
    const spiralPath = generatePathForPattern('spiral', DEGENERATE_FIRST_EDGE)
    const perimeterPath = generatePathForPattern('perimeter', DEGENERATE_FIRST_EDGE)
    expect(spiralPath.length).toBeGreaterThan(2)
    expect(perimeterPath.length).toBeGreaterThan(2)
  })

  it('fallback random with degenerate first edge', () => {
    const path = generatePathForPattern('random', DEGENERATE_FIRST_EDGE)
    expect(path.length).toBe(60)
  })

  it('default pattern (frame path) falls back to stripes', () => {
    type Pattern = Parameters<typeof generatePathForPattern>[0]
    const path = generatePathForPattern('other' as Pattern, QUAD)
    expect(path.length).toBeGreaterThan(2)
    path.forEach((p) => {
      expect(p).toHaveProperty('lat')
      expect(p).toHaveProperty('lng')
    })
  })

  it('default pattern (fallback path) falls back to stripes', () => {
    type Pattern = Parameters<typeof generatePathForPattern>[0]
    const path = generatePathForPattern('other' as Pattern, DEGENERATE_FIRST_EDGE)
    expect(path.length).toBeGreaterThan(2)
  })
})
