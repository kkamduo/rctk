export const analysisCache: {
  imageKey: string
  regions?: unknown[]
  analyzeConfig?: unknown
  elements?: { bgColor: string; elements: unknown[] }

  overviewRaw?: string
  overview?: any

  zonesRaw?: string
  zones?: any

  zoneElementsA?: any
  zoneElementsB?: any


  coordinates?: string
} = { imageKey: '' }

export function refreshCache(imageData: string) {
  const key = `${imageData.length}_${imageData.slice(0, 128)}`
  if (analysisCache.imageKey !== key) {
    analysisCache.imageKey = key
    delete analysisCache.regions
    delete analysisCache.analyzeConfig
    delete analysisCache.elements
    delete analysisCache.overviewRaw
    delete analysisCache.overview

    delete analysisCache.zonesRaw
    delete analysisCache.zones

    delete analysisCache.zoneElementsA
    delete analysisCache.zoneElementsB
    delete analysisCache.coordinates
  }
}
