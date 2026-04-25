import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join, extname } from 'path'
import { writeFile, readFile } from 'fs/promises'
import * as dotenv from 'dotenv'

dotenv.config()

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''

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

ipcMain.handle('detect-regions', async (_, { imageData, mediaType }) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageData}` } },
            { type: 'text', text: DETECT_REGIONS_PROMPT },
          ],
        }],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })
    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      return { success: false, error: err.error?.message || `API 오류 ${response.status}` }
    }
    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const text = data.choices[0].message.content.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { success: false, error: '응답에서 JSON을 찾을 수 없습니다' }
    const parsed = JSON.parse(jsonMatch[0])
    return { success: true, regions: parsed.regions }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

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
- 예: "Motor Temp" → "Motor Temp", "RPM" → "RPM", "속도" → "속도"

=== 레이아웃 추출 규칙 ===
- 좌표는 요소의 실제 위치를 반영. 단순 그리드로 배치하지 말 것
- xPct, yPct, widthPct, heightPct는 이미지 크기 기준 0~100% 비율로 반환
- 원형 게이지가 여러 개면 각각 독립된 arc-gauge로 추출
- 버튼 그룹(방향키 4개 등)은 각각 별도 button 요소로 추출
- 좌표가 겹치지 않도록 주의

=== 버튼 심볼 매핑 ===
위쪽 화살표 → ▲, 아래쪽 → ▼, 왼쪽 → ◀, 오른쪽 → ▶
전원 → ⏻, 정지 → ■, 재생 → ▶, 홈 → ⌂, 확인 → ✓, 취소 → ✕`

ipcMain.handle('analyze-image', async (_, { imageData, mediaType }) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageData}` } },
            { type: 'text', text: ANALYZE_PROMPT },
          ],
        }],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      return { success: false, error: err.error?.message || `API 오류 ${response.status}` }
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const text = data.choices[0].message.content.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { success: false, error: '응답에서 JSON을 찾을 수 없습니다' }

    const parsed = JSON.parse(jsonMatch[0])
    return { success: true, config: parsed }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

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
- 예: 이미지 너비 50% 위치 → xPct=50, 이미지 높이 25% 위치 → yPct=25
- 이미지 너비의 20%를 차지하는 요소 → widthPct=20

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

ipcMain.handle('analyze-regions', async (_, { imageData, mediaType, regions }) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageData}` } },
            { type: 'text', text: buildExtractPrompt(regions) },
          ],
        }],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })
    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      return { success: false, error: err.error?.message || `API 오류 ${response.status}` }
    }
    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const text = data.choices[0].message.content.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { success: false, error: '응답에서 JSON을 찾을 수 없습니다' }
    const parsed = JSON.parse(jsonMatch[0])
    return { success: true, bgColor: parsed.bgColor, elements: parsed.elements }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

const IMAGE_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
}

ipcMain.handle('read-image-file', async (_, { filePath }: { filePath: string }) => {
  try {
    const mime = IMAGE_MIME[extname(filePath).toLowerCase()]
    if (!mime) return { success: false, error: '지원하지 않는 이미지 형식입니다 (jpg/png/gif/webp/bmp)' }
    const buf = await readFile(filePath)
    return { success: true, data: buf.toString('base64'), mediaType: mime }
  } catch (err) {
    return { success: false, error: String(err).replace('Error: ', '') }
  }
})

ipcMain.handle('generate-layout', async (_, { messages, prompt }) => {
  try {
    type MsgContent = string | Array<{ type: string; [key: string]: unknown }>
    const apiMessages: Array<{ role: string; content: MsgContent }> =
      messages ?? [{ role: 'user', content: prompt }]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: GENERATE_PROMPT },
          ...apiMessages,
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      return { success: false, error: err.error?.message || `API 오류 ${response.status}` }
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const text = data.choices[0].message.content.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { success: false, error: '응답에서 JSON을 찾을 수 없습니다' }

    const parsed = JSON.parse(jsonMatch[0])
    return { success: true, config: parsed }
  } catch (err) {
    return { success: false, error: String(err) }
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
