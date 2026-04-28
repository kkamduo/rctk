import { useState, useRef, useCallback, useEffect } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { X, Upload, Sparkles, CheckCircle2, Loader2, ImageIcon, Trash2, RefreshCw, Type } from 'lucide-react'
import type { DisplayConfig, DisplayElement } from '../../types/display'

type Phase = 'idle' | 'draw'
type Corner = 'nw' | 'ne' | 'sw' | 'se'
type DragAction =
  | { kind: 'draw'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'move'; id: string; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'resize'; id: string; corner: Corner; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number }

interface Crop {
  id: string
  x: number; y: number; w: number; h: number
  kind: 'icon' | 'text'
  imageData: string
  mediaType: string
  label: string   // 필드명 (아이콘: 설명, 텍스트: 키 이름)
  value: string   // 표시값 (텍스트 타입 전용, OCR 결과)
  color: string
  bgColor: string
  reading: boolean
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const BOX_COLOR = '#3b82f6'

// 크롭 영역에서 배경 제거 후 오브젝트만 PNG로 추출
async function doCrop(
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

      // 4개 코너 + 테두리 샘플로 배경색 추정
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

      // 배경과 유사한 픽셀 투명화 (RGB 유클리드 거리 기준)
      const THRESHOLD = 45
      for (let i = 0; i < px.length; i += 4) {
        const dr = px[i] - br, dg = px[i + 1] - bg, db = px[i + 2] - bb
        if (Math.sqrt(dr * dr + dg * dg + db * db) < THRESHOLD) px[i + 3] = 0
      }
      ctx.putImageData(imgData, 0, 0)

      // 불투명 픽셀에서 지배색 추출
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
      const color = `#${hex(fr)}${hex(fg)}${hex(fb)}`

      resolve({ imageData: canvas.toDataURL('image/png').split(',')[1], mediaType: 'image/png', color, bgColor })
    }
    img.onerror = () => resolve({ imageData: '', mediaType: 'image/png', color: '#eeeeee', bgColor: '#111111' })
    img.src = imageUrl
  })
}

// 이미지 테두리 픽셀로 전체 배경색 추출
async function extractBgColor(imageUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const SIZE = 100
      const cv = document.createElement('canvas')
      cv.width = SIZE; cv.height = SIZE
      const ctx = cv.getContext('2d')!
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      const d = ctx.getImageData(0, 0, SIZE, SIZE).data
      const idx = (x: number, y: number) => (y * SIZE + x) * 4
      const samples: [number, number, number][] = []
      for (let x = 0; x < SIZE; x++) {
        const i0 = idx(x, 0), i1 = idx(x, SIZE - 1)
        samples.push([d[i0], d[i0 + 1], d[i0 + 2]])
        samples.push([d[i1], d[i1 + 1], d[i1 + 2]])
      }
      for (let y = 1; y < SIZE - 1; y++) {
        const i0 = idx(0, y), i1 = idx(SIZE - 1, y)
        samples.push([d[i0], d[i0 + 1], d[i0 + 2]])
        samples.push([d[i1], d[i1 + 1], d[i1 + 2]])
      }
      const bins = new Map<string, { n: number; r: number; g: number; b: number }>()
      for (const [r, g, b] of samples) {
        const k = `${r >> 4},${g >> 4},${b >> 4}`
        const bin = bins.get(k) ?? { n: 0, r: 0, g: 0, b: 0 }
        bins.set(k, { n: bin.n + 1, r: bin.r + r, g: bin.g + g, b: bin.b + b })
      }
      const best = [...bins.values()].sort((a, b) => b.n - a.n)[0]
      const hex = (c: number) => Math.round(c / best.n).toString(16).padStart(2, '0')
      resolve(`#${hex(best.r)}${hex(best.g)}${hex(best.b)}`)
    }
    img.onerror = () => resolve('#0a0a0a')
    img.src = imageUrl
  })
}

