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

  generateLayout: (options: {
    prompt: string
  }) => ipcRenderer.invoke('generate-layout', options),
})
