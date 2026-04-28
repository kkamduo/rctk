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

      evaluateConfig: (opts: { imageData: string; mediaType: string; configJson: string }) =>
        Promise<{
          success: boolean
          scores?: { total: number; layout: number; coverage: number }
          improvements?: string[]
          error?: string
        }>

      readText: (opts: { imageData: string; mediaType: string }) =>
        Promise<{ success: boolean; text: string; error?: string }>

      readImageFile: (opts: { filePath: string }) =>
        Promise<{ success: boolean; data?: string; mediaType?: string; error?: string }>

      generateLayout: (opts: {
        messages: Array<{
          role: 'user' | 'assistant'
          content: string | Array<{ type: string; [key: string]: unknown }>
        }>
        canvasWidth?: number
        canvasHeight?: number
      }) => Promise<{ success: boolean; config?: DisplayConfig; error?: string }>

      refineLayout: (opts: {
        imageData: string
        mediaType: string
        currentConfigJson: string
        improvements: string[]
      }) => Promise<{ success: boolean; config?: DisplayConfig; error?: string }>

      analyzeImageStaged: (opts: {
        imageData: string
        mediaType: string
      }) => Promise<{
        success: boolean
        config?: DisplayConfig
        stages?: Array<{ n: number; label: string; ok: boolean }>
        error?: string
      }>

      onAnalysisStage: (callback: (data: {
        stage: number
        label: string
        status: 'running' | 'done' | 'error'
      }) => void) => void

      offAnalysisStage: () => void

    }
  }
}
