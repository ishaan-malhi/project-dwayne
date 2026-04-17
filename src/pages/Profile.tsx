import { useState, useRef, type FC } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import {
  getDayType, getWeekForDate, getPhaseForDate, getPhaseForWeek, getLoadForPhase,
  formatShortDate, addDays, today, isWeek6TimeTrialDay, getSpeedTarget, getZone2Duration,
  getDaysRemaining, getTotalPlanDays,
} from '../utils/plan'
import ProgressRing from '../components/ProgressRing'
import { compressPhoto } from '../utils/photoUtils'
import { PHASES, PLAN_START } from '../data/phases'
import { STRENGTH_A, STRENGTH_B } from '../data/sessions'
import { SESSION_LABELS } from '../data/schedule'

const SESSION_COLORS: Record<string, string> = {
  STRENGTH_A: '#5ba3ff', STRENGTH_B: '#5ba3ff',
  VO2: '#ff4747', ZONE2: '#47ff8a', SPEED: '#ffaa47', REST: '#6b6b6b',
}

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DOW_TYPES = ['STRENGTH_A', 'REST', 'VO2', 'STRENGTH_B', 'ZONE2', 'SPEED', 'REST'] as const

function getCellDate(week: number, dowIndex: number): string {
  return addDays(PLAN_START, (week - 1) * 7 + dowIndex)
}

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 200, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return `${x},${y}`
  })
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {height > 16 && data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((v - min) / range) * (h - 6) - 3
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />
      })}
    </svg>
  )
}

function PhotoCell({ week, currentWeek, hasPhoto, isMissed, photoUnlocked, onCapture, onView, onUnlock }: {
  week: number
  currentWeek: number
  hasPhoto: boolean
  isMissed: boolean
  photoUnlocked: boolean
  onCapture: () => void
  onView: () => void
  onUnlock: () => void
}) {
  const isAvailable = week === currentWeek && !hasPhoto
  const isLocked = hasPhoto && !photoUnlocked
  const color = hasPhoto ? '#47ff8a' : isMissed ? '#ff4747' : isAvailable ? '#5ba3ff' : '#333'

  const handleClick = () => {
    if (isLocked) { onUnlock(); return }
    if (hasPhoto && photoUnlocked) { onView(); return }
    if (isAvailable) onCapture()
  }

  return (
    <button
      onClick={handleClick}
      aria-label={`Week ${week} photo`}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        background: 'none', border: 'none', padding: '4px 0',
        cursor: (isAvailable || hasPhoto) ? 'pointer' : 'default',
        opacity: week > currentWeek ? 0.35 : 1,
      }}
    >
      <div style={{ position: 'relative', width: 28, height: 28 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        {hasPhoto && isLocked && (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
        )}
        {(hasPhoto && !isLocked || isMissed) && (
          <span style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color, lineHeight: 1,
          }}>
            {hasPhoto ? '✓' : '✕'}
          </span>
        )}
      </div>
      <span style={{ fontSize: 8, color: '#6b6b6b', fontFamily: 'JetBrains Mono, monospace' }}>W{week}</span>
    </button>
  )
}

