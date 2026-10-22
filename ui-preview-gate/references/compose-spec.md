# compose.mjs spec

```json
{
  "out": "preview.png",
  "width": 375,
  "panels": [
    {
      "label": "Before (current)",
      "tone": "before",
      "image": "before.png",
      "boxes": [{ "x": 146, "y": 150, "w": 196, "h": 58 }],
      "note": "Option category shows as a tab"
    },
    {
      "label": "After",
      "tone": "after",
      "image": "after.png",
      "boxes": [{ "x": 0, "y": 150, "w": 375, "h": 58 }],
      "note": "Option-only category removed from tabs"
    }
  ]
}
```

- Paths are relative to the spec file.
- `width`: display width of every panel in px (default 375). A panel can override
  it, e.g. `"width": 864` for desktop.
- `sourceWidth`: CSS width the image was captured at (default: the panel width).
  Boxes are in CSS px of the capture and scale by `width / sourceWidth`, so a
  1280px desktop capture can be shown at 864px with its original coordinates.
- `boxes[].tone` overrides the panel tone; `boxes[].label` adds a small tag.
- `boxPadding`: px added around every box so borders do not cover the element's
  text (default 6; set at spec or panel level). On tightly stacked rows, prefer a
  `note` over `label` so tags do not cover neighbouring text.
- `boxes[].pad` overrides the padding for one box. Use `"pad": 0` with a small
  `h` (4-8px) to draw an insertion marker in the gap where something will be
  added (on before) or where something was removed (on after).
- `note` is an optional caption under the panel.
- `mockup: true` marks a panel as a mockup: the label gets a `MOCKUP` badge and
  the frame becomes dashed. Use it only under the `mockup-allowed` policy.
- `staged: "<how>"` marks a real capture of a screen the normal flow cannot
  reach (e.g. an earlier step disabled in code to open a dialog). It renders a
  `STAGED` banner on the panel.
- `caption` (spec level) is shown above both panels. Use it for the state shown
  and for any unavoidable difference between the two sides.

compose.mjs refuses to write the image (exit 2) when the spec breaks a rule:
not exactly 2 panels (one pair per image; one image per state), `boxPadding`
below 6, a `label` on a box shorter than 48px, or an amber box covering more
than 25% of the screen. Fix the spec instead of working around the check.

Tones: `before` red, `after` green, `mismatch` amber, `neutral` gray (no box
color change; use for an "unchanged" reference panel).

## Verification layout

Use the approved preview's after image and the new capture:

```json
{
  "out": "verify.png",
  "panels": [
    { "label": "Approved preview", "tone": "after", "image": "after.png", "boxes": [...] },
    { "label": "Actual", "tone": "after", "image": "actual.png", "boxes": [...] }
  ]
}
```

Add `{ "tone": "mismatch", ... }` boxes on the actual panel for differences.
