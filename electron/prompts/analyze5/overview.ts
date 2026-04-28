/**
 * Stage 1 — 전체 파악 (geminiVision, 512 tokens)
 * 목적: 해상도 감지, 배경색 확정, 대략적 UI 구조 파악
 */

export const STAGE1_MAX_TOKENS = 512

export const OVERVIEW_PROMPT = `You are analyzing an industrial HMI/LCD display screenshot.
Return ONLY a JSON object. No markdown, no explanation.

{
  "resolution": { "w": <integer>, "h": <integer> },
  "bgColor": "<dominant background hex, e.g. #1A1A2E>",
  "layout": "<one short English phrase describing top-level zones, e.g. 'header + 3 arc-gauges + status panel + bottom buttons'>"
}

Rules:
- resolution: estimate pixel dimensions from UI density and aspect ratio
- bgColor: the single most dominant background color of the entire screen
- layout: describe only the major structural zones, not individual elements`
