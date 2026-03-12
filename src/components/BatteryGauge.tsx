interface BatteryGaugeProps {
  percent: number
  className?: string
}

/** Simple SVG circular battery gauge (0–100%). */
export function BatteryGauge({ percent, className = '' }: BatteryGaugeProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference
  const isLow = clamped < 20
  const isMid = clamped >= 20 && clamped < 50
  const strokeColor = isLow ? '#ef4444' : isMid ? '#eab308' : '#22c55e'

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="h-24 w-24 sm:h-28 sm:w-28"
        aria-label={`Battery ${clamped}%`}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="text-sm font-medium tabular-nums text-slate-300">
        {Math.round(clamped)}%
      </span>
    </div>
  )
}
