export const STAGE3A_MAX_TOKENS = 4096

export function buildElementsAPrompt(stage1: string, stage2Zones: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.

Overview:
${stage1}

Screen zones:
${stage2Zones}

TASK: Extract ONLY graphical/visual regions — logos, background images, icon artwork, button shapes with visual complexity.
Do NOT extract text, numbers, gauges, or simple LEDs.
Return ONLY a JSON object. No markdown, no explanation.

{
  "elements": [
    {
      "id": "a-1",
      "zoneId": "<zone id from Stage 2 zones, e.g. z1>",
      "type": "image-crop",
      "label": "<snake_case English description e.g. logo_icon, brake_button, warning_icon>",
      "xPct": <left edge 0-100>,
      "yPct": <top edge 0-100>,
      "widthPct": <width 0-100>,
      "heightPct": <height 0-100>,
      "color": "#ffffff",
      "bgColor": "transparent",
      "confident": <true|false>
    }
  ]
}

Rules:
- id: sequential a-1, a-2, ...
- Only include: logos, company branding, machine diagrams, schematic drawings, decorative artwork that contains NO readable text
- Do NOT include: button backgrounds with text on them, gradient panels with labels, any region where text is overlaid
- For button/panel backgrounds → Stage B will handle them with bgColor styling
- Simple colored rectangles or solid backgrounds → skip
- Minimum widthPct 8, heightPct 6
- All elements must have type "image-crop"
- zoneId: must match one of the zone ids from Screen zones above
- Do NOT output elements that cannot be assigned to any zone`
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
          type:      { type: 'string' },
          label:     { type: 'string' },
          xPct:      { type: 'number' },
          yPct:      { type: 'number' },
          widthPct:  { type: 'number' },
          heightPct: { type: 'number' },
          color:     { type: 'string' },
          bgColor:   { type: 'string' },
          confident: { type: 'boolean' },
          zoneId: { type: 'string' },
        },
        required: ['id', 'type', 'label', 'xPct', 'yPct', 'widthPct', 'heightPct', 'color', 'bgColor','zoneId'],
      },
    },
  },
  required: ['elements'],
}