export default function ImageAnalyzer({ onClose }: { onClose: () => void }) {
  const { colors } = useStyleStore()
  const { addElement } = useDisplayEditorStore()

  const [phase, setPhase] = useState<Phase>('idle')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [natDims, setNatDims] = useState({ w: 480, h: 320 })
  const [imageBg, setImageBg] = useState('#0a0a0a')
  const [crops, setCrops] = useState<Crop[]>([])
  const [drag, setDrag] = useState<DragAction | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [isDrop, setIsDrop] = useState(false)
  const [readingAll, setReadingAll] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  const toPct = useCallback((cx: number, cy: number) => {
    const r = imgRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return { x: clamp((cx - r.left) / r.width * 100, 0, 100), y: clamp((cy - r.top) / r.height * 100, 0, 100) }
  }, [])

  useEffect(() => {
    if (!drag) return
    const onMove = (e: MouseEvent) => {
      const p = toPct(e.clientX, e.clientY)
      if (drag.kind === 'draw') {
        setDrag(d => d?.kind === 'draw' ? { ...d, x1: p.x, y1: p.y } : d)
      } else if (drag.kind === 'move') {
        const dx = p.x - drag.sx, dy = p.y - drag.sy
        setCrops(prev => prev.map(c => c.id !== drag.id ? c : {
          ...c, x: clamp(drag.ox + dx, 0, 100 - c.w), y: clamp(drag.oy + dy, 0, 100 - c.h),
        }))
      } else if (drag.kind === 'resize') {
        const dx = p.x - drag.sx, dy = p.y - drag.sy
        const MIN = 3
        setCrops(prev => prev.map(c => {
          if (c.id !== drag.id) return c
          let { x, y, w, h } = c
          if (drag.corner === 'se') { w = clamp(drag.ow + dx, MIN, 100 - drag.ox); h = clamp(drag.oh + dy, MIN, 100 - drag.oy) }
          else if (drag.corner === 'sw') { const nx = clamp(drag.ox + dx, 0, drag.ox + drag.ow - MIN); w = drag.ow - (nx - drag.ox); x = nx; h = clamp(drag.oh + dy, MIN, 100 - drag.oy) }
          else if (drag.corner === 'ne') { w = clamp(drag.ow + dx, MIN, 100 - drag.ox); const ny = clamp(drag.oy + dy, 0, drag.oy + drag.oh - MIN); h = drag.oh - (ny - drag.oy); y = ny }
          else { const nx = clamp(drag.ox + dx, 0, drag.ox + drag.ow - MIN); const ny = clamp(drag.oy + dy, 0, drag.oy + drag.oh - MIN); w = drag.ow - (nx - drag.ox); h = drag.oh - (ny - drag.oy); x = nx; y = ny }
          return { ...c, x, y, w, h }
        }))
      }
    }
    const onUp = async () => {
      if (drag.kind === 'draw') {
        const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1)
        const w = Math.abs(drag.x1 - drag.x0), h = Math.abs(drag.y1 - drag.y0)
        if (w > 1.5 && h > 1.5 && imagePreview) {
          const { imageData, mediaType, color, bgColor } = await doCrop(imagePreview, x, y, w, h)
          setCrops(prev => [...prev, { id: `c-${Date.now()}`, x, y, w, h, kind: 'icon', imageData, mediaType, label: '', value: '', color, bgColor, reading: false }])
        }
      } else if (drag.kind === 'move' || drag.kind === 'resize') {
        // 이동/리사이즈 후 해당 영역 재크롭
        const id = drag.id
        if (imagePreview) {
          setCrops(prev => {
            const crop = prev.find(c => c.id === id)
            if (!crop) return prev
            doCrop(imagePreview, crop.x, crop.y, crop.w, crop.h).then(({ imageData, mediaType, color, bgColor }) =>
              setCrops(p => p.map(c => c.id === id ? { ...c, imageData, mediaType, color, bgColor } : c))
            )  // kind/label/value는 유지
            return prev
          })
        }
      }
      setDrag(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [drag, toPct, imagePreview])

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async e => {
      const url = e.target?.result as string
      setImagePreview(url)
      setCrops([])
      setPhase('draw')
      const bg = await extractBgColor(url)
      setImageBg(bg)
    }
    reader.readAsDataURL(file)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) processFile(item.getAsFile()!)
  }, [processFile])

  const readText = useCallback(async (id: string, imageData: string, mediaType: string) => {
    if (!window.electronAPI?.readText) return
    setCrops(prev => prev.map(c => c.id === id ? { ...c, reading: true } : c))
    try {
      const res = await window.electronAPI.readText({ imageData, mediaType })
      const text = res.text?.trim() ?? ''
      setCrops(prev => prev.map(c => {
        if (c.id !== id) return c
        // 텍스트 타입: OCR 결과 → value / 아이콘 타입: OCR 결과 → label
        return c.kind === 'text'
          ? { ...c, value: text, reading: false }
          : { ...c, label: text, reading: false }
      }))
    } catch {
      setCrops(prev => prev.map(c => c.id === id ? { ...c, reading: false } : c))
    }
  }, [])

  const readAllText = useCallback(async () => {
    const targets = crops.filter(c => !c.label && c.imageData)
    if (!targets.length) return
    setReadingAll(true)
    await Promise.all(targets.map(c => readText(c.id, c.imageData, c.mediaType)))
    setReadingAll(false)
  }, [crops, readText])

  const onContainerDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || phase !== 'draw') return
    if ((e.target as HTMLElement).closest('[data-box]')) return
    e.preventDefault()
    const p = toPct(e.clientX, e.clientY)
    setDrag({ kind: 'draw', x0: p.x, y0: p.y, x1: p.x, y1: p.y })
  }

  const applyToCanvas = () => {
    if (!crops.length) return
    crops.forEach(c => {
      if (c.kind === 'text') {
        addElement({
          id: c.id,
          type: 'label',
          xPct: c.x,
          yPct: c.y,
          widthPct: c.w,
          heightPct: c.h,
          label: c.label,
          value: c.value,
          color: c.color,
          bgColor: c.bgColor,
        } satisfies DisplayElement)
      } else {
        addElement({
          id: c.id,
          type: 'image-crop',
          xPct: c.x,
          yPct: c.y,
          widthPct: c.w,
          heightPct: c.h,
          label: c.label,
          color: c.color,
          bgColor: c.bgColor,
          imageData: c.imageData,
          mediaType: c.mediaType,
        } satisfies DisplayElement)
      }
    })
    onClose()
  }

  const drawPrev = drag?.kind === 'draw' ? {
    x: Math.min(drag.x0, drag.x1), y: Math.min(drag.y0, drag.y1),
    w: Math.abs(drag.x1 - drag.x0), h: Math.abs(drag.y1 - drag.y0),
  } : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onPaste={handlePaste}
    >
      <div
        className="flex flex-col rounded-xl shadow-2xl"
        style={{ background: colors.surface, border: `1px solid ${colors.border}`, width: 780, maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <ImageIcon size={15} style={{ color: colors.primary }} />
            <span className="font-semibold text-sm" style={{ color: colors.text }}>이미지 크롭 분석</span>
            {phase === 'draw' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: colors.primary + '20', color: colors.primary }}>
                드래그로 영역 선택
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ color: colors.text, opacity: 0.4 }}><X size={16} /></button>
        </div>

        {/* Body: 좌측 이미지 / 우측 크롭 목록 */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

          {/* 좌측: 이미지 */}
          <div className="flex-1 overflow-auto p-4" style={{ minWidth: 0 }}>
            {phase === 'idle' ? (
              <div
                className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-20 gap-3 cursor-pointer transition-colors"
                style={{ borderColor: isDrop ? colors.primary : colors.border, background: colors.background }}
                onDragOver={e => { e.preventDefault(); setIsDrop(true) }}
                onDragLeave={() => setIsDrop(false)}
                onDrop={e => { e.preventDefault(); setIsDrop(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={28} style={{ color: colors.border }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: colors.text, opacity: 0.6 }}>이미지 드래그 또는 클릭</p>
                  <p className="text-xs mt-1" style={{ color: colors.text, opacity: 0.35 }}>Ctrl+V 붙여넣기 가능</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[10px] mb-2" style={{ color: colors.text, opacity: 0.4 }}>
                  빈 곳 드래그 → 영역 추가 &nbsp;·&nbsp; 박스 드래그 → 이동 &nbsp;·&nbsp; 코너 핸들 → 리사이즈
                </p>
                <div
                  ref={imgRef}
                  style={{ position: 'relative', lineHeight: 0, cursor: 'crosshair', userSelect: 'none' }}
                  onMouseDown={onContainerDown}
                >
                  <img
                    src={imagePreview!}
                    alt=""
                    style={{ width: '100%', display: 'block', borderRadius: 6, pointerEvents: 'none' }}
                    draggable={false}
                    onLoad={e => {
                      const img = e.currentTarget
                      setNatDims({ w: img.naturalWidth, h: img.naturalHeight })
                    }}
                  />

                  {/* 기존 박스들 */}
                  {crops.map((crop, i) => (
                    <div
                      key={crop.id}
                      data-box="1"
                      onMouseEnter={() => setHovered(crop.id)}
                      onMouseLeave={() => setHovered(null)}
                      onMouseDown={e => {
                        e.stopPropagation(); if (e.button !== 0) return; e.preventDefault()
                        const p = toPct(e.clientX, e.clientY)
                        setDrag({ kind: 'move', id: crop.id, sx: p.x, sy: p.y, ox: crop.x, oy: crop.y })
                      }}
                      style={{
                        position: 'absolute',
                        left: `${crop.x}%`, top: `${crop.y}%`,
                        width: `${crop.w}%`, height: `${crop.h}%`,
                        border: `2px solid ${BOX_COLOR}`,
                        background: `${BOX_COLOR}20`,
                        boxSizing: 'border-box',
                        cursor: 'move',
                      }}
                    >
                      {/* 순번 배지 */}
                      <div style={{ position: 'absolute', top: 0, left: 0, background: BOX_COLOR, color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', lineHeight: '15px', borderRadius: '0 0 3px 0', pointerEvents: 'none' }}>
                        {i + 1}
                      </div>

                      {/* 호버 시 삭제 버튼 */}
                      {hovered === crop.id && (
                        <button
                          data-box="1"
                          onClick={e => { e.stopPropagation(); setCrops(prev => prev.filter(c => c.id !== crop.id)) }}
                          style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', width: 16, height: 16, borderRadius: '0 0 0 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer' }}
                        >✕</button>
                      )}

                      {/* 코너 리사이즈 핸들 */}
                      {(['nw', 'ne', 'sw', 'se'] as Corner[]).map(c => (
                        <div
                          key={c}
                          data-box="1"
                          onMouseDown={e => {
                            e.stopPropagation(); e.preventDefault()
                            const p = toPct(e.clientX, e.clientY)
                            setDrag({ kind: 'resize', id: crop.id, corner: c, sx: p.x, sy: p.y, ox: crop.x, oy: crop.y, ow: crop.w, oh: crop.h })
                          }}
                          style={{
                            position: 'absolute', width: 10, height: 10,
                            background: BOX_COLOR, border: '2px solid #fff', borderRadius: 2,
                            cursor: c === 'nw' || c === 'se' ? 'nwse-resize' : 'nesw-resize',
                            ...(c.includes('n') ? { top: -5 } : { bottom: -5 }),
                            ...(c.includes('w') ? { left: -5 } : { right: -5 }),
                          }}
                        />
                      ))}
                    </div>
                  ))}

                  {/* 드로우 프리뷰 */}
                  {drawPrev && drawPrev.w > 0 && (
                    <div style={{
                      position: 'absolute',
                      left: `${drawPrev.x}%`, top: `${drawPrev.y}%`,
                      width: `${drawPrev.w}%`, height: `${drawPrev.h}%`,
                      border: '2px dashed #fff', background: 'rgba(255,255,255,0.06)',
                      boxSizing: 'border-box', pointerEvents: 'none',
                    }} />
                  )}
                </div>
              </>
            )}
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
            />
          </div>

          {/* 우측: 크롭 목록 */}
          {phase === 'draw' && (
            <div className="overflow-y-auto shrink-0 border-l" style={{ width: 236, borderColor: colors.border }}>
              {/* 헤더 */}
              <div
                className="flex items-center justify-between px-3 py-2 border-b sticky top-0 z-10"
                style={{ borderColor: colors.border, background: colors.surface }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.4 }}>
                  크롭 ({crops.length})
                </span>
                {crops.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={readAllText}
                      disabled={readingAll}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium disabled:opacity-40"
                      style={{ background: colors.primary + '20', color: colors.primary, border: `1px solid ${colors.primary}40` }}
                    >
                      {readingAll ? <Loader2 size={9} className="animate-spin" /> : <Type size={9} />}
                      전체 읽기
                    </button>
                    <button
                      onClick={() => setCrops([])}
                      className="p-1 rounded"
                      style={{ color: colors.danger, opacity: 0.55 }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>

              {crops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 px-4">
                  <ImageIcon size={22} style={{ color: colors.border }} />
                  <p className="text-[10px] text-center leading-relaxed" style={{ color: colors.text, opacity: 0.35 }}>
                    이미지 위에서<br />영역을 드래그해서<br />선택하세요
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {crops.map((crop, i) => (
                    <div
                      key={crop.id}
                      className="rounded-lg overflow-hidden"
                      style={{ background: colors.background, border: `1px solid ${colors.border}` }}
                    >
                      {/* 크롭 썸네일 */}
                      {crop.kind === 'text' ? (
                        <div
                          className="flex items-center justify-center px-2"
                          style={{ minHeight: 48, background: crop.bgColor || '#111', color: crop.color || '#eee' }}
                        >
                          <span className="text-sm font-mono font-bold truncate">
                            {crop.value || crop.label || '텍스트'}
                          </span>
                        </div>
                      ) : crop.imageData && (
                        <img
                          src={`data:${crop.mediaType};base64,${crop.imageData}`}
                          alt=""
                          style={{ width: '100%', maxHeight: 80, objectFit: 'contain', display: 'block', background: '#111' }}
                        />
                      )}

                      <div className="p-2 space-y-1.5">
                        {/* 순번 + 아이콘/텍스트 토글 */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold shrink-0 w-4 text-center" style={{ color: BOX_COLOR }}>
                            {i + 1}
                          </span>
                          <div className="flex rounded overflow-hidden flex-1" style={{ border: `1px solid ${colors.border}` }}>
                            {(['icon', 'text'] as const).map(k => (
                              <button
                                key={k}
                                onClick={() => setCrops(prev => prev.map(c => c.id === crop.id ? { ...c, kind: k } : c))}
                                className="flex-1 text-[9px] py-0.5 font-semibold transition-colors"
                                style={{
                                  background: crop.kind === k ? colors.primary : 'transparent',
                                  color: crop.kind === k ? '#fff' : colors.text,
                                  opacity: crop.kind === k ? 1 : 0.45,
                                }}
                              >
                                {k === 'icon' ? '아이콘' : '텍스트'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 레이블 입력 (공통: 필드명) */}
                        <input
                          value={crop.label}
                          onChange={e => setCrops(prev => prev.map(c => c.id === crop.id ? { ...c, label: e.target.value } : c))}
                          placeholder={crop.kind === 'text' ? '필드명 (예: 속도, 온도)' : '설명 (선택)'}
                          className="w-full text-[9px] px-1.5 py-1 rounded border"
                          style={{ background: colors.surface, color: colors.text, borderColor: colors.border, outline: 'none' }}
                        />

                        {/* 텍스트 타입 전용: 값 입력란 */}
                        {crop.kind === 'text' && (
                          <input
                            value={crop.value}
                            onChange={e => setCrops(prev => prev.map(c => c.id === crop.id ? { ...c, value: e.target.value } : c))}
                            placeholder="초기값 (OCR 또는 직접 입력)"
                            className="w-full text-[9px] px-1.5 py-1 rounded border"
                            style={{ background: colors.surface, color: colors.primary, borderColor: colors.primary + '40', outline: 'none' }}
                          />
                        )}

                        {/* 액션 버튼 줄 */}
                        <div className="flex items-center gap-1">
                          <div
                            title={`배경색: ${crop.bgColor}`}
                            style={{ width: 14, height: 14, borderRadius: 2, background: crop.bgColor, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
                          />
                          <button
                            onClick={() => readText(crop.id, crop.imageData, crop.mediaType)}
                            disabled={crop.reading || !crop.imageData}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium flex-1 justify-center disabled:opacity-40"
                            style={{ background: colors.primary + '15', color: colors.primary, border: `1px solid ${colors.primary}30` }}
                          >
                            {crop.reading
                              ? <Loader2 size={8} className="animate-spin" />
                              : <Sparkles size={8} />
                            }
                            {crop.kind === 'text' ? '값 읽기' : '텍스트 읽기'}
                          </button>
                          <button
                            onClick={() => setCrops(prev => prev.filter(c => c.id !== crop.id))}
                            className="p-1 rounded"
                            style={{ color: colors.danger, opacity: 0.55 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-t" style={{ borderColor: colors.border }}>
          <div>
            {phase === 'draw' && (
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                style={{ background: colors.background, color: colors.text, border: `1px solid ${colors.border}` }}
              >
                <RefreshCw size={11} />이미지 교체
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium"
              style={{ background: colors.border, color: colors.text }}
            >취소</button>
            {phase === 'draw' && (
              <button
                onClick={applyToCanvas}
                disabled={crops.length === 0}
                className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                style={{ background: colors.success, color: '#fff' }}
              >
                <CheckCircle2 size={13} />
                캔버스에 적용 ({crops.length}개)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
