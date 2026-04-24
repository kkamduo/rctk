import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'

// ← 여기에 Groq API 키를 입력하세요
const GROQ_API_KEY = 'gsk_your_key_here'

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
      "type": "indicator|gauge|numeric|label|title|logo",
      "x": X좌표,
      "y": Y좌표,
      "width": 너비,
      "height": 높이,
      "label": "텍스트 내용 (이미지 그대로)",
      "value": "값 또는 상태텍스트 (없으면 빈 문자열)",
      "color": "#전경색HEX",
      "bgColor": "#배경색HEX",
      "active": true,
      "unit": "단위 (없으면 빈 문자열)"
    }
  ]
}

추출 기준:
1. 캔버스 크기: 이미지 비율을 유지하되 width=480, height=320 기준으로 좌표 정규화
2. type 선택:
   - LED/상태표시박스 + 텍스트 → "indicator" (active: true=초록, false=회색)
   - 프로그레스바/게이지 → "gauge" (value: 0~100 퍼센트)
   - 숫자값 표시 (0.0m, RPM 등) → "numeric"
   - 단순 텍스트/레이블 → "label"
   - 상단 제목/헤더 → "title"
   - 브랜드명/로고 → "logo"
3. 색상은 이미지 실제 색상을 HEX로 변환
4. 좌표는 요소의 좌상단 기준 (x, y)
5. 모든 텍스트 요소를 빠짐없이 추출할 것
6. 이미지가 반전/미러된 경우 올바른 방향으로 텍스트 해석`

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
사용자의 설명을 바탕으로 디스플레이 화면을 JSON으로 설계해주세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

{
  "name": "화면 이름",
  "width": 480,
  "height": 320,
  "bgColor": "#배경색HEX",
  "elements": [
    {
      "id": "el-1",
      "type": "indicator|gauge|numeric|label|title|logo",
      "x": X좌표,
      "y": Y좌표,
      "width": 너비,
      "height": 높이,
      "label": "레이블 텍스트",
      "value": "값 또는 상태텍스트",
      "color": "#전경색HEX",
      "bgColor": "#배경색HEX",
      "active": true,
      "unit": "단위"
    }
  ]
}

설계 기준:
1. 캔버스: width=480, height=320 기준으로 요소 배치
2. type 선택: indicator(LED/상태), gauge(프로그레스바), numeric(숫자값), label(텍스트), title(제목), logo(브랜드)
3. 요소들이 겹치지 않도록 균형있게 배치
4. 산업용 UI답게 어두운 배경(#0a0a0a~#1a1a2e)에 밝은 전경색 사용
5. 요소 수는 5~15개 사이로 적절히`

ipcMain.handle('generate-layout', async (_, { prompt }) => {
  try {
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
          { role: 'user', content: prompt },
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
