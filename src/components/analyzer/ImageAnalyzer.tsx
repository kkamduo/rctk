import { useState, useRef, useCallback, useEffect } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { X, Upload, Sparkles, CheckCircle2, AlertCircle, Loader2, ImageIcon, ScanSearch, Layers, Trash2 } from 'lucide-react'
import type { DisplayConfig } from '../../types/display'
import type { DetectedRegion } from '../../types/electron'

type Phase = 'idle' | 'detecting' | 'review' | 'extracting' | 'done' | 'error'
type DragAction =
  | { kind: 'move';   id: string; spx: number; spy: number; ox: number; oy: number }
  | { kind: 'resize'; id: string; corner: 'nw'|'ne'|'sw'|'se'; spx: number; spy: number; ox: number; oy: number; ow: number; oh: number }
  | { kind: 'draw';   x0: number; y0: number; x1: number; y1: number }

interface PendingRegion { x: number; y: number; w: number; h: number }

const CAT_COLOR: Record<string, string> = {
  header: '#3b82f6', gauge: '#10b981', button: '#f59e0b',
  status: '#8b5cf6', numeric: '#06b6d4', label: '#94a3b8',
}
const CAT_KO: Record<string, string> = {
  header: '헤더', gauge: '계기판', button: '버튼',
  status: '상태표시', numeric: '수치표시', label: '레이블',
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export default function ImageAnalyzer({ onClose }: { onClose: () => void }) {
  const { colors } = useStyleStore()
  const { loadConfig } = useDisplayEditorStore()

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageData,    setImageData]    = useState<string | null>(null)
  const [mediaType,    setMediaType]    = useState('image/jpeg')
  const [phase,        setPhase]        = useState<Phase>('idle')
  const [errorMsg,     setErrorMsg]     = useState('')
  const [regions,      setRegions]      = useState<DetectedRegion[]>([])
  const [enabled,      setEnabled]      = useState<Set<string>>(new Set())
  const [result,       setResult]       = useState<DisplayConfig | null>(null)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [isDrop,       setIsDrop]       = useState(false)
  const [drag,         setDrag]         = useState<DragAction | null>(null)
  const [pending,      setPending]      = useState<PendingRegion | null>(null)
  const [hovered,      setHovered]      = useState<string | null>(null)
  const [subBusy,      setSubBusy]      = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef  = useRef<HTMLDivElement>(null)

  const toPct = useCallback((cx: number, cy: number) => {
    const r = imgRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return { x: clamp((cx - r.left) / r.width * 100, 0, 100), y: clamp((cy - r.top) / r.height * 100, 0, 100) }
  }, [])

  useEffect(() => {
    if (!drag) return
    const onMove = (e: MouseEvent) => {
      const p = toPct(e.clientX, e.clientY)
      if (drag.kind === 'move') {
        const dx = p.x - drag.spx, dy = p.y - drag.spy
        setRegions(prev => prev.map(r => r.id !== drag.id ? r : {
          ...r, x: clamp(drag.ox + dx, 0, 100 - r.w), y: clamp(drag.oy + dy, 0, 100 - r.h),
        }))
      } else if (drag.kind === 'resize') {
        const dx = p.x - drag.spx, dy = p.y - drag.spy
        const MIN = 4
        setRegions(prev => prev.map(r => {
          if (r.id !== drag.id) return r
          let { x, y, w, h } = r
          if (drag.corner === 'se') { w = clamp(drag.ow + dx, MIN, 100 - drag.ox); h = clamp(drag.oh + dy, MIN, 100 - drag.oy) }
          else if (drag.corner === 'sw') { const nx = clamp(drag.ox + dx, 0, drag.ox + drag.ow - MIN); w = drag.ow-(nx-drag.ox); x = nx; h = clamp(drag.oh+dy, MIN, 100-drag.oy) }
          else if (drag.corner === 'ne') { w = clamp(drag.ow+dx, MIN, 100-drag.ox); const ny = clamp(drag.oy+dy, 0, drag.oy+drag.oh-MIN); h = drag.oh-(ny-drag.oy); y = ny }
          else { const nx = clamp(drag.ox+dx,0,drag.ox+drag.ow-MIN); const ny = clamp(drag.oy+dy,0,drag.oy+drag.oh-MIN); w=drag.ow-(nx-drag.ox); h=drag.oh-(ny-drag.oy); x=nx; y=ny }
          return { ...r, x, y, w, h }
        }))
      } else {
        setDrag(d => d?.kind === 'draw' ? { ...d, x1: p.x, y1: p.y } : d)
      }
    }
    const onUp = () => {
      if (drag.kind === 'draw') {
        const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1)
        const w = Math.abs(drag.x1 - drag.x0), h = Math.abs(drag.y1 - drag.y0)
        if (w > 2 && h > 2) setPending({ x, y, w, h })
      }
      setDrag(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [drag, toPct])

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setMediaType(file.type)
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      setImagePreview(url); setImageData(url.split(',')[1])
      setResult(null); setRegions([]); setPending(null); setPhase('idle')
    }
    reader.readAsDataURL(file)
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) processFile(item.getAsFile()!)
  }, [])

  const detectRegions = async () => {
    if (!imageData) return
    setPhase('detecting'); setErrorMsg(''); setRegions([]); setPending(null)
    try {
      const res = await window.electronAPI!.detectRegions({ imageData, mediaType })
      if (!res.success || !res.regions) throw new Error(res.error || '영역 감지 실패')
      setRegions(res.regions)
      setEnabled(new Set(res.regions.map(r => r.id)))
      setPhase('review')
    } catch (err) { setErrorMsg(String(err).replace('Error: ','')); setPhase('error') }
  }

  const extractElements = async () => {
    if (!imageData) return
    setPhase('extracting'); setErrorMsg('')
    try {
      const res = await window.electronAPI!.analyzeImage({ imageData, mediaType })
      if (!res.success || !res.config) throw new Error(res.error || '분석 실패')
      setResult(res.config)
      setSelected(new Set(res.config.elements.map(el => el.id)))
      setPhase('done')
    } catch (err) { setErrorMsg(String(err).replace('Error: ','')); setPhase('error') }
  }

  const analyzeSubRegion = async (area: PendingRegion) => {
    if (!imagePreview) return
    setSubBusy(true)
    try {
      const cropped = await new Promise<{ data: string; type: string }>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const cx = img.width * area.x / 100, cy = img.height * area.y / 100
          const cw = img.width * area.w / 100,  ch = img.height * area.h / 100
          canvas.width = Math.max(1, cw); canvas.height = Math.max(1, ch)
          canvas.getContext('2d')!.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch)
          const url = canvas.toDataURL('image/jpeg', 0.92)
          resolve({ data: url.split(',')[1], type: 'image/jpeg' })
        }
        img.onerror = reject; img.src = imagePreview
      })
      const res = await window.electronAPI!.detectRegions({ imageData: cropped.data, mediaType: cropped.type })
      if (!res.success || !res.regions?.length) throw new Error(res.error || '구역 내 요소를 찾지 못했습니다')
      const mapped = res.regions.map((r, i) => ({
        ...r, id: `sub-${Date.now()}-${i}`,
        x: area.x + (r.x / 100) * area.w, y: area.y + (r.y / 100) * area.h,
        w: (r.w / 100) * area.w,           h: (r.h / 100) * area.h,
      }))
      setRegions(prev => [...prev, ...mapped])
      setEnabled(prev => { const n = new Set(prev); mapped.forEach(r => n.add(r.id)); return n })
      setPending(null)
    } catch (err) { alert(String(err).replace('Error: ', '')) }
    finally { setSubBusy(false) }
  }

  const addManual = (area: PendingRegion, cat: DetectedRegion['category']) => {
    const r: DetectedRegion = { id: `m-${Date.now()}`, category: cat, label: CAT_KO[cat], ...area }
    setRegions(prev => [...prev, r])
    setEnabled(prev => new Set([...prev, r.id]))
    setPending(null)
  }

  const removeRegion = (id: string) => {
    setRegions(prev => prev.filter(r => r.id !== id))
    setEnabled(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const onContainerDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || phase !== 'review') return
    if ((e.target as HTMLElement).closest('[data-box]')) return
    e.preventDefault()
    const p = toPct(e.clientX, e.clientY)
    setDrag({ kind: 'draw', x0: p.x, y0: p.y, x1: p.x, y1: p.y })
    setPending(null)
  }

  const isLoading = phase === 'detecting' || phase === 'extracting'
  const drawPrev = drag?.kind === 'draw' ? {
    x: Math.min(drag.x0, drag.x1), y: Math.min(drag.y0, drag.y1),
    w: Math.abs(drag.x1 - drag.x0), h: Math.abs(drag.y1 - drag.y0),
  } : null

  const steps = [
    { label: '영역 감지', done: ['review','extracting','done'].includes(phase), active: ['idle','detecting'].includes(phase) },
    { label: '구역 확인', done: ['extracting','done'].includes(phase), active: phase === 'review' },
    { label: 'UI 생성',   done: false, active: ['extracting','done'].includes(phase) },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => e.target === e.currentTarget && onClose()} onPaste={handlePaste}>
      <div className="flex flex-col rounded-xl shadow-2xl" style={{ background: colors.surface, border: `1px solid ${colors.border}`, width: 700, maxHeight: '92vh', overflow: 'hidden' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: colors.primary }} />
              <span className="font-semibold text-sm" style={{ color: colors.text }}>AI 디스플레이 분석</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: colors.primary+'20', color: colors.primary }}>llama-4-scout</span>
            </div>
            <div className="flex items-center gap-1">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div style={{ width:16, height:16, borderRadius:'50%', background: s.done ? colors.success : s.active ? colors.primary : colors.border, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff', fontWeight:700 }}>
                    {s.done ? '✓' : i+1}
                  </div>
                  <span style={{ fontSize:9, color: s.active ? colors.primary : s.done ? colors.success : colors.text, opacity: s.active||s.done ? 1 : 0.4 }}>{s.label}</span>
                  {i < 2 && <div style={{ width:10, height:1, background: s.done ? colors.success : colors.border, margin:'0 2px' }} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ color: colors.text, opacity: 0.4 }}><X size={16} /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Image area */}
          <div>
            {phase === 'review' && (
              <p className="text-[10px] mb-1.5" style={{ color: colors.text, opacity: 0.5 }}>
                박스 드래그 → 이동 &nbsp;·&nbsp; 코너 핸들 → 리사이즈 &nbsp;·&nbsp; 빈 곳 드래그 → 새 구역 추가
              </p>
            )}
            {/* Outer border/drop zone */}
            <div
              className="rounded-lg border-2 border-dashed transition-colors"
              style={{ borderColor: isDrop ? colors.primary : phase==='review' ? colors.primary+'50' : colors.border, background: colors.background, minHeight: imagePreview ? 'auto' : 160, cursor: imagePreview ? 'default' : 'pointer' }}
              onDragOver={e => { e.preventDefault(); setIsDrop(true) }}
              onDragLeave={() => setIsDrop(false)}
              onDrop={e => { e.preventDefault(); setIsDrop(false); const f=e.dataTransfer.files[0]; if(f) processFile(f) }}
              onClick={!imagePreview ? () => fileRef.current?.click() : undefined}
            >
              {imagePreview ? (
                /* Image + overlay container */
                <div ref={imgRef} style={{ position:'relative', lineHeight:0, cursor: phase==='review' ? 'crosshair' : 'default' }}
                  onMouseDown={onContainerDown}>
                  <img src={imagePreview} alt="" style={{ width:'100%', display:'block', borderRadius:6, userSelect:'none', pointerEvents:'none' }} draggable={false} />

                  {/* Existing boxes */}
                  {phase === 'review' && regions.map(region => {
                    const col = CAT_COLOR[region.category] ?? '#888'
                    const on  = enabled.has(region.id)
                    return (
                      <div key={region.id} data-box="1"
                        onMouseEnter={() => setHovered(region.id)}
                        onMouseLeave={() => setHovered(null)}
                        onMouseDown={e => {
                          e.stopPropagation(); if(e.button!==0) return; e.preventDefault()
                          const p = toPct(e.clientX, e.clientY)
                          setDrag({ kind:'move', id:region.id, spx:p.x, spy:p.y, ox:region.x, oy:region.y })
                        }}
                        style={{ position:'absolute', left:`${region.x}%`, top:`${region.y}%`, width:`${region.w}%`, height:`${region.h}%`,
                          border:`2px solid ${on ? col : '#555'}`, background: on ? `${col}1a` : 'rgba(0,0,0,0.25)',
                          boxSizing:'border-box', cursor:'move', opacity: on ? 1 : 0.4, transition:'opacity 0.1s' }}
                      >
                        {/* Label */}
                        <div data-box="1" style={{ position:'absolute', top:0, left:0, background: on?col:'#555', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', lineHeight:'15px', borderRadius:'0 0 3px 0', whiteSpace:'nowrap', maxWidth:'80%', overflow:'hidden', textOverflow:'ellipsis', pointerEvents:'none' }}>
                          {CAT_KO[region.category]} · {region.label}
                        </div>

                        {/* Hover buttons */}
                        {hovered === region.id && (
                          <div data-box="1" style={{ position:'absolute', top:0, right:0, display:'flex', gap:2, padding:2 }}>
                            <button data-box="1" onClick={e => { e.stopPropagation(); setEnabled(prev => { const n=new Set(prev); n.has(region.id)?n.delete(region.id):n.add(region.id); return n }) }}
                              style={{ background: on?col:'#555', color:'#fff', fontSize:8, fontWeight:700, padding:'1px 4px', borderRadius:2, cursor:'pointer' }}>
                              {on ? 'ON' : 'OFF'}
                            </button>
                            <button data-box="1" onClick={e => { e.stopPropagation(); removeRegion(region.id) }}
                              style={{ background:'#ef4444', color:'#fff', width:16, height:16, borderRadius:2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Corner resize handles */}
                        {(['nw','ne','sw','se'] as const).map(c => (
                          <div key={c} data-box="1"
                            onMouseDown={e => {
                              e.stopPropagation(); e.preventDefault()
                              const p = toPct(e.clientX, e.clientY)
                              setDrag({ kind:'resize', id:region.id, corner:c, spx:p.x, spy:p.y, ox:region.x, oy:region.y, ow:region.w, oh:region.h })
                            }}
                            style={{ position:'absolute', width:10, height:10, background:col, border:'2px solid #fff', borderRadius:2,
                              cursor: c==='nw'||c==='se' ? 'nwse-resize' : 'nesw-resize',
                              ...(c.includes('n') ? {top:-5} : {bottom:-5}),
                              ...(c.includes('w') ? {left:-5} : {right:-5}),
                            }} />
                        ))}
                      </div>
                    )
                  })}

                  {/* Draw preview */}
                  {drawPrev && drawPrev.w > 0 && (
                    <div style={{ position:'absolute', left:`${drawPrev.x}%`, top:`${drawPrev.y}%`, width:`${drawPrev.w}%`, height:`${drawPrev.h}%`,
                      border:'2px dashed #fff', background:'rgba(255,255,255,0.06)', boxSizing:'border-box', pointerEvents:'none' }} />
                  )}

                  {/* Pending region + category picker */}
                  {pending && (
                    <>
                      <div style={{ position:'absolute', left:`${pending.x}%`, top:`${pending.y}%`, width:`${pending.w}%`, height:`${pending.h}%`,
                        border:'2px dashed #fff', background:'rgba(255,255,255,0.04)', boxSizing:'border-box', pointerEvents:'none' }} />
                      <div data-box="1" onMouseDown={e => e.stopPropagation()}
                        style={{ position:'absolute', left:`${Math.min(pending.x, 60)}%`, top:`${Math.min(pending.y + pending.h + 1, 70)}%`,
                          background:colors.surface, border:`1px solid ${colors.border}`, borderRadius:8, padding:8, zIndex:20,
                          minWidth:190, boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }}>
                        <p style={{ fontSize:9, color:colors.text, opacity:0.5, marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>카테고리 선택</p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, marginBottom:6 }}>
                          {(Object.keys(CAT_KO) as DetectedRegion['category'][]).map(cat => (
                            <button key={cat} onClick={() => addManual(pending, cat)}
                              style={{ background:CAT_COLOR[cat]+'25', border:`1px solid ${CAT_COLOR[cat]}60`, color:CAT_COLOR[cat], fontSize:9, fontWeight:700, padding:'3px 0', borderRadius:4, cursor:'pointer' }}>
                              {CAT_KO[cat]}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => !subBusy && analyzeSubRegion(pending)} disabled={subBusy}
                          style={{ width:'100%', background:colors.primary+'20', border:`1px solid ${colors.primary}50`, color:colors.primary, fontSize:9, fontWeight:700,
                            padding:'4px 0', borderRadius:4, cursor:subBusy?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, opacity:subBusy?0.6:1 }}>
                          {subBusy ? <><Loader2 size={9} className="animate-spin" />분석 중...</> : <><Sparkles size={9} />AI 추가 탐지</>}
                        </button>
                        <button onClick={() => setPending(null)} style={{ width:'100%', marginTop:3, fontSize:9, color:colors.text, opacity:0.4, cursor:'pointer', padding:'2px 0' }}>취소</button>
                      </div>
                    </>
                  )}

                  {/* Replace image (idle only) */}
                  {phase === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      style={{ background:'rgba(0,0,0,0.5)', cursor:'pointer', borderRadius:6 }}
                      onClick={() => fileRef.current?.click()}>
                      <div className="flex items-center gap-2 text-white text-xs font-medium"><ImageIcon size={14} />이미지 교체</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Upload size={28} style={{ color: colors.border }} />
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color:colors.text, opacity:0.6 }}>이미지를 드래그하거나 클릭해서 업로드</p>
                    <p className="text-xs mt-1" style={{ color:colors.text, opacity:0.35 }}>Ctrl+V로 클립보드 붙여넣기 가능</p>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) processFile(f) }} />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs" style={{ color: colors.primary }}>
              <Loader2 size={13} className="animate-spin" />
              {phase === 'detecting' ? 'AI가 화면 구역을 감지하는 중...' : 'UI 요소를 추출하는 중...'}
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs" style={{ background:colors.danger+'15', color:colors.danger, border:`1px solid ${colors.danger}30` }}>
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <div><p className="font-semibold mb-0.5">오류</p><p style={{ opacity:0.8 }}>{errorMsg}</p></div>
            </div>
          )}

          {/* Region list */}
          {phase === 'review' && regions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Layers size={11} style={{ color:colors.text, opacity:0.4 }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:colors.text, opacity:0.4 }}>
                    감지된 구역 ({enabled.size}/{regions.length})
                  </span>
                </div>
                <button className="text-[10px] font-medium" style={{ color:colors.primary }}
                  onClick={() => enabled.size===regions.length ? setEnabled(new Set()) : setEnabled(new Set(regions.map(r=>r.id)))}>
                  {enabled.size===regions.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {regions.map(region => {
                  const col = CAT_COLOR[region.category] ?? '#888'
                  const on  = enabled.has(region.id)
                  return (
                    <button key={region.id} onClick={() => setEnabled(prev => { const n=new Set(prev); n.has(region.id)?n.delete(region.id):n.add(region.id); return n })}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left"
                      style={{ background: on?`${col}18`:colors.background, border:`1px solid ${on?col+'70':colors.border}`, opacity: on?1:0.5 }}>
                      <div style={{ width:7, height:7, borderRadius:2, background:col, flexShrink:0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate" style={{ color: on?col:colors.text }}>{CAT_KO[region.category]}</p>
                        <p className="text-[9px] truncate" style={{ color:colors.text, opacity:0.45 }}>{region.label}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeRegion(region.id) }} style={{ color:colors.danger, opacity:0.6, flexShrink:0 }}>
                        <Trash2 size={10} />
                      </button>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Element selection */}
          {phase === 'done' && result && (
            <div className="rounded-lg p-4 space-y-3" style={{ background:colors.background, border:`1px solid ${colors.success}40` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color:colors.success }} />
                  <span className="text-xs font-semibold" style={{ color:colors.success }}>요소 추출 완료</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color:colors.text, opacity:0.4 }}>{result.width}×{result.height} · {result.elements.length}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:colors.text, opacity:0.4 }}>적용할 요소 ({selected.size}/{result.elements.length})</span>
                <button onClick={() => selected.size===result.elements.length ? setSelected(new Set()) : setSelected(new Set(result.elements.map(e=>e.id)))}
                  className="text-[10px] font-medium" style={{ color:colors.primary }}>
                  {selected.size===result.elements.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="space-y-0.5 max-h-44 overflow-y-auto">
                {result.elements.map(el => (
                  <label key={el.id} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer" style={{ background:colors.surface }}>
                    <input type="checkbox" checked={selected.has(el.id)} onChange={e => setSelected(prev => { const n=new Set(prev); e.target.checked?n.add(el.id):n.delete(el.id); return n })}
                      className="w-3 h-3 cursor-pointer" style={{ accentColor:colors.primary }} />
                    <div style={{ width:8, height:8, borderRadius:2, background:el.color, border:`1px solid ${colors.border}`, flexShrink:0 }} />
                    <span className="flex-1 text-xs truncate font-mono" style={{ color:colors.text }}>{el.label||'(이름없음)'}</span>
                    <span className="text-[9px] shrink-0" style={{ color:colors.text, opacity:0.35 }}>{el.type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-t" style={{ borderColor: colors.border }}>
          <div>
            {(phase==='review'||phase==='done') && (
              <button onClick={detectRegions} disabled={isLoading} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background:colors.background, color:colors.text, border:`1px solid ${colors.border}` }}>재감지</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background:colors.border, color:colors.text }}>취소</button>
            {(phase==='idle'||phase==='error') && (
              <button onClick={detectRegions} disabled={!imageData||isLoading} className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40" style={{ background:colors.primary, color:'#fff' }}>
                <ScanSearch size={13} />영역 감지
              </button>
            )}
            {phase==='review' && (
              <button onClick={extractElements} disabled={enabled.size===0||isLoading} className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40" style={{ background:colors.primary, color:'#fff' }}>
                <Sparkles size={13} />UI 생성
              </button>
            )}
            {phase==='done' && result && (
              <button onClick={() => { loadConfig({ ...result, elements: result.elements.filter(el=>selected.has(el.id)) }); onClose() }}
                disabled={selected.size===0} className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40" style={{ background:colors.success, color:'#fff' }}>
                <CheckCircle2 size={13} />캔버스에 적용 ({selected.size}개)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
