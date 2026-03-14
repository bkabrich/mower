/** Mower operating mode */
export type MowerMode = 'idle' | 'teleop' | 'auto'

/** GPS fix (lat/lng for map) */
export interface GpsFix {
  latitude: number
  longitude: number
  altitude?: number
}

/** Single point in a path (lat/lng for map display) */
export interface PathPoint {
  lat: number
  lng: number
}

/** Predefined mowing pattern */
export type MowingPattern = 'stripes' | 'spiral' | 'perimeter' | 'random' | null

/** Dashboard state from device / MQTT */
export interface MowerState {
  mode: MowerMode
  speed: number
  batteryPercent: number
  connected: boolean
  gps: GpsFix | null
}
