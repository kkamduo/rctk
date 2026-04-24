import { useRemoteStore, GRID_PRESETS } from '../../stores/remoteStore'
import { useStyleStore } from '../../stores/styleStore'
import { LayoutGrid } from 'lucide-react'
import type { GridPreset } from '../../types/remote'

const PRESET_KEYS = Object.keys(GRID_PRESETS).filter((k) => k !== 'custom') as GridPreset[]

export default function GridConfigurator() {
  const { colors } = useStyleStore()
  const { config, gridPreset, setGridPreset, setCustomGrid, setBodyColor, setBodyStyle } =
    useRemoteStore()

  return (
    <div className="border-b p-3" style={{ borderColor: colors.border }}>
      <div className="flex items-center gap-2 mb-3">
        <LayoutGrid size={13} style={{ color: colors.primary }} />
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: colors.primary }}>
          그리드
        </span>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-3 gap-1 mb-3">
        {PRESET_KEYS.map((p) => (
          <button
            key={p}
            onClick={() => setGridPreset(p)}
            className="py-1 rounded text-[11px] font-mono transition-all"
            style={{
              background: gridPreset === p ? colors.primary : colors.border,
              color: gridPreset === p ? '#fff' : colors.text,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Custom rows × cols */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px]" style={{ color: colors.text, opacity: 0.65 }}>
          직접 입력
        </span>
        <input
          type="number"
          min={1}
          max={8}
          value={config.grid.rows}
          onChange={(e) => setCustomGrid(Math.max(1, parseInt(e.target.value) || 1), config.grid.cols)}
          className="w-10 px-1 py-0.5 rounded text-[11px] font-mono text-center border"
          style={{ background: colors.background, color: colors.text, borderColor: colors.border }}
        />
        <span style={{ color: colors.text, opacity: 0.4 }}>×</span>
        <input
          type="number"
          min={1}
          max={8}
          value={config.grid.cols}
          onChange={(e) => setCustomGrid(config.grid.rows, Math.max(1, parseInt(e.target.value) || 1))}
          className="w-10 px-1 py-0.5 rounded text-[11px] font-mono text-center border"
          style={{ background: colors.background, color: colors.text, borderColor: colors.border }}
        />
      </div>

      {/* Body style */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: colors.text, opacity: 0.65 }}>
            모양
          </span>
          <div className="flex gap-1">
            {([['rounded', '둥글게'], ['sharp', '직각'], ['industrial', '산업용']] as const).map(([s, label]) => (
              <button
                key={s}
                onClick={() => setBodyStyle(s)}
                className="px-1.5 py-0.5 rounded text-[10px] transition-all"
                style={{
                  background: config.bodyStyle === s ? colors.primary : colors.border,
                  color: config.bodyStyle === s ? '#fff' : colors.text,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: colors.text, opacity: 0.65 }}>
            본체 색상
          </span>
          <input
            type="color"
            value={config.bodyColor}
            onChange={(e) => setBodyColor(e.target.value)}
            style={{ width: 24, height: 20, borderRadius: 4, cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  )
}
