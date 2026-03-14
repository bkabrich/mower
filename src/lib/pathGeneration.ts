import type { PathPoint } from '../types/mower'
import type { MowingPattern } from '../types/mower'

/** Minimum inset (degrees) so path stays clearly inside with polyline stroke. */
const MIN_INSET = 0.00015
/** Fraction of boundary size to inset (8%). */
const INSET_FRACTION = 0.08

/** Cutting width 50 inches (for neat overlap); ~1.27 m. At ~39°N, 1° lat ≈ 111.32 km => spacing in degrees. */
const CUTTING_WIDTH_INCHES = 50
const METERS_PER_DEGREE_LAT_AT_39N = 111_320
const METERS_PER_DEGREE_LNG_AT_39N = 111_320 * Math.cos((39 * Math.PI) / 180)
const CUTTING_WIDTH_M = CUTTING_WIDTH_INCHES * 0.0254
const CUTTING_WIDTH_DEGREES =
  CUTTING_WIDTH_M / METERS_PER_DEGREE_LAT_AT_39N

/** Local frame aligned to boundary: origin and two unit vectors in (lng, lat) so stripes run along d1. */
interface BoundaryFrame {
  origin: PathPoint
  d1: { lng: number; lat: number }
  d2: { lng: number; lat: number }
  minU: number
  maxU: number
  minV: number
  maxV: number
  uvCorners: { u: number; v: number }[]
}

function getBounds(points: PathPoint[]) {
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
}

function getInsetBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
) {
  const w = maxLng - minLng
  const h = maxLat - minLat
  const fractionInset = Math.min(w, h) * INSET_FRACTION
  const inset = Math.min(
    Math.max(MIN_INSET, fractionInset),
    w * 0.45,
    h * 0.45
  )
  return {
    minLat: minLat + inset,
    maxLat: maxLat - inset,
    minLng: minLng + inset,
    maxLng: maxLng - inset,
  }
}

function clampPathToBounds(
  path: PathPoint[],
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): PathPoint[] {
  const { minLat: mi, maxLat: ma, minLng: mg, maxLng: mx } = getInsetBounds(
    minLat,
    maxLat,
    minLng,
    maxLng
  )
  return path.map((p) => ({
    lat: Math.max(mi, Math.min(ma, p.lat)),
    lng: Math.max(mg, Math.min(mx, p.lng)),
  }))
}

/** Build local frame from boundary: d1 along first edge, d2 perpendicular; stripes will be parallel to edges. */
function getBoundaryFrame(boundary: PathPoint[]): BoundaryFrame | null {
  if (boundary.length < 3) return null
  const n = boundary.length
  const origin: PathPoint = {
    lat: boundary.reduce((s, p) => s + p.lat, 0) / n,
    lng: boundary.reduce((s, p) => s + p.lng, 0) / n,
  }
  const p0 = boundary[0]
  const p1 = boundary[1]
  let d1_lng = p1.lng - p0.lng
  let d1_lat = p1.lat - p0.lat
  const len1 = Math.hypot(d1_lng, d1_lat)
  if (len1 < 1e-10) return null
  d1_lng /= len1
  d1_lat /= len1
  const d2_lng = -d1_lat
  const d2_lat = d1_lng
  const uvCorners: { u: number; v: number }[] = boundary.map((p) => ({
    u: (p.lng - origin.lng) * d1_lng + (p.lat - origin.lat) * d1_lat,
    v: (p.lng - origin.lng) * d2_lng + (p.lat - origin.lat) * d2_lat,
  }))
  const us = uvCorners.map((c) => c.u)
  const vs = uvCorners.map((c) => c.v)
  return {
    origin,
    d1: { lng: d1_lng, lat: d1_lat },
    d2: { lng: d2_lng, lat: d2_lat },
    minU: Math.min(...us),
    maxU: Math.max(...us),
    minV: Math.min(...vs),
    maxV: Math.max(...vs),
    uvCorners,
  }
}

