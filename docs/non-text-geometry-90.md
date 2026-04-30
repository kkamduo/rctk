# Non-Text Geometry 90% Extraction Plan

## Goal

RCTK must extract all non-text visual elements from an HMI/TFT screenshot with at least 90% position and size fidelity.

The immediate objective is not perfect OCR. The immediate objective is that panels, buttons, diagrams, icons, gauges, indicators, and other visual objects appear in the same place and at the same size as the source image.

## Why This Matters

VisualTFT screens are expensive to reproduce manually because most of the work is placing visual components accurately. If RCTK can recover non-text geometry reliably, text can be corrected later through chat or manual editing. Incorrect geometry, however, makes the generated screen feel wrong even when labels are close.

This project therefore treats non-text geometry as the base layer of screen reconstruction.

## Scope

### In Scope

- Page background and main canvas size
- Solid panels, grouped sections, containers, rectangles
- Borders, separators, frame lines
- Machine diagrams and large graphical regions
- Logos, icons, symbols, status lamps
- Gauges, meters, progress bars, bar graphs
- Touch/navigation button bounds
- RTC/time widgets as a rectangular UI object
- Cropped image regions that should be preserved as graphics

### Out Of Scope For This Target

- OCR correctness
- Exact text label wording
- Exact numeric values
- Font family matching
- Text-only labels without a surrounding visual object

Text elements can still be present in the final `DisplayConfig`, but they are excluded from the 90% non-text geometry score.

## Accuracy Definition

Use source image coordinates as the ground truth.

For each non-text element:

- Convert `xPct`, `yPct`, `widthPct`, `heightPct` into pixel coordinates using the detected canvas size.
- Compare the generated bounding box with the reference bounding box.
- Preferred metric: IoU >= 0.90.
- Fallback metric: center error <= 3% of canvas size and width/height error <= 3%.

Overall pass condition:

- At least 90% of reference non-text elements pass the per-element match rule.
- No major visual category is completely missing. For example, the screen cannot pass if all icons or all navigation buttons are absent.

## Element Classification Rules

### Non-Text Types

These types count toward the geometry target:

- `rectangle`
- `image-crop`
- `icon`
- `indicator`
- `gauge`
- `arc-gauge`
- `button`
- `button-nav`
- `rtc`
- future diagram/image/container types

### Text Types

These types do not count toward the non-text geometry target:

- `label`
- `title`
- plain text-only `numeric` labels when the visual object is only text

When a numeric value is inside a visible panel, button, gauge, or display box, score the containing visual object, not the text glyphs.

## Pipeline Direction

### Stage 1: Canvas Authority

The image resolution must drive the canvas size.

Required behavior:

- Detect source image width and height.
- Set `DisplayConfig.width` and `DisplayConfig.height` from the source when available.
- Avoid falling back to `480x320` when the source is clearly different.

### Stage 2: Coarse Region Detection

Detect major non-text regions first:

- Header band
- Left/right panels
- Central diagram area
- Bottom navigation bar
- Large grouped boxes

The output should favor full visual region bounds over tight text bounds.

### Stage 3A: Visual Element Extraction

This is the most important stage for the current mission.

Rules:

- Extract non-text visual objects only.
- Include exact bounding boxes.
- Prefer `rectangle` for panels and boxes.
- Prefer `image-crop` for logos, machine diagrams, and complex graphics.
- Prefer `indicator`, `gauge`, `arc-gauge`, `button-nav`, and `rtc` for recognizable widgets.
- Do not emit text-only labels here.

### Stage 3B: Text And UI Detail

Text detail is secondary.

Rules:

- Add text elements only after visual geometry is stable.
- Never replace a visual panel with a text element.
- If text is inside a button or panel, preserve the button/panel geometry separately.

### Stage 4: Coordinate Normalization

All final elements must use percentage geometry:

- `xPct`
- `yPct`
- `widthPct`
- `heightPct`

Coordinates must be derived from source pixel boxes and source canvas dimensions.

### Stage 5: Assembly And De-Duplication

Assembly should preserve visual layer order:

1. Background rectangles and panels
2. Cropped images and diagrams
3. Gauges, indicators, buttons, RTC widgets
4. Text overlays

Do not remove a non-text element just because a text element overlaps it.

## Export Requirements

The TFT export path must preserve non-text types:

- `rectangle` -> TFT `rectangle`
- `button-nav` -> TFT `button` with `switch`
- `rtc` -> TFT `rtc`
- `gauge` -> TFT `progress`
- `arc-gauge` -> TFT `meter`
- `indicator` -> TFT `animation` or closest supported visual type
- `image-crop` -> image asset reference in ZIP/TFT flow

Fallback to generic `text` is not allowed for non-text types unless the type is explicitly text-only.

## Validation Work

Add or maintain a validation path that can answer:

- How many non-text reference elements exist?
- How many generated non-text elements matched?
- Which categories were missed?
- Which elements failed because of position error?
- Which elements failed because of size error?
- Which elements fell back to `text` during export?

Recommended validation output:

```text
nonTextTotal=32
matched=29
matchRate=90.6%
meanIoU=0.93
missingCategories=[]
textFallbackFailures=[]
```

## Priority Order

### P0: Make Geometry Reliable

- Strengthen visual extraction prompts.
- Preserve source canvas size.
- Ensure rectangles, image crops, icons, gauges, indicators, buttons, and RTC widgets are generated as non-text types.
- Prevent text fallback in export.

### P1: Add Repeatable Validation

- Build a small comparison script for reference boxes versus generated boxes.
- Start with `hansin_test/260331_V1.3.3/monitor.tft` and `hansin_test/0430_03`.
- Report IoU, center error, and size error.

### P2: Improve Chat Correction

- Allow commands such as "move the diagram 5px right" or "resize the bottom nav buttons to match the source".
- Keep these corrections tied to existing element IDs.

### P3: Improve Text After Geometry

- Once non-text geometry is stable, improve OCR, font, labels, and numeric values.

## Done Criteria

This mission is complete when:

- A representative screen reaches at least 90% non-text element match rate.
- The generated display uses the source image canvas size.
- Non-text types remain non-text in editor state and TFT export.
- A future Codex or Claude Code session can read this file and continue without re-discovering the goal.
