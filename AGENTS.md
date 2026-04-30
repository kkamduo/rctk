# RCTK Agent Guide

## Current Mission

Extract every non-text visual element from an industrial HMI/TFT screenshot with at least 90% position and size fidelity against the source image.

Text recognition is not the priority for this mission. Text may be detected later, but it must not reduce the accuracy of non-text element geometry.

## Definition Of Non-Text Elements

Treat these as in scope:

- Background panels, section boxes, borders, separators, rectangles
- Icons, logos, diagrams, machine drawings, cropped image regions
- Gauges, progress bars, meters, indicators, lamps
- Navigation or touch buttons where the button shape/bounds matter
- RTC/time widgets as a widget bounding box, even if the displayed characters are text

Treat these as out of scope for the 90% geometry target:

- Plain text labels
- Numeric value text
- Header/title text without a visual container
- OCR content accuracy

## Accuracy Target

Use the source image canvas as the coordinate authority.

- Preserve the detected canvas width and height from the image whenever possible.
- Store element geometry in `xPct`, `yPct`, `widthPct`, and `heightPct`.
- A non-text element is considered matched when its bounding box reaches IoU >= 0.90 against the source element, or when center and size errors are each within 3% of the canvas if IoU is not available.
- The feature is done when at least 90% of non-text elements in a representative sample pass the match rule.

## Implementation Direction

1. Prioritize Stage 3A/visual extraction for non-text geometry.
2. Detect large containers and backgrounds before smaller child controls.
3. Keep text extraction separate from visual element geometry.
4. Do not collapse visual containers into text elements.
5. Do not let `rectangle`, `image-crop`, `icon`, `gauge`, `arc-gauge`, `indicator`, `button-nav`, or `rtc` fall back to generic text export.
6. Compare generated output against real TFT samples, especially `hansin_test/260331_V1.3.3/monitor.tft` and the latest `hansin_test/0430_03` sample.

## Files To Check First

- `electron/prompts/analyze5/elementsA.ts`
- `electron/prompts/analyze5/elementsB.ts`
- `electron/prompts/analyze5/coordinates.ts`
- `electron/prompts/analyze5/assemble.ts`
- `src/types/display.ts`
- `src/components/display/ElementRenderer.tsx`
- `src/utils/exporter.ts`
- `docs/non-text-geometry-90.md`

## Rules For Future Agents

- Before implementing, read `docs/non-text-geometry-90.md`.
- Keep changes scoped to the extraction, geometry, rendering, export, or validation path.
- If adding a new element type, update type definitions, renderer, editor panel labels, TFT export, and validation notes together.
- If build fails because of unrelated legacy Electron test files, report it clearly and still verify the touched path as far as possible.
