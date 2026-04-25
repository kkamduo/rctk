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

  generateLayout: (options: {
    prompt: string
  }) => ipcRenderer.invoke('generate-layout', options),
})
