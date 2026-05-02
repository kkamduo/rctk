import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join, extname } from 'path'
import { writeFile, readFile } from 'fs/promises'
import * as dotenv from 'dotenv'

import { geminiVision, geminiChat } from './api/gemini'
import { groqVision, groqChat } from './api/groq'
import { analysisCache, refreshCache } from './utils/cache'
import { parseJson } from './utils/parseJson'
import { GENERATE_REQUIREMENTS_PROMPT, GENERATE_LAYOUT_PROMPT, GENERATE_DETAIL_PROMPT } from './prompts/generate'
import { EVALUATE_PROMPT } from './prompts/evaluate'
import { REFINE_PROMPT } from './prompts/refine'
import { READ_TEXT_PROMPT } from './prompts/readText'
import type { ApiMessage } from './types/api'

import { OVERVIEW_PROMPT, STAGE1_MAX_TOKENS }       from './prompts/analyze5/overview'
import { buildZonesPrompt, STAGE2_MAX_TOKENS, ZONES_SCHEMA } from './prompts/analyze5/zones'
import { buildElementsAPrompt, STAGE3A_MAX_TOKENS, ELEMENTS_A_SCHEMA } from './prompts/analyze5/elementsA'
import { buildElementsBPrompt, STAGE3B_MAX_TOKENS, ELEMENTS_B_SCHEMA } from './prompts/analyze5/elementsB'



dotenv.config()


