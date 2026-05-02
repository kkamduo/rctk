import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { useStyleStore } from '../../stores/styleStore'
import { Trash2, Layers, X } from 'lucide-react'
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
  'image-crop': '이미지 크롭',
  icon: '아이콘',
  rectangle: '사각형',
  'button-nav': '내비 버튼',
  rtc: '실시간 시계',
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

  const clampPct = (v: number) => Math.max(0, Math.min(100, v))

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
            <div
              key={el.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs"
              style={{
                background: el.id === selectedId ? colors.primary + '20' : colors.background,
                color: colors.text,
                border: `1px solid ${el.id === selectedId ? colors.primary + '60' : 'transparent'}`,
                cursor: 'pointer',
              }}
              onClick={() => setSelectedId(el.id === selectedId ? null : el.id)}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: el.color, border: '1px solid #555', flexShrink: 0 }} />
              {el.confident === false && (
                <span className="text-[8px] font-bold shrink-0 px-1 py-0.5 rounded"
                  style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444440' }}>
                  ?
                </span>
              )}
              <span
                className="text-[8px] font-bold shrink-0 px-1 py-0.5 rounded"
                style={{
                  background: el.dynamic !== false ? '#f59e0b22' : 'rgba(255,255,255,0.06)',
                  color: el.dynamic !== false ? '#f59e0b' : colors.text,
                  opacity: el.dynamic !== false ? 1 : 0.4,
                  border: `1px solid ${el.dynamic !== false ? '#f59e0b40' : 'transparent'}`,
                }}
              >
                {el.dynamic !== false ? '동적' : '정적'}
              </span>
              <span className="flex-1 truncate">{el.label || '(이름없음)'}</span>
              <span className="text-[9px] opacity-40 mr-1">{TYPE_LABELS[el.type]}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeElement(el.id) }}
                className="shrink-0 rounded p-0.5 transition-opacity hover:opacity-100 opacity-30"
                style={{ color: colors.danger }}
                title="삭제"
              >
                <X size={11} />
              </button>
            </div>
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
            <button onClick={() => removeElement(selected.id)} style={{ color: colors.danger, opacity: 0.7 }}>
              <Trash2 size={13} />
            </button>
          </div>
          <div className="space-y-2">
            
          {selected.confident === false && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded mb-1"
            style={{ background: '#ef444415', border: '1px solid #ef444440' }}>
            <span className="text-[10px]" style={{ color: '#ef4444' }}>AI 불확실 — 확인 필요</span>
            <button
              onClick={() => updateElement(selected.id, { confident: true })}
              className="text-[10px] px-2 py-0.5 rounded font-semibold"
              style={{ background: '#ef444430', color: '#ef4444' }}>
              확인
            </button>
          </div>
        )}
            {/* dynamic 토글 */}
            <div>
              <label className="block text-[10px] mb-1" style={{ color: colors.text, opacity: 0.5 }}>값 유형</label>
              <button
                onClick={() => updateElement(selected.id, { dynamic: selected.dynamic !== false ? false : true })}
                className="w-full py-1 rounded text-[10px] font-semibold text-left px-2"
                style={{
                  background: selected.dynamic !== false ? '#f59e0b22' : 'rgba(255,255,255,0.06)',
                  color: selected.dynamic !== false ? '#f59e0b' : colors.text,
                  border: `1px solid ${selected.dynamic !== false ? '#f59e0b50' : colors.border}`,
                }}
              >
                {selected.dynamic !== false ? '동적 — 실시간으로 값이 바뀜' : '정적 — 고정된 값'}
              </button>
            </div>

            {input('레이블', selected.label, (v) => updateElement(selected.id, { label: v }))}
            {(selected.type === 'gauge' || selected.type === 'arc-gauge' || selected.type === 'numeric' || selected.type === 'logo' || selected.type === 'button') &&
              input('값 / 심볼', selected.value ?? '', (v) => updateElement(selected.id, { value: v }))}
            {(selected.type === 'gauge' || selected.type === 'arc-gauge' || selected.type === 'numeric') &&
              input('단위', selected.unit ?? '', (v) => updateElement(selected.id, { unit: v }))}
            {colorInput('색상', selected.color, (v) => updateElement(selected.id, { color: v }))}
            {colorInput('배경색', selected.bgColor, (v) => updateElement(selected.id, { bgColor: v }))}
            <div className="grid grid-cols-2 gap-2">
              {input('X (%)', selected.xPct.toFixed(1), (v) => updateElement(selected.id, { xPct: clampPct(parseFloat(v) || 0) }))}
              {input('Y (%)', selected.yPct.toFixed(1), (v) => updateElement(selected.id, { yPct: clampPct(parseFloat(v) || 0) }))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {input('너비 (%)', selected.widthPct.toFixed(1), (v) => updateElement(selected.id, { widthPct: Math.max(0.5, parseFloat(v) || 1) }))}
              {input('높이 (%)', selected.heightPct.toFixed(1), (v) => updateElement(selected.id, { heightPct: Math.max(0.5, parseFloat(v) || 1) }))}
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
            {selected.type === 'button-nav' && input(
              '이동 대상(switch)',
              selected.switchTarget ?? '',
              (v) => updateElement(selected.id, { switchTarget: v })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
