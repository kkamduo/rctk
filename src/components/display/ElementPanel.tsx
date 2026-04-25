import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { useStyleStore } from '../../stores/styleStore'
import { Trash2, Layers } from 'lucide-react'
import type { ElementType } from '../../types/display'

const TYPE_LABELS: Record<ElementType, string> = {
  indicator: '인디케이터',
  gauge: '게이지 바',
  'arc-gauge': '원형 게이지',
  numeric: '수치 표시',
  button: '버튼',
  label: '레이블',
  title: '제목',
  logo: '로고',
}

export default function ElementPanel() {
  const { config, selectedId, setSelectedId, updateElement, removeElement, setBgColor, setName, setCanvasSize, gridSize, gridVisible, gridSnap, setGridSize, setGridVisible, setGridSnap } = useDisplayEditorStore()
  const { colors } = useStyleStore()

  const selected = config.elements.find((el) => el.id === selectedId)

  const input = (label: string, value: string | number, onChange: (v: string) => void, type = 'text') => (
    <div>
      <label className="block text-[10px] mb-1" style={{ color: colors.text, opacity: 0.5 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 rounded text-xs border"
        style={{ background: colors.background, color: colors.text, borderColor: colors.border, outline: 'none' }}
      />
    </div>
  )

  const colorInput = (label: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label className="block text-[10px] mb-1" style={{ color: colors.text, opacity: 0.5 }}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-7 rounded cursor-pointer border-0" style={{ background: 'none' }} />
        <span className="text-xs font-mono" style={{ color: colors.text }}>{value}</span>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Canvas settings */}
      <div className="p-3 border-b" style={{ borderColor: colors.border }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: colors.text, opacity: 0.4 }}>캔버스</p>
        <div className="space-y-2">
          {input('이름', config.name, setName)}
          <div className="grid grid-cols-2 gap-2">
            {input('가로(px)', config.width, (v) => setCanvasSize(parseInt(v) || config.width, config.height), 'number')}
            {input('세로(px)', config.height, (v) => setCanvasSize(config.width, parseInt(v) || config.height), 'number')}
          </div>
          {colorInput('배경색', config.bgColor, setBgColor)}
        </div>
      </div>

      {/* Grid settings */}
      <div className="p-3 border-b" style={{ borderColor: colors.border }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: colors.text, opacity: 0.4 }}>격자</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGridVisible(!gridVisible)}
              className="flex-1 py-1 rounded text-[10px] font-medium transition-opacity"
              style={{ background: gridVisible ? colors.primary + '25' : colors.background, color: gridVisible ? colors.primary : colors.text, border: `1px solid ${gridVisible ? colors.primary + '60' : colors.border}` }}
            >
              격자 표시 {gridVisible ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setGridSnap(!gridSnap)}
              className="flex-1 py-1 rounded text-[10px] font-medium transition-opacity"
              style={{ background: gridSnap ? colors.primary + '25' : colors.background, color: gridSnap ? colors.primary : colors.text, border: `1px solid ${gridSnap ? colors.primary + '60' : colors.border}` }}
            >
              스냅 {gridSnap ? 'ON' : 'OFF'}
            </button>
          </div>
          <div>
            <label className="block text-[10px] mb-1" style={{ color: colors.text, opacity: 0.5 }}>격자 크기 (px)</label>
            <div className="flex items-center gap-1.5">
              {[4, 8, 10, 16, 20].map((s) => (
                <button
                  key={s}
                  onClick={() => setGridSize(s)}
                  className="flex-1 py-1 rounded text-[10px] font-mono font-medium"
                  style={{ background: gridSize === s ? colors.primary : colors.background, color: gridSize === s ? '#fff' : colors.text, border: `1px solid ${gridSize === s ? colors.primary : colors.border}` }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Element list */}
      <div className="p-3 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-1 mb-2">
          <Layers size={11} style={{ color: colors.text, opacity: 0.4 }} />
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.4 }}>
            요소 목록 ({config.elements.length})
          </p>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {config.elements.map((el) => (
            <button
              key={el.id}
              onClick={() => setSelectedId(el.id === selectedId ? null : el.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs"
              style={{
                background: el.id === selectedId ? colors.primary + '20' : colors.background,
                color: colors.text,
                border: `1px solid ${el.id === selectedId ? colors.primary + '60' : 'transparent'}`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: el.color, border: '1px solid #555', flexShrink: 0 }} />
              <span className="flex-1 truncate">{el.label || '(이름없음)'}</span>
              <span className="text-[9px] opacity-40">{TYPE_LABELS[el.type]}</span>
            </button>
          ))}
          {config.elements.length === 0 && (
            <p className="text-[10px] text-center py-2" style={{ color: colors.text, opacity: 0.3 }}>AI 분석 후 요소가 표시됩니다</p>
          )}
        </div>
      </div>

      {/* Selected element editor */}
      {selected && (
        <div className="p-3 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.4 }}>
              {TYPE_LABELS[selected.type]}
            </p>
            <button
              onClick={() => removeElement(selected.id)}
              style={{ color: colors.danger, opacity: 0.7 }}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {input('레이블', selected.label, (v) => updateElement(selected.id, { label: v }))}
            {(selected.type === 'gauge' || selected.type === 'arc-gauge' || selected.type === 'numeric' || selected.type === 'logo' || selected.type === 'button') &&
              input('값 / 심볼', selected.value ?? '', (v) => updateElement(selected.id, { value: v }))}
            {(selected.type === 'gauge' || selected.type === 'arc-gauge' || selected.type === 'numeric') &&
              input('단위', selected.unit ?? '', (v) => updateElement(selected.id, { unit: v }))}
            {colorInput('색상', selected.color, (v) => updateElement(selected.id, { color: v }))}
            {colorInput('배경색', selected.bgColor, (v) => updateElement(selected.id, { bgColor: v }))}
            <div className="grid grid-cols-2 gap-2">
              {input('X', selected.x, (v) => updateElement(selected.id, { x: parseInt(v) || 0 }), 'number')}
              {input('Y', selected.y, (v) => updateElement(selected.id, { y: parseInt(v) || 0 }), 'number')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {input('가로', selected.width, (v) => updateElement(selected.id, { width: parseInt(v) || 10 }), 'number')}
              {input('세로', selected.height, (v) => updateElement(selected.id, { height: parseInt(v) || 10 }), 'number')}
            </div>
            {selected.type === 'indicator' && (
              <div>
                <label className="block text-[10px] mb-1" style={{ color: colors.text, opacity: 0.5 }}>상태</label>
                <button
                  onClick={() => updateElement(selected.id, { active: !selected.active })}
                  className="px-3 py-1 rounded text-xs"
                  style={{ background: selected.active !== false ? colors.success + '30' : colors.border, color: selected.active !== false ? colors.success : colors.text }}
                >
                  {selected.active !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
