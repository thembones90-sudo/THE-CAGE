# THE CAGE: ELITE OVR V2.1, Owner-Approved Implementation

**Date:** 31 October 2026
**Status:** APPROVED, IMPLEMENTED, VERIFIED

## Decision

The complete 67-player ELITE OVR proposal was accepted. Its historical OVR targets are now displayed on all ELITE cards in the main showdown and the random draft.

- **67/67** exact approved OVR values.
- **24** increased, **31** decreased, **12** unchanged compared with the accepted V2 draft.
- **Four ELITE peaks rated 90+:** Adriano **91**; Bernardo Silva, Rúben Dias and Robert Pirès **90**.
- **117 non-ELITE players retained their source attributes and ratings.**
- Career tier totals remain **30 TITAN / 69 LEGEND / 67 ELITE / 18 STALWART**.
- Jay-Jay Okocha remains **LEGEND**; Valerón remains **ELITE at 87**.

## How the approved numbers are produced

This is an **attribute-level** recalibration. The accepted target OVRs are recorded in `proposals/ELITE_OVR_67_APPROVED.json` together with the precise original and revised prime stats. The generated `src/elite-ovr-approved-v21.js` applies those changes after natural-position mapping but before `src/overall.js`.

The same source updates are included in T3 calibration and the rebuilt match engine. The updated inputs can change game simulation results, as expected. **The overall rating itself remains a display-only statistic**. No individual OVR number is hardcoded into the calculator.

- **Alex de Souza:** raw and displayed OVR both **86**. His prime attributes were recalibrated downward to keep him clearly within ELITE rather than LEGEND/TITAN territory; no individual OVR override is used.
- **Siniša Mihajlović:** primary position corrected from **LB to CB**, with **LB / CDM** alternatives; 85 formula OVR. This follows the accepted positional review.
- **Trent Alexander-Arnold:** remains RB with CM alternative. An **Inverted playmaker** fullback archetype was added generically to both left-back and right-back calculations. After slight input refinement, his formula OVR is **88**. No other TITAN or LEGEND was changed by that archetype.
- **Safet Sušić:** 89 OVR, with technique and creation adjusted while retaining excellent vision.
- **Shunsuke Nakamura:** 86 OVR, with his signature shooting unchanged.
- **Darko Pančev:** 88 OVR, with his signature 99 finishing unchanged.
- **Robert Pirès:** 90 OVR after reassessing his wide-creative abilities.

## Formula and audit safeguards

The formula now has **27 positional archetypes** over **12 positions**, still derived from **14 independent prime attributes**. No player gets a reputation, folklore, nationality or career-tier bonus. All 67 targets are checked against the live formula, not simply taken from the target file.

The full before/after numerical data is in `proposals/ELITE_OVR_67_APPROVED.json`. The draft remains at `proposals/ELITE_OVR_67_REVIEW_DRAFT.json` for historical comparison.

## Rebuild and tests

Reproduce the game overlays with `node tools/build-elite-ovr-overlay.cjs` and `node tools/build-t3.cjs`. Rebuild reports with `node tools/audit-roster.cjs` and `node tools/write-overall-report.cjs`.

Key tests: `tests/elite-67-approved-ovr.cjs` verifies all 184 players, exactly 67 approved targets, the 117 unselected players, the separate tier hierarchy, and zero OVR overrides. Legacy historical regression tests now verify only explicitly approved changes, protecting other player data. The showdown, random draft, and T3 deterministic tests also pass.
