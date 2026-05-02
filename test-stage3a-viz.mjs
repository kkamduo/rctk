/**
 * Stage3A 결과 시각화 — HTML 오버레이 생성
 * 사용: node test-stage3a-viz.mjs <이미지경로>
 *
 * 후처리(zone-rect 자동 삽입)는 electron/utils/assembleElements.ts와 동일 로직 적용.
 * TS 직접 import 불가이므로 JS로 미러링 — 로직 변경 시 두 파일 동시 수정 필요.
 */

import { readFile, writeFile } from 'fs/promises'
import { extname, basename } from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.bmp': 'image/bmp', '.webp': 'image/webp' }
const MODEL = 'gemini-2.5-flash'

const TYPE_COLORS = {
  'rectangle':  '#4488ff',
  'button-nav': '#ff8800',
  'gauge':      '#00ffcc',
  'arc-gauge':  '#ff44ff',
  'indicator':  '#ffff00',
  'icon':       '#ff4444',
  'image-crop': '#44ff44',
  'rtc':        '#ffffff',
}

async function geminiVision(imageData, mediaType, prompt, maxTokens, schema) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ role: 'user', parts: [
      { inline_data: { mime_type: mediaType, data: imageData } },
      { text: prompt },
    ]}],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      ...(schema ? { responseSchema: schema } : {}),
    },
  }
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) { const t = await res.text(); throw new Error(`Gemini ${res.status}: ${t.slice(0, 300)}`) }
  const json = await res.json()
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

const OVERVIEW_PROMPT = `Analyze this HMI/LCD display screenshot.
Return ONLY a JSON object:
{ "resolution": { "w": <width px>, "h": <height px> }, "bgColor": "<hex>", "layout": "<one-line>", "elementCount": <number> }`

const buildZonesPrompt = (s1) => `Analyze this HMI display. Overview: ${s1}
Divide into 3-8 zones. Return ONLY JSON: { "zones": [{ "id": "z1", "label": "<name>", "xPct": 0, "yPct": 0, "widthPct": 100, "heightPct": 20 }] }`

const buildElementsAPrompt = (s1, s2) => `You are analyzing an industrial HMI/LCD display screenshot.
Overview: ${s1}
Screen zones: ${s2}

TASK: Extract ALL non-text visual elements — every panel, box, button shape, gauge, indicator, icon, diagram, and graphical region.
Return ONLY a JSON object.

{ "elements": [{ "id": "a-1", "zoneId": "<zone id>", "type": "<type>", "label": "<snake_case name>",
  "xPct": <0-100>, "yPct": <0-100>, "widthPct": <0-100>, "heightPct": <0-100>,
  "color": "<hex>", "bgColor": "<hex or transparent>", "confident": <bool> }] }

Allowed types: rectangle, button-nav, gauge, arc-gauge, indicator, icon, image-crop, rtc

Detection order:
1. Full-screen background fill (rectangle)
2. Header band, footer bar, sidebar panels (rectangle)
3. Large section boxes, data panels (rectangle)
4. Navigation bar buttons (button-nav)
5. Gauges, progress bars, arc dials (gauge / arc-gauge)
6. Indicator lamps, LED dots (indicator)
7. Small icons, pictograms (icon)
8. Logos, diagrams, image regions (image-crop)
9. Clock/datetime widgets (rtc)

Critical rules:
- rectangle is MANDATORY for any background, panel, header bar, or region fill — extract at least the main background and header
- button-nav for any clickable/touchable navigation button with a distinct shape
- Even if text sits ON TOP of a shape, extract the shape
- Do NOT emit text labels
- Minimum widthPct 3, heightPct 2`

const ELEMENTS_A_SCHEMA = {
  type: 'object',
  properties: { elements: { type: 'array', items: { type: 'object',
    properties: {
      id: { type: 'string' }, zoneId: { type: 'string' },
      type: { type: 'string', enum: ['rectangle','button-nav','gauge','arc-gauge','indicator','icon','image-crop','rtc'] },
      label: { type: 'string' }, xPct: { type: 'number' }, yPct: { type: 'number' },
      widthPct: { type: 'number' }, heightPct: { type: 'number' },
      color: { type: 'string' }, bgColor: { type: 'string' }, confident: { type: 'boolean' },
    },
    required: ['id','zoneId','type','label','xPct','yPct','widthPct','heightPct','color','bgColor'],
  }}},
  required: ['elements'],
}

// ── Main ────────────────────────────────────────────────────────────────────

const imgPath = process.argv[2]
if (!imgPath) { console.error('Usage: node test-stage3a-viz.mjs <image-path>'); process.exit(1) }