function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'RCTK - Remote Control Toolkit',
    backgroundColor: '#111827',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('generate-layout', async (_, { messages, prompt, canvasWidth, canvasHeight }) => {
  try {
    const w = canvasWidth ?? 480
    const h = canvasHeight ?? 320
    const initialMessages: ApiMessage[] = [
      { role: 'user', content: `캔버스 크기: ${w}x${h}. 반드시 width: ${w}, height: ${h}를 사용하라.` },
      ...(messages ?? [{ role: 'user', content: prompt }]),
    ]

    // 1단계: 요구사항 파악
    const reqText = process.env.GEMINI_API_KEY
      ? await geminiChat([...initialMessages, { role: 'user', content: GENERATE_REQUIREMENTS_PROMPT }], '', 1024)
      : await groqChat([...initialMessages, { role: 'user', content: GENERATE_REQUIREMENTS_PROMPT }], '', 1024)

    // 2단계: 레이아웃 설계
    const layoutHistory: ApiMessage[] = [
      ...initialMessages,
      { role: 'user', content: GENERATE_REQUIREMENTS_PROMPT },
      { role: 'assistant', content: reqText },
      { role: 'user', content: GENERATE_LAYOUT_PROMPT },
    ]
    const layoutText = process.env.GEMINI_API_KEY
      ? await geminiChat(layoutHistory, '', 8192)
      : await groqChat(layoutHistory, '', 8192)

    // 3단계: 상세 완성
    const detailHistory: ApiMessage[] = [
      ...layoutHistory,
      { role: 'assistant', content: layoutText },
      { role: 'user', content: GENERATE_DETAIL_PROMPT },
    ]
    const detailText = process.env.GEMINI_API_KEY
      ? await geminiChat(detailHistory, '', 8192)
      : await groqChat(detailHistory, '', 8192)

    const parsed = parseJson(detailText)
    return { success: true, config: parsed }

  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('refine-layout', async (_, { currentConfigJson, improvements }: {
  currentConfigJson: string
  improvements: string[]
}) => {
  try {
    const feedbackList = improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')
    const msg: ApiMessage = {
      role: 'user',
      content: `현재 UI 설정:\n${currentConfigJson}\n\n평가 에이전트 피드백 (이것만 수정하세요):\n${feedbackList}`,
    }
    const text = await geminiChat([msg], REFINE_PROMPT, 16384)
    const parsed = parseJson(text)
    return { success: true, config: parsed }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

ipcMain.handle('evaluate-config', async (_, { imageData, mediaType, configJson }) => {
  try {
    const prompt = EVALUATE_PROMPT(configJson)
    const text = await geminiVision(imageData, mediaType, prompt, 16384)
    const parsed = parseJson(text) as {
      scores: {layout: number; coverage: number }
      improvements: string[]
    }
    if (!parsed.scores) {
      throw new Error(`AI 응답 형식 오류 — scores 누락: ${JSON.stringify(parsed).slice(0, 200)}`)
    }
    const { layout, coverage } = parsed.scores
    const l = clamp100(layout), v = clamp100(coverage)
    const total = Math.round(l * 0.6 + v * 0.4)
    return { success: true, scores: { total, layout: l, coverage: v }, improvements: parsed.improvements ?? [] }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('read-text', async (_, { imageData, mediaType }) => {
  try {
    const text = process.env.GEMINI_API_KEY
      ? await geminiVision(imageData, mediaType, READ_TEXT_PROMPT, 256)
      : await groqVision(imageData, mediaType, READ_TEXT_PROMPT, 256)
    const parsed = parseJson(text) as { text: string }
    return { success: true, text: parsed.text ?? '' }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', ''), text: '' }
  }
})

ipcMain.handle('read-image-file', async (_, { filePath }: { filePath: string }) => {
  const IMAGE_MIME: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  }
  try {
    const mime = IMAGE_MIME[extname(filePath).toLowerCase()]
    if (!mime) return { success: false, error: '지원하지 않는 이미지 형식입니다 (jpg/png/gif/webp/bmp)' }
    const buf = await readFile(filePath)
    return { success: true, data: buf.toString('base64'), mediaType: mime }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('analyze-image-staged', async (event, { imageData, mediaType, imageWidth, imageHeight }) => {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY가 설정되지 않았습니다' }
  }

  refreshCache(imageData)

  const send = (stage: number, label: string, status: 'running' | 'done' | 'error') =>
    event.sender.send('analysis-stage', { stage, label, status })

  const stages: { n: number; label: string; ok: boolean }[] = []

  try {
    // ── Stage 1 — 전체 파악 ─────────────────────────────────────────────────
    send(1, '전체 파악', 'running')
    let s1: string
    if (analysisCache.overview) {
      s1 = analysisCache.overview
    } else {
      s1 = await geminiVision(imageData, mediaType, OVERVIEW_PROMPT, STAGE1_MAX_TOKENS)
      analysisCache.overview = s1
    }
    stages.push({ n: 1, label: '전체 파악', ok: true })
    send(1, '전체 파악', 'done')

    // ── Stage 2 — 영역 분할 ─────────────────────────────────────────────────
    send(2, '영역 분할', 'running')
    let s2: string
    if (analysisCache.zones) {
      s2 = analysisCache.zones
    } else {
      s2 = await geminiVision(imageData, mediaType, buildZonesPrompt(s1), STAGE2_MAX_TOKENS, ZONES_SCHEMA)
      analysisCache.zones = s2
    }
    stages.push({ n: 2, label: '영역 분할', ok: true })
    send(2, '영역 분할', 'done')

    // ── Stage 3A — 시각 요소 추출 ───────────────────────────────────────────
    send(3, '시각 요소 추출', 'running')
    let s3a: string
    if (analysisCache.zoneElementsA) {
      s3a = analysisCache.zoneElementsA
    } else {
      s3a = await geminiVision(imageData, mediaType, buildElementsAPrompt(s1, s2), STAGE3A_MAX_TOKENS, ELEMENTS_A_SCHEMA)
      analysisCache.zoneElementsA = s3a
    }
    stages.push({ n: 3, label: '시각 요소 추출', ok: true })
    send(3, '시각 요소 추출', 'done')

    // ── Stage 3B — 텍스트/수치 추출 ─────────────────────────────────────────
    send(4, '텍스트 추출', 'running')
    let s3b: string
    if (analysisCache.zoneElementsB) {
      s3b = analysisCache.zoneElementsB
    } else {
      s3b = await geminiVision(imageData, mediaType, buildElementsBPrompt(s1, s2, s3a), STAGE3B_MAX_TOKENS, ELEMENTS_B_SCHEMA)
      analysisCache.zoneElementsB = s3b
    }
    stages.push({ n: 4, label: '텍스트 추출', ok: true })
    send(4, '텍스트 추출', 'done')

    // ── 코드로 조합 ──────────────────────────────────────────────────────────
    send(5, 'JSON 조합', 'running')
    const s1Parsed = parseJson(s1) as { resolution: { w: number; h: number }; bgColor: string; layout: string }
    const s3aParsed = parseJson(s3a) as { elements: Array<Record<string, unknown>> }
    const s3bParsed = parseJson(s3b) as { texts: Array<Record<string, unknown>> }

    // Stage3A: 비텍스트 요소 (rectangle/button-nav/gauge 등) — container 타입이 남아 있으면 rectangle로 변환
    const visualElements = (s3aParsed.elements ?? []).map((el: any) => ({
      ...el,
      type: el.type === 'container' ? 'rectangle' : el.type,
    }))

    // Stage3B: 텍스트 요소만 (label/numeric/title)
    const textElements = (s3bParsed.texts ?? []).map((el: any) => ({
      ...el,
      type: el.type === 'container' ? 'rectangle' : el.type,
    }))

    const allElements = [...visualElements, ...textElements]

    const config = {
      name: s1Parsed.layout ?? 'Display',
      width: imageWidth ?? s1Parsed.resolution?.w ?? 480,
      height: imageHeight ?? s1Parsed.resolution?.h ?? 320,
      bgColor: s1Parsed.bgColor ?? '#000000',
      elements: allElements.map((el, i) => ({
        ...el,
        id: `el-${i + 1}`,
        label: el.label ?? '',
        color: el.color ?? '#ffffff',
        value: el.value ?? '0',
        unit: el.unit ?? '',
        active: el.active ?? false,
        dynamic: el.dynamic ?? false,
        confident: el.confident !== false,
      })),
    }
    stages.push({ n: 5, label: 'JSON 조합', ok: true })
    send(5, 'JSON 조합', 'done')

    return { success: true, config, stages }
  } catch (err) {
    const failedStage = stages.length + 1
    send(failedStage, ['전체 파악', '영역 분할', '시각 요소 추출', '텍스트 추출', 'JSON 조합'][failedStage - 1] ?? '알 수 없음', 'error')
    return { success: false, error: String(err).replace('Error: ', ''), stages }
  }
})

ipcMain.handle('save-file', async (_, { content, filename, filters }) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: filename,
    filters,
  })
  if (canceled || !filePath) return { success: false }
  try {
    await writeFile(filePath, content, 'utf-8')
    return { success: true, filePath }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
