import { create } from 'zustand'

interface ApiState {
  apiKey: string
  setApiKey: (key: string) => void
}

export const useApiStore = create<ApiState>((set) => ({
  apiKey: localStorage.getItem('rctk_api_key') || '',
  setApiKey: (key) => {
    localStorage.setItem('rctk_api_key', key)
    set({ apiKey: key })
  },
}))
