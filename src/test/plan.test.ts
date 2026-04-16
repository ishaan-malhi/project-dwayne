import { describe, it, expect } from 'vitest'
import {
  getWeekForDate, getPhaseForWeek, getDayType,
  getLoadForPhase, getSpeedTarget, isWeek6TimeTrialDay,
  getTipForDate, addDays,
} from '../utils/plan'

describe('getWeekForDate', () => {
  it('week 1 on plan start date', () => {
    expect(getWeekForDate('2026-04-13')).toBe(1)
  })
  it('week 1 on day 7', () => {
    expect(getWeekForDate('2026-04-19')).toBe(1)
  })
  it('week 2 starts April 20', () => {
    expect(getWeekForDate('2026-04-20')).toBe(2)
  })
  it('week 4 starts May 4', () => {
    expect(getWeekForDate('2026-05-04')).toBe(4)
  })
  it('week 6 starts May 18', () => {
    expect(getWeekForDate('2026-05-18')).toBe(6)
  })
  it('week 7 starts May 25', () => {
    expect(getWeekForDate('2026-05-25')).toBe(7)
  })
  it('clamps to 1 before plan start', () => {
    expect(getWeekForDate('2026-04-10')).toBe(1)
  })
  it('clamps to 7 after plan end', () => {
    expect(getWeekForDate('2026-06-10')).toBe(7)
  })
})

describe('getPhaseForWeek', () => {
  it('phase 1 for weeks 1–3', () => {
    expect(getPhaseForWeek(1)).toBe(1)
    expect(getPhaseForWeek(2)).toBe(1)
    expect(getPhaseForWeek(3)).toBe(1)
  })
  it('phase 2 for weeks 4–5', () => {
    expect(getPhaseForWeek(4)).toBe(2)
    expect(getPhaseForWeek(5)).toBe(2)
  })
  it('phase 3 for weeks 6–7', () => {
    expect(getPhaseForWeek(6)).toBe(3)
    expect(getPhaseForWeek(7)).toBe(3)
  })
})

describe('getDayType', () => {
  it('Monday = STRENGTH_A', () => {
    expect(getDayType('2026-04-13')).toBe('STRENGTH_A') // Mon
  })
  it('Tuesday = REST', () => {
    expect(getDayType('2026-04-14')).toBe('REST')
  })
  it('Wednesday = VO2', () => {
    expect(getDayType('2026-04-15')).toBe('VO2')
  })
  it('Thursday = STRENGTH_B', () => {
    expect(getDayType('2026-04-16')).toBe('STRENGTH_B')
  })
  it('Friday = ZONE2', () => {
    expect(getDayType('2026-04-17')).toBe('ZONE2')
  })
  it('Saturday = SPEED', () => {
    expect(getDayType('2026-04-18')).toBe('SPEED')
  })
  it('Sunday = REST', () => {
    expect(getDayType('2026-04-19')).toBe('REST')
  })
})

describe('getLoadForPhase', () => {
  const ex = {
    name: 'Trap Bar Deadlift',
    sets: 4, reps: '5',
    load: { phase1: '105–120kg', phase2: '125–127.5kg', phase3: '125kg ×3×3' },
  }
  it('returns phase1 load', () => {
    expect(getLoadForPhase(ex, 1)).toBe('105–120kg')
  })
  it('returns phase2 load', () => {
    expect(getLoadForPhase(ex, 2)).toBe('125–127.5kg')
  })
  it('returns phase3 load', () => {
    expect(getLoadForPhase(ex, 3)).toBe('125kg ×3×3')
  })
})

describe('getSpeedTarget', () => {
  it('week 1: 5 reps at 4:45/km', () => {
    const t = getSpeedTarget(1)
    expect(t.reps).toBe(5)
    expect(t.pace).toBe('4:45/km')
  })
  it('week 6: time trial', () => {
    const t = getSpeedTarget(6)
    expect(t.pace).toBe('Sub 22:30')
    expect(t.note).toContain('TIME TRIAL')
  })
})

describe('isWeek6TimeTrialDay', () => {
  it('true on Saturday of week 6', () => {
    expect(isWeek6TimeTrialDay('2026-05-23')).toBe(true) // Sat week 6
  })
  it('false on Saturday of week 1', () => {
    expect(isWeek6TimeTrialDay('2026-04-18')).toBe(false)
  })
  it('false on Monday of week 6', () => {
    expect(isWeek6TimeTrialDay('2026-05-18')).toBe(false)
  })
})

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-04-13', 7)).toBe('2026-04-20')
  })
  it('subtracts negative days', () => {
    expect(addDays('2026-04-20', -7)).toBe('2026-04-13')
  })
})

describe('getTipForDate', () => {
  it('returns a non-empty string', () => {
    const tip = getTipForDate('2026-04-13')
    expect(typeof tip).toBe('string')
    expect(tip.length).toBeGreaterThan(0)
  })
  it('cycles through tips without throwing', () => {
    for (let i = 0; i < 30; i++) {
      expect(() => getTipForDate(addDays('2026-04-13', i))).not.toThrow()
    }
  })
})
