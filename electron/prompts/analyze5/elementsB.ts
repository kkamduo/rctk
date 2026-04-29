export const STAGE3B_MAX_TOKENS = 8192

export function buildElementsBPrompt(stage1: string, stage2Zones: string, stage3aResult: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.

Overview:
${stage1}

Screen zones:
${stage2Zones}

Visual regions already extracted as image-crop (do NOT re-extract these):
${stage3aResult}

TASK: Extract ONLY text labels, numeric values, gauges, indicators, and arc-gauges.
Do NOT extract graphical/image regions — those are already captured above.
Return ONLY a JSON object. No markdown, no explanation.

{
  "elements": [
    {
      "id": "b-1",
      "type": "<indicator|gauge|arc-gauge|numeric|label|title|icon>",
      "label": "<exact text visible in image, no translation>",
      "value": "<current displayed value as string, or null>",
      "unit": "<unit string or null>",
      "active": <true|false|null>,
      "dynamic": <true if real-time sensor/device data, false if fixed text>,
      "xPct": <left edge 0-100>,
      "yPct": <top edge 0-100>,
      "widthPct": <width 0-100>,
      "heightPct": <height 0-100>,
      "color": "<foreground hex>",
      "bgColor": "<background hex or transparent>",
      "confident": <true|false>
    }
  ]
}

Rules:
- id: sequential b-1, b-2, ...
- Do NOT use type "image-crop"
- dynamic: true for live sensor values, status lamps, gauges — false for logos, static labels, titles
- Minimum widthPct 8, heightPct 6
- label: copy exact text from image, preserve original language
- CRITICAL — bounding box: xPct/yPct/widthPct/heightPct must be the FULL visual widget container boundary (including background panel, border, padding), NOT a tight bounding box around the text characters only. Include the surrounding display panel or cell that visually contains the element.`
}

export const ELEMENTS_B_SCHEMA = {
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
