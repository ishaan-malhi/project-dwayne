import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionLog, SetLog, EmojiPulse } from '../types'
import { today, addDays, getDayType } from '../utils/plan'

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
        const isTraining = (d: string) => getDayType(d) !== 'REST'
        let streak = 0
        let cursor = today()
        let daysChecked = 0

        // If today is a training day that hasn't been logged yet, start from yesterday
        if (isTraining(cursor) && !logs[cursor]?.completed) {
          cursor = addDays(cursor, -1)
        }

        while (daysChecked < 60) {
          daysChecked++
          if (!isTraining(cursor)) {
            // REST day — skip without breaking the streak
            cursor = addDays(cursor, -1)
            continue
          }
          if (logs[cursor]?.completed) {
            streak++
            cursor = addDays(cursor, -1)
          } else {
            break
          }
        }
        return streak
      },
    }),
    {
      name: 'dwayne:session',
      // Migrate data that may have been saved under the wrong key
      onRehydrateStorage: () => (state) => {
        if (state && Object.keys(state.logs).length === 0) {
          try {
            const stale = localStorage.getItem('dwayne:sessions')
            if (stale) {
              const parsed = JSON.parse(stale)
              if (parsed?.state?.logs) state.logs = parsed.state.logs
              localStorage.removeItem('dwayne:sessions')
            }
          } catch { /* ignore */ }
        }
      },
    }
  )
)