function WeekRow({ week, logs, todayStr, selectedCell, onSelect }: {
  week: number
  logs: Record<string, { completed?: boolean }>
  todayStr: string
  selectedCell: { week: number; dow: number } | null
  onSelect: (w: number, di: number) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(7, 1fr)', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>
        <span style={{ fontSize: 9, color: '#333', fontWeight: 600 }}>W{week}</span>
      </div>
      {Array.from({ length: 7 }, (_, di) => di).map(di => {
        const cellDate = getCellDate(week, di)
        const dayType = DOW_TYPES[di]
        const color = SESSION_COLORS[dayType]
        const log = logs[cellDate]
        const isToday = cellDate === todayStr
        const isSelected = selectedCell?.week === week && selectedCell?.dow === di
        const isPast = cellDate < todayStr
        return (
          <button
            key={di}
            aria-label={`${cellDate} ${dayType}`}
            onClick={() => onSelect(week, di)}
            style={{
              aspectRatio: '1', borderRadius: 4,
              border: isToday ? `1px solid ${color}` : isSelected ? '1px solid #444' : '1px solid transparent',
              background: isSelected ? '#1c1c1c' : 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            }}
          >
            {dayType !== 'REST' ? (
              <>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: log?.completed ? color : isPast ? `${color}30` : `${color}50`,
                }} />
                <span style={{ fontSize: 6, color: log?.completed ? color : isPast ? `${color}60` : `${color}80`, lineHeight: 1, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                  {log?.completed ? '✓' : ({ STRENGTH_A: 'S', STRENGTH_B: 'S', VO2: 'V', ZONE2: 'Z', SPEED: 'P' } as Record<string, string>)[dayType] ?? ''}
                </span>
              </>
            ) : (
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#222' }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

const Profile: FC = () => {
  const [selectedCell, setSelectedCell] = useState<{ week: number; dow: number } | null>(null)
  const [programExpanded, setProgramExpanded] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [editingHeight, setEditingHeight] = useState(false)
  const [heightInput, setHeightInput] = useState('')
  const [editingWeight, setEditingWeight] = useState(false)
  const [editingBf, setEditingBf] = useState(false)
  const [bfEditInput, setBfEditInput] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoWeek, setPhotoWeek] = useState<number | null>(null)
  const [photoUnlocked, setPhotoUnlocked] = useState(false)
  const [biometricPending, setBiometricPending] = useState(false)
  const [viewingPhotoWeek, setViewingPhotoWeek] = useState<number | null>(null)

  const { logs } = useSessionStore()
  const streak = useSessionStore(s => s.getStreak())
  const { logWeighIn, logBf, weightHistory, logWeeklyPhoto, getWeeklyPhoto } = useProgressStore()
  const { height, setHeight } = useSettingsStore()

  const todayStr = today()
  const currentWeek = getWeekForDate(todayStr)
  const currentPhase = getPhaseForDate(todayStr)
  const phaseInfo = PHASES.find(p => p.phase === currentPhase)
  const daysLeft = getDaysRemaining()
  const totalDays = getTotalPlanDays()

  const weightData = weightHistory()
  const latestEntry = weightData.slice(-1)[0]
  const latestWeight = latestEntry?.weight
  const latestBf = useProgressStore(s => s.getEntry(latestEntry?.date ?? ''))?.bfPercent

  const photoThisWeek = getWeeklyPhoto(currentWeek)

  const unlockPhotos = async () => {
    if (biometricPending || photoUnlocked) return
    setBiometricPending(true)
    try {
      const available = await (PublicKeyCredential as { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> })
        .isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false
      if (!available) {
        setPhotoUnlocked(true)
        return
      }
      const storedId = localStorage.getItem('dwayne_photo_cred_id')
      if (!storedId) {
        const cred = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { name: 'Project Dwayne', id: window.location.hostname },
            user: { id: new TextEncoder().encode('ishaan'), name: 'ishaan', displayName: 'Ishaan' },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
            authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
            timeout: 60000,
          },
        }) as PublicKeyCredential | null
        if (cred) {
          localStorage.setItem('dwayne_photo_cred_id', btoa(String.fromCharCode(...new Uint8Array(cred.rawId))))
          setPhotoUnlocked(true)
        }
      } else {
        const rawId = Uint8Array.from(atob(storedId), c => c.charCodeAt(0))
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            allowCredentials: [{ id: rawId, type: 'public-key' }],
            userVerification: 'required',
            timeout: 60000,
          },
        })
        if (assertion) setPhotoUnlocked(true)
      }
    } catch {
      // User cancelled or not supported — stay locked
    } finally {
      setBiometricPending(false)
    }
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || photoWeek === null) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string
      try {
        const compressed = await compressPhoto(dataUrl)
        logWeeklyPhoto(photoWeek, todayStr, compressed.split(',')[1])
      } catch {
        logWeeklyPhoto(photoWeek, todayStr, dataUrl.split(',')[1])
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
    setPhotoWeek(null)
  }

  const triggerPhotoCapture = (week: number) => {
    if (week !== currentWeek || getWeeklyPhoto(week)) return
    setPhotoWeek(week)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification(`Body — Week ${week} check-in`, { body: 'Time for your weekly progress photo.' })
        }
      })
    }
    setTimeout(() => photoRef.current?.click(), 50)
  }

  const handleCellSelect = (w: number, di: number) => {
    setSelectedCell(prev => (prev?.week === w && prev?.dow === di) ? null : { week: w, dow: di })
  }

  const selectedCellDate = selectedCell ? getCellDate(selectedCell.week, selectedCell.dow) : null
  const selectedDayType = selectedCellDate ? getDayType(selectedCellDate) : null
  const selectedPhase = selectedCell ? getPhaseForWeek(selectedCell.week) : 1

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>
            Phase {currentPhase} · Week {currentWeek}
          </span>
          {phaseInfo && <span style={{ fontSize: 11, color: '#6b6b6b' }}> — {phaseInfo.name}</span>}
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

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Height */}
          <div
            style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}
            onClick={() => { setHeightInput(height > 0 ? String(height) : ''); setEditingHeight(true) }}
          >
            <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Height</div>
            {editingHeight ? (
              <input
                type="number" inputMode="numeric" autoFocus value={heightInput}
                onChange={e => setHeightInput(e.target.value)}
                onBlur={() => { if (heightInput) setHeight(parseInt(heightInput, 10)); setEditingHeight(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { if (heightInput) setHeight(parseInt(heightInput, 10)); setEditingHeight(false) } }}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#f0f0f0', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', padding: 0, outline: 'none' }}
              />
            ) : (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: height > 0 ? '#f0f0f0' : '#333' }}>
                {height > 0 ? `${height}cm` : '—'}
              </div>
            )}
          </div>

          {/* Weight — inline edit */}
          <div
            style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}
            onClick={() => { if (!editingWeight) { setWeightInput(latestWeight ? String(latestWeight) : ''); setEditingWeight(true) } }}
          >
            <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Weight</div>
            {editingWeight ? (
              <input
                type="number" inputMode="decimal" autoFocus value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                onBlur={() => { if (weightInput) logWeighIn(todayStr, parseFloat(weightInput)); setEditingWeight(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { if (weightInput) logWeighIn(todayStr, parseFloat(weightInput)); setEditingWeight(false) } }}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#f0f0f0', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', padding: 0, outline: 'none' }}
              />
            ) : (
              <>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: latestWeight ? '#f0f0f0' : '#333' }}>
                  {latestWeight ? `${latestWeight}kg` : '—'}
                </div>
                {weightData.length >= 2 && (
                  <div style={{ marginTop: 6 }}>
                    <Sparkline data={weightData.slice(-6).map(e => e.weight)} color="#5ba3ff" height={14} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* BF% — inline edit */}
          <div
            style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}
            onClick={() => { setBfEditInput(latestBf ? String(latestBf) : ''); setEditingBf(true) }}
          >
            <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>BF%</div>
            {editingBf ? (
              <input
                type="number" inputMode="decimal" autoFocus value={bfEditInput}
                onChange={e => setBfEditInput(e.target.value)}
                onBlur={() => { if (bfEditInput) logBf(todayStr, parseFloat(bfEditInput)); setEditingBf(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { if (bfEditInput) logBf(todayStr, parseFloat(bfEditInput)); setEditingBf(false) } }}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#f0f0f0', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', padding: 0, outline: 'none' }}
              />
            ) : (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: latestBf ? '#f0f0f0' : '#333' }}>
                {latestBf ? `${latestBf}%` : '—'}
              </div>
            )}
          </div>
        </div>

        {/* Weekly photo section */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Progress Photos</span>
              {!photoUnlocked && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Locked">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
            </div>
            {!photoThisWeek && <span style={{ fontSize: 10, color: '#5ba3ff' }}>Tap W{currentWeek} to log</span>}
          </div>
          <div style={{ display: 'flex' }}>
            {Array.from({ length: 7 }, (_, i) => i + 1).map(w => (
              <PhotoCell
                key={w}
                week={w}
                currentWeek={currentWeek}
                hasPhoto={!!getWeeklyPhoto(w)}
                isMissed={w < currentWeek && !getWeeklyPhoto(w)}
                photoUnlocked={photoUnlocked}
                onCapture={() => triggerPhotoCapture(w)}
                onView={() => setViewingPhotoWeek(w)}
                onUnlock={unlockPhotos}
              />
            ))}
          </div>
        </div>

        {/* Program — collapsed by default, teasing current week */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Program</span>
            <button
              onClick={() => setProgramExpanded(v => !v)}
              aria-expanded={programExpanded}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#999', background: 'none', border: 'none', padding: '6px 0', minHeight: 28, letterSpacing: '0.04em', cursor: 'pointer' }}
            >
              {programExpanded ? 'Show less' : 'All weeks'}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.15s ease-out', transform: programExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          {/* Day headers — always visible */}
          <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
            <div />
            {DAY_HEADERS.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 9, color: '#6b6b6b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Current week row — always visible */}
          <WeekRow
            week={currentWeek}
            logs={logs}
            todayStr={todayStr}
            selectedCell={selectedCell}
            onSelect={handleCellSelect}
          />

          {/* Remaining weeks — only when expanded */}
          {programExpanded && (
            <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Array.from({ length: 7 }, (_, wi) => wi + 1)
                .filter(w => w !== currentWeek)
                .map(w => (
                  <WeekRow
                    key={w}
                    week={w}
                    logs={logs}
                    todayStr={todayStr}
                    selectedCell={selectedCell}
                    onSelect={handleCellSelect}
                  />
                ))}
            </div>
          )}

          {/* Cell detail */}
          {selectedCell && selectedCellDate && selectedDayType && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#1c1c1c', borderRadius: 6 }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, color: '#f0f0f0', fontWeight: 600 }}>{formatShortDate(selectedCellDate)}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: SESSION_COLORS[selectedDayType], background: `${SESSION_COLORS[selectedDayType]}18`,
                  padding: '2px 6px', borderRadius: 3,
                }}>
                  {SESSION_LABELS[selectedDayType]}
                </span>
              </div>
              {selectedDayType === 'STRENGTH_A' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {STRENGTH_A.map(ex => (
                    <div key={ex.name} className="flex items-baseline justify-between">
                      <span style={{ fontSize: 11, color: '#f0f0f0' }}>{ex.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: SESSION_COLORS.STRENGTH_A }}>
                        {ex.sets}×{ex.reps} · {getLoadForPhase(ex, selectedPhase)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {selectedDayType === 'STRENGTH_B' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {STRENGTH_B.map(ex => (
                    <div key={ex.name} className="flex items-baseline justify-between">
                      <span style={{ fontSize: 11, color: '#f0f0f0' }}>{ex.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: SESSION_COLORS.STRENGTH_B }}>
                        {ex.sets}×{ex.reps} · {getLoadForPhase(ex, selectedPhase)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {selectedDayType === 'VO2' && (
                <span style={{ fontSize: 11, color: '#6b6b6b' }}>4×4 intervals · 4 min at 90–95% HR · 3 min recovery</span>
              )}
              {selectedDayType === 'ZONE2' && (
                <span style={{ fontSize: 11, color: '#6b6b6b' }}>Bike — {getZone2Duration(selectedCell!.week)} · 135–145 bpm</span>
              )}
              {selectedDayType === 'SPEED' && (
                <span style={{ fontSize: 11, color: '#6b6b6b' }}>
                  {(() => {
                    const t = getSpeedTarget(selectedCell!.week)
                    return isWeek6TimeTrialDay(selectedCellDate)
                      ? `5km TIME TRIAL — ${t.pace}`
                      : `${t.reps}×1km @ ${t.pace} · ${t.rest} rest`
                  })()}
                </span>
              )}
              {selectedDayType === 'REST' && (
                <span style={{ fontSize: 11, color: '#6b6b6b' }}>Rest day</span>
              )}
            </div>
          )}
        </div>

        {/* Exercise Inventory — muscle group names only */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setShowInventory(v => !v)}
            aria-expanded={showInventory}
            style={{
              width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Exercise Inventory</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.15s ease-out', transform: showInventory ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showInventory && (
            <div style={{ borderTop: '1px solid #1c1c1c', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Hinge + Pull', exercises: STRENGTH_A },
                { label: 'Squat + Push', exercises: STRENGTH_B },
              ].map(group => (
                <div key={group.label}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: '#5ba3ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {group.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {group.exercises.map(ex => (
                      <span key={ex.name} style={{ fontSize: 12, color: '#f0f0f0' }}>{ex.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />

      {/* Photo viewer overlay */}
      {viewingPhotoWeek !== null && (() => {
        const entry = getWeeklyPhoto(viewingPhotoWeek)
        return entry ? (
          <div
            role="dialog"
            aria-label={`Week ${viewingPhotoWeek} progress photo`}
            onClick={() => setViewingPhotoWeek(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <img
              src={`data:image/jpeg;base64,${entry.photoBase64}`}
              alt={`Week ${viewingPhotoWeek} progress`}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }}
            />
            <span style={{ color: '#6b6b6b', fontSize: 11, marginTop: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              W{viewingPhotoWeek} · {entry.date} · tap to close
            </span>
          </div>
        ) : null
      })()}

    </div>
  )
}

export default Profile