const mime = MIME[extname(imgPath).toLowerCase()]
const buf = await readFile(imgPath)
const imageData = buf.toString('base64')
const imageDataUrl = `data:${mime};base64,${imageData}`

console.log(`[Image] ${imgPath} (${(buf.length/1024).toFixed(1)} KB)`)

console.log('Stage 1...')
const s1Raw = await geminiVision(imageData, mime, OVERVIEW_PROMPT, 2048)
const s1 = JSON.parse(s1Raw)
console.log(`  resolution: ${s1.resolution?.w}×${s1.resolution?.h}`)

console.log('Stage 2...')
const s2Raw = await geminiVision(imageData, mime, buildZonesPrompt(s1Raw), 2048)
const s2 = JSON.parse(s2Raw)
console.log(`  zones: ${s2.zones?.length}`)

console.log('Stage 3A...')
const s3aRaw = await geminiVision(imageData, mime, buildElementsAPrompt(s1Raw, s2Raw), 6144, ELEMENTS_A_SCHEMA)
const s3a = JSON.parse(s3aRaw)
console.log(`  elements (raw): ${s3a.elements?.length ?? 0}`)

// ── 후처리: zone-rect 자동 삽입 — mirrors electron/utils/assembleElements.ts ──
function iou(a, b) {
  const ix = Math.max(0, Math.min(a.xPct + a.widthPct, b.xPct + b.widthPct) - Math.max(a.xPct, b.xPct))
  const iy = Math.max(0, Math.min(a.yPct + a.heightPct, b.yPct + b.heightPct) - Math.max(a.yPct, b.yPct))
  const inter = ix * iy
  const union = a.widthPct * a.heightPct + b.widthPct * b.heightPct - inter
  return union > 0 ? inter / union : 0
}

function addZoneRectsFallback(visualElements, zones, bgColor) {
  return zones
    .filter(zone => !visualElements.some(el => el.type === 'rectangle' && iou(el, zone) >= 0.3))
    .map(zone => ({
      id: `zone-rect-${zone.id}`,
      zoneId: zone.id,
      type: 'rectangle',
      label: zone.label,
      xPct: zone.xPct, yPct: zone.yPct,
      widthPct: zone.widthPct, heightPct: zone.heightPct,
      color: '#ffffff', bgColor,
      confident: true,
      _auto: true,
    }))
}

// mirrors electron/utils/assembleElements.ts — keep in sync
const TIME_PATTERN = /^\d{1,2}:\d{2}(:\d{2})?$/
const NAV_LABEL_RE = /left|right|arrow|turn|parking|brake|p_button|nav|direction/i
const LAMP_LABEL_RE = /headlight|lamp|light|indicator_dot|status/i
const PICTURE_LABEL_RE = /temp|thermometer|battery|sensor|icon_image|picture|logo|diagram/i
const INDICATOR_LABEL_RE = /indicator|lamp|led|dot|status_light|warning|signal/i

function promoteBottomIcons(elements) {
  return elements.map(el => {
    if (el.type !== 'icon') return el
    const label = String(el.label ?? '')
    const isLargeBottomControl = el.yPct >= 80 && el.widthPct >= 7 && el.heightPct >= 7
    const isLikelyNav = NAV_LABEL_RE.test(label)
    const isStatusLamp = LAMP_LABEL_RE.test(label)
    if (isLargeBottomControl && isLikelyNav && !isStatusLamp) {
      return { ...el, type: 'button-nav', _promoted: true }
    }
    return el
  })
}

function reclassifyFullScreenRect(elements) {
  return elements.map(el => {
    if (el.type !== 'rectangle') return el
    const isFullScreen =
      (el.widthPct >= 90 && el.heightPct >= 90) ||
      (el.xPct <= 2 && el.yPct <= 2 && el.widthPct >= 95 && el.heightPct >= 95)
    return isFullScreen ? { ...el, type: 'image-crop', _promoted: true } : el
  })
}

function reclassifySidebarIcons(elements) {
  return elements.map(el => {
    if (el.type !== 'icon') return el
    const label = String(el.label ?? '')
    if (el.xPct < 20 && el.heightPct >= 8 && PICTURE_LABEL_RE.test(label)) {
      return { ...el, type: 'image-crop', _promoted: true }
    }
    return el
  })
}

function reclassifySmallRectToIndicator(elements) {
  return elements.map(el => {
    if (el.type !== 'rectangle') return el
    const label = String(el.label ?? '')
    if (el.widthPct <= 8 && el.heightPct <= 12 && INDICATOR_LABEL_RE.test(label)) {
      return { ...el, type: 'indicator', _promoted: true }
    }
    return el
  })
}

