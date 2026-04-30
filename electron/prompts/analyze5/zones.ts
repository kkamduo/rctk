/**
 * Stage 2 — 영역 분할 (geminiVision, 1024 tokens)
 * 목적: 좌표 없이 구역만 나누기
 * category: header | gauge-area | status-panel | button-group | footer | sidebar | other
 */

export const STAGE2_MAX_TOKENS = 2048

export function buildZonesPrompt(stage1Result: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.
Previous analysis summary:
${stage1Result}

Divide the screen into logical zones. Return ONLY a JSON object. No markdown, no explanation.

{
  "zones": [
    {
      "id": "z1",
      "category": "<header | gauge-area | status-panel | button-group | footer | sidebar | other>",
      "xPct": <left edge 0-100>,
      "yPct": <top edge 0-100>,
      "widthPct": <width 0-100>,
      "heightPct": <height 0-100>
    }
  ]
}

Rules:
- 3~8 zones maximum
- category: pick the single best-fit category from the list
- xPct/yPct: top-left corner of the zone (0~100)
- widthPct/heightPct: size of the zone (0~100)
- Zones may overlap slightly at borders — that is acceptable
- Total zone coverage should span the full screen`
}

export const ZONES_SCHEMA = {
  type: 'object',
  properties: {
    zones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          category:  { type: 'string' },
          xPct:      { type: 'number' },
          yPct:      { type: 'number' },
          widthPct:  { type: 'number' },
          heightPct: { type: 'number' },
        },
        required: ['id', 'category', 'xPct', 'yPct', 'widthPct', 'heightPct'],
      },
    },
  },
  required: ['zones'],
}
