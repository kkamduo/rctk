import { useStyleStore } from '../../stores/styleStore'
import type { WidgetConfig } from '../../types/display'
import type { ButtonConfig } from '../../types/remote'

interface Props {
  widget: WidgetConfig
  linkedButton?: ButtonConfig
  selected: boolean
  size: number
  onClick: () => void
}

function GaugeBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ width: '100%', marginTop: 2 }}>
      <div
        style={{
          width: '100%',
          height: 5,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          fontSize: 7,
          color,
          textAlign: 'right',
          marginTop: 1,
          fontFamily: 'monospace',
          opacity: 0.8,
        }}
      >
        {pct.toFixed(0)}%
      </div>
    </div>
  )
}

export default function DisplayWidget({ widget, linkedButton, selected, size, onClick }: Props) {
  const { colors } = useStyleStore()
  const wColor = linkedButton?.bgColor || widget.color
  const numVal = typeof widget.value === 'number' ? widget.value : 0
  const pct = Math.min(100, Math.max(0, (numVal / widget.max) * 100))

  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        background: `${wColor}15`,
        border: `1px solid ${selected ? colors.primary : wColor + '35'}`,
        borderRadius: 5,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 2,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? `0 0 0 1px ${colors.primary}50` : 'none',
        transition: 'all 0.12s',
        outline: 'none',
      }}
    >
      {/* Type badge */}
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 3,
          fontSize: 6,
          fontFamily: 'monospace',
          color: wColor,
          opacity: 0.55,
          textTransform: 'uppercase',
        }}
      >
        {widget.type}
      </span>

      {/* --- Status --- */}
      {widget.type === 'status' && (
        <div
          style={{
            marginTop: 18,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: wColor,
            boxShadow: `0 0 7px ${wColor}`,
          }}
        />
      )}

      {/* --- Indicator --- */}
      {widget.type === 'indicator' && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: wColor, boxShadow: `0 0 6px ${wColor}` }} />
          <span style={{ fontSize: 7, fontFamily: 'monospace', color: wColor }}>ON</span>
        </div>
      )}

      {/* --- Numeric --- */}
      {widget.type === 'numeric' && (
        <div
          style={{
            marginTop: 16,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'monospace',
            color: wColor,
            lineHeight: 1,
          }}
        >
          {numVal.toFixed(1)}
          {widget.unit && (
            <span style={{ fontSize: 8, opacity: 0.7, marginLeft: 1 }}>{widget.unit}</span>
          )}
        </div>
      )}

      {/* --- Gauge --- */}
      {widget.type === 'gauge' && (
        <div style={{ marginTop: 14, width: '100%', padding: '0 4px' }}>
          <GaugeBar pct={pct} color={wColor} />
        </div>
      )}

      {/* --- Alarm --- */}
      {widget.type === 'alarm' && (
        <>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 5,
              border: `1px solid ${colors.danger}`,
              opacity: 0.35,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              marginTop: 16,
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: colors.danger,
              letterSpacing: '0.06em',
            }}
          >
            ALARM
          </div>
        </>
      )}

      {/* Label */}
      <div
        style={{
          fontSize: 8,
          color: colors.text,
          opacity: 0.5,
          textAlign: 'center',
          fontFamily: 'monospace',
          maxWidth: size - 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: 'auto',
        }}
      >
        {linkedButton?.label || widget.label}
      </div>
    </button>
  )
}
