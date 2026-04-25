import { useState, useRef, useEffect, useCallback } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { Wand2, Send, Loader2, CheckCircle2, AlertCircle, Lightbulb, ImageIcon, X, FolderOpen } from 'lucide-react'
import type { DisplayConfig } from '../../types/display'

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
}

const EXAMPLES = [
  '모터 제어 패널 — 속도계, 온도, 전압, 비상정지',
  '양수장 모니터링 — 수위 게이지 3개, 펌프 상태',
  '컨베이어 벨트 — 속도, 구간 인디케이터, 가동시간',
  '공조 시스템 — 온습도, 팬 상태, 필터 경고',
]

export default function TextGenerator() {
  const { colors } = useStyleStore()
  const { loadConfig } = useDisplayEditorStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPathInput, setShowPathInput] = useState(false)
  const [pathInput, setPathInput] = useState('')
  const [pathError, setPathError] = useState('')

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
      setAttachedImage({ preview, data: preview.split(',')[1], mediaType: file.type })
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

    const apiMessages: ApiMessage[] = [
      ...messages
        .filter((m) => m.role !== 'error')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.apiContent ?? m.text })),
      { role: 'user', content: userApiContent },
    ]

    try {
      if (!window.electronAPI?.generateLayout) throw new Error('Electron API를 찾을 수 없습니다.')
      const res = await window.electronAPI.generateLayout({ messages: apiMessages })
      if (!res.success || !res.config) throw new Error(res.error || '생성 실패')

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `${res.config!.name} · ${res.config!.elements.length}개 요소`,
          config: res.config,
          apiContent: JSON.stringify(res.config),
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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              <Lightbulb size={10} style={{ color: colors.text, opacity: 0.4 }} />
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.4 }}>예시</span>
            </div>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => send(ex)}
                className="text-left text-[10px] px-2.5 py-2 rounded transition-opacity hover:opacity-80"
                style={{ background: colors.background, color: colors.text, border: `1px solid ${colors.border}` }}
              >
                {ex}
              </button>
            ))}
            <div className="flex items-center gap-1.5 mt-1 px-0.5">
              <ImageIcon size={10} style={{ color: colors.text, opacity: 0.3 }} />
              <span className="text-[9px]" style={{ color: colors.text, opacity: 0.3 }}>
                이미지 드래그 또는 📎·🗁 버튼으로 첨부
              </span>
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
                    className="text-[10px] px-3 py-2 rounded-lg leading-relaxed"
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
                <span className="text-[10px] leading-relaxed" style={{ color: colors.danger }}>{msg.text}</span>
              </div>
            )
          }

          return (
            <div key={msg.id} className="p-2.5 rounded-lg space-y-2" style={{ background: colors.background, border: `1px solid ${colors.success}35` }}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} style={{ color: colors.success }} />
                <span className="text-[10px] font-semibold" style={{ color: colors.success }}>생성 완료</span>
              </div>
              <div className="text-[10px] font-mono leading-relaxed" style={{ color: colors.text, opacity: 0.65 }}>{msg.text}</div>
              <button
                onClick={() => msg.config && loadConfig(msg.config)}
                className="w-full py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-opacity hover:opacity-80"
                style={{ background: colors.success + '20', color: colors.success, border: `1px solid ${colors.success}40` }}
              >
                <CheckCircle2 size={10} />캔버스에 적용
              </button>
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
