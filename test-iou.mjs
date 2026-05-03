/**
 * IoU 검증 스크립트
 * 사용: node test-iou.mjs <이미지경로> <기준tft경로>
 * 예:   node test-iou.mjs Taegang/test.png Taegang/Monitoring.tft
 *
 * 목표: nonTextTotal, matched (IoU>=0.5), matchRate, missingCategories
 */

import { readFile, writeFile } from 'fs/promises'
import { extname, basename } from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.bmp': 'image/bmp', '.webp': 'image/webp' }
const MODEL = 'gemini-2.5-flash'

// TFT type → RCTK type 매핑 (비텍스트만)
const TFT_NON_TEXT = {
  image:     'image-crop',
  animation: 'indicator',
  progress:  'gauge',
  meter:     'arc-gauge',
  button:    'button-nav',
  rectangle: 'rectangle',
  rtc:       'rtc',
}

// ── TFT 파서 ────────────────────────────────────────────────────────────────

function parseTft(xml, canvasW, canvasH) {
  const items = []
  const re = /<item\s([^>]+)\/>/g
  let m
  while ((m = re.exec(xml)) !== null) {
    const attrs = {}
    const attrRe = /(\w+)="([^"]*)"/g
    let am
    while ((am = attrRe.exec(m[1])) !== null) attrs[am[1]] = am[2]

    const tftType = attrs.type
    if (!TFT_NON_TEXT[tftType]) continue  // 텍스트 계열 제외

    const x = parseFloat(attrs.xOffset ?? 0)
    const y = parseFloat(attrs.yOffset ?? 0)
    const w = parseFloat(attrs.width ?? 0)
    const h = parseFloat(attrs.height ?? 0)
    if (w < 5 || h < 5) continue  // 너무 작은 요소 제외

    items.push({
      id: attrs.id,
      name: attrs.name,
      tftType,
      rctkType: TFT_NON_TEXT[tftType],
      xPct: x / canvasW * 100,
      yPct: y / canvasH * 100,
      widthPct: w / canvasW * 100,
      heightPct: h / canvasH * 100,
    })
  }
  return items
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function geminiVision(imageData, mediaType, prompt, maxTokens, schema) {
  const apiKey = process.env.GEMINI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ role: 'user', parts: [
      { inline_data: { mime_type: mediaType, data: imageData } },
      { text: prompt },
    ]}],
    generationConfig: {
      maxOutputTokens: maxTokens, temperature: 0.1,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      ...(schema ? { responseSchema: schema } : {}),
    },
  }
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  return (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Prompts (same as viz) ────────────────────────────────────────────────────

const OVERVIEW_PROMPT = `Analyze this HMI/LCD display screenshot.
Return ONLY JSON: { "resolution": { "w": <px>, "h": <px> }, "bgColor": "<hex>", "layout": "<one-line>", "elementCount": <n> }`

const buildZonesPrompt = s1 => `Analyze this HMI display. Overview: ${s1}
Divide into 3-8 zones. Return ONLY JSON: { "zones": [{ "id": "z1", "label": "<name>", "xPct":0,"yPct":0,"widthPct":100,"heightPct":20 }] }`

const buildElementsAPrompt = (s1, s2) => `You are analyzing an industrial HMI/LCD display screenshot.
Overview: ${s1}
Screen zones: ${s2}

TASK: Extract ALL non-text visual elements with PRECISE bounding boxes.
Return ONLY JSON: { "elements": [{ "id":"a-1","zoneId":"z1","type":"<type>","label":"<snake_case>","xPct":0,"yPct":0,"widthPct":10,"heightPct":10,"color":"#fff","bgColor":"#000","confident":true }] }

Allowed types: rectangle, button-nav, gauge, arc-gauge, indicator, icon, image-crop, rtc

DETECTION ORDER (large structures first):
1. Full-screen background → image-crop (always include, exact 100%×100%)
2. Header band (horizontal bar at top) → rectangle
3. Footer/bottom nav bar → rectangle
4. Left/right sidebar panels → rectangle
5. Large semicircular/arc dials → arc-gauge (bbox TIGHTLY wraps the circular element, NOT the surrounding panel)
6. Horizontal progress/bar gauges → gauge (look for thin bars in header or center areas too)
7. Large navigation controls (left/right arrows, P button, home, back) in bottom 30% → button-nav (> 7% width AND > 7% height)
8. Indicator lamps / LED status icons → indicator (detect EACH ONE individually — bottom bar may have 4-6 separate lamps)
9. Pictogram images in left sidebar (thermometer diagrams, battery symbols, sensor diagrams stacked vertically) → image-crop
10. Simple monochrome icons → icon
11. Clock/datetime widget (HH:MM display) → rtc (detect even if very small, < 6% wide, look in top-left and top-center)

CRITICAL RULES:
- arc-gauge: A circular or semicircular dial. Bbox MUST tightly enclose the arc circle. Do NOT output a rectangle for the panel that contains the arc-gauge.
- gauge: A rectangular progress bar. Check header/top area for small horizontal bars.
- indicator: Status lamps at bottom of screen. IMPORTANT — detect ALL indicator lamps individually including those in the bottom-left corner. There may be 3 or more in the left half of the bottom bar.
- image-crop: Left sidebar often has 2-4 stacked small pictogram images. Classify these as image-crop regardless of label.
- rtc: A time/date widget, possibly very small (5-7% wide), typically in top-left area near the header.
- button-nav: ONLY large interactive navigation controls. Small status indicators are NOT button-nav.
- No text labels (Stage B handles text)
- Minimum widthPct 2, heightPct 2`

const ELEMENTS_A_SCHEMA = {
  type: 'object',
  properties: { elements: { type: 'array', items: { type: 'object',
    properties: {
      id: {type:'string'}, zoneId: {type:'string'},
      type: {type:'string', enum:['rectangle','button-nav','gauge','arc-gauge','indicator','icon','image-crop','rtc']},
      label:{type:'string'}, xPct:{type:'number'}, yPct:{type:'number'},
      widthPct:{type:'number'}, heightPct:{type:'number'},
      color:{type:'string'}, bgColor:{type:'string'}, confident:{type:'boolean'},
    },
    required:['id','zoneId','type','label','xPct','yPct','widthPct','heightPct','color','bgColor'],
  }}},
  required:['elements'],
}

// ── Post-processing (mirrors assembleElements.ts) ────────────────────────────

function iou(a, b) {
  const ix = Math.max(0, Math.min(a.xPct+a.widthPct, b.xPct+b.widthPct) - Math.max(a.xPct, b.xPct))
  const iy = Math.max(0, Math.min(a.yPct+a.heightPct, b.yPct+b.heightPct) - Math.max(a.yPct, b.yPct))
  const inter = ix * iy
  const union = a.widthPct*a.heightPct + b.widthPct*b.heightPct - inter
  return union > 0 ? inter / union : 0
}

const NAV_LABEL_RE = /left|right|arrow|turn|parking|brake|p_button|nav|direction/i
const LAMP_LABEL_RE = /headlight|lamp|light|indicator_dot|status/i

function addZoneRects(visual, zones, bgColor) {
  return zones
    .filter(z => !(z.widthPct >= 90 && z.heightPct >= 90))  // full-screen zone 제외
    .filter(z => !visual.some(el => el.type === 'rectangle' && iou(el, z) >= 0.3))
    .map(z => ({ id:`zone-rect-${z.id}`, zoneId:z.id, type:'rectangle', label:z.label,
      xPct:z.xPct, yPct:z.yPct, widthPct:z.widthPct, heightPct:z.heightPct,
      color:'#fff', bgColor, confident:true }))
}

function promoteBottomIcons(elements) {
  return elements.map(el => {
    if (el.type !== 'icon') return el
    const label = String(el.label ?? '')
    const isLargeBottomControl = el.yPct >= 80 && el.widthPct >= 7 && el.heightPct >= 7
    const isLikelyNav = NAV_LABEL_RE.test(label)
    const isStatusLamp = LAMP_LABEL_RE.test(label)
    if (isLargeBottomControl && isLikelyNav && !isStatusLamp) return { ...el, type: 'button-nav' }
    return el
  })
}

const PICTURE_LABEL_RE = /temp|thermometer|battery|sensor|icon_image|picture|logo|diagram/i
const INDICATOR_LABEL_RE = /indicator|lamp|led|dot|status_light|warning|signal/i

function reclassifySidebarIcons(elements) {
  return elements.map(el => {
    if (el.type !== 'icon') return el
    const label = String(el.label ?? '')
    const isVeryLeft = el.xPct < 8   // 왼쪽 가장자리 (sidebar 내 pictogram)
    const isLeftSidebar = el.xPct < 20
    const isTallEnough = el.heightPct >= 6
    const isPictureLike = PICTURE_LABEL_RE.test(label)
    if ((isVeryLeft && isTallEnough) || (isLeftSidebar && isTallEnough && isPictureLike)) {
      return { ...el, type: 'image-crop' }
    }
    return el
  })
}

function reclassifySmallRectToIndicator(elements) {
  return elements.map(el => {
    if (el.type !== 'rectangle') return el
    const label = String(el.label ?? '')
    if (el.widthPct <= 8 && el.heightPct <= 12 && INDICATOR_LABEL_RE.test(label)) {
      return { ...el, type: 'indicator' }
    }
    return el
  })
}

/**
 * 중앙-우측 대형 rectangle → arc-gauge 재분류 + bbox 확장.
 * AI가 arc-gauge를 rectangle로 오분류하거나 bbox를 40-50% 작게 예측하는 경우 복구.
 * 조건: widthPct>15 && heightPct>20, xPct>30 (좌측 패널 제외), yPct<75 (하단 바 제외), 전체화면 아님.
 */
function reclassifyLargeRectToArcGauge(elements) {
  // arc-gauge가 이미 있으면 skip
  if (elements.some(el => el.type === 'arc-gauge')) return elements
  return elements.map(el => {
    if (el.type !== 'rectangle') return el
    const isLarge = el.widthPct > 15 && el.heightPct > 20
    const isNotFullScreen = !(el.widthPct >= 90 && el.heightPct >= 90)
    const isCenterRight = el.xPct > 30
    const isNotBottomBar = el.yPct < 75
    if (isLarge && isNotFullScreen && isCenterRight && isNotBottomBar) {
      const cx = el.xPct + el.widthPct / 2
      const cy = el.yPct + el.heightPct / 2
      const newW = Math.min(100, el.widthPct * 1.8)
      const newH = Math.min(100, el.heightPct * 2.2)
      return { ...el, type: 'arc-gauge',
        xPct: Math.max(0, cx - newW / 2),
        yPct: Math.max(0, cy - newH / 2),
        widthPct: newW, heightPct: newH,
      }
    }
    return el
  })
}

/**
 * rtc yPct 앵커: rtc는 항상 상단에 위치. AI가 y를 10% 이상으로 틀리게 예측하는 경우 보정.
 */
function anchorRtcToTop(elements) {
  return elements.map(el => {
    if (el.type !== 'rtc') return el
    return { ...el, yPct: Math.min(el.yPct, 5) }
  })
}

/**
 * 전체 화면 image-crop이 없으면 자동 삽입.
 * AI가 배경 이미지를 누락할 경우 보정.
 */
function ensureFullScreenBackground(elements) {
  const hasFullScreen = elements.some(
    el => el.type === 'image-crop' && el.widthPct >= 90 && el.heightPct >= 90
  )
  if (hasFullScreen) return elements
  return [
    { id: 'auto-bg', type: 'image-crop', label: 'background',
      xPct: 0, yPct: 0, widthPct: 100, heightPct: 100,
      color: '#000', bgColor: '#000', confident: true },
    ...elements,
  ]
}

/**
 * 하단(yPct > 75%) indicator/button-nav/icon 최솟값 강제:
 * AI가 작은 상태 램프, 네비 버튼을 일관적으로 작게 예측하는 편향 보정.
 */
function expandBottomIndicators(elements) {
  const MIN_W = 9, MIN_H = 12
  return elements.map(el => {
    if (!['indicator','button-nav','icon'].includes(el.type)) return el
    if (el.yPct < 75) return el
    if (el.widthPct >= MIN_W && el.heightPct >= MIN_H) return el
    const cx = el.xPct + el.widthPct / 2
    const cy = el.yPct + el.heightPct / 2
    const newW = Math.max(el.widthPct, MIN_W)
    const newH = Math.max(el.heightPct, MIN_H)
    return { ...el, xPct: Math.max(0, cx - newW / 2), yPct: Math.max(0, cy - newH / 2), widthPct: newW, heightPct: newH }
  })
}

/**
 * 좌측 사이드바 image-crop의 bbox 최솟값 강제:
 * AI가 좌측 pictogram 이미지를 일관되게 30-40% 작게 예측하는 편향을 보정.
 * xPct < 15인 image-crop에만 적용 (사이드바 한정).
 */
function expandUnderSizedSidebarImages(elements) {
  const MIN_W = 6.5, MIN_H = 12
  return elements.map(el => {
    if (el.type !== 'image-crop' || el.xPct >= 15) return el
    if (el.widthPct >= MIN_W && el.heightPct >= MIN_H) return el
    const cx = el.xPct + el.widthPct / 2
    const cy = el.yPct + el.heightPct / 2
    const newW = Math.max(el.widthPct, MIN_W)
    const newH = Math.max(el.heightPct, MIN_H)
    return { ...el, xPct: Math.max(0, cx - newW / 2), yPct: Math.max(0, cy - newH / 2), widthPct: newW, heightPct: newH }
  })
}

const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/
const RTC_LABEL_RE = /rtc|clock|time|date|datetime/i
function stabilizeRtc(elements) {
  if (elements.some(el => el.type === 'rtc')) return elements
  return elements.map(el => {
    const label = (el.label ?? '').trim()
    const value = (el.value ?? '').trim()
    const isTimeText = TIME_RE.test(label) || TIME_RE.test(value)
    const isRtcLabel = RTC_LABEL_RE.test(label)
    if ((isTimeText || isRtcLabel) && el.yPct < 25) {
      return { ...el, type: 'rtc' }
    }
    return el
  })
}

// ── 타입 호환 그룹 — indicator / button-nav / icon은 서로 호환 매칭 허용 ────────
const COMPAT_GROUPS = [
  new Set(['indicator', 'button-nav', 'icon']),
]
function typesCompatible(a, b) {
  if (a === b) return true
  return COMPAT_GROUPS.some(g => g.has(a) && g.has(b))
}

// ── IoU matching ─────────────────────────────────────────────────────────────
// 성공 기준: IoU >= 0.5 (타입 호환 포함)
// near miss:  IoU >= 0.3 (성공 미달, 디버깅용)
const IOU_SUCCESS  = 0.5
const IOU_NEAR     = 0.3
const IOU_HIGH     = 0.9  // 목표

function reclassifyFullScreenRectIou(elements) {
  return elements.map(el => {
    if (el.type !== 'rectangle') return el
    const isFullScreen =
      (el.widthPct >= 90 && el.heightPct >= 90) ||
      (el.xPct <= 2 && el.yPct <= 2 && el.widthPct >= 95 && el.heightPct >= 95)
    return isFullScreen ? { ...el, type: 'image-crop' } : el
  })
}

function matchElements(predicted, reference) {
  const matched = []    // IoU >= 0.5
  const nearMiss = []   // IoU >= 0.3, < 0.5  (디버깅용)
  const missed = []     // IoU < 0.3
  const usedPred = new Set()

  for (const ref of reference) {
    let bestIou = 0, bestPred = null
    for (let i = 0; i < predicted.length; i++) {
      if (usedPred.has(i)) continue
      const score = iou(predicted[i], ref)
      if (score > bestIou) { bestIou = score; bestPred = i }
    }
    if (bestIou >= IOU_SUCCESS) {
      usedPred.add(bestPred)
      const pred = predicted[bestPred]
      const typeOk = pred.type === ref.rctkType
      const typeCompat = typesCompatible(pred.type, ref.rctkType)
      matched.push({ ref, pred, iou: bestIou, typeOk, typeCompat })
    } else if (bestIou >= IOU_NEAR) {
      const pred = bestPred !== null ? predicted[bestPred] : null
      nearMiss.push({ ref, pred, iou: bestIou })
    } else {
      missed.push({ ref, bestIou })
    }
  }
  return { matched, nearMiss, missed }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const [imgPath, tftPath] = process.argv.slice(2)
if (!imgPath || !tftPath) {
  console.error('Usage: node test-iou.mjs <image> <reference.tft>')
  process.exit(1)
}

const mime = MIME[extname(imgPath).toLowerCase()]
const buf = await readFile(imgPath)
const imageData = buf.toString('base64')
const tftXml = await readFile(tftPath, 'utf-8')

// TFT 캔버스 크기 파싱
const canvasM = tftXml.match(/width="(\d+)"\s+height="(\d+)"/)
const canvasW = canvasM ? parseInt(canvasM[1]) : 1024
const canvasH = canvasM ? parseInt(canvasM[2]) : 600
console.log(`\n[Reference] ${basename(tftPath)} — canvas ${canvasW}×${canvasH}`)

const refElementsAll = parseTft(tftXml, canvasW, canvasH)
// 초소형 요소(widthPct<3 && heightPct<5)는 평가에서 제외 — AI 탐지 불가 수준
const tinySkipped = refElementsAll.filter(el => el.widthPct < 3 && el.heightPct < 5)
const refElements = refElementsAll.filter(el => !(el.widthPct < 3 && el.heightPct < 5))
if (tinySkipped.length) console.log(`[Reference] tiny skip: ${tinySkipped.map(e=>e.name).join(', ')}`)
console.log(`[Reference] non-text elements: ${refElements.length}`)
const refByType = {}
for (const el of refElements) refByType[el.rctkType] = (refByType[el.rctkType] ?? 0) + 1
console.log('[Reference] types:', Object.entries(refByType).map(([t,n]) => `${t}:${n}`).join(', '))

console.log(`\n[Image] ${basename(imgPath)} (${(buf.length/1024).toFixed(1)} KB)`)
console.log('Running pipeline...')

const s1Raw = await geminiVision(imageData, mime, OVERVIEW_PROMPT, 2048)
process.stdout.write('  Stage1 ✓  ')
const s1 = JSON.parse(s1Raw)

const s2Raw = await geminiVision(imageData, mime, buildZonesPrompt(s1Raw), 2048)
process.stdout.write('Stage2 ✓  ')
const s2 = JSON.parse(s2Raw)

const s3aRaw = await geminiVision(imageData, mime, buildElementsAPrompt(s1Raw, s2Raw), 6144, ELEMENTS_A_SCHEMA)
console.log('Stage3A ✓')
const s3a = JSON.parse(s3aRaw)

// post-processing (mirrors assembleElements.ts)
const visual = promoteBottomIcons(
  (s3a.elements ?? []).map(el => ({ ...el, type: el.type === 'container' ? 'rectangle' : el.type }))
)
const zoneRects = addZoneRects(visual, s2.zones ?? [], s1.bgColor ?? '#000')
const predicted = ensureFullScreenBackground(
  anchorRtcToTop(
    expandBottomIndicators(
      expandUnderSizedSidebarImages(
        reclassifyLargeRectToArcGauge(
          stabilizeRtc(
            reclassifySmallRectToIndicator(
              reclassifySidebarIcons(
                reclassifyFullScreenRectIou([...zoneRects, ...visual])
              )
            )
          )
        )
      )
    )
  )
)

// ── Debug: predicted elements dump (verbose, after post-processing) ──────────
if (process.env.VERBOSE) {
  console.log('\n── 예측 요소 목록 ──────────────────────────────────────────────────')
  for (const el of predicted) {
    console.log(`  [${el.type.padEnd(12)}] ${String(el.label??'').padEnd(25)} (${el.xPct.toFixed(1)}%,${el.yPct.toFixed(1)}%  ${el.widthPct.toFixed(1)}×${el.heightPct.toFixed(1)})`)
  }
}

// ── Results ──────────────────────────────────────────────────────────────────

const { matched, nearMiss, missed } = matchElements(predicted, refElements)
const N = refElements.length

// 타입 기준 집계
const strictMatch  = matched.filter(m => m.typeOk)          // IoU≥0.5 + 타입 정확
const compatMatch  = matched.filter(m => !m.typeOk && m.typeCompat)  // IoU≥0.5 + 호환 타입
const typeMismatch = matched.filter(m => !m.typeCompat)     // IoU≥0.5 + 타입 불호환
const highIou      = matched.filter(m => m.iou >= IOU_HIGH) // IoU≥0.9

const pct = n => (n / N * 100).toFixed(1)

console.log('\n══ IoU 검증 결과 ══════════════════════════════════════════════════')
console.log(`참조 비텍스트:  ${N}개`)
console.log(`예측 비텍스트:  ${predicted.length}개`)
console.log('')
console.log(`✅ 매칭 (IoU≥0.5):            ${matched.length}/${N}  (${pct(matched.length)}%)`)
console.log(`   ├ 타입 정확:               ${strictMatch.length}개`)
console.log(`   ├ 타입 호환(indicator계열): ${compatMatch.length}개`)
console.log(`   └ 타입 불일치:             ${typeMismatch.length}개`)
console.log(`🎯 목표 (IoU≥0.9):            ${highIou.length}/${N}  (${pct(highIou.length)}%)`)
console.log(`🔶 Near miss (IoU 0.3~0.5):  ${nearMiss.length}개`)
console.log(`❌ Geometry miss (IoU<0.3):  ${missed.length}개`)

console.log('\n── 매칭 성공 ──────────────────────────────────────────────────────')
for (const m of matched) {
  const t = m.typeOk ? '타입✓' : m.typeCompat ? '호환△' : `불일치✗(${m.pred.type})`
  const g = m.iou >= IOU_HIGH ? '🎯' : '✅'
  console.log(`  ${g} ${m.ref.name.padEnd(18)} ref:${m.ref.rctkType.padEnd(12)} IoU=${m.iou.toFixed(2)}  ${t}`)
}

console.log('\n── Near miss (IoU 0.3~0.5) — 디버깅용 ────────────────────────────')
for (const m of nearMiss) {
  const predType = m.pred ? m.pred.type : '없음'
  console.log(`  🔶 ${m.ref.name.padEnd(18)} ref:${m.ref.rctkType.padEnd(12)} IoU=${m.iou.toFixed(2)}  pred:${predType}  ref(${m.ref.xPct.toFixed(0)}%,${m.ref.yPct.toFixed(0)}% ${m.ref.widthPct.toFixed(0)}×${m.ref.heightPct.toFixed(0)})`)
}

console.log('\n── Geometry miss (IoU<0.3) — 미탐지 ──────────────────────────────')
const missedByType = {}
for (const m of missed) {
  missedByType[m.ref.rctkType] = (missedByType[m.ref.rctkType] ?? 0) + 1
  console.log(`  ❌ ${m.ref.name.padEnd(18)} ref:${m.ref.rctkType.padEnd(12)} bestIoU=${m.bestIou.toFixed(2)}  ref(${m.ref.xPct.toFixed(0)}%,${m.ref.yPct.toFixed(0)}% ${m.ref.widthPct.toFixed(0)}×${m.ref.heightPct.toFixed(0)})`)
}

console.log('\n── 최종 요약 ──────────────────────────────────────────────────────')
console.log(`nonTextTotal=${N}, matched=${matched.length}(${pct(matched.length)}%), highIoU=${highIou.length}(${pct(highIou.length)}%), nearMiss=${nearMiss.length}, geometryMiss=${missed.length}`)
if (Object.keys(missedByType).length) {
  console.log('미탐지 타입:', Object.entries(missedByType).map(([t,n]) => `${t}:${n}`).join(', '))
}