function stabilizeRtc(elements) {
  if (elements.some(el => el.type === 'rtc')) return elements
  return elements.map(el => {
    const text = ((el.label ?? '') + ' ' + (el.value ?? '')).trim()
    const isTime = TIME_PATTERN.test(text) || TIME_PATTERN.test((el.label ?? '').trim())
    if (isTime && el.yPct < 25) return { ...el, type: 'rtc', _promoted: true }
    return el
  })
}

const visualElements = promoteBottomIcons(
  (s3a.elements ?? []).map(el => ({ ...el, type: el.type === 'container' ? 'rectangle' : el.type }))
)
const zoneRects = addZoneRectsFallback(visualElements, s2.zones ?? [], s1.bgColor ?? '#000000')
// z-order: zone-rect(배경) → visual elements (Stage3B 텍스트는 viz에서 생략)
const elements = stabilizeRtc(
  reclassifySmallRectToIndicator(
    reclassifySidebarIcons(
      reclassifyFullScreenRect([...zoneRects, ...visualElements])
    )
  )
)

console.log(`  zone-rects added: ${zoneRects.length}`)
console.log(`  elements (after post-process): ${elements.length}`)

// type summary
const typeCounts = {}
for (const el of elements) typeCounts[el.type] = (typeCounts[el.type] ?? 0) + 1
console.log('  types:', Object.entries(typeCounts).map(([t,n]) => `${t}:${n}`).join(', '))

// ── Build HTML ───────────────────────────────────────────────────────────────

const overlays = elements.map(el => {
  const color = TYPE_COLORS[el.type] ?? '#ffffff'
  const isAuto = el._auto === true
  const isPromoted = el._promoted === true
  const note = isAuto ? ' [zone-rect 자동삽입]' : isPromoted ? ' [icon→button-nav 승격]' : ''
  const label = `${el.id} ${el.type}${note}\n${el.label}`
  const badge = isAuto ? ' ★' : isPromoted ? ' ↑' : ''
  return `<div class="box ${isAuto ? 'auto-rect' : ''}" style="
    left:${el.xPct}%;top:${el.yPct}%;width:${el.widthPct}%;height:${el.heightPct}%;
    border-color:${color};
  " title="${label}">
    <span class="tag" style="background:${color};">${el.id}${badge} ${el.type}</span>
  </div>`
}).join('\n')

const legend = Object.entries(TYPE_COLORS).map(([type, color]) => {
  const count = typeCounts[type] ?? 0
  return `<div class="legend-item ${count === 0 ? 'missing' : ''}">
    <span class="swatch" style="background:${color}"></span>${type} (${count})
  </div>`
}).join('')

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Stage3A 결과 — ${basename(imgPath)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #111; color: #eee; font-family: monospace; }
h1 { padding: 12px 16px; font-size: 14px; background: #222; }
.container { position: relative; display: inline-block; }
img { display: block; max-width: 100%; }
.box {
  position: absolute;
  border: 2px solid;
  pointer-events: auto;
  cursor: default;
}
.box.auto-rect { border-style: dashed; opacity: 0.6; }
.box:hover { background: rgba(255,255,255,0.08); z-index: 10; }
.tag {
  position: absolute;
  top: 0; left: 0;
  font-size: 10px;
  padding: 1px 3px;
  color: #000;
  white-space: nowrap;
  opacity: 0.85;
  pointer-events: none;
}
.legend {
  padding: 12px 16px;
  display: flex; flex-wrap: wrap; gap: 8px;
  background: #1a1a1a;
}
.legend-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 3px 8px;
  background: #2a2a2a; border-radius: 4px;
}
.legend-item.missing { opacity: 0.35; }
.swatch { width: 12px; height: 12px; display: inline-block; border-radius: 2px; }
.info { padding: 8px 16px; font-size: 12px; color: #aaa; background: #1a1a1a; border-top: 1px solid #333; }
</style>
</head>
<body>
<h1>Stage3A 결과 — ${basename(imgPath)} | 요소 ${elements.length}개 | ${s1.resolution?.w}×${s1.resolution?.h}</h1>
<div class="legend">${legend}</div>
<div class="container">
  <img src="${imageDataUrl}" />
  ${overlays}
</div>
<div class="info">
  ${Object.entries(typeCounts).map(([t,n]) => `${t}: ${n}`).join(' &nbsp;|&nbsp; ')}
  &nbsp;|&nbsp; bgColor: ${s1.bgColor}
  &nbsp;|&nbsp; layout: ${s1.layout}
</div>
</body>
</html>`

const outPath = imgPath.replace(/\.[^.]+$/, '') + '-stage3a-result.html'
await writeFile(outPath, html, 'utf-8')
console.log(`\n결과 저장: ${outPath}`)
