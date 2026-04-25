import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join, extname } from 'path'
import { writeFile, readFile } from 'fs/promises'
import * as dotenv from 'dotenv'

dotenv.config()

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''
const USE_CLAUDE = !!ANTHROPIC_API_KEY
const CLAUDE_MODEL = 'claude-sonnet-4-6'

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

// ─── Claude API helpers ───────────────────────────────────────────────────────

async function claudeVision(imageData: string, mediaType: string, prompt: string, maxTokens = 2048): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })
  if (!response.ok) {
    const err = await response.json() as { error?: { message?: string } }
    throw new Error(err.error?.message || `Claude API 오류 ${response.status}`)
  }
  const data = await response.json() as { content: Array<{ type: string; text?: string }> }
  return data.content.find(c => c.type === 'text')?.text?.trim() ?? ''
}

type MsgContent = string | Array<{ type: string; [key: string]: unknown }>
type ApiMessage = { role: 'user' | 'assistant'; content: MsgContent }

type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

function toClaudeMessages(messages: ApiMessage[]): Array<{ role: 'user' | 'assistant'; content: string | ClaudeContentBlock[] }> {
  return messages.map(msg => {
    if (typeof msg.content === 'string') return { role: msg.role, content: msg.content }
    const content: ClaudeContentBlock[] = msg.content.map(part => {
      if (part.type === 'image_url') {
        const url = (part.image_url as { url: string }).url
        const [header, b64data] = url.split(',')
        const mime = header.split(':')[1].split(';')[0]
        return { type: 'image', source: { type: 'base64', media_type: mime, data: b64data } }
      }
      return { type: 'text', text: String(part.text ?? '') }
    })
    return { role: msg.role, content }
  })
}

async function claudeChat(messages: ApiMessage[], systemPrompt: string, maxTokens = 4096): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: toClaudeMessages(messages),
    }),
  })
  if (!response.ok) {
    const err = await response.json() as { error?: { message?: string } }
    throw new Error(err.error?.message || `Claude API 오류 ${response.status}`)
  }
  const data = await response.json() as { content: Array<{ type: string; text?: string }> }
  return data.content.find(c => c.type === 'text')?.text?.trim() ?? ''
}

// ─── Groq API helpers ─────────────────────────────────────────────────────────

async function groqVision(imageData: string, mediaType: string, prompt: string, maxTokens = 2048): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageData}` } },
          { type: 'text', text: prompt },
        ],
      }],
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  })
  if (!response.ok) {
    const err = await response.json() as { error?: { message?: string } }
    throw new Error(err.error?.message || `Groq API 오류 ${response.status}`)
  }
  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content.trim()
}

async function groqChat(messages: ApiMessage[], systemPrompt: string, maxTokens = 4096): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  })
  if (!response.ok) {
    const err = await response.json() as { error?: { message?: string } }
    throw new Error(err.error?.message || `Groq API 오류 ${response.status}`)
  }
  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content.trim()
}

function parseJson(text: string): unknown {
  const start = text.indexOf('{')
  if (start === -1) throw new Error('응답에서 JSON을 찾을 수 없습니다')
  let depth = 0, inStr = false, esc = false, end = -1
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (esc) { esc = false; continue }
    if (ch === '\\' && inStr) { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (!inStr) {
      if (ch === '{') depth++
      else if (ch === '}') { if (--depth === 0) { end = i; break } }
    }
  }
  if (end === -1) throw new Error(`JSON 파싱 실패: 닫는 괄호 없음 (원문 앞 200자: ${text.slice(0, 200)})`)
  return JSON.parse(text.slice(start, end + 1))
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const DETECT_REGIONS_PROMPT = `이 이미지는 산업용 장비의 디스플레이/HMI 화면입니다.
화면에서 의미있는 UI 구역들을 감지하여 JSON으로 반환하세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

{
  "regions": [
    {
      "id": "r1",
      "category": "header|gauge|button|status|numeric|label",
      "label": "구역 이름 (이미지 내 텍스트 기반, 없으면 카테고리명)",
      "x": X좌표(이미지 너비 대비 0~100 퍼센트),
      "y": Y좌표(이미지 높이 대비 0~100 퍼센트),
      "w": 너비(이미지 너비 대비 0~100 퍼센트),
      "h": 높이(이미지 높이 대비 0~100 퍼센트)
    }
  ]
}

카테고리 기준:
- "header": 상단 제목, 타이틀, 헤더 영역
- "gauge": 원형/반원형 다이얼 계기판 (속도계, 온도계, RPM 게이지)
- "button": 버튼, 방향 컨트롤, 조작 버튼 그룹
- "status": LED 상태 인디케이터, ON/OFF 표시
- "numeric": 숫자 수치 표시 박스 (온도값, RPM값, 전압값 등)
- "label": 텍스트 레이블, 단위, 범례

