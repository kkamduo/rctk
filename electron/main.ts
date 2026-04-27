import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join, extname } from 'path'
import { writeFile, readFile } from 'fs/promises'
import * as dotenv from 'dotenv'

import { geminiVision, geminiChat } from './api/gemini'
import { gptVision } from './api/openai'
import { groqVision, groqChat } from './api/groq'
import { analysisCache, refreshCache } from './utils/cache'
import { parseJson } from './utils/parseJson'
import { DETECT_REGIONS_PROMPT } from './prompts/detectRegions'
import { ANALYZE_PROMPT } from './prompts/analyze'
import { GENERATE_SKELETON_PROMPT, GENERATE_DETAIL_PROMPT } from './prompts/generate'
import { EVALUATE_PROMPT } from './prompts/evaluate'
import { REFINE_PROMPT } from './prompts/refine'
import { READ_TEXT_PROMPT } from './prompts/readText'
import { buildExtractPrompt } from './prompts/extract'
import type { ApiMessage } from './types/api'

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

ipcMain.handle('detect-regions', async (_, { imageData, mediaType }) => {
  try {
    refreshCache(imageData)
    if (analysisCache.regions) return { success: true, regions: analysisCache.regions }
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다')
    const text = await geminiVision(imageData, mediaType, DETECT_REGIONS_PROMPT, 16384)
    const parsed = parseJson(text) as { regions: unknown[] }
    analysisCache.regions = parsed.regions
    return { success: true, regions: parsed.regions }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('analyze-image', async (_, { imageData, mediaType }) => {
  try {
    refreshCache(imageData)
    if (analysisCache.analyzeConfig) return { success: true, config: analysisCache.analyzeConfig }
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다')
    const text = await geminiVision(imageData, mediaType, ANALYZE_PROMPT, 16384)
    const parsed = parseJson(text)
    analysisCache.analyzeConfig = parsed
    return { success: true, config: parsed }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('analyze-regions', async (_, { imageData, mediaType, regions }) => {
  try {
    refreshCache(imageData)
    if (analysisCache.elements) return { success: true, bgColor: analysisCache.elements.bgColor, elements: analysisCache.elements.elements }
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다')
    const prompt = buildExtractPrompt(regions)
    const text = await geminiVision(imageData, mediaType, prompt, 16384)
    const parsed = parseJson(text) as { bgColor: string; elements: unknown[] }
    analysisCache.elements = parsed
    return { success: true, bgColor: parsed.bgColor, elements: parsed.elements }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('generate-layout', async (_, { messages, prompt }) => {
  try {
    const initialMessages: ApiMessage[] = messages ?? [{ role: 'user', content: prompt }]

    // 1단계: 스켈레톤 생성
    const skeletonText = process.env.GEMINI_API_KEY
      ? await geminiChat([...initialMessages, { role: 'user', content: GENERATE_SKELETON_PROMPT }], '', 4096)
      : await groqChat([...initialMessages, { role: 'user', content: GENERATE_SKELETON_PROMPT }], '', 4096)

    // 2단계: 상세 필드 추가
    const history: ApiMessage[] = [
      ...initialMessages,
      { role: 'user', content: GENERATE_SKELETON_PROMPT },
      { role: 'assistant', content: skeletonText },
      { role: 'user', content: GENERATE_DETAIL_PROMPT },
    ]
    const detailText = process.env.GEMINI_API_KEY
      ? await geminiChat(history, '', 8192)
      : await groqChat(history, '', 8192)

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

ipcMain.handle('evaluate-config', async (_, { imageData, mediaType, configJson }) => {
  try {
    const prompt = EVALUATE_PROMPT(configJson)
    const text = await geminiVision(imageData, mediaType, prompt, 16384)
    const parsed = parseJson(text) as {
      scores: { color: number; layout: number; coverage: number }
      improvements: string[]
    }
    if (!parsed.scores) {
      throw new Error(`AI 응답 형식 오류 — scores 누락: ${JSON.stringify(parsed).slice(0, 200)}`)
    }
    const { color, layout, coverage } = parsed.scores
    const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
    const c = clamp100(color), l = clamp100(layout), v = clamp100(coverage)
    const total = Math.round(c * 0.3 + l * 0.4 + v * 0.3)
    return { success: true, scores: { total, color: c, layout: l, coverage: v }, improvements: parsed.improvements ?? [] }
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
