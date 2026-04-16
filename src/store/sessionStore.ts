import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionLog, SetLog, EmojiPulse } from '../types'
import { today, addDays } from '../utils/plan'

interface SessionState {
  logs: Record<string, SessionLog>
  logSession: (date: string, log: SessionLog) => void
  updateSets: (date: string, sets: SetLog[]) => void
  completeSession: (date: string, opts: {
    notes: string
    emojiPulse?: EmojiPulse
    rpe?: number
    sleepHours?: number
    cardioActual?: SessionLog['cardioActual']
  }) => void
  skipSession: (date: string, reason: string) => void
  unskipSession: (date: string) => void
  getLog: (date: string) => SessionLog | undefined
  getStreak: () => number
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      logs: {},

      logSession: (date, log) => {
        set(state => ({ logs: { ...state.logs, [date]: log } }))
      },

      updateSets: (date, sets) => {
        set(state => {
          const existing = state.logs[date]
          if (!existing) return state
          return { logs: { ...state.logs, [date]: { ...existing, sets } } }
        })
      },

      completeSession: (date, opts) => {
        set(state => {
          const existing = state.logs[date] ?? {
            date,
            type: 'REST',
            sets: [],
            notes: '',
            completed: false,
          }
          return {
            logs: {
              ...state.logs,
              [date]: {
                ...existing,
                ...opts,
                completed: true,
              },
            },
          }
        })
      },

      skipSession: (date, reason) => {
        set(state => {
          const existing = state.logs[date] ?? { date, type: 'REST', sets: [], notes: '', completed: false }
          return {
            logs: {
              ...state.logs,
              [date]: { ...existing, completed: false, skipped: true, skipReason: reason || undefined },
            },
          }
        })
      },

      unskipSession: (date) => {
        set(state => {
          const existing = state.logs[date]
          if (!existing) return state
          const { skipped: _s, skipReason: _r, ...rest } = existing
          return { logs: { ...state.logs, [date]: { ...rest, completed: false } } }
        })
      },

      getLog: (date) => get().logs[date],

      getStreak: () => {
        const { logs } = get()
        let streak = 0
        let cursor = today()
        // Start from yesterday if today not yet completed
        if (!logs[cursor]?.completed) {
          cursor = addDays(cursor, -1)
        }
        while (true) {
          const log = logs[cursor]
          if (log?.completed) {
            streak++
            cursor = addDays(cursor, -1)
          } else {
            break
          }
          if (streak > 100) break
        }
        return streak
      },
    }),
    { name: 'dwayne:sessions' }
  )
)