/** Step size in v (degrees) for 50-inch spacing in the d2 direction. */
function getStepV(frame: BoundaryFrame): number {
  const { d2 } = frame
  const mPerUnit =
    Math.sqrt(
      (d2.lng * METERS_PER_DEGREE_LNG_AT_39N) ** 2 +
        (d2.lat * METERS_PER_DEGREE_LAT_AT_39N) ** 2
    ) || 1
  return CUTTING_WIDTH_M / mPerUnit
}

/** (u,v) -> (lat, lng) */
function uvToLatLng(
  u: number,
  v: number,
  origin: PathPoint,
  d1: { lng: number; lat: number },
  d2: { lng: number; lat: number }
): PathPoint {
  return {
    lat: origin.lat + u * d1.lat + v * d2.lat,
    lng: origin.lng + u * d1.lng + v * d2.lng,
  }
}

/** Intersect line v = v0 with the uv quad; return [uMin, uMax] or null. */
function intersectLineV(
  v0: number,
  uvCorners: { u: number; v: number }[]
): [number, number] | null {
  const us: number[] = []
  for (let i = 0; i < uvCorners.length; i++) {
    const a = uvCorners[i]
    const b = uvCorners[(i + 1) % uvCorners.length]
    const dv = b.v - a.v
    if (Math.abs(dv) < 1e-12) {
      if (Math.abs(a.v - v0) < 1e-12) {
        us.push(a.u, b.u)
      }
      continue
    }
    const t = (v0 - a.v) / dv
    if (t >= 0 && t <= 1) {
      us.push(a.u + t * (b.u - a.u))
    }
  }
  if (us.length < 2) return null
  return [Math.min(...us), Math.max(...us)]
}

/** Stripes parallel to boundary edges (constant v, varying u). */
function stripesParallelToBoundary(boundary: PathPoint[]): PathPoint[] {
  const frame = getBoundaryFrame(boundary)
  if (!frame) return []
  const { origin, d1, d2, uvCorners } = frame
  const stepV = getStepV(frame)
  const path: PathPoint[] = []
  let v = frame.minV
  let goingRight = true
  while (v <= frame.maxV) {
    const seg = intersectLineV(v, uvCorners)
    if (seg) {
      const [uMin, uMax] = seg
      if (goingRight) {
        path.push(uvToLatLng(uMin, v, origin, d1, d2))
        path.push(uvToLatLng(uMax, v, origin, d1, d2))
      } else {
        path.push(uvToLatLng(uMax, v, origin, d1, d2))
        path.push(uvToLatLng(uMin, v, origin, d1, d2))
      }
      goingRight = !goingRight
    }
    v += stepV
  }
  return path
}

/** Perimeter (boundary edges) then stripes parallel to boundary. */
function perimeterThenStripesParallel(boundary: PathPoint[]): PathPoint[] {
  const closed = [...boundary, boundary[0]]
  const perimeter: PathPoint[] = closed.map((p) => ({ lat: p.lat, lng: p.lng }))
  return [...perimeter, ...stripesParallelToBoundary(boundary)]
}

/** Spiral in uv space (parallel to boundary), then map to lat/lng. */
function spiralParallelToBoundary(boundary: PathPoint[]): PathPoint[] {
  const frame = getBoundaryFrame(boundary)
  if (!frame) return []
  const { origin, d1, d2, uvCorners } = frame
  const step = getStepV(frame)
  const path: PathPoint[] = []
  let t = frame.minV
  let b = frame.maxV
  let l = frame.minU
  let r = frame.maxU
  while (t <= b && l <= r) {
    for (let u = l; u <= r; u += step)
      path.push(uvToLatLng(u, t, origin, d1, d2))
    t += step
    for (let v = t; v <= b; v += step)
      path.push(uvToLatLng(r, v, origin, d1, d2))
    r -= step
    if (l > r) break
    for (let u = r; u >= l; u -= step)
      path.push(uvToLatLng(u, b, origin, d1, d2))
    b -= step
    if (t > b) break
    for (let v = b; v >= t; v -= step)
      path.push(uvToLatLng(l, v, origin, d1, d2))
    l += step
  }
  return path
}

function stripesInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  spacing = CUTTING_WIDTH_DEGREES
): PathPoint[] {
  const path: PathPoint[] = []
  let lat = minLat
  let goingRight = true
  while (lat <= maxLat) {
    if (goingRight) {
      path.push({ lat, lng: minLng })
      path.push({ lat, lng: maxLng })
    } else {
      path.push({ lat, lng: maxLng })
      path.push({ lat, lng: minLng })
    }
    lat += spacing
    goingRight = !goingRight
  }
  return path
}

function spiralInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  step = CUTTING_WIDTH_DEGREES
): PathPoint[] {
  const path: PathPoint[] = []
  let t = minLat
  let b = maxLat
  let l = minLng
  let r = maxLng
  while (t <= b && l <= r) {
    for (let x = l; x <= r; x += step) path.push({ lat: t, lng: x })
    t += step
    for (let y = t; y <= b; y += step) path.push({ lat: y, lng: r })
    r -= step
    if (l > r) break
    for (let x = r; x >= l; x -= step) path.push({ lat: b, lng: x })
    b -= step
    if (t > b) break
    for (let y = b; y >= t; y -= step) path.push({ lat: y, lng: l })
    l += step
  }
  return path
}

function perimeterThenStripes(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): PathPoint[] {
  const perimeter: PathPoint[] = [
    { lat: minLat, lng: minLng },
    { lat: minLat, lng: maxLng },
    { lat: maxLat, lng: maxLng },
    { lat: maxLat, lng: minLng },
    { lat: minLat, lng: minLng },
  ]
  return [...perimeter, ...stripesInBounds(minLat, maxLat, minLng, maxLng)]
}

function randomInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  count = 60
): PathPoint[] {
  const path: PathPoint[] = []
  for (let i = 0; i < count; i++) {
    path.push({
      lat: minLat + Math.random() * (maxLat - minLat),
      lng: minLng + Math.random() * (maxLng - minLng),
    })
  }
  return path
}

export function generatePathForPattern(
  pattern: NonNullable<MowingPattern>,
  boundary: PathPoint[]
): PathPoint[] {
  if (boundary.length < 3) return []
  const { minLat, maxLat, minLng, maxLng } = getBounds(boundary)
  const w = maxLng - minLng
  const h = maxLat - minLat
  if (w <= 0 || h <= 0) return []

  const frame = getBoundaryFrame(boundary)
  let path: PathPoint[]

  if (frame) {
    switch (pattern) {
      case 'stripes':
        path = stripesParallelToBoundary(boundary)
        break
      case 'spiral':
        path = spiralParallelToBoundary(boundary)
        break
      case 'perimeter':
        path = perimeterThenStripesParallel(boundary)
        break
      case 'random': {
        const inset = getInsetBounds(minLat, maxLat, minLng, maxLng)
        path = randomInBounds(
          inset.minLat,
          inset.maxLat,
          inset.minLng,
          inset.maxLng
        )
        break
      }
      default:
        path = stripesParallelToBoundary(boundary)
    }
  } else {
    const inset = getInsetBounds(minLat, maxLat, minLng, maxLng)
    const { minLat: mi, maxLat: ma, minLng: mg, maxLng: mx } = inset
    switch (pattern) {
      case 'stripes':
        path = stripesInBounds(mi, ma, mg, mx)
        break
      case 'spiral':
        path = spiralInBounds(mi, ma, mg, mx)
        break
      case 'perimeter':
        path = perimeterThenStripes(mi, ma, mg, mx)
        break
      case 'random':
        path = randomInBounds(mi, ma, mg, mx)
        break
      default:
        path = stripesInBounds(mi, ma, mg, mx)
    }
  }

  return clampPathToBounds(path, minLat, maxLat, minLng, maxLng)
}

/** Clamp a path to stay inside a boundary (for display). */
export function clampPathToBoundary(
  path: PathPoint[],
  boundary: PathPoint[]
): PathPoint[] {
  if (boundary.length < 3 || path.length === 0) return path
  const { minLat, maxLat, minLng, maxLng } = getBounds(boundary)
  return clampPathToBounds(path, minLat, maxLat, minLng, maxLng)
}
