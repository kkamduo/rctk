import { create } from 'zustand'

export type ThemePreset = 'industrial-dark' | 'military' | 'clean' | 'warning' | 'custom'

export interface ThemeColors {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  border: string
  danger: string
  success: string
  warning: string
}

export const PRESETS: Record<ThemePreset, ThemeColors> = {
  'industrial-dark': {
    primary: '#f97316',
    accent: '#fb923c',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    border: '#374151',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#eab308',
  },
  'military': {
    primary: '#4ade80',
    accent: '#86efac',
    background: '#0f1a0f',
    surface: '#1a2e1a',
    text: '#d1fae5',
    border: '#2d4a2d',
    danger: '#f87171',
    success: '#4ade80',
    warning: '#fde047',
  },
  'clean': {
    primary: '#3b82f6',
    accent: '#60a5fa',
    background: '#f1f5f9',
    surface: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  'warning': {
    primary: '#f59e0b',
    accent: '#fbbf24',
    background: '#1c1008',
    surface: '#2d1f0e',
    text: '#fef3c7',
    border: '#78350f',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  'custom': {
    primary: '#6366f1',
    accent: '#818cf8',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#eab308',
  },
}

interface StyleState {
  preset: ThemePreset
  colors: ThemeColors
  bgImage: string | null
  setPreset: (preset: ThemePreset) => void
  setColor: (key: keyof ThemeColors, value: string) => void
  setBgImage: (image: string | null) => void
}

export const useStyleStore = create<StyleState>((set) => ({
  preset: 'industrial-dark',
  colors: PRESETS['industrial-dark'],
  bgImage: null,
  setPreset: (preset) => set({ preset, colors: PRESETS[preset] }),
  setColor: (key, value) =>
    set((s) => ({ colors: { ...s.colors, [key]: value }, preset: 'custom' })),
  setBgImage: (image) => set({ bgImage: image }),
}))
