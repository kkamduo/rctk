export const STAGE3B_MAX_TOKENS = 8192

export function buildElementsBPrompt(stage1: string, stage2Zones: string, stage3aResult: string): string {
  return `You are analyzing an industrial HMI/LCD display screenshot.

Overview:
${stage1}

Screen zones:
${stage2Zones}

Visual regions already extracted as image-crop (do NOT re-extract these):
${stage3aResult}

TASK: Extract UI components as container+children structure.
Each visible widget (gauge cell, status panel, value display) must be wrapped in a container.
Text/value pairs must NEVER appear as standalone elements — always as children of a container.
Do NOT extract graphical/image regions — those are already captured above.
Return ONLY a JSON object. No markdown, no explanation.

{
  "components": [
    {
      "id": "c-1",
      "zoneId": "<zone id from Stage 2>",
      "type": "container",
      "xPct": <left edge 0-100>,
      "yPct": <top edge 0-100>,
      "widthPct": <width 0-100>,
      "heightPct": <height 0-100>,
      "bgColor": "<background hex or transparent>",
      "children": [
        {
          "id": "c-1-label",
          "type": "label",
          "label": "<header text of this widget>",
          "xPct": <relative to full screen, 0-100>,
          "yPct": <relative to full screen, 0-100>,
          "widthPct": <0-100>,
          "heightPct": <0-100>,
          "color": "<hex>",
          "dynamic": false
        },
        {
          "id": "c-1-value",
          "type": "<numeric|gauge|arc-gauge|indicator|icon>",
          "label": "<displayed value or name>",
          "value": "<current value as string, or null>",
          "unit": "<unit or null>",
          "active": <true|false|null>,
          "dynamic": <true|false>,
          "xPct": <0-100>,
          "yPct": <0-100>,
          "widthPct": <0-100>,
          "heightPct": <0-100>,
          "color": "<hex>",
          "bgColor": "<hex or transparent>",
          "confident": <true|false>
        }
      ]
    }
  ]
}

Rules:
- id: containers are c-1, c-2, ... / children are c-1-label, c-1-value, c-1-unit, etc.
- zoneId on container only (not on children): must match a zone id from Screen zones
- Every visible widget must be a container — do NOT output bare text/numeric elements at top level
- children types: label | numeric | gauge | arc-gauge | indicator | icon (NO image-crop, NO container)
- All xPct/yPct/widthPct/heightPct are absolute screen percentages (0-100), even for children
- container bgColor: the panel/cell background color
- Minimum container widthPct 8, heightPct 6
- Do NOT re-extract any region already listed in the image-crop section above
- PRIORITY: zone boundary > visual coordinate — assign each container to the zone covering most of its area and keep its coordinates within that zone's boundaries
- Do NOT output components that cannot be assigned to any zone`
}

export const ELEMENTS_B_SCHEMA = {
  type: 'object',
  properties: {
    components: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          zoneId:    { type: 'string' },
          type:      { type: 'string' },
          xPct:      { type: 'number' },
          yPct:      { type: 'number' },
          widthPct:  { type: 'number' },
          heightPct: { type: 'number' },
          bgColor:   { type: 'string' },
          children: {
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
              required: ['id', 'type', 'label', 'xPct', 'yPct', 'widthPct', 'heightPct', 'color'],
            },
          },
        },
        required: ['id', 'zoneId', 'type', 'xPct', 'yPct', 'widthPct', 'heightPct', 'bgColor', 'children'],
      },
    },
  },
  required: ['components'],
}