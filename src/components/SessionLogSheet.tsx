import { useState, useRef, type FC, type CSSProperties } from 'react'
import Sheet from './Sheet'
import { useSessionStore } from '../store/sessionStore'
import { getDayType, getPhaseForDate, getLoadForPhase } from '../utils/plan'
import { STRENGTH_A, STRENGTH_B, VO2_PARAMS, ZONE2_PARAMS } from '../data/sessions'
import type { SetLog, EmojiPulse } from '../types'

interface SummaryRow { load: string; reps: number; rpe: number }

interface Props {
  open: boolean
  onClose: () => void
  date: string
  prefillSets?: SetLog[]
}

const EMOJI_OPTIONS: Array<{ value: EmojiPulse; emoji: string; label: string }> = [
  { value: 1, emoji: '😴', label: 'Easy' },
  { value: 2, emoji: '😐', label: 'OK' },
  { value: 3, emoji: '💪', label: 'Strong' },
  { value: 4, emoji: '🔥', label: 'Max' },
]

const inp: CSSProperties = {
  background: '#1c1c1c', border: '1px solid #222', borderRadius: 5,
  color: '#f0f0f0', fontSize: 16, padding: '6px 10px',
}

const SessionLogSheet: FC<Props> = ({ open, onClose, date, prefillSets }) => {
  const dayType = getDayType(date)
  const phase = getPhaseForDate(date)
  const { logSession, getLog } = useSessionStore()
  const existing = getLog(date)

  const exercises = dayType === 'STRENGTH_A' ? STRENGTH_A : dayType === 'STRENGTH_B' ? STRENGTH_B : []
  const isCardio = dayType === 'VO2' || dayType === 'ZONE2' || dayType === 'SPEED'

  const [summaryRows, setSummaryRows] = useState<Record<string, SummaryRow>>(() =>
    Object.fromEntries(exercises.map(ex => {
      const prefill = prefillSets?.filter(s => s.exerciseName === ex.name)
      const exExisting = existing?.sets?.filter(s => s.exerciseName === ex.name)
      return [ex.name, {
        load: prefill?.[0]?.actualLoad ?? exExisting?.[0]?.actualLoad ?? '',
        reps: prefill?.[0]?.reps ?? exExisting?.[0]?.reps ?? 0,
        rpe: exExisting?.[0]?.rpe ?? 0,
      }]
    }))
  )
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set())
  const [perSetData, setPerSetData] = useState<Record<string, SetLog[]>>(() =>
    Object.fromEntries(exercises.map(ex => [
      ex.name,
      existing?.sets?.filter(s => s.exerciseName === ex.name) ??
      Array.from({ length: ex.sets }, (_, i) => ({
        exerciseName: ex.name, setIndex: i, actualLoad: '', reps: 0,
      })),
    ]))
  )

  const [emojiPulse, setEmojiPulse] = useState<EmojiPulse | undefined>(existing?.emojiPulse)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [cardioActual, setCardioActual] = useState<NonNullable<ReturnType<typeof getLog>>['cardioActual']>(
    existing?.cardioActual ?? {}
  )

  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const toggleExpand = (exName: string) => {
    setExpandedEx(prev => {
      const n = new Set(prev)
      n.has(exName) ? n.delete(exName) : n.add(exName)
      return n
    })
  }

  const updatePerSet = (exName: string, idx: number, field: 'actualLoad' | 'reps', value: string) => {
    setPerSetData(prev => ({
      ...prev,
      [exName]: prev[exName].map((s, i) =>
        i === idx ? { ...s, [field]: field === 'reps' ? Number(value) : value } : s
      ),
    }))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const base64 = (ev.target?.result as string).split(',')[1]
      setCardioActual(a => ({ ...a, photoBase64: base64 }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleComplete = () => {
    const allSets: SetLog[] = exercises.flatMap(ex => {
      if (expandedEx.has(ex.name)) {
        return perSetData[ex.name].map(s => ({
          ...s, rpe: summaryRows[ex.name]?.rpe || undefined,
        }))
      }
      const row = summaryRows[ex.name]
      return Array.from({ length: ex.sets }, (_, i) => ({
        exerciseName: ex.name,
        setIndex: i,
        actualLoad: row.load,
        reps: row.reps,
        rpe: row.rpe || undefined,
      }))
    })
    logSession(date, {
      date,
      type: dayType,
      sets: allSets,
      cardioActual: cardioActual && Object.keys(cardioActual).length ? cardioActual : undefined,
      notes,
      completed: true,
      emojiPulse,
    })
    onClose()
  }

  const cardioInfo = dayType === 'VO2' ? VO2_PARAMS : dayType === 'ZONE2' ? ZONE2_PARAMS : null

  return (
    <Sheet open={open} onClose={onClose} title="Log Session">
      <div className="px-4 py-4 flex flex-col gap-5">

        {/* STRENGTH: summary rows with expand-to-per-set */}
        {exercises.map(ex => {
          const row = summaryRows[ex.name]
          const isExpanded = expandedEx.has(ex.name)
          return (
            <div key={ex.name}>
              {/* Exercise header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{ex.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#6b6b6b', fontFamily: 'JetBrains Mono, monospace' }}>
                    {getLoadForPhase(ex, phase)}
                  </span>
                  <button
                    onClick={() => toggleExpand(ex.name)}
                    aria-label={isExpanded ? 'Collapse per-set' : 'Expand per-set'}
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', border: '1px solid #333', borderRadius: 5, color: '#6b6b6b', flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease-out' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Summary row (default) */}
              {!isExpanded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto 1fr', gap: 6, alignItems: 'end' }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#6b6b6b', marginBottom: 3 }}>Load</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="text" inputMode="decimal" placeholder="—"
                        value={row.load}
                        onChange={e => setSummaryRows(p => ({ ...p, [ex.name]: { ...p[ex.name], load: e.target.value } }))}
                        style={{ ...inp, flex: 1, textAlign: 'center' }}
                      />
                      <span style={{ fontSize: 10, color: '#6b6b6b' }}>kg</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#6b6b6b', marginBottom: 3 }}>Reps</p>
                    <input
                      type="number" inputMode="numeric" placeholder="—"
                      value={row.reps || ''}
                      onChange={e => setSummaryRows(p => ({ ...p, [ex.name]: { ...p[ex.name], reps: Number(e.target.value) } }))}
                      style={{ ...inp, width: '100%', textAlign: 'center' }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', paddingBottom: 1 }}>
                    <p style={{ fontSize: 10, color: '#6b6b6b', marginBottom: 3 }}>Sets</p>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: '#f0f0f0',
                      display: 'block', padding: '6px 8px' }}>
                      {ex.sets}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#6b6b6b', marginBottom: 3 }}>RPE</p>
                    <input
                      type="number" inputMode="numeric" placeholder="—" min="1" max="10"
                      value={row.rpe || ''}
                      onChange={e => setSummaryRows(p => ({ ...p, [ex.name]: { ...p[ex.name], rpe: Number(e.target.value) } }))}
                      style={{ ...inp, width: '100%', textAlign: 'center' }}
                    />
                  </div>
                </div>
              )}

              {/* Expanded per-set rows */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {perSetData[ex.name]?.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 72px', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6b6b6b', textAlign: 'right' }}>{i + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="text" inputMode="decimal" placeholder="Load"
                          value={s.actualLoad}
                          onChange={e => updatePerSet(ex.name, i, 'actualLoad', e.target.value)}
                          style={{ ...inp, flex: 1 }}
                        />
                        <span style={{ fontSize: 10, color: '#6b6b6b' }}>kg</span>
                      </div>
                      <input
                        type="number" inputMode="numeric" placeholder="Reps"
                        value={s.reps || ''}
                        onChange={e => updatePerSet(ex.name, i, 'reps', e.target.value)}
                        style={{ ...inp, width: '100%', textAlign: 'center' }}
                      />
                    </div>
                  ))}
                  {/* RPE row when expanded */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#6b6b6b', minWidth: 28 }}>RPE</span>
                    <input
                      type="number" inputMode="numeric" placeholder="1–10" min="1" max="10"
                      value={summaryRows[ex.name]?.rpe || ''}
                      onChange={e => setSummaryRows(p => ({ ...p, [ex.name]: { ...p[ex.name], rpe: Number(e.target.value) } }))}
                      style={{ ...inp, width: 80, textAlign: 'center' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* CARDIO: contextual inputs + photo */}
        {isCardio && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cardioInfo && (
              <div style={{ background: '#1c1c1c', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: '#6b6b6b' }}>
                  {cardioInfo.duration}{cardioInfo.hrTarget ? ` · ${cardioInfo.hrTarget}` : ''}
                </p>
                {cardioInfo.notes && <p style={{ fontSize: 11, color: '#6b6b6b', marginTop: 2 }}>{cardioInfo.notes}</p>}
              </div>
            )}

            {dayType === 'VO2' && (
              <div className="flex gap-2">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Intervals (of 4)</p>
                  <input type="number" inputMode="numeric" placeholder="4"
                    value={cardioActual?.repsCompleted ?? ''}
                    onChange={e => setCardioActual(a => ({ ...a, repsCompleted: Number(e.target.value) }))}
                    style={{ ...inp, width: '100%', textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Avg HR (bpm)</p>
                  <input type="number" inputMode="numeric"
                    value={cardioActual?.hr ?? ''}
                    onChange={e => setCardioActual(a => ({ ...a, hr: Number(e.target.value) }))}
                    style={{ ...inp, width: '100%', textAlign: 'center' }}
                  />
                </div>
              </div>
            )}

            {dayType === 'ZONE2' && (
              <div className="flex gap-2">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Duration (min)</p>
                  <input type="number" inputMode="numeric"
                    value={cardioActual?.duration ?? ''}
                    onChange={e => setCardioActual(a => ({ ...a, duration: Number(e.target.value) }))}
                    style={{ ...inp, width: '100%', textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Avg HR (bpm)</p>
                  <input type="number" inputMode="numeric"
                    value={cardioActual?.hr ?? ''}
                    onChange={e => setCardioActual(a => ({ ...a, hr: Number(e.target.value) }))}
                    style={{ ...inp, width: '100%', textAlign: 'center' }}
                  />
                </div>
              </div>
            )}

            {dayType === 'SPEED' && (
              <div className="flex gap-2">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Reps completed</p>
                  <input type="number" inputMode="numeric"
                    value={cardioActual?.repsCompleted ?? ''}
                    onChange={e => setCardioActual(a => ({ ...a, repsCompleted: Number(e.target.value) }))}
                    style={{ ...inp, width: '100%', textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 4 }}>Avg pace (mm:ss)</p>
                  <input type="text" inputMode="text" placeholder="4:30"
                    value={cardioActual?.pace ?? ''}
                    onChange={e => setCardioActual(a => ({ ...a, pace: e.target.value }))}
                    style={{ ...inp, width: '100%', textAlign: 'center' }}
                  />
                </div>
              </div>
            )}

            {/* Photo evidence */}
            {cardioActual?.photoBase64 ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={`data:image/jpeg;base64,${cardioActual.photoBase64}`}
                  alt="Session evidence"
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                />
                <button
                  onClick={() => setCardioActual(a => { const n = { ...a }; delete n!.photoBase64; return n })}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#f0f0f0', borderRadius: 4, fontSize: 12, padding: '2px 8px' }}
                >×</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => cameraRef.current?.click()}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 5, background: '#1c1c1c', border: '1px solid #222', color: '#f0f0f0', fontSize: 12 }}>
                  Camera
                </button>
                <button onClick={() => uploadRef.current?.click()}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 5, background: '#1c1c1c', border: '1px solid #222', color: '#f0f0f0', fontSize: 12 }}>
                  Upload
                </button>
              </div>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
            <input ref={uploadRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </div>
        )}

        {/* How was it */}
        <div className="flex gap-2">
          {EMOJI_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEmojiPulse(emojiPulse === opt.value ? undefined : opt.value)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 8, fontSize: 22,
                border: emojiPulse === opt.value ? '2px solid #f0f0f0' : '1px solid #222',
                background: emojiPulse === opt.value ? '#1c1c1c' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span>{opt.emoji}</span>
              <span style={{ fontSize: 9, color: '#6b6b6b' }}>{opt.label}</span>
            </button>
          ))}
        </div>
        {emojiPulse === 4 && phase === 1 && (
          <p style={{ fontSize: 11, color: '#ffaa47', marginTop: -12 }}>
            Phase 1 — hold that load, don't progress yet.
          </p>
        )}

        {/* Notes */}
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 16, padding: '8px 10px', resize: 'none', fontFamily: 'inherit' }}
        />

        <button
          onClick={handleComplete}
          style={{ width: '100%', padding: '12px', borderRadius: 8, background: '#f0f0f0', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none', marginBottom: 8 }}
        >
          Complete Session
        </button>

      </div>
    </Sheet>
  )
}

export default SessionLogSheet
