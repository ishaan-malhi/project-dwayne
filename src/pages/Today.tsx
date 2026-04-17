import { useState, type FC } from 'react'
import { getDayType, getDayLocation, getPhaseForDate, getLoadForPhase, getSpeedTarget,
  getZone2Duration, getWeekForDate, getDaysRemaining, getTotalPlanDays, getTipForDate,
  formatDate, addDays, today, isWeek6TimeTrialDay } from '../utils/plan'
import { PHASES } from '../data/phases'
import { STRENGTH_A, STRENGTH_B, VO2_PARAMS } from '../data/sessions'
import { MACRO_TARGETS, WATER_TARGET_ML } from '../data/nutrition'
import { SUPPLEMENTS } from '../data/supplements'
import { SESSION_LABELS, SESSION_SUBTITLES } from '../data/schedule'
import { useSessionStore } from '../store/sessionStore'
import { useNutritionStore } from '../store/nutritionStore'
import SessionLogSheet from '../components/SessionLogSheet'
import Sheet from '../components/Sheet'
import WaterCard from '../components/WaterCard'
import ProgressRing from '../components/ProgressRing'

const SESSION_COLORS: Record<string, string> = {
  STRENGTH_A: '#5ba3ff', STRENGTH_B: '#5ba3ff',
  VO2: '#ff4747', ZONE2: '#47ff8a', SPEED: '#ffaa47', REST: '#6b6b6b',
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100))
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span style={{ fontSize: 10, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#f0f0f0' }}>
          {value}<span style={{ color: '#6b6b6b' }}>/{target}g</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: '#1c1c1c' }}>
        <div style={{ height: 4, borderRadius: 2, background: color, width: `${pct}%`, transition: 'width 0.3s ease-out' }} />
      </div>
    </div>
  )
}

