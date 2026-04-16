import type { PhaseInfo, Phase } from '../types'

export const PLAN_START = '2026-04-13'
export const PLAN_END = '2026-06-03'

export const PHASES: PhaseInfo[] = [
  {
    phase: 1,
    weekStart: 1,
    weekEnd: 3,
    name: 'Foundation',
    focus: 'Re-establish patterns, fat mobilisation begins',
    deficit: '–350 to –450 kcal',
  },
  {
    phase: 2,
    weekStart: 4,
    weekEnd: 5,
    name: 'Intensity Ramp',
    focus: 'Peak training load, aggressive fat loss',
    deficit: '–500 kcal',
  },
  {
    phase: 3,
    weekStart: 6,
    weekEnd: 7,
    name: 'Peak & Polish',
    focus: 'Volume taper, sharpness maintained',
    deficit: '–350 kcal (wk 6), maintenance (wk 7)',
  },
]

export const PHASE_BY_WEEK: Record<number, Phase> = {
  1: 1, 2: 1, 3: 1,
  4: 2, 5: 2,
  6: 3, 7: 3,
}
