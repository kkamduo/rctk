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
- rectangle   : background panel, section box, border frame, separator, any solid-fill or gradient region
- button-nav  : navigation/touch button whose shape/bounds are visually distinct — use this for ANY large tappable arrow, back/forward chevron, or screen-switch button
- gauge       : horizontal or vertical progress bar / bar graph / linear meter
- arc-gauge   : circular or arc-shaped meter / dial / speedometer
- indicator   : status lamp, LED dot, small on/off symbol (typically < 3% width)
- icon        : small pictogram or symbol that is NOT a tappable button (thermometer, battery icon, light symbol)
- image-crop  : company logo, machine diagram, schematic drawing, complex multi-color graphic
- rtc         : any widget that displays a live clock or date — look for HH:MM or YY-MM-DD patterns

Detection order — MUST follow this order, large to small:
1. Full-screen background fill (rectangle — always include this)
2. Header band at top (rectangle)
3. Footer / bottom navigation bar (rectangle)
4. Left sidebar or data panel (rectangle)
5. Right sidebar or gauge panel (rectangle)
6. Large navigation buttons: arrow left, arrow right, back, home, P-button (button-nav)
7. Gauges, progress bars, arc dials (gauge / arc-gauge)
8. Indicator lamps, LED status dots (indicator)
9. Small icon symbols: thermometer, battery icon, light symbols (icon)
10. Company logo, diagram, complex graphic region (image-crop)
11. Clock / datetime display box (rtc)

Critical rules:
- You MUST emit at least one rectangle for the overall background
- You MUST emit at least one rectangle for any visible header or footer band
- rtc for any visible HH:MM clock display — even if it looks like text, mark it rtc
- Even if text sits ON TOP of a button or panel, extract the shape as a separate element
- Do NOT emit bare text labels — those belong in Stage B
- Each element bounding box must cover the full visual shape
- Minimum widthPct 3, heightPct 2
- zoneId must match one of the zone ids from Screen zones above
- id: sequential a-1, a-2, ...
- confident: false if the boundary is unclear

button-nav classification rules (IMPORTANT):
- Any arrow (←, →, ◀, ▶), chevron, or directional symbol in the bottom navigation area → button-nav
- Any large gear-shift / drive-mode letter (D, R, N, P) displayed as a tappable element → button-nav
- Any P (parking), back, home, or page-switch symbol in the footer zone → button-nav
- Size threshold: if a symbol is wider than 5% of screen width AND taller than 5% of screen height AND located in the lower 30% of the screen → button-nav, NOT icon
- Small indicator lights, headlight symbols, warning icons (typically < 4% width) → keep as icon`
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
