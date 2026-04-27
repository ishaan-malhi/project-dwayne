import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  height: number        // cm, 0 = unset
  notificationsEnabled: boolean
  reminderHour: number  // 0–23, default 19 (7pm)
  setHeight: (cm: number) => void
  setNotificationsEnabled: (v: boolean) => void
  setReminderHour: (h: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      height: 0,
      notificationsEnabled: false,
      reminderHour: 19,
      setHeight: (cm) => set({ height: cm }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setReminderHour: (h) => set({ reminderHour: h }),
    }),
    { name: 'dwayne:settings' }
  )
)
