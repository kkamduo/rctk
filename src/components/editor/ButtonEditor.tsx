import { useRemoteStore } from '../../stores/remoteStore'
import { useStyleStore } from '../../stores/styleStore'
import { SlidersHorizontal, X } from 'lucide-react'
import type { ButtonFunction } from '../../types/remote'

const FUNCTIONS: { value: ButtonFunction; label: string; desc: string }[] = [
  { value: 'momentary', label: 'Momentary', desc: '누르는 동안만' },
  { value: 'toggle', label: 'Toggle', desc: 'ON/OFF 전환' },
  { value: 'hold', label: 'Hold', desc: '길게 누르기' },
  { value: 'emergency', label: 'Emergency', desc: '비상정지' },
  { value: 'encoder', label: 'Encoder', desc: '회전 입력' },
  { value: 'indicator', label: 'Indicator', desc: '상태 표시' },
]

export default function ButtonEditor() {
  const { colors } = useStyleStore()
  const { config, selectedButtonId, setSelectedButton, updateButton } = useRemoteStore()

  const button = config.buttons.find((b) => b.id === selectedButtonId)
  if (!button) return null

  const upd = (key: string, value: unknown) => updateButton(button.id, { [key]: value })

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} style={{ color: colors.primary }} />
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: colors.primary }}>
            버튼 편집
          </span>
        </div>
        <button onClick={() => setSelectedButton(null)} style={{ color: colors.text, opacity: 0.4 }}>
          <X size={13} />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Label */}
        <div>
          <label className="block text-[11px] mb-1" style={{ color: colors.text, opacity: 0.65 }}>
            레이블
          </label>
          <input
            type="text"
            value={button.label}
            onChange={(e) => upd('label', e.target.value)}
            className="w-full px-2 py-1 rounded text-xs border"
            style={{ background: colors.background, color: colors.text, borderColor: colors.border }}
          />
        </div>

        {/* Sub Label */}
        <div>
          <label className="block text-[11px] mb-1" style={{ color: colors.text, opacity: 0.65 }}>
            보조 레이블
          </label>
          <input
            type="text"
            value={button.subLabel}
            onChange={(e) => upd('subLabel', e.target.value)}
            className="w-full px-2 py-1 rounded text-xs border"
            style={{ background: colors.background, color: colors.text, borderColor: colors.border }}
          />
        </div>

        {/* Function */}
        <div>
          <label className="block text-[11px] mb-1" style={{ color: colors.text, opacity: 0.65 }}>
            기능
          </label>
          <select
            value={button.function}
            onChange={(e) => upd('function', e.target.value)}
            className="w-full px-2 py-1 rounded text-xs border"
            style={{ background: colors.background, color: colors.text, borderColor: colors.border }}
          >
            {FUNCTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label} — {f.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Colors */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] mb-1" style={{ color: colors.text, opacity: 0.65 }}>
              글자 색
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={button.color}
                onChange={(e) => upd('color', e.target.value)}
                style={{ width: 24, height: 22, borderRadius: 4, cursor: 'pointer' }}
              />
              <span className="text-[10px] font-mono" style={{ color: colors.text, opacity: 0.4 }}>
                {button.color}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] mb-1" style={{ color: colors.text, opacity: 0.65 }}>
              배경 색
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={button.bgColor}
                onChange={(e) => upd('bgColor', e.target.value)}
                style={{ width: 24, height: 22, borderRadius: 4, cursor: 'pointer' }}
              />
              <span className="text-[10px] font-mono" style={{ color: colors.text, opacity: 0.4 }}>
                {button.bgColor}
              </span>
            </div>
          </div>
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: colors.text, opacity: 0.65 }}>
            활성화
          </span>
          <button
            onClick={() => upd('enabled', !button.enabled)}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{ background: button.enabled ? colors.success : colors.border }}
          >
            <span
              className="inline-block h-3 w-3 rounded-full bg-white transition-transform"
              style={{ transform: button.enabled ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        <div className="pt-1.5 border-t" style={{ borderColor: colors.border }}>
          <span className="text-[10px] font-mono" style={{ color: colors.text, opacity: 0.25 }}>
            ID: {button.id}
          </span>
        </div>
      </div>
    </div>
  )
}
