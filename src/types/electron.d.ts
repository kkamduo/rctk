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

      analyzeRegions: (opts: {
        imageData: string
        mediaType: string
        regions: Array<{ id: string; category: string; label: string }>
      }) => Promise<{
        success: boolean
        bgColor?: string
        elements?: Array<{
          id: string
          label: string
          value?: string
          color: string
          bgColor: string
          active?: boolean
          unit?: string
        }>
        error?: string
      }>

      readImageFile: (opts: { filePath: string }) =>
        Promise<{ success: boolean; data?: string; mediaType?: string; error?: string }>

      generateLayout: (opts: {
        messages: Array<{
          role: 'user' | 'assistant'
          content: string | Array<{ type: string; [key: string]: unknown }>
        }>
      }) => Promise<{ success: boolean; config?: DisplayConfig; error?: string }>
    }
  }
}
