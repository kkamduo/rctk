/// <reference path="../../types/electron.d.ts" />
import { useState, useRef, useCallback, useEffect } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { X, Upload, Play, Square, CheckCircle2, AlertCircle, Loader2, TrendingUp, ChevronDown, ChevronUp, Trophy, Sparkles } from 'lucide-react'
import type { DisplayConfig, DisplayElement } from '../../types/display'
import ElementRenderer from '../display/ElementRenderer'
import { cropElement } from '../../utils/imageCrop'

interface Scores { total: number; layout: number; coverage: number }

interface IterResult {
  n: number
  config: DisplayConfig
  scores: Scores
  improvements: string[]
  step: 'init' | 'evaluate' | 'generate'  // which step produced this entry
}

type Phase = 'idle' | 'running' | 'done' | 'error'
type RunStep = 'evaluating' | 'generating'

const MAX_ITER = 99
const EARLY_STOP_SCORE = 90

// image-crop 요소의 base64 데이터 제거 (AI 전송 최적화)
function stripImageData(config: DisplayConfig): DisplayConfig {
  return {
    ...config,
    elements: config.elements.map(el =>
      el.type === 'image-crop' ? { ...el, imageData: undefined, mediaType: undefined } : el
    ) as DisplayElement[],
  }
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = scoreColor(value)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] w-12 shrink-0 text-right opacity-60">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[9px] w-6 text-right font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <span
      className="text-xs font-black font-mono px-2 py-0.5 rounded"
      style={{ background: color + '25', color, border: `1px solid ${color}50` }}
    >
      {score}
    </span>
  )
}

