import { useStyleStore } from '../../stores/styleStore'
import type { ButtonConfig, ButtonFunction } from '../../types/remote'

const BADGE: Record<ButtonFunction, string> = {
  momentary: 'M',
  toggle: 'T',
  hold: 'H',
  emergency: 'E',
  encoder: 'ENC',
  indicator: 'IND',
}

const BADGE_COLOR: Record<ButtonFunction, string> = {
  momentary: '#6b7280',
  toggle: '#3b82f6',
  hold: '#8b5cf6',
  emergency: '#ef4444',
  encoder: '#f59e0b',
  indicator: '#22c55e',
}

interface Props {
  button: ButtonConfig
  selected: boolean
  size: number
  onClick: () => void
}

export default function ButtonCell({ button, selected, size, onClick }: Props) {
  const { colors } = useStyleStore()
  const isEmergency = button.function === 'emergency'
  const isIndicator = button.function === 'indicator'
  const badgeColor = BADGE_COLOR[button.function]

  return (
    <button
      onClick={onClick}
      disabled={!button.enabled}
      title={`${button.label} [${button.function}]`}
      style={{
        width: size,
        height: size,
        background: button.bgColor,
        borderRadius: isEmergency ? '50%' : 8,
        border: `2px solid ${
          selected ? colors.primary : isEmergency ? '#ef4444' : 'rgba(255,255,255,0.07)'
        }`,
        boxShadow: selected
          ? `0 0 0 2px ${colors.primary}50, 0 4px 12px rgba(0,0,0,0.4)`
          : isEmergency
          ? '0 0 12px #ef444440'
          : '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        opacity: button.enabled ? 1 : 0.3,
        cursor: button.enabled ? 'pointer' : 'not-allowed',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: 4,
        transition: 'all 0.12s ease',
        outline: 'none',
      }}
      onMouseEnter={(e) => { if (button.enabled) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)' }}
      onMouseDown={(e) => { if (button.enabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.94)' }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
    >
      {/* Function badge */}
      <span
        style={{
          position: 'absolute',
          top: 3,
          right: 3,
          fontSize: 7,
          fontFamily: 'monospace',
          background: badgeColor + '28',
          color: badgeColor,
          padding: '1px 3px',
          borderRadius: 2,
          lineHeight: 1,
          letterSpacing: '0.03em',
        }}
      >
        {BADGE[button.function]}
      </span>

      {/* Emergency ring */}
      {isEmergency && (
        <span
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            border: '2px dashed #ef444480',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main label */}
      <span
        style={{
          color: button.color,
          fontSize: size > 68 ? 11 : 9,
          fontWeight: 700,
          fontFamily: 'monospace',
          letterSpacing: '0.04em',
          textAlign: 'center',
          maxWidth: size - 14,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        {button.label}
      </span>

      {/* Sub label */}
      {button.subLabel && (
        <span
          style={{
            color: button.color,
            opacity: 0.55,
            fontSize: 8,
            fontFamily: 'monospace',
            textAlign: 'center',
            maxWidth: size - 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {button.subLabel}
        </span>
      )}

      {/* Indicator LED */}
      {isIndicator && (
        <span
          style={{
            position: 'absolute',
            bottom: 5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: colors.success,
            boxShadow: `0 0 5px ${colors.success}`,
          }}
        />
      )}
    </button>
  )
}
