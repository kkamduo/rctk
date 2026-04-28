/**
 * Stage 2 — 영역 분할 (geminiVision, 1024 tokens)
 * 목적: 좌표 없이 구역만 나누기
 * category: header | gauge-area | status-panel | button-group | footer | sidebar | other
 */

export const STAGE2_MAX_TOKENS = 1024

export function buildZonesPrompt(stage1Result: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.
Previous analysis summary:
${stage1Result}

Divide the screen into logical zones. Return ONLY a JSON object. No markdown, no explanation.

{
  "zones": [
    {
      "id": "z1",
      "name": "<short descriptive name>",
      "rough_position": "<top | top-left | top-center | top-right | center | center-left | center-right | bottom | bottom-left | bottom-right | full>",
      "category": "<header | gauge-area | status-panel | button-group | footer | sidebar | other>"
    }
  ]
}

Rules:
- 3~8 zones maximum
- Do NOT include any coordinates or pixel values
- rough_position: describe where this zone sits on screen
- category: pick the single best-fit category from the list
- name: short English label like "top header bar", "main gauge cluster", "alarm status panel"`
}
