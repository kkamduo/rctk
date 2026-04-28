/**
 * Stage 5 — JSON 조합 (geminiChat, 8192 tokens)
 * 목적: 이미지 없이 Stage1~4 텍스트 합산 → 완전한 DisplayConfig JSON
 */

export const STAGE5_MAX_TOKENS = 8192

export function buildAssemblePrompt(
  stage1: string,
  stage2: string,
  stage3: string,
  stage4: string
): string {
  return `You are assembling a complete DisplayConfig JSON from structured analysis data.
No image is available — work purely from the text below.
Return ONLY the final JSON object. No markdown, no explanation.

=== STAGE 1 — Overview ===
${stage1}

=== STAGE 2 — Zones ===
${stage2}

=== STAGE 3 — Elements (type/label/value/unit/active) ===
${stage3}

=== STAGE 4 — Coordinates & Colors (id/xPct/yPct/widthPct/heightPct/color/bgColor) ===
${stage4}

Output this exact structure:
{
  "name": "<screen name from stage1 layout description>",
  "width": <integer from stage1 resolution.w>,
  "height": <integer from stage1 resolution.h>,
  "bgColor": "<hex from stage1 bgColor>",
  "elements": [
    {
      "id": "<from stage4 id, e.g. el-1>",
      "type": "<from stage3>",
      "xPct": <from stage4>,
      "yPct": <from stage4>,
      "widthPct": <from stage4>,
      "heightPct": <from stage4>,
      "label": "<from stage3>",
      "value": "<from stage3, or '0' if null>",
      "unit": "<from stage3, or '' if null>",
      "color": "<from stage4>",
      "bgColor": "<from stage4>",
      "active": <from stage3, or false if null>,
      "dynamic": <true if type is numeric|gauge|arc-gauge|indicator, else false>,
      "confident": <true if type was clearly identifiable, else false>
    }
  ]
}

Merge rules:
- Match stage3 elements to stage4 elements by sequential order (both lists are in the same order)
- dynamic: true for numeric, gauge, arc-gauge, indicator — false for label, title, logo, icon, button
- confident: false only if the element type was genuinely ambiguous in stage3
- value: never null in output — use "0" for gauges, "" for labels if no value present
- unit: never null in output — use "" if no unit
- active: never null in output — use false if not an indicator
- All elements must be present — do not drop any from stage3/stage4`
}
