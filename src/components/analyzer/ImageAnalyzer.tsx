import { useState, useRef, useCallback } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import {
  X, Upload, Sparkles, CheckCircle2,
  AlertCircle, Loader2, ImageIcon
} from 'lucide-react'
import type { DisplayConfig } from '../../types/display'

type Status = 'idle' | 'analyzing' | 'done' | 'error'

interface Props {
  onClose: () => void
}

export default function ImageAnalyzer({ onClose }: Props) {
  const { colors } = useStyleStore()
  const { loadConfig } = useDisplayEditorStore()

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>('image/jpeg')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<DisplayConfig | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setMediaType(file.type)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      setImageData(dataUrl.split(',')[1])
      setResult(null)
      setStatus('idle')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (item) processFile(item.getAsFile()!)
  }, [])

  const analyze = async () => {
    if (!imageData) return
    setStatus('analyzing')
    setErrorMsg('')
    setResult(null)

    try {
      if (!window.electronAPI?.analyzeImage) {
        throw new Error('Electron API를 찾을 수 없습니다. 앱을 재시작해주세요.')
      }
      const res = await window.electronAPI.analyzeImage({ imageData, mediaType })
      if (!res.success || !res.config) throw new Error(res.error || '분석 실패')
      setResult(res.config)
      setSelectedElementIds(new Set(res.config.elements.map((el) => el.id)))
      setStatus('done')
    } catch (err) {
      setErrorMsg(String(err).replace('Error: ', ''))
      setStatus('error')
    }
  }

  const apply = () => {
    if (!result) return
    loadConfig({ ...result, elements: result.elements.filter((el) => selectedElementIds.has(el.id)) })
    onClose()
  }

  const toggleAllElements = () => {
    if (!result) return
    if (selectedElementIds.size === result.elements.length) setSelectedElementIds(new Set())
    else setSelectedElementIds(new Set(result.elements.map((el) => el.id)))
  }

  const toggleElement = (id: string, checked: boolean) => {
    const next = new Set(selectedElementIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedElementIds(next)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPaste={handlePaste}
    >
      <div
        className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ background: colors.surface, border: `1px solid ${colors.border}`, width: 640, maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: colors.primary }} />
            <span className="font-semibold text-sm" style={{ color: colors.text }}>AI 디스플레이 분석</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: colors.primary + '20', color: colors.primary }}>
              llama-4-scout (Groq)
            </span>
          </div>
          <button onClick={onClose} style={{ color: colors.text, opacity: 0.45 }}><X size={16} /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Image Drop Zone */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: colors.text, opacity: 0.7 }}>분석할 디스플레이 이미지</label>
            <div
              className="relative rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden"
              style={{ borderColor: isDragging ? colors.primary : colors.border, background: isDragging ? colors.primary + '08' : colors.background, minHeight: imagePreview ? 'auto' : 160 }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="분석 대상" className="w-full object-contain" style={{ maxHeight: 280 }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="flex items-center gap-2 text-white text-xs font-medium"><ImageIcon size={14} />이미지 교체</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Upload size={28} style={{ color: colors.border }} />
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: colors.text, opacity: 0.6 }}>이미지를 드래그하거나 클릭해서 업로드</p>
                    <p className="text-xs mt-1" style={{ color: colors.text, opacity: 0.35 }}>Ctrl+V로 클립보드에서 붙여넣기도 가능</p>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyze}
            disabled={!imageData || status === 'analyzing'}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
            style={{ background: colors.primary, color: '#fff' }}
          >
            {status === 'analyzing' ? (
              <><Loader2 size={15} className="animate-spin" />디스플레이 요소 분석 중...</>
            ) : (
              <><Sparkles size={15} />AI 분석 시작</>
            )}
          </button>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs" style={{ background: colors.danger + '15', color: colors.danger, border: `1px solid ${colors.danger}30` }}>
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-0.5">분석 실패</p>
                <p className="select-text cursor-text" style={{ opacity: 0.8 }}>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Result Preview */}
          {status === 'done' && result && (
            <div className="rounded-lg p-4 space-y-3" style={{ background: colors.background, border: `1px solid ${colors.success}40` }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: colors.success }} />
                <span className="text-xs font-semibold" style={{ color: colors.success }}>분석 완료</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded" style={{ background: colors.surface }}>
                  <p style={{ color: colors.text, opacity: 0.5, fontSize: 10 }}>이름</p>
                  <p className="font-mono font-medium mt-0.5" style={{ color: colors.text }}>{result.name}</p>
                </div>
                <div className="p-2 rounded" style={{ background: colors.surface }}>
                  <p style={{ color: colors.text, opacity: 0.5, fontSize: 10 }}>캔버스</p>
                  <p className="font-mono font-medium mt-0.5" style={{ color: colors.text }}>{result.width}×{result.height}</p>
                </div>
                <div className="p-2 rounded" style={{ background: colors.surface }}>
                  <p style={{ color: colors.text, opacity: 0.5, fontSize: 10 }}>요소 수</p>
                  <p className="font-mono font-medium mt-0.5" style={{ color: colors.text }}>{result.elements?.length ?? 0}개</p>
                </div>
              </div>

              {/* 요소 선택 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.5 }}>
                    적용할 요소 선택 ({selectedElementIds.size}/{result.elements.length})
                  </span>
                  <button onClick={toggleAllElements} className="text-[10px] font-medium" style={{ color: colors.primary }}>
                    {selectedElementIds.size === result.elements.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  {result.elements.map((el) => (
                    <label
                      key={el.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:opacity-90"
                      style={{ background: colors.surface }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedElementIds.has(el.id)}
                        onChange={(e) => toggleElement(el.id, e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                        style={{ accentColor: colors.primary }}
                      />
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: el.color, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
                      <span className="flex-1 text-xs truncate font-mono" style={{ color: colors.text }}>{el.label || '(이름없음)'}</span>
                      <span className="text-[9px] shrink-0" style={{ color: colors.text, opacity: 0.4 }}>{el.type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 shrink-0 border-t" style={{ borderColor: colors.border }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: colors.border, color: colors.text }}>취소</button>
          <button
            onClick={apply}
            disabled={status !== 'done' || !result || selectedElementIds.size === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-opacity"
            style={{ background: colors.success, color: '#fff' }}
          >
            <CheckCircle2 size={13} />
            캔버스에 적용{status === 'done' && result ? ` (${selectedElementIds.size}개)` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
