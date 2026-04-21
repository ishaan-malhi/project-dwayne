import { type FC, useState, useEffect, useRef } from 'react'
import { STRENGTH_A, STRENGTH_B } from '../data/sessions'
import { getLoadForPhase, getPhaseForDate } from '../utils/plan'
import type { SetLog } from '../types'

type WorkoutPhase = 'active' | 'resting' | 'rest_done'

const PRESETS = [60, 90, 120, 180]
const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  open: boolean
  onClose: () => void
  onLogSession: (sets: SetLog[]) => void
  dayType: 'STRENGTH_A' | 'STRENGTH_B'
  date: string
}

const WorkoutMode: FC<Props> = ({ open, onClose, onLogSession, dayType, date }) => {
  const exercises = dayType === 'STRENGTH_A' ? STRENGTH_A : STRENGTH_B
  const phase = getPhaseForDate(date)

  const [exIdx, setExIdx] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [workoutPhase, setWorkoutPhase] = useState<WorkoutPhase>('active')
  const [restDuration, setRestDuration] = useState(90)
  const [timeLeft, setTimeLeft] = useState(90)
  const [isComplete, setIsComplete] = useState(false)
  const [loadInputs, setLoadInputs] = useState<Record<string, string>>({})

  // Keep a stable ref to onClose so the popstate handler always calls the latest version
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // History API — lets iOS back gesture / Android back button close the modal
  useEffect(() => {
    if (!open) return
    window.history.pushState({ workoutMode: true }, '')
    const handlePop = () => onCloseRef.current()
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [open])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setExIdx(0); setSetIdx(0)
      setWorkoutPhase('active')
      setRestDuration(90); setTimeLeft(90)
      setIsComplete(false)
      setLoadInputs({})
    }
  }, [open])

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Countdown
  useEffect(() => {
    if (workoutPhase !== 'resting') return
    if (timeLeft <= 0) { setWorkoutPhase('rest_done'); return }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [workoutPhase, timeLeft])

  if (!open) return null

  const ex = exercises[exIdx]

  function startRest() {
    setTimeLeft(restDuration)
    setWorkoutPhase('resting')
  }

  function advance() {
    const isLastSet = setIdx >= ex.sets - 1
    const isLastExercise = exIdx >= exercises.length - 1
    if (isLastSet && isLastExercise) { setIsComplete(true); return }
    if (isLastSet) { setExIdx(i => i + 1); setSetIdx(0) }
    else { setSetIdx(i => i + 1) }
    setWorkoutPhase('active')
  }

  function skipExercise() {
    const isLastExercise = exIdx >= exercises.length - 1
    if (isLastExercise) { setIsComplete(true); return }
    setExIdx(i => i + 1)
    setSetIdx(0)
    setWorkoutPhase('active')
  }

  function changePreset(duration: number) {
    setRestDuration(duration)
    if (workoutPhase === 'resting' || workoutPhase === 'rest_done') {
      setTimeLeft(duration)
      setWorkoutPhase('resting')
    }
  }

  function buildCollectedSets(): SetLog[] {
    return exercises.flatMap((e, ei) =>
      Array.from({ length: e.sets }, (_, si) => ({
        exerciseName: e.name,
        setIndex: si,
        actualLoad: loadInputs[`${ei}-${si}`] ?? '',
        reps: 0,
      }))
    )
  }

  // SVG arc
  const dashOffset =
    workoutPhase === 'active' ? 0
    : workoutPhase === 'resting' ? CIRCUMFERENCE * (1 - timeLeft / restDuration)
    : 0

  const arcColor = workoutPhase === 'rest_done' ? '#47ff8a' : '#5ba3ff'
  const centerText = workoutPhase === 'active' ? `${restDuration}s` : workoutPhase === 'resting' ? String(timeLeft) : '✓'
  const centerFill = workoutPhase === 'active' ? '#6b6b6b' : workoutPhase === 'resting' ? '#f0f0f0' : '#47ff8a'
  const centerSize = workoutPhase === 'rest_done' ? 28 : workoutPhase === 'resting' ? 32 : 20
  const arcTransition = workoutPhase === 'resting'
    ? 'stroke-dashoffset 1s linear, stroke 0.3s ease'
    : 'stroke 0.3s ease'

  const dayLabel = dayType === 'STRENGTH_A' ? 'STRENGTH A' : 'STRENGTH B'

  if (isComplete) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Workout complete"
        style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#0a0a0a',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px' }}
      >
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 56, color: '#47ff8a', lineHeight: 1, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0', marginBottom: 8 }}>Workout done</div>
          <div style={{ fontSize: 13, color: '#bbb', marginBottom: 40 }}>Log your sets to save the session</div>
          <button
            onClick={() => onLogSession(buildCollectedSets())}
            style={{ width: '100%', padding: 14, borderRadius: 8, background: '#f0f0f0',
              color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none', marginBottom: 12 }}
          >
            Log Session
          </button>
          <button
            onClick={onClose}
            style={{ width: '100%', padding: 14, borderRadius: 8, background: 'transparent',
              color: '#999', fontSize: 13, fontWeight: 500, border: 'none' }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workout mode"
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', padding: '0 16px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 8, flexShrink: 0 }}>
        <button
          onClick={onClose}
          aria-label="Close workout"
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#141414', border: '1px solid #222', borderRadius: 8, color: '#999' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#bbb' }}>
          {dayLabel}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#bbb',
          minWidth: 40, textAlign: 'right' }}>
          {exIdx + 1} / {exercises.length}
        </span>
      </div>

      {/* Exercise block */}
      <div style={{ marginTop: 24, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0', lineHeight: 1.25 }}>
              {ex.name}
            </div>
            <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>
              {getLoadForPhase(ex, phase)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#bbb' }}>
              Set {setIdx + 1} / {ex.sets}
            </span>
          </div>
        </div>

        {/* Load input — active phase only */}
        {workoutPhase === 'active' && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Load"
                value={loadInputs[`${exIdx}-${setIdx}`] ?? ''}
                onChange={e => setLoadInputs(prev => ({ ...prev, [`${exIdx}-${setIdx}`]: e.target.value }))}
                style={{ flex: 1, background: '#1c1c1c', border: '1px solid #222', borderRadius: 5,
                  color: '#f0f0f0', fontSize: 16, padding: '10px 12px' }}
              />
              <span style={{ fontSize: 12, color: '#6b6b6b', minWidth: 24 }}>kg</span>
            </div>
          </div>
        )}
      </div>

      {/* Circular timer */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0', flexShrink: 0 }}>
        <svg width={228} height={228} viewBox="0 0 228 228" aria-hidden="true">
          {/* Track */}
          <circle cx="114" cy="114" r={RADIUS} fill="none" stroke="#1c1c1c" strokeWidth="6" />
          {/* Progress arc */}
          <circle
            cx="114" cy="114" r={RADIUS} fill="none"
            stroke={arcColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '114px 114px', transition: arcTransition }}
          />
          {/* Center label */}
          <text
            x="114" y="114"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: centerSize,
              fill: centerFill, fontWeight: 500 }}
          >
            {centerText}
          </text>
        </svg>
      </div>

      {/* Rest presets */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16, flexShrink: 0 }}>
        {PRESETS.map(p => {
          const selected = p === restDuration
          return (
            <button
              key={p}
              onClick={() => changePreset(p)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${selected ? '#f0f0f0' : '#2e2e2e'}`,
                color: selected ? '#f0f0f0' : '#6b6b6b',
                background: 'transparent',
                fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {p}s
            </button>
          )
        })}
      </div>

      {/* Primary CTA */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        {workoutPhase === 'active' && (
          <button
            onClick={startRest}
            style={{ width: '100%', padding: 14, borderRadius: 8,
              background: '#5ba3ff', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none' }}
          >
            Set Done
          </button>
        )}
        {workoutPhase === 'resting' && (
          <button
            onClick={advance}
            style={{ width: '100%', padding: 14, borderRadius: 8,
              background: 'transparent', border: '1px solid #5ba3ff',
              color: '#5ba3ff', fontSize: 13, fontWeight: 600 }}
          >
            Skip Rest
          </button>
        )}
        {workoutPhase === 'rest_done' && (
          <button
            onClick={advance}
            style={{ width: '100%', padding: 14, borderRadius: 8,
              background: '#5ba3ff', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none' }}
          >
            Next Set →
          </button>
        )}
      </div>

      {/* Skip exercise */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, flexShrink: 0 }}>
        <button
          onClick={skipExercise}
          style={{ background: 'none', border: 'none', color: '#6b6b6b', fontSize: 12, padding: '10px 16px' }}
        >
          Skip exercise
        </button>
      </div>

      {/* Exercise progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24, flexShrink: 0 }}>
        {exercises.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === exIdx ? 10 : 8,
              height: i === exIdx ? 10 : 8,
              borderRadius: '50%',
              background: i <= exIdx ? '#5ba3ff' : '#333',
              flexShrink: 0,
              alignSelf: 'center',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default WorkoutMode
