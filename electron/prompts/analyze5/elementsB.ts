/**
 * Stage 3B — 텍스트/값 보강 전용
 * 목적: Stage 3A가 잡은 비텍스트 요소 위에 올라가는 label/numeric/title만 추가
 * 원칙: Stage 3A 요소를 덮어쓰거나 삭제하지 않는다
 *       비텍스트 형태(rectangle/button-nav/gauge 등)는 여기서 다시 뽑지 않는다
 */

export const STAGE3B_MAX_TOKENS = 8192

export function buildElementsBPrompt(stage1: string, stage2Zones: string, stage3aResult: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.

Overview:
${stage1}

Screen zones:
${stage2Zones}

Non-text visual elements already extracted in Stage A (DO NOT re-extract these shapes):
${stage3aResult}

TASK: Extract ONLY text and value elements — labels, numeric displays, titles, and unit annotations.
Do NOT extract any shape, panel, box, button background, gauge body, or icon. Those are already captured above.
Return ONLY a JSON object. No markdown, no explanation.

{
  "texts": [
    {
      "id": "b-1",
      "zoneId": "<zone id from Stage 2>",
      "type": "<label | numeric | title>",
      "label": "<the visible text content>",
      "value": "<current numeric value as string, or null>",
      "unit": "<unit string, or null>",
      "xPct": <left edge 0-100>,
      "yPct": <top edge 0-100>,
      "widthPct": <width 0-100>,
      "heightPct": <height 0-100>,
      "color": "<text color hex>",
      "dynamic": <true if this shows a live sensor value, false if static>,
      "confident": <true|false>
    }
  ]
}

Allowed types:
- label   : fixed descriptive text (channel name, axis label, section heading)
- numeric : numeric value display — include value and unit fields
- title   : screen or panel title, large header text

Critical rules:
- Extract text elements only — no shapes, no panels, no backgrounds
- Do NOT re-emit any element whose bounding box matches a Stage A element
- Each text element covers only the text glyph area, not the surrounding panel
- id: sequential b-1, b-2, ...
- zoneId must match one of the zone ids from Screen zones above
- Minimum widthPct 2, heightPct 1`
}

export const ELEMENTS_B_SCHEMA = {
  type: 'object',
  properties: {
    texts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          zoneId:    { type: 'string' },
          type:      { type: 'string', enum: ['label', 'numeric', 'title'] },
          label:     { type: 'string' },
          value:     { type: 'string' },
          unit:      { type: 'string' },
          xPct:      { type: 'number' },
          yPct:      { type: 'number' },
          widthPct:  { type: 'number' },
          heightPct: { type: 'number' },
          color:     { type: 'string' },
          dynamic:   { type: 'boolean' },
          confident: { type: 'boolean' },
        },
        required: ['id', 'zoneId', 'type', 'label', 'xPct', 'yPct', 'widthPct', 'heightPct', 'color'],
      },
    },
  },
  required: ['texts'],
}
