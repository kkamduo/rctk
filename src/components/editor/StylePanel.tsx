import { useStyleStore, ThemePreset, PRESETS, ThemeColors } from '../../stores/styleStore'
import { Palette, ImageIcon } from 'lucide-react'

const THEME_OPTIONS: { id: ThemePreset; label: string; dot: string }[] = [
  { id: 'industrial-dark', label: '산업용', dot: '#f97316' },
  { id: 'military', label: '군용', dot: '#4ade80' },
  { id: 'clean', label: '클린', dot: '#3b82f6' },
  { id: 'warning', label: '경고', dot: '#f59e0b' },
  { id: 'custom', label: '커스텀', dot: '#6366f1' },
]

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'primary', label: '기본색' },
  { key: 'accent', label: '강조색' },
  { key: 'surface', label: '표면색' },
  { key: 'border', label: '테두리' },
  { key: 'text', label: '텍스트' },
  { key: 'danger', label: '위험' },
  { key: 'success', label: '성공' },
  { key: 'warning', label: '경고' },
]

export default function StylePanel() {
  const { preset, colors, setPreset, setColor, setBgImage } = useStyleStore()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setBgImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="border-b p-3" style={{ borderColor: colors.border }}>
      <div className="flex items-center gap-2 mb-3">
        <Palette size={13} style={{ color: colors.primary }} />
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: colors.primary }}>
          스타일
        </span>
      </div>

      {/* Theme presets */}
      <div className="grid grid-cols-5 gap-1 mb-3">
        {THEME_OPTIONS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPreset(t.id)}
            title={t.label}
            className="flex flex-col items-center gap-1 py-1.5 rounded transition-all"
            style={{
              background: preset === t.id ? colors.border : 'transparent',
              border: `1px solid ${preset === t.id ? colors.primary : colors.border}`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.dot }} />
            <span className="text-[9px] leading-none" style={{ color: colors.text, opacity: preset === t.id ? 1 : 0.6 }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Color pickers */}
      <div className="space-y-1.5 mb-3">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: colors.text, opacity: 0.65 }}>
              {label}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono" style={{ color: colors.text, opacity: 0.4 }}>
                {colors[key]}
              </span>
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => setColor(key, e.target.value)}
                style={{ width: 20, height: 20, borderRadius: 4, cursor: 'pointer' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Background image */}
      <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
        <label
          className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] cursor-pointer transition-colors"
          style={{ background: colors.border, color: colors.text }}
        >
          <ImageIcon size={11} />
          배경 이미지 업로드
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>
    </div>
  )
}
