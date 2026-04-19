import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  height: number  // cm, 0 = unset
  setHeight: (cm: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      height: 0,
      setHeight: (cm) => set({ height: cm }),
    }),
    { name: 'dwayne:settings' }
  )
)
