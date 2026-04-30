// ─── 추가 import (main.ts 상단 import 블록에 병합) ───────────────────────────
//
// import { OVERVIEW_PROMPT, STAGE1_MAX_TOKENS }       from './prompts/analyze5/overview'
// import { buildZonesPrompt, STAGE2_MAX_TOKENS }      from './prompts/analyze5/zones'
// import { buildElementsPrompt, STAGE3_MAX_TOKENS }   from './prompts/analyze5/elements'
// import { buildCoordinatesPrompt, STAGE4_MAX_TOKENS } from './prompts/analyze5/coordinates'
// import { buildAssemblePrompt, STAGE5_MAX_TOKENS }   from './prompts/analyze5/assemble'

// ─── IPC 핸들러 (기존 save-file 핸들러 바로 위에 삽입) ────────────────────────

ipcMain.handle('analyze-image-staged', async (event, { imageData, mediaType }) => {
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
      s2 = await geminiVision(imageData, mediaType, buildZonesPrompt(s1), STAGE2_MAX_TOKENS)
      analysisCache.zones = s2
    }
    stages.push({ n: 2, label: '영역 분할', ok: true })
    send(2, '영역 분할', 'done')

    // ── Stage 3 — 구역별 요소 추출 ──────────────────────────────────────────
    send(3, '요소 추출', 'running')
    let s3: string
    if (analysisCache.zoneElements) {
      s3 = analysisCache.zoneElements
    } else {
      s3 = await geminiVision(imageData, mediaType, buildElementsPrompt(s2), STAGE3_MAX_TOKENS)
      analysisCache.zoneElements = s3
    }
    stages.push({ n: 3, label: '요소 추출', ok: true })
    send(3, '요소 추출', 'done')

    // ── Stage 4 — 좌표/색상 정밀 추출 ───────────────────────────────────────
    send(4, '좌표·색상 추출', 'running')
    let s4: string
    if (analysisCache.coordinates) {
      s4 = analysisCache.coordinates
    } else {
      s4 = await geminiVision(imageData, mediaType, buildCoordinatesPrompt(s3), STAGE4_MAX_TOKENS)
      analysisCache.coordinates = s4
    }
    stages.push({ n: 4, label: '좌표·색상 추출', ok: true })
    send(4, '좌표·색상 추출', 'done')

    // ── Stage 5 — JSON 조합 (이미지 없음) ───────────────────────────────────
    send(5, 'JSON 조합', 'running')
    const s5Text = await geminiChat(
      [{ role: 'user', content: buildAssemblePrompt(s1, s2, s3, s4) }],
      '',
      STAGE5_MAX_TOKENS
    )
    const config = parseJson(s5Text)
    stages.push({ n: 5, label: 'JSON 조합', ok: true })
    send(5, 'JSON 조합', 'done')

    return { success: true, config, stages }
  } catch (err) {
    const failedStage = stages.length + 1
    send(failedStage, ['전체 파악', '영역 분할', '요소 추출', '좌표·색상 추출', 'JSON 조합'][failedStage - 1] ?? '알 수 없음', 'error')
    return { success: false, error: String(err).replace('Error: ', ''), stages }
  }
})
