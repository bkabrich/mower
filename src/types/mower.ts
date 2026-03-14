/** Mower operating mode */
export type MowerMode = 'idle' | 'teleop' | 'auto'

/** GPS fix (sensor_msgs/NavSatFix style from ROS) */
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

/** Dashboard state from ROS / rosbridge */
export interface MowerState {
  mode: MowerMode
  speed: number
  batteryPercent: number
  connected: boolean
  gps: GpsFix | null
}
