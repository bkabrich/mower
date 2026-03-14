/**
 * Geo helpers for path recording (min-distance threshold to avoid duplicate points).
 * Assumption: min distance 1.5 m between recorded points (configurable).
 */

const EARTH_RADIUS_M = 6_371_000

/** Haversine distance in meters between two points. */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

/** Default min distance (m) between recorded path points to avoid noise/duplicates. */
export const RECORD_MIN_DISTANCE_M = 1.5

/** Return true if (lat, lng) is at least `minM` meters from (lastLat, lastLng). */
export function shouldAddPoint(
  lastLat: number,
  lastLng: number,
  lat: number,
  lng: number,
  minM: number = RECORD_MIN_DISTANCE_M
): boolean {
  return haversineMeters(lastLat, lastLng, lat, lng) >= minM
}

/** Path point for length/position helpers. */
export interface LatLngPoint {
  lat: number
  lng: number
}

/** Total length of path in meters (sum of segment lengths). */
export function pathLengthMeters(points: LatLngPoint[]): number {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineMeters(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    )
  }
  return total
}

/** Position (lat, lng) along path at `distanceMeters` from start. Clamps to path end. */
export function positionAlongPath(
  points: LatLngPoint[],
  distanceMeters: number
): { lat: number; lng: number } | null {
  if (points.length === 0) return null
  if (points.length === 1 || distanceMeters <= 0)
    return { lat: points[0].lat, lng: points[0].lng }
  let remaining = distanceMeters
  for (let i = 0; i < points.length - 1; i++) {
    const segLen = haversineMeters(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    )
    if (remaining <= segLen) {
      const t = segLen > 0 ? remaining / segLen : 1
      return {
        lat: points[i].lat + t * (points[i + 1].lat - points[i].lat),
        lng: points[i].lng + t * (points[i + 1].lng - points[i].lng),
      }
    }
    remaining -= segLen
  }
  const last = points[points.length - 1]
  return { lat: last.lat, lng: last.lng }
}
