import type { DisplayConfig } from './display'

export interface DetectedRegion {
  id: string
  category: 'header' | 'gauge' | 'button' | 'status' | 'numeric' | 'label'
  label: string
  x: number
  y: number
  w: number
  h: number
}

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (opts: {
        content: string
        filename: string
        filters: Array<{ name: string; extensions: string[] }>
      }) => Promise<{ success: boolean; filePath?: string }>

      detectRegions: (opts: {
        imageData: string
        mediaType: string
      }) => Promise<{ success: boolean; regions?: DetectedRegion[]; error?: string }>

      analyzeImage: (opts: {
        imageData: string
        mediaType: string
      }) => Promise<{ success: boolean; config?: DisplayConfig; error?: string }>

      generateLayout: (opts: {
        prompt: string
      }) => Promise<{ success: boolean; config?: DisplayConfig; error?: string }>
    }
  }
}
