export const analysisCache: {
  imageKey: string
  regions?: unknown[]
  analyzeConfig?: unknown
  elements?: { bgColor: string; elements: unknown[] }
} = { imageKey: '' }

export function refreshCache(imageData: string) {
  const key = imageData.slice(0, 64)
  if (analysisCache.imageKey !== key) {
    analysisCache.imageKey = key
    delete analysisCache.regions
    delete analysisCache.analyzeConfig
    delete analysisCache.elements
  }
}
