import { create } from 'zustand'
import type { ButtonConfig, GridConfig, GridPreset, RemoteConfig } from '../types/remote'

export const GRID_PRESETS: Record<GridPreset, { rows: number; cols: number }> = {
  '2x3': { rows: 2, cols: 3 },
  '2x4': { rows: 2, cols: 4 },
  '3x3': { rows: 3, cols: 3 },
  '3x4': { rows: 3, cols: 4 },
  '4x4': { rows: 4, cols: 4 },
  '2x6': { rows: 2, cols: 6 },
  'custom': { rows: 3, cols: 3 },
}

export function generateButtons(rows: number, cols: number): ButtonConfig[] {
  const buttons: ButtonConfig[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c + 1
      buttons.push({
        id: `btn-${r}-${c}`,
        label: `BTN${idx}`,
        subLabel: '',
        function: 'momentary',
        color: '#f9fafb',
        bgColor: '#374151',
        enabled: true,
        col: c,
        row: r,
        colSpan: 1,
        rowSpan: 1,
      })
    }
  }
  return buttons
}

const defaultGrid: GridConfig = { rows: 3, cols: 3, gap: 8 }

interface RemoteState {
  config: RemoteConfig
  selectedButtonId: string | null
  gridPreset: GridPreset
  setGridPreset: (preset: GridPreset) => void
  setCustomGrid: (rows: number, cols: number) => void
  setSelectedButton: (id: string | null) => void
  updateButton: (id: string, updates: Partial<ButtonConfig>) => void
  setRemoteName: (name: string) => void
  setBodyColor: (color: string) => void
  setBodyStyle: (style: RemoteConfig['bodyStyle']) => void
  loadConfig: (config: RemoteConfig) => void
}

export const useRemoteStore = create<RemoteState>((set) => ({
  config: {
    name: 'Remote 1',
    grid: defaultGrid,
    buttons: generateButtons(defaultGrid.rows, defaultGrid.cols),
    bodyColor: '#1f2937',
    bodyStyle: 'industrial',
  },
  selectedButtonId: null,
  gridPreset: '3x3',

  setGridPreset: (preset) =>
    set((s) => {
      const { rows, cols } = GRID_PRESETS[preset]
      return {
        gridPreset: preset,
        config: { ...s.config, grid: { ...s.config.grid, rows, cols }, buttons: generateButtons(rows, cols) },
        selectedButtonId: null,
      }
    }),

  setCustomGrid: (rows, cols) =>
    set((s) => ({
      gridPreset: 'custom',
      config: { ...s.config, grid: { ...s.config.grid, rows, cols }, buttons: generateButtons(rows, cols) },
      selectedButtonId: null,
    })),

  setSelectedButton: (id) => set({ selectedButtonId: id }),

  updateButton: (id, updates) =>
    set((s) => ({
      config: {
        ...s.config,
        buttons: s.config.buttons.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      },
    })),

  setRemoteName: (name) => set((s) => ({ config: { ...s.config, name } })),
  setBodyColor: (color) => set((s) => ({ config: { ...s.config, bodyColor: color } })),
  setBodyStyle: (style) => set((s) => ({ config: { ...s.config, bodyStyle: style } })),
  loadConfig: (config) => set({ config, selectedButtonId: null, gridPreset: 'custom' }),
}))
