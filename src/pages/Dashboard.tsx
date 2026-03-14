import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MowerMap } from '../components/MowerMap'
import { BatteryGauge } from '../components/BatteryGauge'
import { StatusIndicators } from '../components/StatusIndicators'
import { useMowerStore } from '../store/mowerStore'
import type { MowerState } from '../types/mower'

/** Default/placeholder state for UI. */
export const initialState: MowerState = {
  mode: 'idle',
  speed: 0,
  batteryPercent: 72,
  connected: false,
  gps: { latitude: 39.32, longitude: -75.926 },
}

export interface DashboardProps {
  /** Optional initial state for testing. */
  initialState?: MowerState
}

export function Dashboard({ initialState: propsInitialState }: DashboardProps = {}) {
  const [state, setState] = useState<MowerState>(propsInitialState ?? initialState)
  const { setConnected, setBattery, setLastKnownPosition } = useMowerStore()

  useEffect(() => {
    setConnected(state.connected)
    setBattery(state.batteryPercent)
    setLastKnownPosition(state.gps)
  }, [state.connected, state.batteryPercent, state.gps, setConnected, setBattery, setLastKnownPosition])

  // -------------------------------------------------------------------------
  // WebSocket / rosbridge placeholder
  // -------------------------------------------------------------------------
  // To connect to rosbridge (e.g. rosbridge_server):
  //
  // 1. Install: npm i roslib (or use raw WebSocket and ROS JSON protocol)
  // 2. Connect: const ws = new WebSocket('ws://localhost:9090')
  // 3. Subscribe to /gps/fix (sensor_msgs/NavSatFix) and update map marker:
  //
  //    ws.onmessage = (event) => {
  //      const msg = JSON.parse(event.data)
  //      if (msg.topic === '/gps/fix' && msg.msg?.latitude != null) {
  //        setState((s) => ({
  //          ...s,
  //          gps: {
  //            latitude: msg.msg.latitude,
  //            longitude: msg.msg.longitude,
  //            altitude: msg.msg.altitude,
  //          },
  //        }))
  //      }
  //    }
  //
  // 4. Subscribe to other topics for mode, speed, battery, connection status
  //    and call setState() accordingly. Set connected: true when ws.readyState === 1.
  // -------------------------------------------------------------------------

  const simulateGpsUpdate = () => {
    setState((s) => ({
      ...s,
      gps: s.gps
        ? {
            ...s.gps,
            latitude: s.gps.latitude + (Math.random() - 0.5) * 0.0002,
            longitude: s.gps.longitude + (Math.random() - 0.5) * 0.0002,
          }
        : s.gps,
    }))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
            Map
          </h2>
          <MowerMap position={state.gps} className="h-[320px] sm:h-[400px]" />
        </section>
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
              Battery
            </h2>
            <BatteryGauge percent={state.batteryPercent} />
          </div>
          <div className="flex-1">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
              Status
            </h2>
            <StatusIndicators
              mode={state.mode}
              speed={state.speed}
              connected={state.connected}
            />
          </div>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, connected: !s.connected }))}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              state.connected ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {state.connected ? 'Disconnect' : 'Connect'}
          </button>
          <button
            type="button"
            onClick={simulateGpsUpdate}
            className="rounded bg-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-500"
          >
            Simulate GPS update
          </button>
          <Link
            to="/map"
            className="rounded bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Map &amp; mowing control →
          </Link>
        </section>
      </div>
    </div>
  )
}
