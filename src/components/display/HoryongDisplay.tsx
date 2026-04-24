import { useState, useRef, useCallback } from 'react'

interface Pos { x: number; y: number }

const CANVAS_W = 340
const CANVAS_H = 250

const INITIAL: Record<string, Pos> = {
  topbar:     { x: 0,   y: 0   },
  indicators: { x: 0,   y: 22  },
  diagram:    { x: 108, y: 22  },
  readings:   { x: 228, y: 22  },
  valves:     { x: 0,   y: 200 },
  footer:     { x: 0,   y: 222 },
}

export default function HoryongDisplay() {
  const [positions, setPositions] = useState<Record<string, Pos>>(INITIAL)
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null)

  const onMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    const pos = positions[id]
    dragging.current = { id, ox: e.clientX - pos.x, oy: e.clientY - pos.y }
  }, [positions])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    const { id, ox, oy } = dragging.current
    setPositions(p => ({ ...p, [id]: { x: e.clientX - ox, y: e.clientY - oy } }))
  }, [])

  const onMouseUp = useCallback(() => { dragging.current = null }, [])

  const p = positions

  return (
    <div>
      <div
        style={{ fontSize: 9, color: '#888', textAlign: 'center', marginBottom: 4, fontFamily: 'monospace' }}
      >
        ✦ 각 요소를 드래그해서 위치 조정
      </div>
      <div
        style={{
          position: 'relative',
          width: CANVAS_W,
          height: CANVAS_H,
          background: '#ffffff',
          border: '2px solid #555',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: dragging.current ? 'grabbing' : 'default',
          userSelect: 'none',
        }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Top bar */}
        <Draggable pos={p.topbar} onMouseDown={e => onMouseDown('topbar', e)}>
          <div style={{
            width: CANVAS_W, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '3px 6px',
            background: '#f0f0f0', borderBottom: '1px solid #ccc',
            fontFamily: 'Arial, sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <BatteryIcon />
              <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 }}>000</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 'bold', color: '#333' }}>Kumanda</span>
          </div>
        </Draggable>

        {/* Left indicators */}
        <Draggable pos={p.indicators} onMouseDown={e => onMouseDown('indicators', e)}>
          <div style={{
            width: 108, background: '#fff',
            border: '1px solid #ddd', padding: '4px 6px',
            display: 'flex', flexDirection: 'column', gap: 3,
            fontFamily: 'Arial, sans-serif',
          }}>
            {[
              { label: 'Kumanda', on: true },
              { label: 'Destek sensör', on: true },
              { label: 'Acil stop', on: true },
              { label: 'Maks. limit', on: true },
              { label: 'Basın sensör', on: true },
              { label: 'İletişimhata', on: false },
            ].map(ind => (
              <div key={ind.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 11, height: 11, flexShrink: 0,
                  background: ind.on ? '#00e600' : '#888',
                  border: '1px solid #333',
                  boxShadow: ind.on ? '0 0 4px #00cc00' : 'none',
                }} />
                <span style={{ fontSize: 8.5, color: '#222' }}>{ind.label}</span>
              </div>
            ))}
          </div>
        </Draggable>

        {/* Center boom diagram */}
        <Draggable pos={p.diagram} onMouseDown={e => onMouseDown('diagram', e)}>
          <div style={{
            background: '#fff', border: '1px solid #ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2px',
          }}>
            <BoomDiagram />
          </div>
        </Draggable>

        {/* Right readings */}
        <Draggable pos={p.readings} onMouseDown={e => onMouseDown('readings', e)}>
          <div style={{
            width: 112, background: '#fff',
            border: '1px solid #ddd', padding: '4px 6px',
            display: 'flex', flexDirection: 'column', gap: 5,
            fontFamily: 'Arial, sans-serif',
          }}>
            <ReadingRow label="Sepetaşağı" type="noset" />
            <ReadingRow label="Sepet Yukarı" type="noset" />
            <ReadingRow label="Epet lokasyonu" value="0.0m" type="gauge-pink" />
            <ReadingRow label="Bomayarı" value="0.0m" type="text" />
            <ReadingRow label="Bomuzunluğu" value="0.0m" type="gauge-blue" />
          </div>
        </Draggable>

        {/* Valve bars */}
        <Draggable pos={p.valves} onMouseDown={e => onMouseDown('valves', e)}>
          <div style={{
            width: CANVAS_W, display: 'flex', gap: 6,
            padding: '3px 6px', background: '#f5f5f5',
            border: '1px solid #ddd', fontFamily: 'Arial, sans-serif',
          }}>
            <ValveBar label="Sepetvalfi" value="0V" color="#dd2222" bg="#fce8e8" border="#d08080" />
            <ValveBar label="Bomvalfi"   value="0V" color="#2255cc" bg="#e0eeff" border="#88aadd" />
          </div>
        </Draggable>

        {/* Footer */}
        <Draggable pos={p.footer} onMouseDown={e => onMouseDown('footer', e)}>
          <div style={{
            width: CANVAS_W, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '3px 8px',
            background: '#fff', borderTop: '1px solid #ccc',
            fontFamily: 'Arial, sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HoryongLogo />
              <span style={{ fontWeight: 900, fontSize: 11, letterSpacing: 1, color: '#111', fontStyle: 'italic' }}>HORYONG</span>
            </div>
            <div style={{ textAlign: 'right', lineHeight: 1.4 }}>
              <div style={{ fontSize: 8, color: '#444' }}>Model : PE285</div>
              <div style={{ fontSize: 7.5, color: '#888' }}>Epec : 0.0  LCD : 2.1.6</div>
            </div>
          </div>
        </Draggable>
      </div>

      {/* Reset button */}
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <button
          onClick={() => setPositions(INITIAL)}
          style={{
            fontSize: 9, padding: '2px 8px', background: '#eee',
            border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer', color: '#555',
          }}
        >
          위치 초기화
        </button>
      </div>
    </div>
  )
}

