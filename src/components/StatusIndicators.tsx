import type { MowerMode } from '../types/mower'

interface StatusIndicatorsProps {
  mode: MowerMode
  speed: number
  connected: boolean
}

export function StatusIndicators({ mode, speed, connected }: StatusIndicatorsProps) {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-slate-600 bg-slate-800/80 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            connected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
          }`}
          aria-hidden
        />
        <span className="text-sm text-slate-300">Connection</span>
        <span className="text-sm font-medium text-slate-100">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">Mode</span>
        <span
          className={`rounded px-2 py-0.5 text-sm font-medium capitalize ${
            mode === 'teleop'
              ? 'bg-amber-500/20 text-amber-400'
              : mode === 'auto'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-600 text-slate-400'
          }`}
        >
          {mode}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">Speed</span>
        <span className="text-sm font-medium tabular-nums text-slate-100">
          {speed.toFixed(1)} m/s
        </span>
      </div>
    </div>
  )
}
