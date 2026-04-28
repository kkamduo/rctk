/**
 * Stage 4 — 좌표/색상 정밀 추출 (geminiVision, 4096 tokens)
 * 목적: 좌표·색상에만 집중, 다른 필드 없음
 */

export const STAGE4_MAX_TOKENS = 4096

export function buildCoordinatesPrompt(stage3ElementList: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.
These elements have been identified in the image:
${stage3ElementList}

For each element, estimate its position and colors. Return ONLY a JSON object. No markdown, no explanation.

{
  "elements": [
    {
      "id": "<sequential: el-1, el-2, ...>",
      "xPct": <left edge position, 0–100, % of canvas width>,
      "yPct": <top edge position, 0–100, % of canvas height>,
      "widthPct": <element width, 0–100, % of canvas width>,
      "heightPct": <element height, 0–100, % of canvas height>,
      "color": "<foreground/text hex color>",
      "bgColor": "<element background hex color, or 'transparent'>"
    }
  ]
}

Rules:
- Assign id sequentially: el-1, el-2, ... matching the order in the element list above
- xPct/yPct: position of the element's top-left corner as % of full canvas
- widthPct/heightPct: size as % of full canvas — must be > 0
- Elements must NOT overlap (adjust if needed)
- color: the primary foreground or text color of the element
- bgColor: background color of the element itself (not the canvas); use "transparent" if none
- color and bgColor must have sufficient contrast`
}
