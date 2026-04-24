import { useRemoteStore } from '../../stores/remoteStore'
import { useStyleStore } from '../../stores/styleStore'
import ButtonCell from './ButtonCell'

const BODY_RADIUS: Record<string, number> = {
  rounded: 24,
  sharp: 4,
  industrial: 10,
}

export default function RemoteCanvas() {
  const { config, selectedButtonId, setSelectedButton } = useRemoteStore()
  const { colors, bgImage } = useStyleStore()
  const { grid, buttons, bodyColor, bodyStyle, name } = config

  const radius = BODY_RADIUS[bodyStyle]
  const btnSize = Math.min(84, Math.max(52, Math.floor(480 / Math.max(grid.cols, grid.rows))))

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <div
          className="text-[10px] font-mono tracking-widest uppercase mb-0.5"
          style={{ color: colors.primary, opacity: 0.7 }}
        >
          리모컨
        </div>
        <div className="text-sm font-bold tracking-wide" style={{ color: colors.text }}>
          {name}
        </div>
      </div>

      {/* Remote body */}
      <div
        style={{
          background: bgImage ? `url(${bgImage}) center/cover` : bodyColor,
          borderRadius: radius,
          border: `2px solid ${colors.border}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
          padding: 20,
        }}
      >
        {/* Top accent strip */}
        <div
          style={{
            width: '100%',
            height: 3,
            borderRadius: 2,
            background: colors.primary,
            opacity: 0.45,
            marginBottom: 16,
          }}
        />

        {/* Button grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${grid.cols}, ${btnSize}px)`,
            gridTemplateRows: `repeat(${grid.rows}, ${btnSize}px)`,
            gap: grid.gap,
          }}
        >
          {buttons.map((btn) => (
            <ButtonCell
              key={btn.id}
              button={btn}
              selected={btn.id === selectedButtonId}
              size={btnSize}
              onClick={() => setSelectedButton(btn.id === selectedButtonId ? null : btn.id)}
            />
          ))}
        </div>

        {/* Bottom info strip */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{ fontSize: 8, fontFamily: 'monospace', color: colors.text, opacity: 0.18, letterSpacing: '0.1em' }}
          >
            RCTK-GEN
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[colors.success, colors.border, colors.border].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <span style={{ fontSize: 8, fontFamily: 'monospace', color: colors.text, opacity: 0.18 }}>
            {grid.rows}×{grid.cols}
          </span>
        </div>
      </div>

      <span className="text-[10px]" style={{ color: colors.text, opacity: 0.3 }}>
        버튼 클릭 → 좌측 패널에서 편집
      </span>
    </div>
  )
}
