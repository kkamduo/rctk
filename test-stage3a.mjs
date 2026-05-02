/**
 * Stage3A 출력 검증 스크립트
 * 사용: node test-stage3a.mjs <이미지경로>
 * 예:   node test-stage3a.mjs C:\Users\kkamd\Desktop\dciot.png
 */

import { readFile } from 'fs/promises'
import { extname } from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.bmp': 'image/bmp', '.webp': 'image/webp' }
const MODEL = 'gemini-2.5-flash'

async function geminiVision(imageData, mediaType, prompt, maxTokens, schema) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env')
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
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return text
}

// ── Prompts (inline, mirrors electron/prompts/analyze5/) ────────────────────

const OVERVIEW_PROMPT = `Analyze this HMI/LCD display screenshot.
Return ONLY a JSON object:
{
  "resolution": { "w": <width px>, "h": <height px> },
  "bgColor": "<dominant background hex>",
  "layout": "<brief one-line layout description>",
  "elementCount": <estimated total UI element count>
}`

function buildZonesPrompt(overview) {
  return `You are analyzing an industrial HMI/LCD display.
Overview: ${overview}
Divide the screen into 3-8 functional zones.
Return ONLY a JSON object:
{
  "zones": [
    { "id": "z1", "label": "<zone name>", "xPct": 0, "yPct": 0, "widthPct": 100, "heightPct": 20 }
  ]
}`
}

function buildElementsAPrompt(overview, zones) {
  return `You are analyzing an industrial HMI/LCD display screenshot.

Overview:
${overview}

Screen zones:
${zones}

TASK: Extract ALL non-text visual elements — every panel, box, button shape, gauge, indicator, icon, diagram, and graphical region.
This is a geometry-first pass. Text content is handled in a later stage.
Return ONLY a JSON object. No markdown, no explanation.

{
  "elements": [
    {
      "id": "a-1",
      "zoneId": "<zone id from Stage 2, e.g. z1>",
      "type": "<see allowed types below>",
      "label": "<snake_case English name, e.g. left_panel, nav_btn_home, engine_gauge>",
      "xPct": <left edge 0-100>,
      "yPct": <top edge 0-100>,
      "widthPct": <width 0-100>,
      "heightPct": <height 0-100>,
      "color": "<primary foreground hex, e.g. #00ff88>",
      "bgColor": "<background fill hex, e.g. #1a1a2e — use transparent if none>",
      "confident": <true|false>
    }
  ]
}

Allowed types:
- rectangle   : background panel, section box, border frame, separator, any solid-fill region
- button-nav  : navigation/touch button whose shape/bounds are visually distinct
- gauge       : horizontal or vertical progress bar / bar graph
- arc-gauge   : circular or arc-shaped meter / dial
- indicator   : status lamp, LED dot, on/off symbol
- icon        : small symbol, pictogram, status icon (not a photo or diagram)
- image-crop  : logo, machine diagram, schematic drawing, complex graphic — preserve as image
- rtc         : clock or date/time widget box

Detection order — extract large elements first, then smaller ones:
1. Full-screen background and main canvas fill
2. Header band, footer bar, sidebar panels
3. Large section boxes, grouped data panels, data cell backgrounds
4. Navigation bar and individual navigation buttons
5. Gauges, meters, progress bars, arc dials
6. Indicator lamps, status icons
7. Logos, machine diagrams, image regions

Critical rules:
- Even if text sits ON TOP of a button or panel, extract the button/panel shape as a separate element
- rectangle is the default type for any box, panel, frame, or background region
- Do NOT emit bare text labels — those belong in Stage B
- Each element needs its own bounding box covering the full visual shape (not just the text inside it)
- Minimum widthPct 3, heightPct 2
- zoneId must match one of the zone ids from Screen zones above
- id: sequential a-1, a-2, ...
- confident: false if the boundary is unclear or the element type is uncertain`
}

const ELEMENTS_A_SCHEMA = {
  type: 'object',
  properties: {
    elements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          zoneId:    { type: 'string' },
          type:      { type: 'string', enum: ['rectangle', 'button-nav', 'gauge', 'arc-gauge', 'indicator', 'icon', 'image-crop', 'rtc'] },
          label:     { type: 'string' },
          xPct:      { type: 'number' },
          yPct:      { type: 'number' },
          widthPct:  { type: 'number' },
          heightPct: { type: 'number' },
          color:     { type: 'string' },
          bgColor:   { type: 'string' },
          confident: { type: 'boolean' },
        },
        required: ['id', 'zoneId', 'type', 'label', 'xPct', 'yPct', 'widthPct', 'heightPct', 'color', 'bgColor'],
      },
    },
  },
  required: ['elements'],
}

// ── Main ────────────────────────────────────────────────────────────────────

const imgPath = process.argv[2]
if (!imgPath) { console.error('Usage: node test-stage3a.mjs <image-path>'); process.exit(1) }

const mime = MIME[extname(imgPath).toLowerCase()]
if (!mime) { console.error('Unsupported image type. Use jpg/png/bmp/webp'); process.exit(1) }

const buf = await readFile(imgPath)
const imageData = buf.toString('base64')
console.log(`\n[Image] ${imgPath} (${(buf.length / 1024).toFixed(1)} KB, ${mime})\n`)

console.log('── Stage 1: Overview ──────────────────────────────────────────')
const s1Raw = await geminiVision(imageData, mime, OVERVIEW_PROMPT, 2048)
console.log(s1Raw)
const s1 = JSON.parse(s1Raw)

console.log('\n── Stage 2: Zones ─────────────────────────────────────────────')
const s2Raw = await geminiVision(imageData, mime, buildZonesPrompt(s1Raw), 2048)
console.log(s2Raw)

console.log('\n── Stage 3A: Non-text Elements ────────────────────────────────')
const s3aRaw = await geminiVision(imageData, mime, buildElementsAPrompt(s1Raw, s2Raw), 6144, ELEMENTS_A_SCHEMA)
console.log(s3aRaw)

const s3a = JSON.parse(s3aRaw)
const elements = s3a.elements ?? []

console.log('\n── Summary ────────────────────────────────────────────────────')
const typeCounts = {}
for (const el of elements) typeCounts[el.type] = (typeCounts[el.type] ?? 0) + 1
console.log(`Total elements: ${elements.length}`)
for (const [type, count] of Object.entries(typeCounts)) console.log(`  ${type.padEnd(12)}: ${count}`)

const expectedTypes = ['rectangle', 'button-nav', 'gauge', 'arc-gauge', 'indicator', 'icon', 'image-crop', 'rtc']
const missing = expectedTypes.filter(t => !typeCounts[t])
if (missing.length) console.log(`\nMissing types (may be ok): ${missing.join(', ')}`)
else console.log('\nAll 8 non-text types present ✓')