규칙:
- 비슷한 종류 요소들은 하나의 구역으로 묶어서 반환
- x, y는 구역 좌상단 기준, 소수점 1자리 허용
- 구역이 이미지 경계를 벗어나지 않도록 (x+w≤100, y+h≤100)
- 겹치지 않도록 배치`

const ANALYZE_PROMPT = `이 이미지는 산업용 장비의 디스플레이 화면(LCD/HMI)입니다.
화면에 표시된 모든 UI 요소를 분석하여 아래 JSON 형식으로 추출해주세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

{
  "name": "화면 이름 (이미지에서 추출, 없으면 'Display')",
  "width": 480,
  "height": 320,
  "bgColor": "#배경색HEX",
  "elements": [
    {
      "id": "el-1",
      "type": "indicator|gauge|arc-gauge|numeric|button|label|title|logo",
      "xPct": X위치(0~100, 이미지 너비 기준 %),
      "yPct": Y위치(0~100, 이미지 높이 기준 %),
      "widthPct": 너비(0~100, 이미지 너비 기준 %),
      "heightPct": 높이(0~100, 이미지 높이 기준 %),
      "label": "원본 텍스트 그대로",
      "value": "값 또는 아이콘심볼",
      "color": "#전경색HEX",
      "bgColor": "#배경색HEX",
      "active": true,
      "unit": "단위"
    }
  ]
}

=== 색상 추출 규칙 (가장 중요) ===
- 배경색이 어두우면 반드시 어두운 HEX로 추출. 절대 #ffffff나 #f0f0f0으로 가정하지 말 것
- 예: 검정 배경 → #0a0a0a, 진한 회색 → #1a1a1a, 진한 파랑 → #0d1b2a
- 강조색(초록/빨강/노랑/파랑)은 실제 색상 그대로 추출
  예: 밝은 초록 → #00ff88, 빨강 → #ff2222, 노랑 → #ffcc00
- color 필드: 해당 요소의 주요 전경색 (텍스트, LED, 아크 색상)
- bgColor 필드: 해당 요소 배경색 (전체 배경과 같을 수도 있음)

=== type 선택 기준 ===
- "arc-gauge": 원형/반원형 다이얼 계기 (속도계, 온도계, RPM 게이지) → value: 0~100 퍼센트, unit: 단위
- "gauge": 수평/수직 바형 게이지 → value: 0~100 퍼센트
- "indicator": LED + 텍스트 상태표시 → active: 켜짐=true, 꺼짐=false
- "numeric": 숫자값 + 단위 표시박스 (RPM, km/h, 온도 수치 등) → value: 숫자문자열, unit: 단위
- "button": 방향키/전원/아이콘 버튼 → value: 버튼심볼(▲▼◀▶⏻ 등), label: 버튼명
- "title": 화면 상단 제목/헤더
- "label": 단순 텍스트 레이블
- "logo": 브랜드명/로고

=== 텍스트 추출 규칙 ===
- label 필드: 이미지의 텍스트를 절대 번역하거나 변경하지 말 것. 원본 그대로 복사
- 영어면 영어 그대로, 한국어면 한국어 그대로

=== 레이아웃 추출 규칙 ===
- 좌표는 요소의 실제 위치를 반영. 단순 그리드로 배치하지 말 것
- xPct, yPct, widthPct, heightPct는 이미지 크기 기준 0~100% 비율로 반환
- 원형 게이지가 여러 개면 각각 독립된 arc-gauge로 추출
- 버튼 그룹(방향키 4개 등)은 각각 별도 button 요소로 추출
- 좌표가 겹치지 않도록 주의

=== 버튼 심볼 매핑 ===
위쪽 화살표 → ▲, 아래쪽 → ▼, 왼쪽 → ◀, 오른쪽 → ▶
전원 → ⏻, 정지 → ■, 재생 → ▶, 홈 → ⌂, 확인 → ✓, 취소 → ✕`

const GENERATE_PROMPT = `당신은 산업용 HMI/LCD 디스플레이 레이아웃 설계 전문가입니다.
사용자의 설명 또는 첨부 이미지를 바탕으로 디스플레이 화면을 JSON으로 설계해주세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

{
  "name": "화면 이름",
  "width": 480,
  "height": 320,
  "bgColor": "#배경색HEX",
  "elements": [
    {
      "id": "el-1",
      "type": "indicator|gauge|arc-gauge|numeric|label|title|logo",
      "xPct": X위치(0~100, 캔버스 너비 기준 %),
      "yPct": Y위치(0~100, 캔버스 높이 기준 %),
      "widthPct": 너비(0~100, 캔버스 너비 기준 %),
      "heightPct": 높이(0~100, 캔버스 높이 기준 %),
      "label": "레이블 텍스트",
      "value": "값",
      "color": "#전경색HEX",
      "bgColor": "#요소배경색HEX",
      "active": true,
      "unit": "단위"
    }
  ]
}

