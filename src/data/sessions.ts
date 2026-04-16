import type { Exercise, CardioParams, SpeedTarget } from '../types'

export const STRENGTH_A: Exercise[] = [
  {
    name: 'Trap Bar Deadlift',
    sets: 4,
    reps: '5',
    load: { phase1: '105–120kg', phase2: '125–127.5kg', phase3: '125kg ×3×3' },
  },
  {
    name: 'Romanian Deadlift',
    sets: 3,
    reps: '8',
    load: { phase1: '75–85kg', phase2: '90–95kg', phase3: '85kg' },
  },
  {
    name: 'Bent Over Row',
    sets: 4,
    reps: '8',
    load: { phase1: '55–65kg', phase2: '65–70kg', phase3: '65kg' },
  },
  {
    name: 'Lat Pulldown',
    sets: 3,
    reps: '10–12',
    load: { phase1: '47.5–52.5kg', phase2: '52.5–55kg', phase3: '52.5kg' },
  },
  {
    name: 'Face Pulls',
    sets: 3,
    reps: '15',
    load: { phase1: 'Light', phase2: 'Light', phase3: 'Light' },
    notes: 'Cable or band',
  },
  {
    name: 'Hanging Leg Raise',
    sets: 3,
    reps: '12',
    load: { phase1: 'BW', phase2: 'BW', phase3: 'BW' },
  },
]

export const STRENGTH_B: Exercise[] = [
  {
    name: 'Barbell Back Squat',
    sets: 4,
    reps: '6',
    load: { phase1: '80–95kg', phase2: '100–105kg', phase3: '100kg ×3×4' },
  },
  {
    name: 'Walking Lunges (DB)',
    sets: 3,
    reps: '20m',
    load: { phase1: '2×16kg', phase2: '2×18–20kg', phase3: '2×18kg' },
  },
  {
    name: 'Barbell Bench Press',
    sets: 4,
    reps: '6',
    load: { phase1: '70–75kg', phase2: '77.5–80kg', phase3: '75kg ×3×3' },
  },
  {
    name: 'Overhead Press',
    sets: 3,
    reps: '8',
    load: { phase1: '35–40kg', phase2: '40–42.5kg', phase3: '40kg' },
  },
  {
    name: 'Tricep Dips / Pushdowns',
    sets: 3,
    reps: '12',
    load: { phase1: 'BW / cable', phase2: 'BW / cable', phase3: 'BW / cable' },
  },
  {
    name: 'Plank + Dead Bug',
    sets: 3,
    reps: '40s each',
    load: { phase1: 'BW', phase2: 'BW', phase3: 'BW' },
  },
]

export const VO2_PARAMS: CardioParams = {
  warmup: '10 min easy jog',
  intervals: '4 min at 90–95% HR max',
  sets: '4 (Phase 1–2), 5 (Phase 2 wk 5 if recovering well)',
  rest: '3 min active recovery (walk/slow jog)',
  cooldown: '5 min walk',
  duration: '~40 min',
  notes: 'Never fasted. Eat 60–90 min before.',
}

// Duration by week number
export const ZONE2_DURATION: Record<number, string> = {
  1: '45 min', 2: '50 min', 3: '55 min', 4: '55 min', 5: '55 min', 6: '50 min', 7: '50 min',
}

export const ZONE2_PARAMS: CardioParams = {
  duration: '45–55 min',
  hrTarget: '135–145 bpm',
  notes: 'Nasal breathing only. Fully conversational pace. Exercise bike.',
}

export const SPEED_TARGETS: SpeedTarget[] = [
  { week: 1, reps: 5, pace: '4:45/km', rest: '90 sec walk' },
  { week: 2, reps: 5, pace: '4:40/km', rest: '90 sec walk' },
  { week: 3, reps: 6, pace: '4:40/km', rest: '90 sec walk' },
  { week: 4, reps: 6, pace: '4:35/km', rest: '90 sec walk' },
  { week: 5, reps: 6, pace: '4:30/km', rest: '90 sec walk' },
  { week: 6, reps: '5km TT', pace: 'Sub 22:30', rest: '—', note: 'TIME TRIAL — milestone session' },
  { week: 7, reps: 4, pace: '4:35/km', rest: '90 sec walk' },
]
