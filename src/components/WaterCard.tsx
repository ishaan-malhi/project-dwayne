import type { FC } from 'react'
import { formatWater } from '../utils/plan'

interface Props {
  waterLogged: number
  waterTarget: number
  onUpdate: (ml: number) => void
  interactive?: boolean
}

const WaterCard: FC<Props> = ({ waterLogged, waterTarget, onUpdate, interactive = true }) => {
  const atTarget = waterLogged >= waterTarget
  const color = atTarget ? '#47ff8a' : '#5ba3ff'

  return (
    <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Water</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: atTarget ? '#47ff8a' : '#f0f0f0' }}>
          {formatWater(waterLogged)}<span style={{ color: '#6b6b6b', fontSize: 11 }}> / {formatWater(waterTarget)}</span>
        </span>
      </div>

      {/* 8-segment bar */}
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 8 }, (_, i) => {
          const segMl = waterTarget / 8
          const filled = waterLogged >= segMl * (i + 1)
          const partial = !filled && waterLogged > segMl * i
          const partialPct = partial ? Math.round(((waterLogged - segMl * i) / segMl) * 100) : 0
          return (
            <div key={i} style={{ flex: 1, height: 10, borderRadius: 5, background: '#1c1c1c', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: filled ? '100%' : `${partialPct}%`,
                background: color,
                borderRadius: 5,
                transition: 'width 0.3s ease-out',
              }} />
            </div>
          )
        })}
      </div>

      {/* Controls */}
      {interactive && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => onUpdate(Math.max(0, waterLogged - 250))}
            style={{ flex: 1, padding: '6px 0', borderRadius: 5, background: 'transparent', border: '1px solid #222', color: '#6b6b6b', fontSize: 12 }}
          >
            −250ml
          </button>
          <button
            onClick={() => onUpdate(waterLogged + 250)}
            style={{ flex: 2, padding: '8px 0', borderRadius: 8, background: '#f0f0f0', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none' }}
          >
            +250ml
          </button>
        </div>
      )}
    </div>
  )
}

export default WaterCard