=== 이미지가 제공된 경우 (최우선 규칙) ===
배경색 추출:
- 이미지의 실제 배경색을 직접 읽어 bgColor에 설정
- 어두운 배경 → 반드시 어두운 HEX (#0a0a0a, #111827, #0d1b2a 등)
- 절대로 #ffffff이나 #f0f0f0으로 가정하지 말 것

요소 색상 추출:
- 각 요소의 color는 이미지에서 그 요소의 실제 전경색을 읽어서 설정
- 밝은 초록 → #00ff88, 빨강 → #ff2222, 청록 → #00ddcc, 노랑 → #ffcc00 등 실제 색상 그대로
- color(전경색)는 bgColor(배경색)와 충분한 대비 필수 — 어두운 배경이면 밝은 전경색 사용

위치 추출:
- 각 요소의 xPct, yPct, widthPct, heightPct는 이미지 내 실제 위치/크기를 0~100% 비율로 표현

타입 판별:
- 원형/반원형 다이얼 계기판 → 반드시 type: "arc-gauge", value: "0~100" (퍼센트), unit: 단위
- 바형/수평 게이지 → type: "gauge", value: "0~100"
- LED/상태 표시 → type: "indicator", active: true/false
- 숫자 수치 박스 → type: "numeric", value: 숫자문자열, unit: 단위
- 텍스트 레이블 → type: "label"
- 화면 제목 → type: "title"

=== 텍스트 설명만 제공된 경우 ===
- 배경: 어두운 계열 (#0d1b2a, #111111, #0a0f1a 중 선택)
- 강조 색상: #00ff88(초록), #00ccff(청록), #ff4444(빨강), #ffcc00(노랑) 등 선명한 산업용 색상
- 원형 계기판 언급 시 → type: "arc-gauge" 사용
- 폰트/전경색은 반드시 밝은 색 (#e0e0e0, #ffffff, 또는 강조 색상)

=== 공통 규칙 ===
- 요소 수: 5~15개, 겹치지 않게 배치
- label: 이미지의 실제 텍스트 그대로 (번역·변경 금지)
- arc-gauge/gauge의 value: "0"~"100" 사이 숫자 문자열
- indicator의 active: 켜짐=true, 꺼짐=false`

function buildExtractPrompt(regions: Array<{ id: string; category: string; label: string }>): string {
  const list = regions.map(r => `[${r.id}] 카테고리: ${r.category}, 감지 레이블: "${r.label}"`).join('\n')
  return `이 이미지는 산업용 장비의 디스플레이/HMI 화면입니다.
아래 구역 목록의 텍스트·색상·값을 추출하세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

구역 목록:
${list}

{
  "bgColor": "#이미지 전체 배경색HEX",
  "elements": [
    {
      "id": "구역ID (위 목록과 반드시 일치)",
      "label": "이미지 내 실제 텍스트 그대로 (없으면 감지 레이블 유지, 번역 금지)",
      "value": "표시값 또는 버튼심볼(▲▼◀▶⏻ 등, 없으면 빈 문자열)",
      "color": "#해당 구역 전경색HEX",
      "bgColor": "#해당 구역 배경색HEX",
      "active": true,
      "unit": "단위 (없으면 빈 문자열)"
    }
  ]
}

규칙:
- 반드시 구역 목록의 모든 id에 대해 요소를 반환
- 색상은 실제 이미지에서 추출. 어두운 배경 → #0a0a0a 형태로
- active: 켜진 LED/상태 → true, 꺼짐 → false`
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('detect-regions', async (_, { imageData, mediaType }) => {
  try {
    const text = USE_CLAUDE
      ? await claudeVision(imageData, mediaType, DETECT_REGIONS_PROMPT, 2048)
      : await groqVision(imageData, mediaType, DETECT_REGIONS_PROMPT, 2048)
    const parsed = parseJson(text) as { regions: unknown[] }
    return { success: true, regions: parsed.regions }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('analyze-image', async (_, { imageData, mediaType }) => {
  try {
    const text = USE_CLAUDE
      ? await claudeVision(imageData, mediaType, ANALYZE_PROMPT, 4096)
      : await groqVision(imageData, mediaType, ANALYZE_PROMPT, 4096)
    const parsed = parseJson(text)
    return { success: true, config: parsed }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('analyze-regions', async (_, { imageData, mediaType, regions }) => {
  try {
    const prompt = buildExtractPrompt(regions)
    const text = USE_CLAUDE
      ? await claudeVision(imageData, mediaType, prompt, 2048)
      : await groqVision(imageData, mediaType, prompt, 2048)
    const parsed = parseJson(text) as { bgColor: string; elements: unknown[] }
    return { success: true, bgColor: parsed.bgColor, elements: parsed.elements }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('generate-layout', async (_, { messages, prompt }) => {
  try {
    const apiMessages: ApiMessage[] = messages ?? [{ role: 'user', content: prompt }]
    const text = USE_CLAUDE
      ? await claudeChat(apiMessages, GENERATE_PROMPT, 4096)
      : await groqChat(apiMessages, GENERATE_PROMPT, 4096)
    const parsed = parseJson(text)
    return { success: true, config: parsed }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

const EVALUATE_PROMPT = (configJson: string) => `당신은 독립적인 UI 품질 평가 에이전트입니다. 절대로 새로운 UI를 생성하지 마세요.

임무: 첨부 이미지(원본)와 아래 "현재 UI 설정"을 비교하여 수치로만 평가하세요.
마크다운 없이 아래 JSON 형식만 반환하세요. name/width/height/elements/bgColor 키는 절대 포함 금지.

현재 UI 설정:
${configJson}

반환 형식 (이것만):
{"scores":{"color":숫자,"layout":숫자,"coverage":숫자},"improvements":["피드백1","피드백2","피드백3"]}

평가 기준:
- color(0~100): 배경색·요소 색상이 원본 이미지 색상과 일치하는 정도
- layout(0~100): 요소 위치·크기 비율이 원본 레이아웃과 일치하는 정도
- coverage(0~100): 원본 이미지의 주요 UI 요소가 빠짐없이 포함된 정도
- improvements: 수정 에이전트에게 전달할 명확한 지시 3~5개 (좌표·색상HEX·타입 명시)
  예) "우상단 arc-gauge 누락 → xPct:60 yPct:10 widthPct:30 heightPct:40으로 추가"
  예) "배경색 #121212로 수정 (현재 너무 밝음)"
  예) "좌측 numeric 요소 xPct:5→xPct:3으로 이동"`

const REFINE_PROMPT = `당신은 UI 수정 에이전트입니다. 평가 에이전트가 제공한 피드백을 정확히 적용하는 것이 유일한 임무입니다.
자체적인 판단이나 창의적 변경은 절대 금지입니다. 피드백에 없는 요소는 건드리지 마세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

