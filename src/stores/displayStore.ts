import { create } from 'zustand'
import type { WidgetConfig, WidgetType, DisplayConfig } from '../types/display'

const WIDGET_TYPES: WidgetType[] = ['status', 'gauge', 'numeric', 'alarm', 'indicator']

function generateWidgets(buttonIds: string[]): WidgetConfig[] {
  return buttonIds.map((id, i) => ({
    id: `widget-${id}`,
    type: WIDGET_TYPES[i % WIDGET_TYPES.length],
    label: `Status ${i + 1}`,
    value: i % 2 === 0 ? 0 : 'OFF',
    unit: i % 3 === 0 ? '%' : '',
    min: 0,
    max: 100,
    color: '#22c55e',
    linkedButtonId: id,
    col: i % 3,
    row: Math.floor(i / 3),
    colSpan: 1,
    rowSpan: 1,
  }))
}

interface DisplayState {
  config: DisplayConfig
  selectedWidgetId: string | null
  setSelectedWidget: (id: string | null) => void
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void
  syncWithRemote: (buttonIds: string[], cols: number) => void
  setDisplayName: (name: string) => void
}

export const useDisplayStore = create<DisplayState>((set) => ({
  config: {
    name: 'Display 1',
    cols: 3,
    bgColor: '#111827',
    widgets: generateWidgets(
      Array.from({ length: 9 }, (_, i) => `btn-${Math.floor(i / 3)}-${i % 3}`)
    ),
  },
  selectedWidgetId: null,

  setSelectedWidget: (id) => set({ selectedWidgetId: id }),

  updateWidget: (id, updates) =>
    set((s) => ({
      config: {
        ...s.config,
        widgets: s.config.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      },
    })),

  syncWithRemote: (buttonIds, cols) =>
    set((s) => ({
      config: { ...s.config, cols, widgets: generateWidgets(buttonIds) },
    })),

  setDisplayName: (name) => set((s) => ({ config: { ...s.config, name } })),
}))
