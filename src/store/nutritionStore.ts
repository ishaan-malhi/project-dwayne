import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NutritionLog, MealEntry } from '../types'

interface NutritionState {
  logs: Record<string, NutritionLog>
  addMeal: (date: string, meal: MealEntry) => void
  removeMeal: (date: string, mealId: string) => void
  updateWater: (date: string, ml: number) => void
  toggleSupplement: (date: string, name: string) => void
  getLog: (date: string) => NutritionLog | undefined
  proteinTotal: (date: string) => number
  caloriesTotal: (date: string) => number
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      logs: {},

      addMeal: (date, meal) => {
        set(state => {
          const existing = state.logs[date] ?? { date, meals: [], water: 0 }
          return {
            logs: {
              ...state.logs,
              [date]: { ...existing, meals: [...existing.meals, meal] },
            },
          }
        })
      },

      removeMeal: (date, mealId) => {
        set(state => {
          const existing = state.logs[date]
          if (!existing) return state
          return {
            logs: {
              ...state.logs,
              [date]: { ...existing, meals: existing.meals.filter(m => m.id !== mealId) },
            },
          }
        })
      },

      updateWater: (date, ml) => {
        set(state => {
          const existing = state.logs[date] ?? { date, meals: [], water: 0 }
          return {
            logs: {
              ...state.logs,
              [date]: { ...existing, water: Math.max(0, ml) },
            },
          }
        })
      },

      toggleSupplement: (date, name) => {
        set(state => {
          const existing = state.logs[date] ?? { date, meals: [], water: 0 }
          const checked = existing.checkedSupplements ?? []
          const next = checked.includes(name)
            ? checked.filter(n => n !== name)
            : [...checked, name]
          return {
            logs: { ...state.logs, [date]: { ...existing, checkedSupplements: next } },
          }
        })
      },

      getLog: (date) => get().logs[date],

      proteinTotal: (date) => {
        const log = get().logs[date]
        if (!log) return 0
        return Math.round(log.meals.reduce((sum, m) => sum + m.macros.protein, 0))
      },

      caloriesTotal: (date) => {
        const log = get().logs[date]
        if (!log) return 0
        return Math.round(log.meals.reduce((sum, m) => sum + m.macros.calories, 0))
      },
    }),
    { name: 'dwayne:nutrition' }
  )
)
