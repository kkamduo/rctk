import { useState, useRef, useEffect, useCallback } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { Wand2, Send, Loader2, CheckCircle2, AlertCircle, ImageIcon, X, FolderOpen, TrendingUp } from 'lucide-react'
import type { DisplayConfig } from '../../types/display'
import { cropElement, splitValueUnit } from '../../utils/imageCrop'

type VisionContent = Array<
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
>

type ApiMessage = {
  role: 'user' | 'assistant'
  content: string | VisionContent
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'error'
  text: string
  imagePreview?: string
  config?: DisplayConfig
  apiContent?: string | VisionContent
}

type AttachedImage = {
  preview: string
  data: string
  mediaType: string
  naturalWidth?: number
  naturalHeight?: number
}


export default function TextGenerator({ onAutoImprove }: { onAutoImprove?: (config: DisplayConfig) => void }) {
  const { colors } = useStyleStore()
  const { loadConfig, addElement, config, replaceAiElements } = useDisplayEditorStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPathInput, setShowPathInput] = useState(false)
  const [pathInput, setPathInput] = useState('')
  const [pathError, setPathError] = useState('')
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null)
  const [checkedEls, setCheckedEls] = useState<Set<string>>(new Set())

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        setAttachedImage({ preview, data: preview.split(',')[1], mediaType: file.type, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })
      }
      img.src = preview
    }
    reader.readAsDataURL(file)
  }, [])

  const loadFromPath = async (filePath: string) => {
    const trimmed = filePath.trim()
    if (!trimmed) return
    setPathError('')
    try {
      const res = await window.electronAPI?.readImageFile({ filePath: trimmed })
      if (!res?.success || !res.data || !res.mediaType) {
        setPathError(res?.error ?? '파일을 읽을 수 없습니다')
        return
      }
      const preview = `data:${res.mediaType};base64,${res.data}`
      setAttachedImage({ preview, data: res.data, mediaType: res.mediaType })
      setPathInput('')
      setShowPathInput(false)
    } catch (err) {
      setPathError(String(err).replace('Error: ', ''))
    }
  }

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if ([...e.dataTransfer.items].some(i => i.kind === 'file')) setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const send = async (text = input) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setInput('')

    const currentImage = attachedImage
    setAttachedImage(null)
    setShowPathInput(false)
    setPathError('')

    const userApiContent: string | VisionContent = currentImage
      ? [
          { type: 'image_url', image_url: { url: `data:${currentImage.mediaType};base64,${currentImage.data}` } },
          { type: 'text', text: trimmed },
        ]
      : trimmed

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      imagePreview: currentImage?.preview,
      apiContent: userApiContent,
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    // 캔버스 비우기 — API 호출 없이 즉시 처리
    if (/비워|지워|초기화|전체.?삭제|다.?삭제/.test(trimmed)) {
      loadConfig({ name: config.name, width: config.width, height: config.height, bgColor: config.bgColor, elements: [] })
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: '캔버스를 비웠습니다.' },
      ])
      setLoading(false)
      return
    }

    const apiMessages: ApiMessage[] = [
      ...messages
        .filter((m) => m.role !== 'error')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.apiContent ?? m.text })),
      { role: 'user', content: userApiContent },
    ]

    try {
      if (!window.electronAPI) throw new Error('Electron API를 찾을 수 없습니다.')

      let finalConfig: DisplayConfig

      if (currentImage) {
        // 이미지 첨부 → Vision 4단계 분석 파이프라인
        const res = await window.electronAPI.analyzeImageStaged({
          imageData: currentImage.data,
          mediaType: currentImage.mediaType,
          imageWidth: currentImage.naturalWidth,
          imageHeight: currentImage.naturalHeight,
        })
        if (!res.success || !res.config) throw new Error(res.error || '분석 실패')

        // image-crop 요소 자동 크롭
        const imageUrl = currentImage.preview
        const croppedElements = await Promise.all(
          res.config.elements.map(async el => {
            if (el.type !== 'image-crop') return el
            const cropped = await cropElement(imageUrl, el.xPct, el.yPct, el.widthPct, el.heightPct)
            return { ...el, ...cropped }
          })
        )
        finalConfig = { ...res.config, elements: croppedElements }
      } else {
        // 텍스트만 → 대화형 생성 파이프라인
        if (!window.electronAPI.generateLayout) throw new Error('Electron API를 찾을 수 없습니다.')
        const res = await window.electronAPI.generateLayout({
          messages: apiMessages,
          canvasWidth: config.width,
          canvasHeight: config.height,
        })
        if (!res.success || !res.config) throw new Error(res.error || '생성 실패')
        finalConfig = res.config
        // 기존 image-crop 보존
        const existingCrops = config.elements.filter(el => el.type === 'image-crop')
        if (existingCrops.length > 0) {
          finalConfig = {
            ...finalConfig,
            elements: [
              ...finalConfig.elements.filter(el => el.type !== 'image-crop'),
              ...existingCrops
            ]
          }
        }
      }

      finalConfig.elements = finalConfig.elements.map(splitValueUnit)

      if (/교체|바꿔|대체/.test(trimmed) || (currentImage && /만들어|동일|재현/.test(trimmed))) {
        replaceAiElements(finalConfig)   // loadConfig → replaceAiElements
      } else if (currentImage && /추가|넣어|크롭/.test(trimmed)) {
        // 이미지 분석 결과는 항상 전체 config → image-crop만 선별 추가
        finalConfig.elements
          .filter(el => el.type === 'image-crop')
          .forEach(el => addElement(el))
      } else if (/적용|추가|만들어|생성|넣어|비슷/.test(trimmed)) {
        // 텍스트 전용 생성 → 비-image-crop 추가
        finalConfig.elements
          .filter(el => el.type !== 'image-crop')
          .forEach(el => addElement(el))
      }


      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `${finalConfig.name} · ${finalConfig.elements.length}개 요소`,
          config: finalConfig,
          apiContent: `${finalConfig.name} · ${finalConfig.elements.length}개 요소 생성됨`,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'error', text: String(err).replace('Error: ', '') },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-full border-l relative"
      style={{ background: colors.surface, borderColor: colors.border, width: 300, minWidth: 300 }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 pointer-events-none rounded"
          style={{ background: colors.primary + '18', border: `2px dashed ${colors.primary}`, margin: 4 }}
        >
          <ImageIcon size={28} style={{ color: colors.primary }} />
          <span className="text-xs font-semibold" style={{ color: colors.primary }}>이미지를 놓으세요</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b" style={{ borderColor: colors.border }}>
        <Wand2 size={14} style={{ color: colors.primary }} />
        <span className="font-semibold text-xs" style={{ color: colors.text }}>바이브 코딩</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: colors.primary + '20', color: colors.primary }}>
          AI 대화
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 text-center py-4 px-2">
            <div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, background: colors.primary + '15' }}>
              <ImageIcon size={22} style={{ color: colors.primary, opacity: 0.7 }} />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: colors.text }}>만드시려는 이미지를 업로드해주세요</div>
              <div className="text-[10px] mt-1.5 leading-relaxed" style={{ color: colors.text, opacity: 0.45 }}>
                기존 HMI 화면 사진을 올리면<br />AI가 요소를 자동으로 추출합니다
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full mt-1" style={{ color: colors.text, opacity: 0.3 }}>
              <span className="text-[9px]">🖼 이미지를 여기에 드래그</span>
              <span className="text-[9px]">📎 하단 버튼으로 파일 선택</span>
              <span className="text-[9px]">💬 텍스트만으로 새 레이아웃 생성도 가능</span>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="flex flex-col gap-1 items-end max-w-[90%]">
                  {msg.imagePreview && (
                    <img
                      src={msg.imagePreview}
                      alt=""
                      className="rounded-lg"
                      style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain', border: `1px solid ${colors.border}` }}
                    />
                  )}
                  <div
                    className="text-[10px] px-3 py-2 rounded-lg leading-relaxed select-text"
                    style={{ background: colors.primary + '25', color: colors.text, border: `1px solid ${colors.primary}40` }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          }

          if (msg.role === 'error') {
            return (
              <div key={msg.id} className="flex items-start gap-1.5 px-1">
                <AlertCircle size={12} className="shrink-0 mt-0.5" style={{ color: colors.danger }} />
                <span className="text-[10px] leading-relaxed select-text" style={{ color: colors.danger }}>{msg.text}</span>
              </div>
            )
          }

          return (
            <div key={msg.id} className="p-2.5 rounded-lg space-y-2" style={{ background: colors.background, border: `1px solid ${colors.success}35` }}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} style={{ color: colors.success }} />
                <span className="text-[10px] font-semibold" style={{ color: colors.success }}>생성 완료</span>
              </div>
              <div className="text-[10px] font-mono leading-relaxed select-text" style={{ color: colors.text, opacity: 0.65 }}>{msg.text}</div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => msg.config && replaceAiElements(msg.config)
                  }
                  className="flex-1 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-80"
                  style={{ background: colors.success + '20', color: colors.success, border: `1px solid ${colors.success}40` }}
                >
                  <CheckCircle2 size={10} />교체
                </button>
                <button
                  onClick={() => msg.config?.elements.filter(el => el.type !== 'image-crop').forEach(el => addElement(el))}
                  className="flex-1 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-80"
                  style={{ background: colors.primary + '20', color: colors.primary, border: `1px solid ${colors.primary}40` }}
                >
                  <CheckCircle2 size={10} />전체추가
                </button>
                <button
                  onClick={() => {
                    if (expandedMsgId === msg.id) {
                      setExpandedMsgId(null)
                    } else {
                      setExpandedMsgId(msg.id)
                      setCheckedEls(new Set(msg.config?.elements.map(el => el.id) ?? []))
                    }
                  }}
                  className="flex-1 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-80"
                  style={{
                    background: expandedMsgId === msg.id ? colors.primary + '35' : colors.background,
                    color: colors.primary,
                    border: `1px solid ${colors.primary}40`,
                  }}
                >
                  선택
                </button>
              </div>
              {onAutoImprove && msg.config && (
                <button
                  onClick={() => onAutoImprove(msg.config!)}
                  className="w-full py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-80"
                  style={{ background: colors.accent + '20', color: colors.accent, border: `1px solid ${colors.accent}40` }}
                >
                  <TrendingUp size={10} />자동 개선
                </button>
              )}
              {expandedMsgId === msg.id && msg.config && (
                <div className="space-y-1 pt-1 border-t" style={{ borderColor: colors.border }}>
                  {msg.config.elements.map(el => (
                    <label key={el.id} className="flex items-center gap-1.5 cursor-pointer px-0.5 py-0.5 rounded hover:opacity-80">
                      <input
                        type="checkbox"
                        checked={checkedEls.has(el.id)}
                        onChange={(e) => {
                          const s = new Set(checkedEls)
                          e.target.checked ? s.add(el.id) : s.delete(el.id)
                          setCheckedEls(s)
                        }}
                        style={{ accentColor: colors.primary }}
                      />
                      <span className="text-[10px] truncate" style={{ color: colors.text }}>
                        {el.type} — {el.label || el.id}
                      </span>
                    </label>
                  ))}
                  <button
                    onClick={() => {
                      msg.config?.elements.filter(el => checkedEls.has(el.id)).forEach(el => addElement(el))
                      setExpandedMsgId(null)
                    }}
                    disabled={checkedEls.size === 0}
                    className="w-full py-1.5 rounded text-[10px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 mt-0.5"
                    style={{ background: colors.primary, color: '#fff' }}
                  >
                    선택한 {checkedEls.size}개 추가
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="flex items-center gap-1.5 px-1 py-1">
            <Loader2 size={12} className="animate-spin" style={{ color: colors.primary }} />
            <span className="text-[10px]" style={{ color: colors.text, opacity: 0.5 }}>생성 중...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t p-2.5 space-y-2" style={{ borderColor: colors.border }}>
        {/* File path input */}
        {showPathInput && (
          <div className="space-y-1">
            <div className="flex gap-1.5">
              <input
                value={pathInput}
                onChange={(e) => { setPathInput(e.target.value); setPathError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') loadFromPath(pathInput) }}
                placeholder="C:\images\display.png"
                className="flex-1 px-2.5 py-1.5 rounded text-[10px] border"
                style={{
                  background: colors.background,
                  color: colors.text,
                  borderColor: pathError ? colors.danger : colors.border,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => loadFromPath(pathInput)}
                className="px-2 rounded text-[10px] font-medium transition-opacity hover:opacity-80"
                style={{ background: colors.primary + '20', color: colors.primary, border: `1px solid ${colors.primary}40` }}
              >
                불러오기
              </button>
            </div>
            {pathError && <p className="text-[9px]" style={{ color: colors.danger }}>{pathError}</p>}
          </div>
        )}

        {/* Attached image preview */}
        {attachedImage && (
          <div className="relative inline-flex">
            <img
              src={attachedImage.preview}
              alt=""
              className="rounded"
              style={{ height: 56, maxWidth: '100%', objectFit: 'contain', border: `1px solid ${colors.border}` }}
            />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center"
              style={{ width: 16, height: 16, background: colors.danger, color: '#fff' }}
            >
              <X size={9} />
            </button>
          </div>
        )}

        {/* Text + send row */}
        <div className="flex gap-1.5 items-end">
          {/* Attachment buttons */}
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => { setShowPathInput(!showPathInput); setPathError('') }}
              title="파일 경로 입력"
              className="flex items-center justify-center rounded transition-opacity hover:opacity-80"
              style={{
                width: 28, height: 28,
                background: showPathInput ? colors.primary + '30' : colors.background,
                color: showPathInput ? colors.primary : colors.text,
                border: `1px solid ${showPathInput ? colors.primary + '60' : colors.border}`,
                opacity: showPathInput ? 1 : 0.55,
              }}
            >
              <FolderOpen size={12} />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              title="파일 선택"
              className="flex items-center justify-center rounded transition-opacity hover:opacity-80"
              style={{
                width: 28, height: 28,
                background: colors.background,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                opacity: 0.55,
              }}
            >
              <ImageIcon size={12} />
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder={
              attachedImage
                ? '이미지 기반으로 생성 요청...'
                : messages.length === 0
                  ? '어떤 디스플레이를 만들고 싶으세요?'
                  : '수정하거나 추가할 내용...'
            }
            rows={2}
            disabled={loading}
            className="flex-1 px-2.5 py-2 rounded text-[10px] border resize-none disabled:opacity-50"
            style={{ background: colors.background, color: colors.text, borderColor: colors.border, outline: 'none', lineHeight: 1.6 }}
          />

          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center rounded transition-opacity disabled:opacity-40 hover:opacity-80 shrink-0"
            style={{ width: 36, height: 60, background: colors.primary, color: '#fff' }}
          >
            <Send size={13} />
          </button>
        </div>

        <p className="text-[9px]" style={{ color: colors.text, opacity: 0.28 }}>
          Enter 전송 · Shift+Enter 줄바꿈 · 이미지 드래그 가능
        </p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
    </div>
  )
}