const Today: FC = () => {
  const [date, setDate] = useState(today())
  const [showLog, setShowLog] = useState(false)
  const [showMacros, setShowMacros] = useState(false)
  const [showSupplements, setShowSupplements] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [skipReason, setSkipReason] = useState('')

  const dayType = getDayType(date)
  const phase = getPhaseForDate(date)
  const week = getWeekForDate(date)
  const location = getDayLocation(date)
  const sessionColor = SESSION_COLORS[dayType]
  const phaseInfo = PHASES.find(p => p.phase === phase)
  const daysLeft = getDaysRemaining()
  const totalDays = getTotalPlanDays()
  const tip = getTipForDate(date)
  const isTodayDate = date === today()

  const sessionLog = useSessionStore(s => s.getLog(date))
  const streak = useSessionStore(s => s.getStreak())
  const { skipSession, unskipSession } = useSessionStore()
  const nutritionLog = useNutritionStore(s => s.getLog(date))
  const proteinLogged = useNutritionStore(s => s.proteinTotal(date))
  const caloriesLogged = useNutritionStore(s => s.caloriesTotal(date))
  const updateWater = useNutritionStore(s => s.updateWater)
  const toggleSupplement = useNutritionStore(s => s.toggleSupplement)
  const checkedSupplements = nutritionLog?.checkedSupplements ?? []

  const macroTarget = MACRO_TARGETS[dayType]
  const waterTarget = WATER_TARGET_ML[dayType]
  const waterLogged = nutritionLog?.water ?? 0

  const exercises = dayType === 'STRENGTH_A' ? STRENGTH_A : dayType === 'STRENGTH_B' ? STRENGTH_B : []
  const speedTarget = dayType === 'SPEED' ? getSpeedTarget(week) : null
  const zone2Duration = dayType === 'ZONE2' ? getZone2Duration(week) : null
  const isTT = isWeek6TimeTrialDay(date)

  const dailySupps = SUPPLEMENTS.filter(s =>
    s.timing === 'morning' || s.timing === 'with-meals' || s.timing === 'night'
  )
  const todaySupps = SUPPLEMENTS.filter(s =>
    s.timing === 'pre-session' && s.sessionTypes?.includes(dayType)
  )
  const isTrainingDay = dayType !== 'REST'

  const now = new Date()
  const hour = now.getHours()
  const show3pmAlert = isTodayDate && hour >= 15 && proteinLogged < 90

  const carbsLogged = Math.round((nutritionLog?.meals ?? []).reduce((s, m) => s + m.macros.carbs, 0))
  const fatLogged = Math.round((nutritionLog?.meals ?? []).reduce((s, m) => s + m.macros.fat, 0))

  const showLogCTA = isTrainingDay && isTodayDate && !sessionLog?.completed && !sessionLog?.skipped

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1c1c1c' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(d => addDays(d, -1))}
              aria-label="Previous day"
              style={{ width: 40, height: 40, borderRadius: 8, background: '#1c1c1c', border: '1px solid #222', color: '#6b6b6b', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >‹</button>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0', minWidth: 100, textAlign: 'center' }}>
              {formatDate(date)}
            </span>
            <button
              onClick={() => setDate(d => addDays(d, 1))}
              aria-label="Next day"
              style={{ width: 40, height: 40, borderRadius: 8, background: '#1c1c1c', border: '1px solid #222', color: '#6b6b6b', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >›</button>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1">
                <span style={{ fontSize: 13 }}>🔥</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#ffaa47' }}>{streak}</span>
              </div>
            )}
            <ProgressRing daysLeft={daysLeft} totalDays={totalDays} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>
            Phase {phase} · Wk {week}
          </span>
          {phaseInfo && <span style={{ fontSize: 10, color: '#6b6b6b' }}>— {phaseInfo.name}</span>}
        </div>
      </div>

      {show3pmAlert && (
        <div style={{ margin: '12px 16px 0', padding: '10px 12px', background: 'rgba(255,71,71,0.08)', border: '1px solid rgba(255,71,71,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#ff4747' }}>
            3pm check — you're at {proteinLogged}g protein. Have a whey shake now.
          </p>
        </div>
      )}

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Session card */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, overflow: 'hidden' }}>
          {/* Card header row */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="flex items-center gap-2">
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: sessionColor, background: `${sessionColor}18`, padding: '3px 8px', borderRadius: 4,
              }}>
                {SESSION_LABELS[dayType]}
              </span>
              <span style={{ fontSize: 12, color: '#6b6b6b' }}>{SESSION_SUBTITLES[dayType]}</span>
            </div>

            {/* Status / secondary actions */}
            {sessionLog?.skipped ? (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 11, color: '#6b6b6b' }}>⊘ Skipped</span>
                <button onClick={() => unskipSession(date)}
                  style={{ fontSize: 11, color: '#5ba3ff', background: 'none', border: 'none', padding: 0 }}>
                  Undo
                </button>
              </div>
            ) : sessionLog?.completed ? (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 11, color: '#47ff8a' }}>✓ Done</span>
                <button onClick={() => setShowLog(true)}
                  style={{ fontSize: 11, color: '#6b6b6b', background: 'none', border: 'none', padding: 0 }}>
                  Edit
                </button>
              </div>
            ) : isTrainingDay && isTodayDate ? (
              <button
                onClick={() => { setSkipReason(''); setShowSkip(true) }}
                aria-label="Skip session"
                style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b6b6b', background: 'none', border: 'none', padding: 0, borderRadius: 4,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </button>
            ) : null}
          </div>

          {/* Card body */}
          {dayType === 'REST' ? (
            <div style={{ padding: '14px', textAlign: 'center', color: '#999', fontSize: 13 }}>
              Rest day. Prioritise sleep and hit your protein.
            </div>
          ) : exercises.length > 0 ? (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {exercises.map(ex => {
                const loggedSets = sessionLog?.sets?.filter(s => s.exerciseName === ex.name) ?? []
                const isLogged = sessionLog?.completed && loggedSets.length > 0
                return (
                  <div key={ex.name} className="flex items-baseline justify-between">
                    <span style={{ fontSize: 13, color: '#f0f0f0' }}>{ex.name}</span>
                    {isLogged ? (
                      <div className="flex items-baseline gap-2">
                        {loggedSets.map((s, i) => (
                          <span key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: sessionColor }}>
                            {s.reps > 0 ? `${s.reps}×` : ''}{s.actualLoad || '—'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontSize: 11, color: '#6b6b6b' }}>{ex.sets}×{ex.reps}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: sessionColor }}>
                          {getLoadForPhase(ex, phase)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : dayType === 'VO2' ? (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="flex justify-between">
                <span style={{ fontSize: 13, color: '#f0f0f0' }}>4×4 Intervals</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: sessionColor }}>{VO2_PARAMS.duration}</span>
              </div>
              <span style={{ fontSize: 11, color: '#999' }}>4 min at 90–95% HR max · 3 min recovery</span>
              {VO2_PARAMS.notes && <span style={{ fontSize: 11, color: '#999' }}>{VO2_PARAMS.notes}</span>}
            </div>
          ) : dayType === 'ZONE2' ? (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="flex justify-between">
                <span style={{ fontSize: 13, color: '#f0f0f0' }}>Bike — {zone2Duration}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: sessionColor }}>135–145 bpm</span>
              </div>
              <span style={{ fontSize: 11, color: '#999' }}>Nasal breathing only. Fully conversational.</span>
            </div>
          ) : dayType === 'SPEED' && speedTarget ? (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {isTT ? (
                <>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 600 }}>5km Time Trial</span>
                    <span style={{ fontSize: 10, background: '#ffaa4720', color: '#ffaa47', padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>MILESTONE</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: '#ffaa47' }}>Target: {speedTarget.pace}</span>
                  <span style={{ fontSize: 11, color: '#999' }}>6 weeks of work comes down to this.</span>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span style={{ fontSize: 13, color: '#f0f0f0' }}>{typeof speedTarget.reps === 'number' ? `${speedTarget.reps}×1km` : speedTarget.reps}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: sessionColor }}>{speedTarget.pace}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#999' }}>{speedTarget.rest} rest between reps</span>
                </>
              )}
            </div>
          ) : null}

          {location && (
            <div style={{ padding: '0 14px 10px' }}>
              <span style={{ fontSize: 10, color: '#6b6b6b' }}>📍 {location}</span>
            </div>
          )}

          {/* Primary Log CTA — full width, session color */}
          {showLogCTA && (
            <div style={{ padding: '0 14px 14px' }}>
              <button
                onClick={() => setShowLog(true)}
                aria-label={`Log ${SESSION_LABELS[dayType]} session`}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8,
                  background: sessionColor, color: '#0a0a0a',
                  fontSize: 13, fontWeight: 600, border: 'none',
                  letterSpacing: '0.01em',
                }}
              >
                Log session
              </button>
            </div>
          )}
        </div>

        {/* Water — above macros */}
        <WaterCard
          waterLogged={waterLogged}
          waterTarget={waterTarget}
          onUpdate={ml => updateWater(date, ml)}
          interactive={isTodayDate}
        />

        {/* Macros — collapsed by default */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <button
            className="flex items-center justify-between"
            style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            aria-expanded={showMacros}
            onClick={() => setShowMacros(v => !v)}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Macros</span>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#f0f0f0' }}>
                {caloriesLogged}<span style={{ color: '#6b6b6b', fontSize: 11 }}> / {macroTarget.calories} kcal</span>
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.15s ease-out', transform: showMacros ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </button>
          {showMacros && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <MacroBar label="Protein" value={proteinLogged} target={macroTarget.protein} color="#5ba3ff" />
              <MacroBar label="Carbs" value={carbsLogged} target={macroTarget.carbs} color="#ffaa47" />
              <MacroBar label="Fat" value={fatLogged} target={macroTarget.fat} color="#47ff8a" />
            </div>
          )}
        </div>

        {/* Supplements */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <button
            className="flex items-center justify-between"
            style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            aria-expanded={showSupplements}
            onClick={() => setShowSupplements(v => !v)}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Supplements</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.15s ease-out', transform: showSupplements ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showSupplements && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333', marginBottom: 6 }}>Daily</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {dailySupps.map(s => {
                    const checked = checkedSupplements.includes(s.name)
                    return (
                      <button key={s.name} onClick={() => isTodayDate && toggleSupplement(date, s.name)}
                        aria-label={`${checked ? 'Uncheck' : 'Check'} ${s.name}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '2px 0', cursor: isTodayDate ? 'pointer' : 'default', width: '100%', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: checked ? 'none' : '1px solid #333', background: checked ? '#47ff8a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>}
                          </div>
                          <span style={{ fontSize: 12, color: checked ? '#6b6b6b' : '#f0f0f0', textDecoration: checked ? 'line-through' : 'none' }}>{s.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#6b6b6b' }}>{s.dose} · {s.timing === 'with-meals' ? 'with meals' : s.timing}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              {isTrainingDay && todaySupps.length > 0 && (
                <div>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333', marginBottom: 6 }}>Today</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {todaySupps.map(s => {
                      const checked = checkedSupplements.includes(s.name)
                      return (
                        <button key={s.name} onClick={() => isTodayDate && toggleSupplement(date, s.name)}
                          aria-label={`${checked ? 'Uncheck' : 'Check'} ${s.name}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '2px 0', cursor: isTodayDate ? 'pointer' : 'default', width: '100%', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: checked ? 'none' : '1px solid #333', background: checked ? '#47ff8a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>}
                            </div>
                            <span style={{ fontSize: 12, color: checked ? '#6b6b6b' : '#f0f0f0', textDecoration: checked ? 'line-through' : 'none' }}>{s.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#6b6b6b' }}>{s.dose} · pre-session</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tip */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 6 }}>Today's note</p>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{tip}</p>
        </div>

      </div>

      <SessionLogSheet open={showLog} onClose={() => setShowLog(false)} date={date} />

      <Sheet open={showSkip} onClose={() => setShowSkip(false)} title="Skip Session">
        <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#999' }}>Why are you skipping?</p>
          <textarea value={skipReason} onChange={e => setSkipReason(e.target.value)}
            placeholder="Illness, travel, injury… (optional)" rows={3} autoFocus
            style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 13, padding: '8px 10px', resize: 'none', fontFamily: 'inherit' }} />
          <button onClick={() => { skipSession(date, skipReason.trim()); setShowSkip(false) }}
            style={{ width: '100%', padding: '12px', borderRadius: 8, background: '#f0f0f0', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none' }}>
            Skip Session
          </button>
        </div>
      </Sheet>
    </div>
  )
}

export default Today
