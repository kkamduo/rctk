import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (options: {
    content: string
    filename: string
    filters: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke('save-file', options),

  detectRegions: (options: {
    imageData: string
    mediaType: string
  }) => ipcRenderer.invoke('detect-regions', options),

  analyzeImage: (options: {
    imageData: string
    mediaType: string
  }) => ipcRenderer.invoke('analyze-image', options),

  analyzeRegions: (options: {
    imageData: string
    mediaType: string
    regions: Array<{ id: string; category: string; label: string }>
  }) => ipcRenderer.invoke('analyze-regions', options),

  evaluateConfig: (options: { imageData: string; mediaType: string; configJson: string }) =>
    ipcRenderer.invoke('evaluate-config', options),

  readText: (options: { imageData: string; mediaType: string }) =>
    ipcRenderer.invoke('read-text', options),

  readImageFile: (options: { filePath: string }) =>
    ipcRenderer.invoke('read-image-file', options),

  generateLayout: (options: {
    messages: Array<{
      role: 'user' | 'assistant'
      content: string | Array<{ type: string; [key: string]: unknown }>
    }>
  }) => ipcRenderer.invoke('generate-layout', options),

  refineLayout: (options: {
    imageData: string
    mediaType: string
    currentConfigJson: string
    improvements: string[]
  }) => ipcRenderer.invoke('refine-layout', options),

    analyzeImageStaged: (options: {
    imageData: string
    mediaType: string
  }) => ipcRenderer.invoke('analyze-image-staged', options),

  onAnalysisStage: (callback: (data: {
    stage: number
    label: string
    status: 'running' | 'done' | 'error'
  }) => void) => {
    ipcRenderer.on('analysis-stage', (_event, data) => callback(data))
  },

  offAnalysisStage: () => {
    ipcRenderer.removeAllListeners('analysis-stage')
  },

})
