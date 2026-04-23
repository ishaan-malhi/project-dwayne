export type DayType = 'STRENGTH_A' | 'STRENGTH_B' | 'VO2' | 'ZONE2' | 'SPEED' | 'REST'
export type Phase = 1 | 2 | 3
export type EmojiPulse = 1 | 2 | 3 | 4 // 😴 😐 💪 🔥

export interface Exercise {
  name: string
  sets: number
  reps: string
  load: { phase1: string; phase2: string; phase3: string }
  notes?: string
}

export interface CardioParams {
  warmup?: string
  intervals?: string
  sets?: string
  rest?: string
  cooldown?: string
  duration: string
  hrTarget?: string
  notes?: string
}

export interface SpeedTarget {
  week: number
  reps: number | string
  pace: string
  rest: string
  note?: string
}

export interface MacroTarget {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface Supplement {
  name: string
  dose: string
  timing: 'morning' | 'pre-session' | 'night' | 'with-meals'
  sessionTypes?: DayType[]
  notes?: string
}

export interface SetLog {
  exerciseName: string
  setIndex: number
  actualLoad: string
  reps: number
  rpe?: number
}

export interface SessionLog {
  date: string
  type: DayType
  sets: SetLog[]
  cardioActual?: {
    duration?: number
    hr?: number
    pace?: string
    repsCompleted?: number
    photoBase64?: string
  }
  notes: string
  completed: boolean
  skipped?: boolean
  skipReason?: string
  bumpedTo?: string
  emojiPulse?: EmojiPulse
  rpe?: number
  sleepHours?: number
}

export interface MacroEstimate {
  protein: number
  carbs: number
  fat: number
  calories: number
  notes: string
}

export interface MealEntry {
  id: string
  timestamp: string
  description: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  photoBase64?: string
  photoMimeType?: string
  macros: MacroEstimate
}

export interface WeeklyPhoto {
  week: number
  date: string
  photoBase64: string
}

export interface NutritionLog {
  date: string
  meals: MealEntry[]
  water: number
  checkedSupplements?: string[]
}

export interface ProgressEntry {
  date: string
  weight?: number
  bfPercent?: number
  fiveKmTime?: number
}

export interface PhaseInfo {
  phase: Phase
  weekStart: number
  weekEnd: number
  name: string
  focus: string
  deficit: string
}