function Draggable({ pos, onMouseDown, children }: {
  pos: Pos
  onMouseDown: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <div
      style={{ position: 'absolute', left: pos.x, top: pos.y, cursor: 'grab' }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  )
}

function ReadingRow({ label, value, type }: { label: string; value?: string; type: string }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: '#666', marginBottom: 1 }}>{label}</div>
      {type === 'noset' && (
        <span style={{ fontSize: 10, fontWeight: 'bold', color: '#dd2222' }}>NOSET</span>
      )}
      {type === 'gauge-pink' && <>
        <div style={{ height: 6, background: '#fff0f5', border: '1px solid #e088aa', borderRadius: 1, marginBottom: 1 }}>
          <div style={{ width: '2%', height: '100%', background: '#dd4488' }} />
        </div>
        <span style={{ fontSize: 9, fontFamily: 'monospace' }}>{value}</span>
      </>}
      {type === 'gauge-blue' && <>
        <div style={{ height: 6, background: '#f0f5ff', border: '1px solid #88aadd', borderRadius: 1, marginBottom: 1 }}>
          <div style={{ width: '2%', height: '100%', background: '#4488cc' }} />
        </div>
        <span style={{ fontSize: 9, fontFamily: 'monospace' }}>{value}</span>
      </>}
      {type === 'text' && (
        <span style={{ fontSize: 9, fontFamily: 'monospace' }}>{value}</span>
      )}
    </div>
  )
}

function ValveBar({ label, value, color, bg, border }: { label: string; value: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 8, color: '#555', marginBottom: 1 }}>{label}</div>
      <div style={{ height: 8, background: bg, border: `1px solid ${border}`, borderRadius: 1, display: 'flex', alignItems: 'center', paddingLeft: 3 }}>
        <span style={{ fontSize: 7.5, color, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</span>
      </div>
    </div>
  )
}

function BatteryIcon() {
  return (
    <svg width="20" height="11" viewBox="0 0 20 11">
      <rect x="0.5" y="1" width="16" height="9" rx="1.5" fill="none" stroke="#333" strokeWidth="1.2" />
      <rect x="16.5" y="3.5" width="3" height="4" rx="0.5" fill="#333" />
    </svg>
  )
}

function HoryongLogo() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      <polyline points="1,11 4,1 6.5,7 8,4 10.5,7 13,1 15,11"
        stroke="#111" strokeWidth="1.8" fill="none"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function BoomDiagram() {
  const armW = 74

  function HazardArm({ x, y }: { x: number; y: number }) {
    const count = 7
    return (
      <g>
        <rect x={x} y={y} width={armW} height={11} fill="#111" />
        {Array.from({ length: count }).map((_, i) => (
          <rect key={i} x={x + i * (armW / count)} y={y} width={armW / count / 2} height={11} fill="#e86a00" />
        ))}
        <rect x={x} y={y} width={armW} height={11} fill="none" stroke="#555" strokeWidth="0.8" />
      </g>
    )
  }

  function GreenSquares({ y }: { y: number }) {
    return <>
      {[3, 16, 55, 68].map(x => (
        <rect key={x} x={x} y={y} width={10} height={10} fill="#00e600" stroke="#009900" strokeWidth="0.7" />
      ))}
    </>
  }

  return (
    <svg width="82" height="160" viewBox="0 0 82 160">
      <GreenSquares y={2} />
      <HazardArm x={4} y={13} />
      <rect x="29" y="24" width="24" height="86" rx="1" fill="#b0c8e8" stroke="#5577aa" strokeWidth="1" />
      <rect x="31" y="26" width="20" height="82" rx="1" fill="#90aed0" />
      <line x1="41" y1="26" x2="41" y2="108" stroke="#6688bb" strokeWidth="0.6" strokeDasharray="4,3" />
      {[50, 70, 90].map(y => <line key={y} x1="29" y1={y} x2="53" y2={y} stroke="#7799cc" strokeWidth="0.5" />)}
      <rect x="39" y="27" width="4" height="80" fill="#cc2222" opacity="0.75" />
      <rect x="32" y="25" width="18" height="13" rx="1" fill="#1a2a4a" stroke="#334466" strokeWidth="0.8" />
      <rect x="34" y="27" width="14" height="9" rx="0.5" fill="#223355" />
      {[29.5, 32, 34.5].map(y => <line key={y} x1="35" y1={y} x2="47" y2={y} stroke="#4499ff" strokeWidth="0.6" opacity="0.5" />)}
      <HazardArm x={4} y={109} />
      <GreenSquares y={121} />
      <rect x="22" y="132" width="38" height="14" rx="2" fill="#9aacbe" stroke="#6688aa" strokeWidth="1" />
      <rect x="26" y="134" width="30" height="10" rx="1" fill="#7a8fa8" />
      <ellipse cx="28" cy="150" rx="9" ry="7" fill="#2a2a2a" stroke="#111" strokeWidth="1" />
      <ellipse cx="54" cy="150" rx="9" ry="7" fill="#2a2a2a" stroke="#111" strokeWidth="1" />
      <ellipse cx="28" cy="150" rx="4" ry="3.5" fill="#555" />
      <ellipse cx="54" cy="150" rx="4" ry="3.5" fill="#555" />
      <circle cx="28" cy="150" r="1.2" fill="#888" />
      <circle cx="54" cy="150" r="1.2" fill="#888" />
    </svg>
  )
}
