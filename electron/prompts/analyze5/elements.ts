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
      "type": "<indicator|gauge|arc-gauge|numeric|label|title|logo|icon|button|image-crop>",
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
      "confident": <true if you are certain about this element's type/position, false if ambiguous>
    }
  ]
}

Rules:
- id: sequential el-1, el-2, ...
- Do NOT miss any visible element — scan every zone
- dynamic: true for live sensor values (temperatures, pressures, speeds, loads, voltages, status lamps) and status icons (alarm, warning, run/stop indicators) — false for logos, decorative icons, static labels, button text, titles
- xPct/yPct: top-left corner of element as % of full canvas
- widthPct/heightPct: minimum heightPct 6, minimum widthPct 8 — do not create elements smaller than this
- color and bgColor must have sufficient contrast
- label: copy exact text from image, preserve original language
- confident: false if the element is blurry, occluded, ambiguous type, or you are guessing
- type "image-crop": use for:
  (a) logos, company branding, background images or patterns
  (b) ANY icon that appears as rendered graphic artwork — thermometer drawings, battery graphics,
      arrow graphics, headlight icons, brake icons, warning icons, instrument graphics, symbol images.
      Key test: if the icon has visual complexity (gradients, detailed shape, multiple colors, drawn artwork)
      or is clearly a pixel-rendered image rather than a single text character → image-crop
  Set label to a short snake_case English description (e.g. "thermometer_icon", "battery_icon", "left_arrow_icon", "brake_icon")
  Do NOT use image-crop for: simple circle/square LEDs (→ indicator), plain text or numeric values (→ label/numeric),
      single Unicode-style symbols like ▶ ⚙ ← (→ icon), horizontal bar gauges (→ gauge), arc gauges (→ arc-gauge)`

}
export const ELEMENTS_SCHEMA = {
  type: 'object',
  properties: {
    elements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          type:      { type: 'string' },
          label:     { type: 'string' },
          value:     { type: 'string' },
          unit:      { type: 'string' },
          active:    { type: 'boolean' },
          dynamic:   { type: 'boolean' },
          xPct:      { type: 'number' },
          yPct:      { type: 'number' },
          widthPct:  { type: 'number' },
          heightPct: { type: 'number' },
          color:     { type: 'string' },
          bgColor:   { type: 'string' },
          confident: { type: 'boolean' },
        },
        required: ['id', 'type', 'label', 'xPct', 'yPct', 'widthPct', 'heightPct', 'color', 'bgColor'],
      },
    },
  },
  required: ['elements'],
}
