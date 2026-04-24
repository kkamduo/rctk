import type { DisplayConfig } from './display'

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (opts: {
        content: string
        filename: string
        filters: Array<{ name: string; extensions: string[] }>
      }) => Promise<{ success: boolean; filePath?: string }>

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
