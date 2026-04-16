import { useState, type FC } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { useProgressStore } from '../store/progressStore'
import { getDayType, getWeekForDate, formatShortDate, addDays, today, isWeek6TimeTrialDay, formatTime } from '../utils/plan'
import { SESSION_LABELS } from '../data/schedule'
import Sheet from '../components/Sheet'

const SESSION_COLORS: Record<string, string> = {
  STRENGTH_A: '#5ba3ff', STRENGTH_B: '#5ba3ff',
  VO2: '#ff4747', ZONE2: '#47ff8a', SPEED: '#ffaa47', REST: '#6b6b6b',
}

const EMOJI_MAP: Record<number, string> = { 1: '😴', 2: '😐', 3: '💪', 4: '🔥' }

const Logs: FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showWeighIn, setShowWeighIn] = useState(false)
  const [showFiveKm, setShowFiveKm] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [bfInput, setBfInput] = useState('')
  const [fiveKmMinutes, setFiveKmMinutes] = useState('')
  const [fiveKmSeconds, setFiveKmSeconds] = useState('')

  const { logs } = useSessionStore()
  const { logWeighIn, logFiveKm, weightHistory, fiveKmHistory } = useProgressStore()

  const weightData = weightHistory()
  const fiveKmData = fiveKmHistory()

  // Build last 21 days for calendar strip
  const days = Array.from({ length: 21 }, (_, i) => addDays(today(), -(20 - i)))

  const selectedLog = selectedDate ? logs[selectedDate] : null

  const handleWeighIn = () => {
    const w = parseFloat(weightInput)
    if (!w) return
    logWeighIn(today(), w, bfInput ? parseFloat(bfInput) : undefined)
    setWeightInput('')
    setBfInput('')
    setShowWeighIn(false)
  }

  const handleFiveKm = () => {
    const m = parseInt(fiveKmMinutes, 10) || 0
    const s = parseInt(fiveKmSeconds, 10) || 0
    const totalSeconds = m * 60 + s
    if (!totalSeconds) return
    logFiveKm(today(), totalSeconds)
    setFiveKmMinutes('')
    setFiveKmSeconds('')
    setShowFiveKm(false)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1c1c1c' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0' }}>Logs</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Calendar strip */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 8 }}>Sessions</p>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
            {days.map(d => {
              const log = logs[d]
              const dt = getDayType(d)
              const color = SESSION_COLORS[dt]
              const isToday = d === today()
              const isSelected = d === selectedDate
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(isSelected ? null : d)}
                  style={{
                    flexShrink: 0, width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4, padding: '6px 4px', borderRadius: 8,
                    background: isSelected ? '#1c1c1c' : 'transparent',
                    border: isToday ? `1px solid ${color}` : isSelected ? '1px solid #333' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase' }}>
                    {new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'narrow' })}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: isToday ? 600 : 400, color: isToday ? '#f0f0f0' : '#6b6b6b' }}>
                    {new Date(d + 'T12:00:00').getDate()}
                  </span>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: log?.completed ? color : dt !== 'REST' ? `${color}40` : 'transparent',
                  }} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected session detail */}
        {selectedDate && selectedLog && (
          <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{formatShortDate(selectedDate)}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: SESSION_COLORS[selectedLog.type], background: `${SESSION_COLORS[selectedLog.type]}18`, padding: '2px 6px', borderRadius: 4 }}>
                  {SESSION_LABELS[selectedLog.type]}
                </span>
              </div>
              {selectedLog.emojiPulse && (
                <span style={{ fontSize: 20 }}>{EMOJI_MAP[selectedLog.emojiPulse]}</span>
              )}
            </div>

            {selectedLog.sleepHours && (
              <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 8 }}>
                Sleep: <span style={{ color: selectedLog.sleepHours < 7 ? '#ff4747' : '#f0f0f0', fontFamily: 'JetBrains Mono, monospace' }}>{selectedLog.sleepHours}h</span>
              </p>
            )}

            {selectedLog.sets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {Array.from(new Set(selectedLog.sets.map(s => s.exerciseName))).map(name => {
                  const exSets = selectedLog.sets.filter(s => s.exerciseName === name)
                  return (
                    <div key={name}>
                      <span style={{ fontSize: 12, color: '#f0f0f0' }}>{name}</span>
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#6b6b6b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {exSets.map(s => `${s.actualLoad}×${s.reps}`).filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedLog.cardioActual && (
              <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8 }}>
                {selectedLog.cardioActual.duration && <span>{selectedLog.cardioActual.duration} min · </span>}
                {selectedLog.cardioActual.hr && <span>HR {selectedLog.cardioActual.hr} bpm</span>}
                {selectedLog.cardioActual.pace && <span> · {selectedLog.cardioActual.pace}</span>}
              </div>
            )}

            {selectedLog.notes && (
              <p style={{ fontSize: 12, color: '#6b6b6b', fontStyle: 'italic' }}>{selectedLog.notes}</p>
            )}
          </div>
        )}

        {/* Progress — weight */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Weight</span>
            <button
              onClick={() => setShowWeighIn(true)}
              style={{ fontSize: 11, color: '#f0f0f0', background: '#1c1c1c', border: '1px solid #333', borderRadius: 5, padding: '4px 10px' }}
            >
              + Log
            </button>
          </div>

          {weightData.length === 0 ? (
            <p style={{ fontSize: 12, color: '#6b6b6b' }}>No weigh-ins logged yet</p>
          ) : (
            <>
              {/* Sparkline */}
              <Sparkline data={weightData.slice(-8).map(e => e.weight)} color="#5ba3ff" />
              {/* Last entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {weightData.slice(-4).reverse().map(e => (
                  <div key={e.date} className="flex justify-between">
                    <span style={{ fontSize: 11, color: '#6b6b6b' }}>{formatShortDate(e.date)}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#f0f0f0' }}>{e.weight}kg</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Progress — 5km times */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>5km Times</span>
            <button
              onClick={() => setShowFiveKm(true)}
              style={{ fontSize: 11, color: '#f0f0f0', background: '#1c1c1c', border: '1px solid #333', borderRadius: 5, padding: '4px 10px' }}
            >
              + Log
            </button>
          </div>

          {fiveKmData.length === 0 ? (
            <p style={{ fontSize: 12, color: '#6b6b6b' }}>No times logged yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fiveKmData.map(e => {
                const week = getWeekForDate(e.date)
                const isTT = isWeek6TimeTrialDay(e.date)
                const isBenchmark = week === 4 || week === 6
                return (
                  <div
                    key={e.date}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: isTT ? '10px 12px' : '4px 0',
                      background: isTT ? 'rgba(255,170,71,0.06)' : 'transparent',
                      borderRadius: isTT ? 8 : 0,
                      border: isTT ? '1px solid rgba(255,170,71,0.2)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 11, color: '#6b6b6b' }}>{formatShortDate(e.date)}</span>
                      {isTT && <span style={{ fontSize: 9, background: '#ffaa4720', color: '#ffaa47', padding: '1px 5px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>TT</span>}
                      {isBenchmark && !isTT && <span style={{ fontSize: 9, background: '#5ba3ff20', color: '#5ba3ff', padding: '1px 5px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>BM</span>}
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isTT ? 18 : 13, color: isTT ? '#ffaa47' : '#f0f0f0', fontWeight: isTT ? 600 : 400 }}>
                      {formatTime(e.seconds)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Weigh-in sheet */}
      <Sheet open={showWeighIn} onClose={() => setShowWeighIn(false)} title="Log Weigh-in">
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 12 }}>
            Same conditions every time: morning, post-toilet, pre-food.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Weight (kg)</p>
              <input
                type="number"
                inputMode="decimal"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="80.5"
                style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', padding: '10px' }}
              />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>BF% estimate (optional)</p>
              <input
                type="number"
                inputMode="decimal"
                value={bfInput}
                onChange={e => setBfInput(e.target.value)}
                placeholder="16.5"
                style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', padding: '10px' }}
              />
            </div>
            <button
              onClick={handleWeighIn}
              style={{ width: '100%', padding: 12, borderRadius: 8, background: '#f0f0f0', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none' }}
            >
              Save
            </button>
          </div>
        </div>
      </Sheet>

      {/* 5km log sheet */}
      <Sheet open={showFiveKm} onClose={() => setShowFiveKm(false)} title="Log 5km Time">
        <div style={{ padding: '16px' }}>
          <div className="flex gap-3 items-end">
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Minutes</p>
              <input
                type="number"
                inputMode="numeric"
                value={fiveKmMinutes}
                onChange={e => setFiveKmMinutes(e.target.value)}
                placeholder="22"
                style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 20, fontFamily: 'JetBrains Mono, monospace', padding: '10px', textAlign: 'center' }}
              />
            </div>
            <span style={{ fontSize: 20, color: '#6b6b6b', paddingBottom: 10 }}>:</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Seconds</p>
              <input
                type="number"
                inputMode="numeric"
                value={fiveKmSeconds}
                onChange={e => setFiveKmSeconds(e.target.value)}
                placeholder="30"
                style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 20, fontFamily: 'JetBrains Mono, monospace', padding: '10px', textAlign: 'center' }}
              />
            </div>
          </div>
          <button
            onClick={handleFiveKm}
            style={{ width: '100%', padding: 12, borderRadius: 8, background: '#f0f0f0', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none', marginTop: 16 }}
          >
            Save
          </button>
        </div>
      </Sheet>
    </div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 200
  const h = 40
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 40 }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((v - min) / range) * (h - 8) - 4
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />
      })}
    </svg>
  )
}

export default Logs
