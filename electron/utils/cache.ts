export const analysisCache: {
  imageKey: string
  regions?: unknown[]
  analyzeConfig?: unknown
  elements?: { bgColor: string; elements: unknown[] }
} = { imageKey: '' }

export function refreshCache(imageData: string) {
  // 앞 64자 대신 전체 길이 + 앞 128자로 키 생성 (더 안정적)
  const key = `${imageData.length}_${imageData.slice(0, 128)}`
  if (analysisCache.imageKey !== key) {
    analysisCache.imageKey = key
    delete analysisCache.regions
    delete analysisCache.analyzeConfig
    delete analysisCache.elements
  }
}