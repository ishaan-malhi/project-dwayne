import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProgressEntry, WeeklyPhoto } from '../types'

interface ProgressState {
  entries: ProgressEntry[]
  weeklyPhotos: WeeklyPhoto[]
  logWeighIn: (date: string, weight: number, bfPercent?: number) => void
  logBf: (date: string, bfPercent: number) => void
  logFiveKm: (date: string, seconds: number) => void
  getEntry: (date: string) => ProgressEntry | undefined
  latestWeight: () => number | undefined
  weightHistory: () => Array<{ date: string; weight: number }>
  fiveKmHistory: () => Array<{ date: string; seconds: number }>
  logWeeklyPhoto: (week: number, date: string, photoBase64: string) => void
  getWeeklyPhoto: (week: number) => WeeklyPhoto | undefined
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      entries: [],
      weeklyPhotos: [],

      logWeighIn: (date, weight, bfPercent) => {
        set(state => {
          const existing = state.entries.find(e => e.date === date)
          if (existing) {
            return {
              entries: state.entries.map(e =>
                e.date === date ? { ...e, weight, bfPercent } : e
              ),
            }
          }
          return { entries: [...state.entries, { date, weight, bfPercent }].sort((a, b) => a.date.localeCompare(b.date)) }
        })
      },

      logBf: (date, bfPercent) => {
        set(state => {
          const existing = state.entries.find(e => e.date === date)
          if (existing) {
            return { entries: state.entries.map(e => e.date === date ? { ...e, bfPercent } : e) }
          }
          return { entries: [...state.entries, { date, bfPercent }].sort((a, b) => a.date.localeCompare(b.date)) }
        })
      },

      logFiveKm: (date, seconds) => {
        set(state => {
          const existing = state.entries.find(e => e.date === date)
          if (existing) {
            return {
              entries: state.entries.map(e =>
                e.date === date ? { ...e, fiveKmTime: seconds } : e
              ),
            }
          }
          return { entries: [...state.entries, { date, fiveKmTime: seconds }].sort((a, b) => a.date.localeCompare(b.date)) }
        })
      },

      getEntry: (date) => get().entries.find(e => e.date === date),

      latestWeight: () => {
        const entries = get().entries.filter(e => e.weight != null)
        if (!entries.length) return undefined
        return entries[entries.length - 1].weight
      },

      weightHistory: () => {
        return get().entries
          .filter(e => e.weight != null)
          .map(e => ({ date: e.date, weight: e.weight! }))
      },

      fiveKmHistory: () => {
        return get().entries
          .filter(e => e.fiveKmTime != null)
          .map(e => ({ date: e.date, seconds: e.fiveKmTime! }))
      },

      logWeeklyPhoto: (week, date, photoBase64) => {
        set(state => ({
          weeklyPhotos: [
            ...state.weeklyPhotos.filter(p => p.week !== week),
            { week, date, photoBase64 },
          ],
        }))
      },

      getWeeklyPhoto: (week) => get().weeklyPhotos.find(p => p.week === week),
    }),
    { name: 'dwayne:progress' }
  )
)
