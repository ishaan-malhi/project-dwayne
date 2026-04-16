import type { DayType } from '../types'

// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export const WEEKLY_SCHEDULE: Record<number, { type: DayType; location?: string }> = {
  0: { type: 'REST' },
  1: { type: 'STRENGTH_A', location: 'Office gym' },
  2: { type: 'REST' },
  3: { type: 'VO2', location: 'Flexible' },
  4: { type: 'STRENGTH_B', location: 'Office gym' },
  5: { type: 'ZONE2', location: 'Home or gym' },
  6: { type: 'SPEED', location: 'Outdoor' },
}

export const SESSION_LABELS: Record<DayType, string> = {
  STRENGTH_A: 'Strength A',
  STRENGTH_B: 'Strength B',
  VO2: 'VO2 Max',
  ZONE2: 'Zone 2',
  SPEED: 'Speed',
  REST: 'Rest',
}

export const SESSION_SUBTITLES: Record<DayType, string> = {
  STRENGTH_A: 'Hinge + Pull',
  STRENGTH_B: 'Squat + Push',
  VO2: '4×4 Intervals',
  ZONE2: '50 min bike',
  SPEED: '1km Repeats',
  REST: 'Recovery',
}
