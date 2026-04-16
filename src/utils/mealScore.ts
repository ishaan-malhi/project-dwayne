import type { MacroEstimate, MacroTarget } from '../types'

export type MealGrade = 'A' | 'B' | 'C' | 'D'

export interface MealScore {
  grade: MealGrade
  score: number
  proteinFill: number   // % of remaining protein need filled
  calorieFit: 'fits' | 'tight' | 'over'
  note: string
}

export const GRADE_COLORS: Record<MealGrade, string> = {
  A: '#47ff8a',
  B: '#5ba3ff',
  C: '#ffaa47',
  D: '#ff4747',
}

export function scoreMeal(
  meal: MacroEstimate,
  target: MacroTarget,
  logged: { protein: number; calories: number }
): MealScore {
  const remainingProtein = Math.max(1, target.protein - logged.protein)
  const remainingCalories = Math.max(1, target.calories - logged.calories)

  // Protein fill (50%): how much of remaining protein does this meal cover?
  const proteinFill = Math.min(1, meal.protein / remainingProtein)
  const proteinScore = proteinFill * 100

  // Calorie fit (30%): does this meal stay within remaining budget?
  let calorieFitScore: number
  let calorieFit: 'fits' | 'tight' | 'over'
  if (meal.calories <= remainingCalories) {
    calorieFitScore = 100
    calorieFit = 'fits'
  } else if (meal.calories <= remainingCalories * 1.15) {
    calorieFitScore = 60
    calorieFit = 'tight'
  } else if (meal.calories <= remainingCalories * 1.3) {
    calorieFitScore = 30
    calorieFit = 'tight'
  } else {
    calorieFitScore = 0
    calorieFit = 'over'
  }

  // Protein density (20%): protein per calorie — 20g/100kcal = score 100
  const proteinDensityScore = Math.min(100, (meal.protein / Math.max(1, meal.calories)) * 500)

  const score = Math.round(proteinScore * 0.5 + calorieFitScore * 0.3 + proteinDensityScore * 0.2)

  let grade: MealGrade
  if (score >= 80) grade = 'A'
  else if (score >= 60) grade = 'B'
  else if (score >= 40) grade = 'C'
  else grade = 'D'

  const note = buildNote(grade, proteinFill, calorieFit, meal.protein, remainingProtein)
  return { grade, score, proteinFill: Math.round(proteinFill * 100), calorieFit, note }
}

function buildNote(
  grade: MealGrade,
  proteinFill: number,
  calorieFit: 'fits' | 'tight' | 'over',
  mealProtein: number,
  remainingProtein: number
): string {
  if (grade === 'A') return 'Perfect fit — high protein, within budget.'
  if (calorieFit === 'over') return 'Puts you over calorie target. Consider a smaller portion.'
  if (proteinFill < 0.3) return `Low protein (${mealProtein}g vs ${Math.round(remainingProtein)}g remaining). Add a source.`
  if (grade === 'B') return 'Good choice — hits most of your remaining protein need.'
  return 'Decent, but could use more protein or fewer calories.'
}
