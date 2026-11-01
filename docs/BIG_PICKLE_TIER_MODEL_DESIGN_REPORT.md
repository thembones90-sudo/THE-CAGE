# Tier Model Visual Upgrade Report

Date: 2026-11-01
Task: improve the five reusable base card designs without changing the game or the existing card architecture.

## Summary

The ACE, STALWART, ELITE, LEGEND and TITAN templates now use separate depth, ornament, nameplate and flag-treatment layers instead of relying only on the original frame colours. Each tier has a distinct material language while the original frame geometry and neutral shirt remain unchanged.

The preview page now switches to a single readable column at phone widths, and the flag treatment uses a full-bleed nationality background plus a contained miniature flag seal so symbols are not cropped.

## Files Changed

Source files:

- `design/tier-models/ace.svg`
- `design/tier-models/stalwart.svg`
- `design/tier-models/elite.svg`
- `design/tier-models/legend.svg`
- `design/tier-models/titan.svg`
- `design/tier-models/index.html`
- `src/tier-card-models.js`

Deployed mirrors:

- `public/design/tier-models/ace.svg`
- `public/design/tier-models/stalwart.svg`
- `public/design/tier-models/elite.svg`
- `public/design/tier-models/legend.svg`
- `public/design/tier-models/titan.svg`
- `public/design/tier-models/index.html`
- `public/src/tier-card-models.js`

Report:

- `docs/BIG_PICKLE_TIER_MODEL_DESIGN_REPORT.md`

`design/tier-models/preview.js` was not changed. No roster, rating, draft, stat or game-mechanic files were changed. Nothing was committed or pushed.

## Tier Treatments

### ACE

- Archival paper body with offset backing and a soft drop depth.
- Registration/print layers, halftone and grain overlays, press-proof microtype and a serial stamp.
- Folded-corner treatment retained from the original frame.
- Runtime flag finish adds a warm print vignette, registration offsets and corner registration rings.

### STALWART

- Riveted copper plate with clipped corners and a recessed art window.
- Patina blooms, rivet heads, engraved corner arcs and stamped side rails.
- Runtime flag finish adds a dark forged border, rivet hardware, warm scuffs and brushed metal.

### ELITE

- Angular silver foil with asymmetric corner cuts.
- Precision grid, cyan hairline trim, prismatic edge highlights and technical microcopy.
- Runtime flag finish adds a fine grid, diagonal sheen, metallic edge and calibrated tick marks.

### LEGEND

- Arched gold medallion with a radial engraved field.
- Laurel leaves, jewel corner studs, guilloche-style rings and heritage medallion lettering.
- Runtime flag finish adds radial rays, gold arcs, laurel motifs and a soft medallion vignette.

### TITAN

- Sculpted dark prismatic relic with a pointed crown and layered armour.
- Crystal facets, spectral seams, side armour and scanline texture.
- Runtime flag finish adds prismatic edge light, crystal shards, glow and spectral scanlines.

## Shared Structure Preserved

The following were kept intact and checked against the pre-upgrade public copies:

- `data-part="frame"` serialization for all five tiers.
- `data-part="shirt"` serialization for all five tiers.

New visuals were added as sibling `card-depth`, `card-ornament`, `card-nameplate` and runtime finish layers. The original frame geometry and neutral shirt were not altered.

## Flag and Seal Behaviour

- The flag remains the roster nationality resolved by `src/national-flags.js`.
- The background layer uses the full local flag asset, scaled to cover the art window.
- A separate seal shows the complete flag with `preserveAspectRatio="xMidYMid meet"`, so emblem-bearing flags are not cropped.
- Seal colours are tier-specific; the seal is contained inside its border at desktop and mobile sizes.
- Long nationality labels use `textLength="225"` when needed; `POSITION · BOSNIA AND HERZEGOVINA` fits inside every card at 390 px.

## Responsive and Interaction Changes

`design/tier-models/index.html` now uses:

- 5 columns above 1200 px.
- 3 columns at 1200 px and below.
- 2 columns at 760 px and below.
- 1 centred column at 640 px and below, max-width 420 px.

Other changes:

- Captions now describe each tier's material treatment.
- `VIEW FLAG ONLY` hides both the shirt and its contact shadow.
- `VIEW IN GRAYSCALE` applies a grayscale filter to the rendered cards.
- Both controls update `aria-pressed`; the preview status uses `role="status"` and `aria-live="polite"`.
- Added a data-URI favicon to avoid a 404 in the preview.

## Verification

Passed:

```text
node tests/national-flag-models.cjs

FLAG_MAPPING_PASS 216 players; 53 nationality labels; 55 original SVG hashes; aliases and unknown fallback
FLAG_MODELS_PASS 280 country/tier pairs; same Italy flag and generic shirt; exact original frames and shirts; correct foreground order; native flag proportions; unique SVG references; local assets; safe unknown fallback; width 1418
```

Also passed:

```text
node --check src/tier-card-models.js
```

- All five SVGs parse as valid XML.
- Source and `public/` mirrors are byte-identical.
- The source and public preview pages both load without JavaScript errors.
- CDP audit at 1440 x 1000 and an emulated 390 x 844 viewport:
  - 5 cards rendered.
  - No horizontal overflow at 390 px (`scrollWidth` 390).
  - No text clipped outside a card.
  - No player-name stroke collisions.
  - No seal containment failures.
  - Flag-only toggle hides the shirt and contact shadow.
  - Grayscale toggle applies `grayscale(1)` and restores cleanly.
  - Long Bosnia and Herzegovina label stays inside every card.
- Baseline and final captures:
  - `work/tier-visual/baseline-desktop.png`
  - `work/tier-visual/baseline-mobile.png`
  - `work/tier-visual/final-desktop.png`
  - `work/tier-visual/final-mobile.png`
  - `work/tier-visual/final-desktop-flag-only.png`
  - `work/tier-visual/final-desktop-grayscale.png`

The baseline mobile capture used the old 2-column layout at 390 px. The final mobile capture is a 390 x 3745 single-column page.

Remaining audit warnings are not player-name collisions: they are enclosing plate borders intersecting text layout boxes and the font-metric overlap between the OVR placeholder dash and the OVR label. No player-name or nationality text is clipped.

## Limitations and Follow-up

- This environment cannot display screenshots for aesthetic review. Verification relied on DOM geometry, computed styles, file hashes, XML parsing and pixel statistics. The owner should review the final captures above for visual judgment.
- Real handset testing was not performed; 390 px was emulated through Chrome DevTools Protocol.
- Only Chrome was tested.
- The service-worker cache key was not changed. Existing installed clients may serve old cached tier assets until a hard refresh or cache-key bump.
- `tools/build-tier-card-models.py` still regenerates the SVGs and would overwrite these hand-authored visuals if run. It was not updated because it is outside the requested scope.
- `docs/NATIONAL_FLAG_BASE_MODELS.md` was not modified; this report records the upgrade separately.
