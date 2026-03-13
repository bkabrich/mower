import type { GpsFix } from '../types/mower'

/** Rosbridge-style message (simplified). */
export interface RosbridgeMessage {
  topic?: string
  msg?: {
    latitude?: number
    longitude?: number
    altitude?: number
  }
}

/**
 * Parses a rosbridge WebSocket message and returns a GpsFix if the message
 * is from /gps/fix (sensor_msgs/NavSatFix). Used when subscribing to /gps/fix.
 */
export function parseGpsFixMessage(data: string): GpsFix | null {
  try {
    const msg: RosbridgeMessage = JSON.parse(data)
    if (msg.topic !== '/gps/fix' || msg.msg == null) return null
    const { latitude, longitude } = msg.msg
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
    const fix: GpsFix = { latitude, longitude }
    if (typeof msg.msg.altitude === 'number') fix.altitude = msg.msg.altitude
    return fix
  } catch {
    return null
  }
}

/**
 * Creates a subscription handler that updates state with GPS from /gps/fix messages.
 * Pass this to WebSocket onmessage when connected to rosbridge.
 */
export function createGpsFixHandler(
  onFix: (fix: GpsFix) => void
): (event: MessageEvent) => void {
  return (event: MessageEvent) => {
    if (typeof event.data !== 'string') return
    const fix = parseGpsFixMessage(event.data)
    if (fix) onFix(fix)
  }
}
