import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseGpsFixMessage, createGpsFixHandler } from './rosbridge'

describe('parseGpsFixMessage', () => {
  it('returns GpsFix for valid /gps/fix message', () => {
    const data = JSON.stringify({
      topic: '/gps/fix',
      msg: { latitude: 38.29, longitude: -122.28 },
    })
    expect(parseGpsFixMessage(data)).toEqual({
      latitude: 38.29,
      longitude: -122.28,
    })
  })

  it('includes altitude when present', () => {
    const data = JSON.stringify({
      topic: '/gps/fix',
      msg: { latitude: 40, longitude: -122, altitude: 100.5 },
    })
    expect(parseGpsFixMessage(data)).toEqual({
      latitude: 40,
      longitude: -122,
      altitude: 100.5,
    })
  })

  it('returns null for wrong topic', () => {
    const data = JSON.stringify({
      topic: '/other/topic',
      msg: { latitude: 38, longitude: -122 },
    })
    expect(parseGpsFixMessage(data)).toBeNull()
  })

  it('returns null when msg is missing', () => {
    const data = JSON.stringify({ topic: '/gps/fix' })
    expect(parseGpsFixMessage(data)).toBeNull()
  })

  it('returns null when latitude is not a number', () => {
    const data = JSON.stringify({
      topic: '/gps/fix',
      msg: { latitude: '38', longitude: -122 },
    })
    expect(parseGpsFixMessage(data)).toBeNull()
  })

  it('returns null when longitude is not a number', () => {
    const data = JSON.stringify({
      topic: '/gps/fix',
      msg: { latitude: 38, longitude: null },
    })
    expect(parseGpsFixMessage(data)).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseGpsFixMessage('not json')).toBeNull()
    expect(parseGpsFixMessage('')).toBeNull()
  })
})

describe('createGpsFixHandler', () => {
  it('calls onFix with parsed GpsFix when message is /gps/fix', () => {
    const onFix = vi.fn()
    const handler = createGpsFixHandler(onFix)
    const event = new MessageEvent('message', {
      data: JSON.stringify({
        topic: '/gps/fix',
        msg: { latitude: 50, longitude: 10 },
      }),
    })
    handler(event)
    expect(onFix).toHaveBeenCalledTimes(1)
    expect(onFix).toHaveBeenCalledWith({ latitude: 50, longitude: 10 })
  })

  it('does not call onFix for non-/gps/fix message', () => {
    const onFix = vi.fn()
    const handler = createGpsFixHandler(onFix)
    const event = new MessageEvent('message', {
      data: JSON.stringify({ topic: '/cmd_vel', msg: {} }),
    })
    handler(event)
    expect(onFix).not.toHaveBeenCalled()
  })

  it('does not call onFix when event.data is not a string', () => {
    const onFix = vi.fn()
    const handler = createGpsFixHandler(onFix)
    const event = new MessageEvent('message', { data: { foo: 1 } })
    handler(event)
    expect(onFix).not.toHaveBeenCalled()
  })
})
