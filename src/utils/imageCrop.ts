import type { DisplayElement } from '../types/display'

export async function cropElement(
  imageUrl: string,
  xPct: number, yPct: number, wPct: number, hPct: number,
): Promise<{ imageData: string; mediaType: string; color: string; bgColor: string }> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const x = Math.round(xPct / 100 * img.naturalWidth)
      const y = Math.round(yPct / 100 * img.naturalHeight)
      const w = Math.max(4, Math.round(wPct / 100 * img.naturalWidth))
      const h = Math.max(4, Math.round(hPct / 100 * img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h)

      const imgData = ctx.getImageData(0, 0, w, h)
      const px = imgData.data
      const edgeSamples: number[][] = []
      const addSample = (sx: number, sy: number) => {
        const i = (sy * w + sx) * 4
        edgeSamples.push([px[i], px[i + 1], px[i + 2]])
      }
      for (let i = 0; i < w; i += Math.max(1, Math.floor(w / 8))) { addSample(i, 0); addSample(i, h - 1) }
      for (let j = 0; j < h; j += Math.max(1, Math.floor(h / 8))) { addSample(0, j); addSample(w - 1, j) }
      const br = Math.round(edgeSamples.reduce((s, c) => s + c[0], 0) / edgeSamples.length)
      const bg = Math.round(edgeSamples.reduce((s, c) => s + c[1], 0) / edgeSamples.length)
      const bb = Math.round(edgeSamples.reduce((s, c) => s + c[2], 0) / edgeSamples.length)

      const THRESHOLD = 45
      for (let i = 0; i < px.length; i += 4) {
        const dr = px[i] - br, dg = px[i + 1] - bg, db = px[i + 2] - bb
        if (Math.sqrt(dr * dr + dg * dg + db * db) < THRESHOLD) px[i + 3] = 0
      }
      ctx.putImageData(imgData, 0, 0)

      const bins = new Map<string, { n: number; r: number; g: number; b: number }>()
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 128) continue
        const k = `${px[i] >> 4},${px[i + 1] >> 4},${px[i + 2] >> 4}`
        const bin = bins.get(k) ?? { n: 0, r: 0, g: 0, b: 0 }
        bins.set(k, { n: bin.n + 1, r: bin.r + px[i], g: bin.g + px[i + 1], b: bin.b + px[i + 2] })
      }
      const hex = (c: number) => c.toString(16).padStart(2, '0')
      const bgColor = `#${hex(br)}${hex(bg)}${hex(bb)}`
      if (bins.size === 0) {
        resolve({ imageData: canvas.toDataURL('image/png').split(',')[1], mediaType: 'image/png', color: '#eeeeee', bgColor })
        return
      }
      const best = [...bins.values()].sort((a, b) => b.n - a.n)[0]
      const fr = Math.round(best.r / best.n), fg = Math.round(best.g / best.n), fb = Math.round(best.b / best.n)
      resolve({ imageData: canvas.toDataURL('image/png').split(',')[1], mediaType: 'image/png', color: `#${hex(fr)}${hex(fg)}${hex(fb)}`, bgColor })
    }
    img.onerror = () => resolve({ imageData: '', mediaType: 'image/png', color: '#eeeeee', bgColor: '#111111' })
    img.src = imageUrl
  })
}

export function splitValueUnit(el: DisplayElement): DisplayElement {
  if (!el.unit && el.value) {
    const m = el.value.match(/^([\d.]+)\s*([^\d].*)$/)
    if (m) return { ...el, value: m[1], unit: m[2].trim() }
  }
  return el
}