출력 형식:
{
  "name": "화면 이름",
  "width": 480,
  "height": 320,
  "bgColor": "#배경색HEX",
  "elements": [
    {
      "id": "el-1",
      "type": "indicator|gauge|arc-gauge|numeric|button|label|title|logo",
      "xPct": 숫자,
      "yPct": 숫자,
      "widthPct": 숫자,
      "heightPct": 숫자,
      "label": "텍스트",
      "value": "값",
      "color": "#HEX",
      "bgColor": "#HEX",
      "active": true,
      "unit": "단위"
    }
  ]
}`

ipcMain.handle('refine-layout', async (_, { imageData, mediaType, currentConfigJson, improvements }: {
  imageData: string
  mediaType: string
  currentConfigJson: string
  improvements: string[]
}) => {
  try {
    const feedbackList = improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')
    const userMsg: ApiMessage = {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageData}` } },
        {
          type: 'text',
          text: `현재 UI 설정:\n${currentConfigJson}\n\n평가 에이전트 피드백 (이것만 수정하세요):\n${feedbackList}`,
        },
      ],
    }
    const text = USE_CLAUDE
      ? await claudeChat([userMsg], REFINE_PROMPT, 4096)
      : await groqChat([userMsg], REFINE_PROMPT, 4096)
    const parsed = parseJson(text)
    return { success: true, config: parsed }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('evaluate-config', async (_, { imageData, mediaType, configJson }) => {
  try {
    const prompt = EVALUATE_PROMPT(configJson)
    const text = USE_CLAUDE
      ? await claudeVision(imageData, mediaType, prompt, 1024)
      : await groqVision(imageData, mediaType, prompt, 1024)
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

const READ_TEXT_PROMPT = `이 이미지에서 보이는 텍스트와 숫자만 읽어서 JSON으로 반환하세요.
아이콘, 도형, 배경은 무시하고 텍스트 내용만 추출하세요.
JSON 이외의 텍스트는 절대 포함하지 마세요.
{ "text": "읽은 텍스트 그대로 한 줄로 (텍스트 없으면 빈 문자열)" }`

ipcMain.handle('read-text', async (_, { imageData, mediaType }) => {
  try {
    const text = USE_CLAUDE
      ? await claudeVision(imageData, mediaType, READ_TEXT_PROMPT, 256)
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
