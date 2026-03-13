import { describe, it, expect, vi } from 'vitest'
import { createGpsFixHandler } from '../src/lib/rosbridge'

/**
 * Tests WebSocket subscription logic: when a client subscribes to /gps/fix
 * and attaches createGpsFixHandler to ws.onmessage, incoming messages are
 * parsed and the callback receives the GpsFix.
 */
describe('WebSocket subscription to /gps/fix', () => {
  it('invokes callback when WebSocket receives /gps/fix message', () => {
    const onFix = vi.fn()
    const handler = createGpsFixHandler(onFix)

    const mockWsMessage = new MessageEvent('message', {
      data: JSON.stringify({
        topic: '/gps/fix',
        msg: { latitude: 38.29, longitude: -122.28, altitude: 50 },
      }),
    })

    handler(mockWsMessage)

    expect(onFix).toHaveBeenCalledWith({
      latitude: 38.29,
      longitude: -122.28,
      altitude: 50,
    })
  })

  it('ignores non-JSON WebSocket message', () => {
    const onFix = vi.fn()
    const handler = createGpsFixHandler(onFix)
    const event = new MessageEvent('message', { data: 'plain text' })
    handler(event)
    expect(onFix).not.toHaveBeenCalled()
  })

  it('ignores message when topic is not /gps/fix', () => {
    const onFix = vi.fn()
    const handler = createGpsFixHandler(onFix)
    const event = new MessageEvent('message', {
      data: JSON.stringify({
        topic: '/odom',
        msg: { x: 1, y: 2 },
      }),
    })
    handler(event)
    expect(onFix).not.toHaveBeenCalled()
  })
})
