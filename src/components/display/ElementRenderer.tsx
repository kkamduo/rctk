import type { DisplayElement } from '../../types/display'

interface Props {
  element: DisplayElement
  selected: boolean
}

export default function ElementRenderer({ element, selected }: Props) {
  const { type, width, height, label, value, color, bgColor, active, unit } = element

  const base: React.CSSProperties = {
    width,
    height,
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
    outline: selected ? '2px solid #3b82f6' : 'none',
    outlineOffset: 1,
  }

  if (type === 'indicator') {
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', gap: 5, padding: '2px 5px', border: '1px solid #ccc' }}>
        <div style={{
          width: 11, height: 11, flexShrink: 0,
          background: active !== false ? color : '#888',
          border: '1px solid rgba(0,0,0,0.3)',
          boxShadow: active !== false ? `0 0 5px ${color}` : 'none',
        }} />
        <span style={{ fontSize: 9, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
    )
  }

  if (type === 'gauge') {
    const pct = value ? Math.min(100, Math.max(0, parseFloat(value) || 0)) : 0
    return (
      <div style={{ ...base, background: bgColor, padding: '2px 5px', border: '1px solid #ccc' }}>
        <div style={{ fontSize: 8, color: '#666', marginBottom: 2 }}>{label}</div>
        <div style={{ height: 7, background: '#f0f0f0', border: `1px solid ${color}50`, borderRadius: 1 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 1 }} />
        </div>
        {value !== undefined && (
          <div style={{ fontSize: 8, fontFamily: 'monospace', marginTop: 1, color: '#333' }}>{value}{unit || ''}</div>
        )}
      </div>
    )
  }

  if (type === 'numeric') {
    return (
      <div style={{ ...base, background: bgColor, padding: '2px 5px', border: '1px solid #ccc', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 8, color: '#666' }}>{label}</div>
        <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold', color, lineHeight: 1.2 }}>
          {value ?? '0.0'}<span style={{ fontSize: 9, marginLeft: 2 }}>{unit}</span>
        </div>
      </div>
    )
  }

  if (type === 'label') {
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        <span style={{ fontSize: 10, color, fontWeight: 'bold' }}>{label}</span>
      </div>
    )
  }

  if (type === 'title') {
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', padding: '0 6px', borderBottom: '1px solid #ddd' }}>
        <span style={{ fontSize: 12, color, fontWeight: '900', letterSpacing: 1 }}>{label}</span>
      </div>
    )
  }

  if (type === 'logo') {
    return (
      <div style={{ ...base, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 }}>{label}</span>
        {value && <span style={{ fontSize: 8, color: '#888' }}>{value}</span>}
      </div>
    )
  }

  return null
}
