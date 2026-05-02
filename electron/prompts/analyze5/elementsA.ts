/**
 * Stage 3A — 비텍스트 geometry 전용 추출
 * 목적: 화면의 모든 시각적 형태(패널, 버튼, 게이지, 아이콘 등)를 먼저 확보
 * 원칙: 텍스트가 위에 얹혀 있어도 뒤의 시각 형태는 반드시 추출
 * 순서: 큰 배경/패널 → 버튼/게이지/위젯 → 아이콘/로고
 */

export const STAGE3A_MAX_TOKENS = 6144

export function buildElementsAPrompt(stage1: string, stage2Zones: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.

Overview:
${stage1}

Screen zones:
${stage2Zones}

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

export const ELEMENTS_A_SCHEMA = {
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
