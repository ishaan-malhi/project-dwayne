import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  claudeApiKey: string
  height: number  // cm, 0 = unset
  setApiKey: (key: string) => void
  setHeight: (cm: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      claudeApiKey: '',
      height: 0,
      setApiKey: (key) => set({ claudeApiKey: key.trim() }),
      setHeight: (cm) => set({ height: cm }),
    }),
    { name: 'dwayne:settings' }
  )
)
