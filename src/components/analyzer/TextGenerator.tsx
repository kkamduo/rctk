import { useState } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { X, Wand2, CheckCircle2, AlertCircle, Loader2, Lightbulb } from 'lucide-react'
import type { DisplayElement } from '../../types/display'

type Status = 'idle' | 'generating' | 'done' | 'error'

interface Props {
  onClose: () => void
}

const EXAMPLES = [
  '모터 제어 패널 — 속도계, 온도, 전압, 비상정지 표시',
  '양수장 모니터링 — 수위 게이지 3개, 펌프 상태, 유량 수치',
  '컨베이어 벨트 — 속도, 구간별 인디케이터, 가동시간 표시',
  '공조 시스템 — 온습도 수치, 팬 상태, 필터 경고등',
]

export default function TextGenerator({ onClose }: Props) {
  const { colors } = useStyleStore()
  const { loadConfig } = useDisplayEditorStore()

  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<ReturnType<typeof useDisplayEditorStore.getState>['config'] | null>(null)
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set())

  const generate = async () => {
    if (!prompt.trim()) return
    setStatus('generating')
    setErrorMsg('')
    setResult(null)

    try {
      if (!window.electronAPI?.generateLayout) {
        throw new Error('Electron API를 찾을 수 없습니다. 앱을 재시작해주세요.')
      }
      const res = await window.electronAPI.generateLayout({ prompt: prompt.trim() })
      if (!res.success || !res.config) throw new Error(res.error || '생성 실패')
      setResult(res.config)
      setSelectedElementIds(new Set(res.config.elements.map((el: DisplayElement) => el.id)))
      setStatus('done')
    } catch (err) {
      setErrorMsg(String(err).replace('Error: ', ''))
      setStatus('error')
    }
  }

  const apply = () => {
    if (!result) return
    loadConfig({ ...result, elements: result.elements.filter((el: DisplayElement) => selectedElementIds.has(el.id)) })
    onClose()
  }

  const toggleElement = (id: string, checked: boolean) => {
    const next = new Set(selectedElementIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedElementIds(next)
  }

  const toggleAll = () => {
    if (!result) return
    if (selectedElementIds.size === result.elements.length) setSelectedElementIds(new Set())
    else setSelectedElementIds(new Set(result.elements.map((el: DisplayElement) => el.id)))
  }

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ background: colors.surface, borderColor: colors.border, width: 300, minWidth: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2">
          <Wand2 size={14} style={{ color: colors.primary }} />
          <span className="font-semibold text-xs" style={{ color: colors.text }}>바이브 코딩</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: colors.primary + '20', color: colors.primary }}>
            텍스트 → 디스플레이
          </span>
        </div>
        <button onClick={onClose} style={{ color: colors.text, opacity: 0.45 }}><X size={14} /></button>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-3">
          {/* Prompt */}
          <div>
            <label className="block text-[10px] mb-1 font-medium" style={{ color: colors.text, opacity: 0.6 }}>
              어떤 디스플레이를 만들고 싶으세요?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate() }}
              placeholder="예: 양수장 펌프 제어 화면 — 수위 게이지 2개, 모터 상태 인디케이터, 유량 수치 표시"
              rows={5}
              className="w-full px-2.5 py-2 rounded text-[10px] border resize-none"
              style={{ background: colors.background, color: colors.text, borderColor: colors.border, outline: 'none', lineHeight: 1.6 }}
            />
            <p className="text-[9px] mt-0.5" style={{ color: colors.text, opacity: 0.3 }}>Ctrl+Enter로 바로 생성</p>
          </div>

          {/* Examples */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Lightbulb size={10} style={{ color: colors.text, opacity: 0.4 }} />
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.4 }}>예시</span>
            </div>
            <div className="flex flex-col gap-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-left text-[10px] px-2 py-1.5 rounded transition-opacity hover:opacity-80"
                  style={{ background: colors.background, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={!prompt.trim() || status === 'generating'}
            className="w-full py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
            style={{ background: colors.primary, color: '#fff' }}
          >
            {status === 'generating' ? (
              <><Loader2 size={13} className="animate-spin" />생성 중...</>
            ) : (
              <><Wand2 size={13} />생성하기</>
            )}
          </button>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-2.5 rounded text-[10px]" style={{ background: colors.danger + '15', color: colors.danger, border: `1px solid ${colors.danger}30` }}>
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-0.5">생성 실패</p>
                <p className="select-text cursor-text" style={{ opacity: 0.8 }}>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {status === 'done' && result && (
            <div className="rounded p-3 space-y-2.5" style={{ background: colors.background, border: `1px solid ${colors.success}40` }}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} style={{ color: colors.success }} />
                <span className="text-[10px] font-semibold" style={{ color: colors.success }}>생성 완료 · {result.name}</span>
              </div>
              <div className="flex gap-2 text-[10px]">
                <span className="font-mono" style={{ color: colors.text, opacity: 0.6 }}>{result.width}×{result.height}</span>
                <span style={{ color: colors.text, opacity: 0.3 }}>·</span>
                <span style={{ color: colors.text, opacity: 0.6 }}>{result.elements?.length ?? 0}개 요소</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.5 }}>
                    적용할 요소 ({selectedElementIds.size}/{result.elements.length})
                  </span>
                  <button onClick={toggleAll} className="text-[9px] font-medium" style={{ color: colors.primary }}>
                    {selectedElementIds.size === result.elements.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {result.elements.map((el: DisplayElement) => (
                    <label key={el.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:opacity-90" style={{ background: colors.surface }}>
                      <input
                        type="checkbox"
                        checked={selectedElementIds.has(el.id)}
                        onChange={(e) => toggleElement(el.id, e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                        style={{ accentColor: colors.primary }}
                      />
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: el.color, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
                      <span className="flex-1 text-[10px] truncate font-mono" style={{ color: colors.text }}>{el.label || '(이름없음)'}</span>
                      <span className="text-[9px] shrink-0" style={{ color: colors.text, opacity: 0.4 }}>{el.type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={apply}
            disabled={status !== 'done' || !result || selectedElementIds.size === 0}
            className="flex-1 py-2 rounded text-[10px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
            style={{ background: colors.success, color: '#fff' }}
          >
            <CheckCircle2 size={12} />
            캔버스에 적용{status === 'done' && result ? ` (${selectedElementIds.size}개)` : ''}
          </button>
        </div>
      </div>
  )
}
