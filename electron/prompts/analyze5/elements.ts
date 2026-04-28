export const STAGE3_MAX_TOKENS = 8192

export function buildElementsPrompt(stage1: string, stage2Zones: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.

Overview:
${stage1}

Screen zones:
${stage2Zones}

List every visible UI element with its position, size, colors, and semantic properties.
Return ONLY a JSON object. No markdown, no explanation.

{
  "elements": [
    {
      "id": "el-1",
      "type": "<indicator|gauge|arc-gauge|numeric|label|title|logo|icon|button>",
      "label": "<exact text visible in image, no translation>",
      "value": "<current displayed value as string, or null>",
      "unit": "<unit string or null>",
      "active": <true|false|null>,
      "dynamic": <true if this element shows real-time sensor/device data, false if it is fixed text or decoration>,
      "xPct": <left edge, 0–100, % of canvas width>,
      "yPct": <top edge, 0–100, % of canvas height>,
      "widthPct": <element width, 0–100, % of canvas width>,
      "heightPct": <element height, 0–100, % of canvas height>,
      "color": "<foreground/text hex color>",
      "bgColor": "<element background hex or transparent>"
    }
  ]
}

Rules:
- id: sequential el-1, el-2, ...
- Do NOT miss any visible element — scan every zone
- dynamic: true for live sensor values (temperatures, pressures, speeds, loads, voltages, status lamps) — false for logos, static labels, button text, titles
- xPct/yPct: top-left corner of element as % of full canvas
- widthPct/heightPct: must be > 0
- color and bgColor must have sufficient contrast
- label: copy exact text from image, preserve original language`
}
