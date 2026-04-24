import { useState } from 'react'
import { useDisplayStore } from '../../stores/displayStore'
import { useStyleStore } from '../../stores/styleStore'
import { useRemoteStore } from '../../stores/remoteStore'
import DisplayWidget from './DisplayWidget'
import HoryongDisplay from './HoryongDisplay'
import { Monitor } from 'lucide-react'

const WIDGET_SIZE = 72

export default function DisplayCanvas() {
  const [horyongMode, setHoryongMode] = useState(false)
  const { config, selectedWidgetId, setSelectedWidget } = useDisplayStore()
  const { config: remote } = useRemoteStore()
  const { colors } = useStyleStore()
  const { widgets, cols, bgColor, name } = config

  const screenWidth = cols * (WIDGET_SIZE + 6) - 6 + 24

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-center">
        <div
          className="text-[10px] font-mono tracking-widest uppercase mb-0.5"
          style={{ color: colors.accent, opacity: 0.7 }}
        >
          디스플레이 화면
        </div>
        <div className="text-sm font-bold tracking-wide" style={{ color: colors.text }}>
          {name}
        </div>
        <button
          onClick={() => setHoryongMode(!horyongMode)}
          className="mt-1 text-[9px] px-2 py-0.5 rounded font-mono"
          style={{
            background: horyongMode ? colors.primary + '30' : colors.border,
            color: horyongMode ? colors.primary : colors.text,
            border: `1px solid ${horyongMode ? colors.primary : colors.border}`,
            opacity: 0.8,
          }}
        >
          {horyongMode ? '● HORYONG LCD' : '○ HORYONG LCD'}
        </button>
      </div>

      {horyongMode && (
        <div style={{ background: '#080808', border: `3px solid ${colors.border}`, borderRadius: 10, padding: 8 }}>
          <HoryongDisplay />
        </div>
      )}

      {!horyongMode && (
      <>{/* Bezel */}
      <div
        style={{
          background: '#080808',
          border: `3px solid ${colors.border}`,
          borderRadius: 10,
          padding: 8,
          boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 15px rgba(0,0,0,0.5)',
        }}
      >
        {/* Screen area */}
        <div
          style={{
            background: bgColor,
            borderRadius: 5,
            padding: 12,
            minWidth: screenWidth,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.35)',
          }}
        >
          {/* Status bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: `1px solid ${colors.border}30`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Monitor size={9} style={{ color: colors.primary }} />
              <span
                style={{
                  fontSize: 8,
                  fontFamily: 'monospace',
                  color: colors.primary,
                  letterSpacing: '0.08em',
                }}
              >
                {remote.name.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: colors.success,
                  boxShadow: `0 0 4px ${colors.success}`,
                }}
              />
              <span style={{ fontSize: 8, fontFamily: 'monospace', color: colors.success }}>
                ONLINE
              </span>
            </div>
          </div>

          {/* Widget grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, ${WIDGET_SIZE}px)`,
              gap: 6,
            }}
          >
            {widgets.map((w) => {
              const btn = remote.buttons.find((b) => b.id === w.linkedButtonId)
              return (
                <DisplayWidget
                  key={w.id}
                  widget={w}
                  linkedButton={btn}
                  selected={w.id === selectedWidgetId}
                  size={WIDGET_SIZE}
                  onClick={() => setSelectedWidget(w.id === selectedWidgetId ? null : w.id)}
                />
              )
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingTop: 5,
              borderTop: `1px solid ${colors.border}30`,
            }}
          >
            <span style={{ fontSize: 7, fontFamily: 'monospace', color: colors.text, opacity: 0.18, letterSpacing: '0.08em' }}>
              RCTK DISPLAY
            </span>
            <span style={{ fontSize: 7, fontFamily: 'monospace', color: colors.text, opacity: 0.18 }}>
              {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      </>)}

      <span className="text-[10px]" style={{ color: colors.text, opacity: 0.3 }}>
        상단 Sync → Remote와 연동
      </span>
    </div>
  )
}
