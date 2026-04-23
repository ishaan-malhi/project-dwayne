import { describe, it, expect, beforeEach, vi } from 'vitest'

// Bypass Zustand persist so no localStorage is needed in tests
vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}))

// Simple date-to-type map for the dates used in tests
const DAY_TYPES: Record<string, string> = {
  '2026-04-20': 'STRENGTH_A', // Monday
  '2026-04-21': 'REST',       // Tuesday
  '2026-04-22': 'VO2',        // Wednesday
  '2026-04-23': 'STRENGTH_B', // Thursday (today)
  '2026-04-24': 'ZONE2',      // Friday
  '2026-04-25': 'SPEED',      // Saturday
  '2026-04-26': 'REST',       // Sunday
  '2026-04-27': 'STRENGTH_A', // Monday
}

vi.mock('../utils/plan', () => ({
  today: () => '2026-04-23',
  addDays: (d: string, n: number) => {
    const [y, m, day] = d.split('-').map(Number)
    const date = new Date(y, m - 1, day)
    date.setDate(date.getDate() + n)
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  },
  getDayType: (d: string) => DAY_TYPES[d] ?? 'REST',
}))

import { useSessionStore } from '../store/sessionStore'

beforeEach(() => {
  useSessionStore.setState({ logs: {} })
})

// ─── bumpSession — data integrity ────────────────────────────────────────────

describe('bumpSession — data integrity', () => {
  it('stores bumpedTo on the source date', () => {
    const { bumpSession, getLog } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    expect(getLog('2026-04-23')?.bumpedTo).toBe('2026-04-24')
  })

  it('preserves the source day type on the log', () => {
    const { bumpSession, getLog } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    expect(getLog('2026-04-23')?.type).toBe('STRENGTH_B')
  })

  it('does not mark the source day as completed', () => {
    const { bumpSession, getLog } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    expect(getLog('2026-04-23')?.completed).toBe(false)
  })

  it('does not mark the source day as skipped', () => {
    const { bumpSession, getLog } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    expect(getLog('2026-04-23')?.skipped).toBeFalsy()
  })

  it('creates no log entry on the target date', () => {
    const { bumpSession, getLog } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    expect(getLog('2026-04-24')).toBeUndefined()
  })
})

// ─── getStreak — bump transparency ──────────────────────────────────────────

describe('getStreak — bumped days', () => {
  it('bumped-away day is transparent and does not break streak', () => {
    const { bumpSession, logSession, getStreak } = useSessionStore.getState()
    // Mon STRENGTH_A and Wed VO2 completed; Thu STRENGTH_B bumped
    logSession('2026-04-20', { date: '2026-04-20', type: 'STRENGTH_A', sets: [], notes: '', completed: true })
    logSession('2026-04-22', { date: '2026-04-22', type: 'VO2', sets: [], notes: '', completed: true })
    bumpSession('2026-04-23', '2026-04-24')
    // Today (Apr 23) has bumpedTo → transparent; should count Wed (1) and Mon (2)
    expect(getStreak()).toBe(2)
  })

  it('streak is zero when no workouts are completed and today is bumped', () => {
    const { bumpSession, getStreak } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    expect(getStreak()).toBe(0)
  })

  it('single completed workout gives streak of 1 regardless of following bump', () => {
    const { bumpSession, logSession, getStreak } = useSessionStore.getState()
    logSession('2026-04-22', { date: '2026-04-22', type: 'VO2', sets: [], notes: '', completed: true })
    bumpSession('2026-04-23', '2026-04-24')
    expect(getStreak()).toBe(1)
  })
})

// ─── effectiveDayType derivation (pure logic) ────────────────────────────────

describe('effectiveDayType derivation', () => {
  it('resolves to bumped type when a bumpSource exists for the date', () => {
    const { bumpSession } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    const { logs } = useSessionStore.getState()
    const bumpSource = Object.values(logs).find(l => l.bumpedTo === '2026-04-24')
    expect(bumpSource?.type).toBe('STRENGTH_B')
  })

  it('returns no bumpSource when nothing targets the date', () => {
    const { logs } = useSessionStore.getState()
    const bumpSource = Object.values(logs).find(l => l.bumpedTo === '2026-04-24')
    expect(bumpSource).toBeUndefined()
  })
})

// ─── showBumpCTA guard conditions (pure logic) ───────────────────────────────

describe('showBumpCTA guard conditions', () => {
  it('is false when session is already completed', () => {
    const { logSession, getLog } = useSessionStore.getState()
    logSession('2026-04-23', { date: '2026-04-23', type: 'STRENGTH_B', sets: [], notes: '', completed: true })
    const log = getLog('2026-04-23')
    expect(!log?.completed && !log?.bumpedTo && !log?.skipped).toBe(false)
  })

  it('is false when session is already bumped', () => {
    const { bumpSession, getLog } = useSessionStore.getState()
    bumpSession('2026-04-23', '2026-04-24')
    const log = getLog('2026-04-23')
    expect(!log?.completed && !log?.bumpedTo && !log?.skipped).toBe(false)
  })

  it('is false when tomorrow is already completed', () => {
    const { logSession, getLog } = useSessionStore.getState()
    logSession('2026-04-24', { date: '2026-04-24', type: 'ZONE2', sets: [], notes: '', completed: true })
    const tomorrowLog = getLog('2026-04-24')
    expect(!tomorrowLog?.completed).toBe(false)
  })

  it('is true when session is unlogged and tomorrow is free', () => {
    const { getLog } = useSessionStore.getState()
    const log = getLog('2026-04-23')
    const tomorrowLog = getLog('2026-04-24')
    expect(!log?.completed && !log?.bumpedTo && !log?.skipped && !tomorrowLog?.completed).toBe(true)
  })
})
