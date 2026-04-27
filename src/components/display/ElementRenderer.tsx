import type { DisplayElement } from '../../types/display'

interface Props {
  element: DisplayElement
  selected: boolean
  widthPx: number
  heightPx: number
}

export default function ElementRenderer({ element, selected, widthPx, heightPx }: Props) {
  const { type, label, value, color, bgColor, active, unit, dynamic, confident } = element
  const fs1 = Math.max(8, Math.round(heightPx * 0.22))
  const fs2 = Math.max(7, Math.round(fs1 * 0.72))

  const base: React.CSSProperties = {
    width: widthPx,
    height: heightPx,
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
    position: 'relative',
    outline: selected ? '2px solid #3b82f6' : confident === false ? '1.5px dashed #f97316' : 'none',
    outlineOffset: 1,
  }

  const badges = (
    <>
      {dynamic === true && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          background: '#3b82f6', color: '#fff',
          fontSize: 8, padding: '1px 3px', borderRadius: 2,
          lineHeight: 1.2, pointerEvents: 'none', zIndex: 10,
        }}>⚡</span>
      )}
      {confident === false && (
        <span style={{
          position: 'absolute', top: dynamic === true ? 14 : 2, right: 2,
          background: '#f97316', color: '#fff',
          fontSize: 8, padding: '1px 3px', borderRadius: 2,
          lineHeight: 1.2, pointerEvents: 'none', zIndex: 10,
        }}>?</span>
      )}
    </>
  )

  if (type === 'indicator') {
    const ledColor = active !== false ? color : '#444'
    const ledSize = Math.max(8, Math.round(fs1 * 0.9))
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', gap: 5, padding: '2px 5px', border: `1px solid ${color}33` }}>
        {badges}
        <div style={{
          width: ledSize, height: ledSize, flexShrink: 0,
          background: ledColor,
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.4)',
          boxShadow: active !== false ? `0 0 6px ${color}` : 'none',
        }} />
        <span style={{ fontSize: fs1, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
    )
  }

  if (type === 'gauge') {
    const pct = value ? Math.min(100, Math.max(0, parseFloat(value) || 0)) : 0
    return (
      <div style={{ ...base, background: bgColor, padding: '2px 5px', border: `1px solid ${color}33` }}>
        {badges}
        <div style={{ fontSize: fs2, color: `${color}99`, marginBottom: 2 }}>{label}</div>
        <div style={{ height: 7, background: '#ffffff18', border: `1px solid ${color}44`, borderRadius: 2 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
        {value !== undefined && (
          <div style={{ fontSize: fs2, fontFamily: 'monospace', marginTop: 1, color }}>{value}{unit || ''}</div>
        )}
      </div>
    )
  }

  if (type === 'arc-gauge') {
    const pct = value ? Math.min(100, Math.max(0, parseFloat(value) || 0)) / 100 : 0
    const svgH = heightPx - 16
    const r = Math.min(widthPx, svgH) / 2 - 6
    const cx = widthPx / 2
    const cy = svgH / 2 + 4
    const startDeg = 135
    const totalDeg = 270
    const valueDeg = startDeg + totalDeg * pct
    const toRad = (d: number) => d * Math.PI / 180
    const pt = (d: number) => ({ x: cx + r * Math.cos(toRad(d)), y: cy + r * Math.sin(toRad(d)) })
    const s = pt(startDeg)
    const bgE = pt(startDeg + totalDeg)
    const vE = pt(valueDeg)
    const largeArcBg = totalDeg > 180 ? 1 : 0
    const largeArcVal = (valueDeg - startDeg) > 180 ? 1 : 0

    return (
      <div style={{ ...base, background: bgColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {badges}
        <svg width={widthPx} height={svgH} style={{ overflow: 'visible' }}>
          <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArcBg} 1 ${bgE.x} ${bgE.y}`}
            fill="none" stroke="#333" strokeWidth={5} strokeLinecap="round" />
          {pct > 0 && (
            <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArcVal} 1 ${vE.x} ${vE.y}`}
              fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
          )}
          <text x={cx} y={cy + 4} textAnchor="middle"
            fontSize={Math.max(10, svgH * 0.22)} fontWeight="bold" fill={color} fontFamily="monospace">
            {value ?? '0'}{unit}
          </text>
        </svg>
        <div style={{ fontSize: 8, color: `${color}99`, marginTop: -8, textAlign: 'center' }}>{label}</div>
      </div>
    )
  }

  if (type === 'numeric') {
    return (
      <div style={{ ...base, background: bgColor, padding: '2px 5px', border: `1px solid ${color}33`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {badges}
        <div style={{ fontSize: fs2, color: `${color}88` }}>{label}</div>
        <div style={{ fontSize: fs1 * 1.4, fontFamily: 'monospace', fontWeight: 'bold', color, lineHeight: 1.2 }}>
          {value ?? '0.0'}<span style={{ fontSize: fs2, marginLeft: 2 }}>{unit}</span>
        </div>
      </div>
    )
  }

  if (type === 'button') {
    const symbol = value || '▶'
    const fontSize = Math.min(widthPx, heightPx) * 0.38
    return (
      <div style={{
        ...base, background: bgColor,
        border: `2px solid ${color}`,
        borderRadius: 4,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2, cursor: 'pointer',
      }}>
        {badges}
        <span style={{ fontSize, color, lineHeight: 1 }}>{symbol}</span>
        {label && <span style={{ fontSize: 7, color: `${color}99` }}>{label}</span>}
      </div>
    )
  }

  if (type === 'label') {
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        {badges}
        <span style={{ fontSize: fs1, color, fontWeight: 'bold' }}>{label}</span>
      </div>
    )
  }

  if (type === 'title') {
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', padding: '0 6px', borderBottom: `1px solid ${color}44` }}>
        {badges}
        <span style={{ fontSize: fs1 * 1.2, color, fontWeight: '900', letterSpacing: 1 }}>{label}</span>
      </div>
    )
  }

  if (type === 'logo') {
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {badges}
        <span style={{ fontSize: fs1 * 1.1, color, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 }}>{label}</span>
        {value && <span style={{ fontSize: fs2, color: `${color}88` }}>{value}</span>}
      </div>
    )
  }

  if (type === 'image-crop') {
    return (
      <div style={{ ...base, overflow: 'hidden', position: 'relative' }}>
        {element.imageData
          ? <img
              src={`data:${element.mediaType ?? 'image/jpeg'};base64,${element.imageData}`}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
            />
          : <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: fs2, color, opacity: 0.5 }}>{label || '크롭'}</span>
            </div>
        }
      </div>
    )
  }

  return null
}