export default function AutoImproveModal({ onClose, initialConfig }: { onClose: () => void; initialConfig?: DisplayConfig }) {
  const { colors } = useStyleStore()
  const { config: canvasConfig, loadConfig } = useDisplayEditorStore()

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState('image/jpeg')
  const [isDrop, setIsDrop] = useState(false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [runStep, setRunStep] = useState<RunStep | null>(null)
  const [currentIter, setCurrentIter] = useState(0)
  const [results, setResults] = useState<IterResult[]>([])
  const [finalConfig, setFinalConfig] = useState<DisplayConfig | null>(null)
  const [previewConfig, setPreviewConfig] = useState<DisplayConfig | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [resWidth, setResWidth] = useState(480)
  const [resHeight, setResHeight] = useState(320)
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null)
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null)

  //4.28 추가 선언부
  const [analysisPhase, setAnalysisPhase] = useState<'idle' | 'analyzing' | 'done'>('idle')
  const [analysisStages, setAnalysisStages] = useState<Array<{ n: number; label: string; status: 'running' | 'done' | 'error' }>>([])
  const [analyzedConfig, setAnalyzedConfig] = useState<DisplayConfig | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const cancelledRef = useRef(false)
  const currentConfigRef = useRef<DisplayConfig>(canvasConfig)
  const fileRef = useRef<HTMLInputElement>(null)
  const logBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [results, runStep])

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setMediaType(file.type)
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      setImagePreview(url)
      setImageData(url.split(',')[1])
      setAnalyzedConfig(null)
      setAnalysisPhase('idle')
      setAnalysisStages([])
      setAnalysisError(null)
      const img = new Image()
      img.onload = () => {
        setNaturalWidth(img.naturalWidth)
        setNaturalHeight(img.naturalHeight)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) processFile(item.getAsFile()!)
  }, [processFile])

  const bestResult = results.length > 0
    ? results.reduce((best, r) => r.scores.total > best.scores.total ? r : best)
    : null

  const runAnalysis = useCallback(async () => {
    if (!imageData || !window.electronAPI) return
    setAnalysisPhase('analyzing')
    setAnalysisStages([])

    window.electronAPI.onAnalysisStage(data => {
      setAnalysisStages(prev => {
        const exists = prev.find(s => s.n === data.stage)
        if (exists) return prev.map(s => s.n === data.stage ? { ...s, status: data.status } : s)
        return [...prev, { n: data.stage, label: data.label, status: data.status }]
      })
    })

    const res = await window.electronAPI.analyzeImageStaged({ imageData, mediaType, imageWidth: naturalWidth ?? undefined, imageHeight: naturalHeight ?? undefined })
    window.electronAPI.offAnalysisStage()

    if (res.success && res.config) {
      const imageUrl = `data:${mediaType};base64,${imageData}`
      const croppedElements = await Promise.all(
        res.config.elements.map(async el => {
          if (el.type !== 'image-crop') return el
          const cropped = await cropElement(imageUrl, el.xPct, el.yPct, el.widthPct, el.heightPct)
          return { ...el, ...cropped }
        })
      )
      setAnalyzedConfig({ ...res.config, elements: croppedElements })
      setAnalysisPhase('done')
}
 else {
      setAnalysisError(res.error || '분석 실패')
      setAnalysisPhase('idle')
    }
  }, [imageData, mediaType])

  const runLoop = useCallback(async () => {
    if (!imageData || !window.electronAPI) return
    cancelledRef.current = false
    setPhase('running')
    setResults([])
    setFinalConfig(null)
    setCurrentIter(0)
    setErrorMsg('')

    let currentConfig: DisplayConfig = analyzedConfig ?? initialConfig ?? { ...canvasConfig, width: resWidth, height: resHeight }
    currentConfigRef.current = currentConfig

    try {
      for (let i = 1; i <= MAX_ITER; i++) {
        if (cancelledRef.current) break
        setCurrentIter(i)

        // ── Step 1: 현재 설정 평가 ──────────────────────────────────────
        setRunStep('evaluating')
        const configJson = JSON.stringify(stripImageData(currentConfig), null, 2)
        const evalRes = await window.electronAPI!.evaluateConfig({ imageData, mediaType, configJson })

        if (cancelledRef.current) break
        if (!evalRes.success || !evalRes.scores) {
          throw new Error(evalRes.error || '평가 실패')
        }

        const iterEntry: IterResult = {
          n: i,
          config: currentConfig,
          scores: evalRes.scores,
          improvements: evalRes.improvements ?? [],
          step: 'evaluate',
        }
        setResults(prev => [...prev, iterEntry])

        // 조기 종료: 높은 점수
        if (evalRes.scores.total >= EARLY_STOP_SCORE) break
        // 마지막 반복이면 개선 생성 안 함
        if (i === MAX_ITER) break
        if (cancelledRef.current) break

        // ── Step 2: 평가 피드백만 전달해 수정 에이전트 호출 ────────────
        setRunStep('generating')
        const currentConfigJson = JSON.stringify(stripImageData(currentConfig), null, 2)
        const genRes = await window.electronAPI!.refineLayout({
          imageData: imageData!,
          mediaType,
          currentConfigJson,
          improvements: evalRes.improvements ?? [],
        })
        if (cancelledRef.current) break
        if (!genRes.success || !genRes.config) {
          throw new Error(genRes.error || '수정 생성 실패')
        }
        currentConfig = genRes.config
        currentConfigRef.current = genRes.config
      }
    } catch (err) {
      setErrorMsg(String(err).replace('Error: ', ''))
      setPhase('error')
      setRunStep(null)
      return
    }

    setFinalConfig(currentConfig)
    setRunStep(null)
    setPhase('done')
  }, [imageData, mediaType, canvasConfig, resWidth, resHeight, analyzedConfig])

  const stop = () => {
    cancelledRef.current = true
    setFinalConfig(currentConfigRef.current)
    setRunStep(null)
    setPhase(results.length > 0 ? 'done' : 'idle')
  }

  const applyResult = (config: DisplayConfig) => {
    onClose()
    setTimeout(() => {
      try {
        const newConfig = JSON.parse(JSON.stringify(config))
        loadConfig(newConfig)
      } catch {
        loadConfig({ ...config, elements: [...config.elements] })
      }
    }, 100)
  }

  const applyBest = () => {
    const target = finalConfig ?? bestResult?.config
    if (target) applyResult(target)
  }

  const toggleExpand = (n: number) =>
    setExpanded(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s })

  const canStart = !!imageData && phase !== 'running'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onPaste={handlePaste}
    >
      <div
        className="flex flex-col rounded-xl shadow-2xl"
        style={{ background: colors.surface, border: `1px solid ${colors.border}`, width: 820, maxHeight: '92vh' }}
      >
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={15} style={{ color: colors.primary }} />
            <span className="font-semibold text-sm" style={{ color: colors.text }}>자동 개선 루프</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: colors.primary + '20', color: colors.primary }}>
              최대 {MAX_ITER}회 반복
            </span>
            {phase === 'running' && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: colors.primary }}>
                <Loader2 size={10} className="animate-spin" />
                #{currentIter} {runStep === 'evaluating' ? 'Claude 평가 중...' : 'Gemini 생성 중...'}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ color: colors.text, opacity: 0.4 }}><X size={16} /></button>
        </div>

        {/* ── 바디: 좌=이미지 / 우=로그 ── */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

          {/* 좌: 이미지 업로드 */}
          <div className="flex flex-col p-4 gap-3 shrink-0" style={{ width: 320, borderRight: `1px solid ${colors.border}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.4 }}>
              비교 대상 이미지
            </p>

            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                <img src={imagePreview} alt="" style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'contain', background: '#000' }} />
                <button
                  onClick={() => { setImagePreview(null); setImageData(null) }}
                  className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center"
                  style={{ width: 20, height: 20, background: colors.danger, color: '#fff', fontSize: 10 }}
                >✕</button>
              </div>
            ) : (
              <div
                className="flex-1 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer min-h-32 transition-colors"
                style={{ borderColor: isDrop ? colors.primary : colors.border, background: colors.background }}
                onDragOver={e => { e.preventDefault(); setIsDrop(true) }}
                onDragLeave={() => setIsDrop(false)}
                onDrop={e => { e.preventDefault(); setIsDrop(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={22} style={{ color: colors.border }} />
                <p className="text-[10px] text-center" style={{ color: colors.text, opacity: 0.45 }}>원본 이미지 드래그<br/>또는 클릭 / Ctrl+V</p>
              </div>
            )}

            {/* 해상도 입력 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] shrink-0" style={{ color: colors.text, opacity: 0.55 }}>해상도</span>
              <input
                type="number" value={resWidth}
                onChange={e => setResWidth(Number(e.target.value))}
                className="rounded px-1.5 py-0.5 text-[10px] font-mono text-center"
                style={{ width: 60, background: colors.background, border: `1px solid ${colors.border}`, color: colors.text }}
              />
              <span className="text-[10px]" style={{ color: colors.text, opacity: 0.4 }}>×</span>
              <input
                type="number" value={resHeight}
                onChange={e => setResHeight(Number(e.target.value))}
                className="rounded px-1.5 py-0.5 text-[10px] font-mono text-center"
                style={{ width: 60, background: colors.background, border: `1px solid ${colors.border}`, color: colors.text }}
              />
            </div>

            {/* AI 분석 */}
            {imageData && analysisPhase === 'idle' && (
              <button
                onClick={runAnalysis}
                className="w-full py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1.5"
                style={{ background: colors.primary, color: '#fff' }}
              >
                <Sparkles size={10} />AI 4단계 분석
              </button>
            )}

            {analysisPhase === 'analyzing' && (
              <div className="space-y-1">
                {analysisStages.map(s => (
                  <div key={s.n} className="flex items-center gap-2 text-[9px]" style={{ color: colors.text }}>
                    {s.status === 'running' && <Loader2 size={9} className="animate-spin shrink-0" style={{ color: colors.primary }} />}
                    {s.status === 'done'    && <CheckCircle2 size={9} className="shrink-0" style={{ color: colors.success }} />}
                    {s.status === 'error'   && <AlertCircle size={9} className="shrink-0" style={{ color: colors.danger }} />}
                    <span>{s.n}단계: {s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {analysisPhase === 'idle' && analysisError && (
              <div className="rounded p-2" style={{ background: colors.danger + '15', border: `1px solid ${colors.danger}40` }}>
                <p className="text-[9px]" style={{ color: colors.danger }}>{analysisError}</p>
              </div>
            )}

            {analysisPhase === 'done' && analyzedConfig && (
              <div className="rounded p-2 space-y-1" style={{ background: colors.success + '15', border: `1px solid ${colors.success}40` }}>
                <p className="text-[9px] font-semibold" style={{ color: colors.success }}>분석 완료 — 루프 시작 시 이 config로 시작</p>
                <p className="text-[9px]" style={{ color: colors.text, opacity: 0.6 }}>
                  {analyzedConfig.width}×{analyzedConfig.height} · {analyzedConfig.elements.length}개 요소
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewConfig(analyzedConfig)}
                    className="text-[9px] font-semibold" style={{ color: colors.primary }}>
                    미리보기
                  </button>
                  <button onClick={() => { setAnalysisPhase('idle'); setAnalyzedConfig(null) }}
                    className="text-[9px]" style={{ color: colors.text, opacity: 0.4 }}>
                    다시 분석
                  </button>
                </div>
              </div>
            )}


            {/* 캔버스 현재 설정 정보 */}
            <div className="rounded-lg p-2.5 space-y-1" style={{ background: colors.background, border: `1px solid ${colors.border}` }}>
              <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.4 }}>시작 설정 (현재 캔버스)</p>
              <p className="text-[10px] font-mono" style={{ color: colors.text }}>{canvasConfig.name}</p>
              <p className="text-[9px]" style={{ color: colors.text, opacity: 0.5 }}>
                {canvasConfig.width}×{canvasConfig.height} · {canvasConfig.elements.length}개 요소
              </p>
            </div>

            {/* 설명 */}
            <div className="space-y-1">
              {[
                `#1~${MAX_ITER} 반복: 평가 → 개선 생성`,
                `점수 기준: 레이아웃(60%) + 커버리지(30%)`,
                `점수 ${EARLY_STOP_SCORE}점 이상이면 조기 종료`,
              ].map((t, i) => (
                <p key={i} className="text-[9px] flex items-start gap-1.5" style={{ color: colors.text, opacity: 0.35 }}>
                  <span style={{ marginTop: 1 }}>·</span>{t}
                </p>
              ))}
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
          </div>

          {/* 우: 반복 로그 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minWidth: 0 }}>

            {results.length === 0 && phase === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                <TrendingUp size={28} style={{ color: colors.border }} />
                <p className="text-xs text-center" style={{ color: colors.text }}>
                  이미지를 업로드하고<br/>"루프 시작"을 눌러주세요
                </p>
              </div>
            )}

            {/* 반복 결과 카드 */}
            {results.map((r) => {
              const isBest = bestResult?.n === r.n && phase === 'done' && results.length > 1
              const isExpanded = expanded.has(r.n)
              const tc = scoreColor(r.scores.total)

              return (
                <div
                  key={r.n}
                  className="rounded-lg overflow-hidden"
                  style={{
                    border: `1px solid ${isBest ? tc + '80' : colors.border}`,
                    background: isBest ? tc + '08' : colors.background,
                  }}
                >
                  {/* 카드 헤더 */}
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                    onClick={() => toggleExpand(r.n)}
                    style={{ borderBottom: isExpanded ? `1px solid ${colors.border}` : 'none' }}
                  >
                    <div className="flex items-center gap-2.5">
                      {isBest && <Trophy size={12} style={{ color: tc }} />}
                      <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>
                        #{r.n}
                      </span>
                      <ScoreBadge score={r.scores.total} />
                      <span className="text-[9px]" style={{ color: colors.text, opacity: 0.4 }}>
                        {r.config.elements.length}개 요소
                      </span>
                      {isBest && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: tc + '25', color: tc }}>
                          최고
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                      onClick={e => { e.stopPropagation(); setPreviewConfig(r.config) }}
                      className="px-2.5 py-1 rounded text-[9px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                      style={{ background: colors.primary + '20', color: colors.primary, border: `1px solid ${colors.primary}40` }}
                    >
                      미리보기
                    </button>

                      <button
                        onClick={e => { e.stopPropagation(); applyResult(r.config) }}
                        className="px-2.5 py-1 rounded text-[9px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                        style={{ background: tc + '20', color: tc, border: `1px solid ${tc}40` }}
                      >
                        <CheckCircle2 size={9} />적용
                      </button>
                      {isExpanded ? <ChevronUp size={13} style={{ color: colors.text, opacity: 0.4 }} /> : <ChevronDown size={13} style={{ color: colors.text, opacity: 0.4 }} />}
                    </div>
                  </div>

                  {/* 카드 상세 */}
                  {isExpanded && (
                    <div className="px-3 py-2.5 space-y-2.5">
                      {/* 점수 바 */}
                      <div className="space-y-1.5">
                        <ScoreBar label="레이아웃" value={r.scores.layout} />
                        <ScoreBar label="커버리지" value={r.scores.coverage} />
                      </div>

                      {/* 개선 사항 */}
                      {r.improvements.length > 0 && (
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: colors.text, opacity: 0.35 }}>
                            발견된 문제점
                          </p>
                          <div className="space-y-1">
                            {r.improvements.map((imp, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-[9px] shrink-0 mt-0.5" style={{ color: colors.danger, opacity: 0.7 }}>→</span>
                                <p className="text-[9px] leading-relaxed" style={{ color: colors.text, opacity: 0.65 }}>{imp}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* 실행 중 표시 */}
            {phase === 'running' && (
              <div
                className="rounded-lg px-3 py-2.5 flex items-center gap-2"
                style={{ background: colors.primary + '10', border: `1px dashed ${colors.primary}40` }}
              >
                <Loader2 size={12} className="animate-spin shrink-0" style={{ color: colors.primary }} />
                <span className="text-[10px]" style={{ color: colors.primary }}>
                  #{currentIter} — {runStep === 'evaluating' ? 'Claude가 원본 이미지와 비교 중...' : 'Gemini가 개선된 UI를 생성 중...'}
                </span>
              </div>
            )}

            {/* 오류 */}
            {phase === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-lg text-xs" style={{ background: colors.danger + '15', color: colors.danger, border: `1px solid ${colors.danger}30` }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <div><p className="font-semibold mb-0.5">오류</p><p style={{ opacity: 0.8, userSelect: 'text', WebkitUserSelect: 'text' }}>{errorMsg}</p></div>
              </div>
            )}

            {/* 완료 요약 */}
            {phase === 'done' && bestResult && (
              <div
                className="rounded-lg p-3 flex items-center justify-between"
                style={{ background: colors.success + '10', border: `1px solid ${colors.success}30` }}
              >
                <div className="flex items-center gap-2">
                  <Trophy size={13} style={{ color: colors.success }} />
                  <span className="text-xs font-semibold" style={{ color: colors.success }}>
                    최고 점수: {bestResult.scores.total}점 (#{bestResult.n}회차)
                  </span>
                </div>
                <button
                  onClick={applyBest}
                  className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-80"
                  style={{ background: colors.success, color: '#fff' }}
                >
                  <CheckCircle2 size={11} />최고 결과 적용
                </button>
              </div>
            )}

            <div ref={logBottomRef} />
          </div>

          {/* 미리보기 패널 */}
          {previewConfig && (
            <div
              className="flex flex-col shrink-0 overflow-hidden"
              style={{ width: 340, borderLeft: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.text, opacity: 0.5 }}>미리보기</span>
                <button onClick={() => setPreviewConfig(null)} style={{ color: colors.text, opacity: 0.4 }}>
                  <X size={13} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3 flex items-center justify-center" style={{ background: colors.background }}>
                <div
                  style={{
                    position: 'relative',
                    width: previewConfig.width,
                    height: previewConfig.height,
                    background: previewConfig.bgColor,
                    transform: 'scale(0.55)',
                    transformOrigin: 'top center',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  {previewConfig.elements.map(el => (
                    <ElementRenderer
                      key={el.id}
                      element={el}
                      selected={false}
                      widthPx={previewConfig.width}
                      heightPx={previewConfig.height}
                    />
                  ))}
                </div>
              </div>
              <div className="px-3 py-2 shrink-0 flex gap-2" style={{ borderTop: `1px solid ${colors.border}` }}>
                <button
                  onClick={() => applyResult(previewConfig)}
                  className="flex-1 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1"
                  style={{ background: colors.success, color: '#fff' }}
                >
                  <CheckCircle2 size={10} />적용
                </button>
                <button
                  onClick={() => setPreviewConfig(null)}
                  className="px-3 py-1.5 rounded text-[10px] font-semibold"
                  style={{ background: colors.background, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 푸터 ── */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium"
            style={{ background: colors.border, color: colors.text }}
          >닫기</button>

          <div className="flex items-center gap-2">
            {phase === 'running' ? (
              <button
                onClick={stop}
                className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                style={{ background: colors.danger + '20', color: colors.danger, border: `1px solid ${colors.danger}40` }}
              >
                <Square size={11} />중지
              </button>
            ) : (
              <button
                onClick={runLoop}
                disabled={!canStart}
                className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                style={{ background: colors.primary, color: '#fff' }}
              >
                <Play size={11} />
                {phase === 'done' ? '다시 시작' : '루프 시작'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
