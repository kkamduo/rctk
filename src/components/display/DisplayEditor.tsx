import { useRef, useCallback, useEffect, useState } from 'react'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { useStyleStore } from '../../stores/styleStore'
import ElementRenderer from './ElementRenderer'
import { computePixels } from '../../types/display'

type Guide = { type: 'h' | 'v'; pos: number }

const GUIDE_THRESHOLD = 6

export default function DisplayEditor() {
  const { config, selectedId, setSelectedId, moveElement, gridSize, gridVisible, gridSnap } = useDisplayEditorStore()
  const { colors } = useStyleStore()
  const { elements, width, height, bgColor, name } = config

  const [guides, setGuides] = useState<Guide[]>([])
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const snap = useCallback(
    (val: number) => (gridSnap ? Math.round(val / gridSize) * gridSize : val),
    [gridSnap, gridSize]
  )

  const onElementMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (selectedId !== id) {
        setSelectedId(id)
        return
      }
      const el = config.elements.find((el) => el.id === id)
      if (!el || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const scale = width / rect.width
      const px = computePixels(el, width, height)
      dragging.current = {
        id,
        ox: (e.clientX - rect.left) * scale - px.x,
        oy: (e.clientY - rect.top) * scale - px.y,
      }
    },
    [config.elements, setSelectedId, selectedId, width, height]
  )

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const scale = width / rect.width
      let rawX = (e.clientX - rect.left) * scale - dragging.current.ox
      let rawY = (e.clientY - rect.top) * scale - dragging.current.oy

      const el = config.elements.find((el) => el.id === dragging.current!.id)
      if (!el) return
      const px = computePixels(el, width, height)

      rawX = Math.max(0, Math.min(width - px.width, rawX))
      rawY = Math.max(0, Math.min(height - px.height, rawY))

      // 정렬 기준점: 다른 요소들의 좌/우/중앙 + 캔버스 중심
      const others = config.elements.filter((o) => o.id !== el.id)
      const refXs: number[] = [width / 2]
      const refYs: number[] = [height / 2]
      for (const o of others) {
        const opx = computePixels(o, width, height)
        refXs.push(opx.x, opx.x + opx.width, opx.x + opx.width / 2)
        refYs.push(opx.y, opx.y + opx.height, opx.y + opx.height / 2)
      }

      const newGuides: Guide[] = []

      let finalX = rawX
      let guideX: number | null = null
      let bestDX = GUIDE_THRESHOLD
      for (const ref of refXs) {
        let d = Math.abs(rawX - ref)
        if (d < bestDX) { bestDX = d; finalX = ref; guideX = ref }
        d = Math.abs(rawX + px.width - ref)
        if (d < bestDX) { bestDX = d; finalX = ref - px.width; guideX = ref }
        d = Math.abs(rawX + px.width / 2 - ref)
        if (d < bestDX) { bestDX = d; finalX = ref - px.width / 2; guideX = ref }
      }
      if (guideX !== null) newGuides.push({ type: 'v', pos: guideX })
      else finalX = snap(rawX)

      let finalY = rawY
      let guideY: number | null = null
      let bestDY = GUIDE_THRESHOLD
      for (const ref of refYs) {
        let d = Math.abs(rawY - ref)
        if (d < bestDY) { bestDY = d; finalY = ref; guideY = ref }
        d = Math.abs(rawY + px.height - ref)
        if (d < bestDY) { bestDY = d; finalY = ref - px.height; guideY = ref }
        d = Math.abs(rawY + px.height / 2 - ref)
        if (d < bestDY) { bestDY = d; finalY = ref - px.height / 2; guideY = ref }
      }
      if (guideY !== null) newGuides.push({ type: 'h', pos: guideY })
      else finalY = snap(rawY)

      finalX = Math.max(0, Math.min(width - px.width, Math.round(finalX)))
      finalY = Math.max(0, Math.min(height - px.height, Math.round(finalY)))

      setGuides(newGuides)
      moveElement(dragging.current.id, finalX / width * 100, finalY / height * 100)
    },
    [config.elements, moveElement, width, height, snap]
  )

  const onMouseUp = useCallback(() => {
    dragging.current = null
    setGuides([])
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      e.preventDefault()
      const step = e.shiftKey ? gridSize * 2 : gridSize
      const el = config.elements.find((el) => el.id === selectedId)
      if (!el) return
      const px = computePixels(el, width, height)
      switch (e.key) {
        case 'ArrowLeft':
          moveElement(selectedId, snap(Math.max(0, px.x - step)) / width * 100, el.yPct)
          break
        case 'ArrowRight':
          moveElement(selectedId, snap(Math.min(width - px.width, px.x + step)) / width * 100, el.yPct)
          break
        case 'ArrowUp':
          moveElement(selectedId, el.xPct, snap(Math.max(0, px.y - step)) / height * 100)
          break
        case 'ArrowDown':
          moveElement(selectedId, el.xPct, snap(Math.min(height - px.height, px.y + step)) / height * 100)
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, config.elements, moveElement, width, height, gridSize, snap])

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-xs font-bold tracking-wide" style={{ color: colors.text }}>{name}</div>

      {elements.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed"
          style={{ width: '100%', minHeight: 320, borderColor: colors.border, color: colors.text, opacity: 0.4 }}
        >
          <span className="text-2xl">🖼</span>
          <p className="text-xs text-center">상단 <strong>AI 분석</strong> 버튼으로<br />이미지를 업로드하세요</p>
        </div>
      ) : (
        <div style={{ background: '#080808', border: `3px solid ${colors.border}`, borderRadius: 10, padding: 8, boxShadow: '0 0 40px rgba(0,0,0,0.8)', maxWidth: '100%' }}>
          <div
            ref={canvasRef}
            style={{ position: 'relative', width, height, background: bgColor, maxWidth: '100%', cursor: 'default', userSelect: 'none', overflow: 'hidden' }}
            onClick={() => setSelectedId(null)}
          >
            {/* 격자 오버레이 */}
            {gridVisible && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: `linear-gradient(to right, rgba(128,128,128,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.18) 1px, transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }} />
            )}

            {/* 요소들 */}
            {elements.map((el) => {
              const px = computePixels(el, width, height)
              return (
                <div
                  key={el.id}
                  style={{ position: 'absolute', left: px.x, top: px.y, cursor: el.id === selectedId ? 'grab' : 'pointer', zIndex: 1 }}
                  onMouseDown={(e) => onElementMouseDown(el.id, e)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ElementRenderer element={el} selected={el.id === selectedId} widthPx={px.width} heightPx={px.height} />
                </div>
              )
            })}

            {/* 정렬 가이드선 */}
            {guides.map((g, i) =>
              g.type === 'v' ? (
                <div key={i} style={{ position: 'absolute', left: g.pos, top: 0, width: 1, height: '100%', background: '#ff3e6c', pointerEvents: 'none', zIndex: 10 }} />
              ) : (
                <div key={i} style={{ position: 'absolute', left: 0, top: g.pos, width: '100%', height: 1, background: '#ff3e6c', pointerEvents: 'none', zIndex: 10 }} />
              )
            )}
          </div>
        </div>
      )}

      {elements.length > 0 && (
        <p className="text-[10px]" style={{ color: colors.text, opacity: 0.3 }}>
          클릭으로 선택 · 선택 후 드래그 또는 방향키 이동 · 캔버스 크기 변경 시 비율 유지
        </p>
      )}
    </div>
  )
}
