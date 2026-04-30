import { create } from 'zustand'
import type { DisplayConfig, DisplayElement } from '../types/display'

const DEFAULT_CONFIG: DisplayConfig = {
  name: 'Display 1',
  width: 480,
  height: 320,
  bgColor: '#ffffff',
  elements: [],
}

interface DisplayEditorState {
  config: DisplayConfig
  selectedId: string | null
  gridSize: number
  gridVisible: boolean
  gridSnap: boolean
  setSelectedId: (id: string | null) => void
  updateElement: (id: string, updates: Partial<DisplayElement>) => void
  /** xPct, yPct: 0–100 (캔버스 너비/높이 기준 %) */
  moveElement: (id: string, xPct: number, yPct: number) => void
  /** widthPct, heightPct: 0–100 (캔버스 너비/높이 기준 %) */
  resizeElement: (id: string, widthPct: number, heightPct: number) => void
  removeElement: (id: string) => void
  addElement: (element: DisplayElement) => void
  loadConfig: (config: DisplayConfig) => void
  setCanvasSize: (width: number, height: number) => void
  setBgColor: (color: string) => void
  setName: (name: string) => void
  setGridSize: (size: number) => void
  setGridVisible: (v: boolean) => void
  setGridSnap: (v: boolean) => void
  aiElementIds: Set<string>
  replaceAiElements: (newConfig: DisplayConfig) => void
}

export const useDisplayEditorStore = create<DisplayEditorState>((set) => ({
  config: DEFAULT_CONFIG,
  selectedId: null,
  gridSize: 10,
  gridVisible: true,
  gridSnap: true,

  setSelectedId: (id) => set({ selectedId: id }),

  updateElement: (id, updates) =>
    set((s) => ({
      config: {
        ...s.config,
        elements: s.config.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      },
    })),

  moveElement: (id, xPct, yPct) =>
    set((s) => ({
      config: {
        ...s.config,
        elements: s.config.elements.map((el) =>
          el.id === id ? { ...el, xPct, yPct } : el
        ),
      },
    })),

  resizeElement: (id, widthPct, heightPct) =>
    set((s) => ({
      config: {
        ...s.config,
        elements: s.config.elements.map((el) =>
          el.id === id ? { ...el, widthPct, heightPct } : el
        ),
      },
    })),

  removeElement: (id) =>
    set((s) => ({
      config: {
        ...s.config,
        elements: s.config.elements.filter((el) => el.id !== id),
      },
      selectedId: null,
    })),

  addElement: (element) =>
    set((s) => {
      const existingIds = new Set(s.config.elements.map((el) => el.id))
      const id = existingIds.has(element.id) ? `${element.id}-${Date.now()}` : element.id
      return {
        config: {
          ...s.config,
          elements: [...s.config.elements, { ...element, id }],
        },
      }
    }),

  loadConfig: (config) => set({ config, selectedId: null }),

  // 캔버스 크기 변경 시 요소 pct는 그대로 유지 → 자동 비례 재배치
  setCanvasSize: (width, height) =>
    set((s) => ({ config: { ...s.config, width, height } })),

  setBgColor: (color) =>
    set((s) => ({ config: { ...s.config, bgColor: color } })),

  setName: (name) =>
    set((s) => ({ config: { ...s.config, name } })),

    setGridSize: (size) => set({ gridSize: size }),
  setGridVisible: (v) => set({ gridVisible: v }),
  setGridSnap: (v) => set({ gridSnap: v }),

  aiElementIds: new Set<string>(),

  replaceAiElements: (newConfig) =>
    set((s) => {
      const kept = s.config.elements.filter(el => !s.aiElementIds.has(el.id))
      const newIds = new Set<string>()
      const added = newConfig.elements.map(el => {
        const id = kept.some(e => e.id === el.id) ? `${el.id}-${Date.now()}` : el.id
        newIds.add(id)
        return { ...el, id }
      })
      return {
        aiElementIds: newIds,
        config: { ...newConfig, elements: [...kept, ...added] },
        selectedId: null,
      }
    }),
}))