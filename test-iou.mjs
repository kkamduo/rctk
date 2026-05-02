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

TASK: Extract ALL non-text visual elements.
Return ONLY JSON: { "elements": [{ "id":"a-1","zoneId":"z1","type":"<type>","label":"<snake_case>","xPct":0,"yPct":0,"widthPct":10,"heightPct":10,"color":"#fff","bgColor":"#000","confident":true }] }

Allowed types: rectangle, button-nav, gauge, arc-gauge, indicator, icon, image-crop, rtc

Detection order (large first):
1. Full-screen background (rectangle — always include)
2. Header band (rectangle)
3. Footer/bottom nav bar (rectangle)
4. Left/right sidebar panels (rectangle)
5. Large nav buttons: arrows, P, back, home (button-nav)
6. Gauges, progress bars, arc dials (gauge/arc-gauge)
7. Indicator lamps, LED dots (indicator)
8. Small icons: thermometer, battery symbol, light icons (icon)
9. Logo, diagram, complex image region (image-crop)
10. Clock/datetime widget (rtc)

Rules:
- MUST emit at least one rectangle for background and header
- button-nav for large arrows/chevrons/P in bottom 30% (> 5% width AND > 5% height)
- rtc for HH:MM clock display
- No text labels (Stage B handles those)
- Minimum widthPct 3, heightPct 2`

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
    if (el.xPct < 20 && el.heightPct >= 8 && PICTURE_LABEL_RE.test(label)) {
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

const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/
function stabilizeRtc(elements) {
  if (elements.some(el => el.type === 'rtc')) return elements
  return elements.map(el => {
    const isTime = TIME_RE.test((el.label ?? '').trim()) || TIME_RE.test((el.value ?? '').trim())
    return isTime && el.yPct < 25 ? { ...el, type: 'rtc' } : el
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

const refElements = parseTft(tftXml, canvasW, canvasH)
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
const predicted = stabilizeRtc(
  reclassifySmallRectToIndicator(
    reclassifySidebarIcons(
      reclassifyFullScreenRectIou([...zoneRects, ...visual])
    )
  )
)

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
