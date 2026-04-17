import type { FC } from 'react'

interface Props { daysLeft: number; totalDays: number }

const ProgressRing: FC<Props> = ({ daysLeft, totalDays }) => {
  const pct = Math.max(0, Math.min(1, (totalDays - daysLeft) / totalDays))
  const r = 20
  const circ = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1c1c1c" strokeWidth="2.5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke="#f0f0f0" strokeWidth="2.5"
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          strokeLinecap="round" transform="rotate(-90 26 26)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, lineHeight: 1, color: '#f0f0f0' }}>
          {Math.round(pct * 100)}%
        </span>
      </div>
    </div>
  )
}

export default ProgressRing
