# National flag backgrounds — five base models

Implemented 1 November 2026. Scope is the five reusable base templates, not individual player card art or football mechanics.

## Components

- `src/national-flags.js`: resolves a roster record's `country` or `nationality` to an explicit flag asset. Covers all 216 current outfield players and their 53 nationality labels. England, Scotland and Wales remain separate; Ireland aliases share the Irish flag. Explicit `Yugoslavia / modern nationality` records use the recorded modern suffix. Unknown or ambiguous nationalities receive the neutral base, not a guessed flag.
- `src/tier-card-models.js`: renders any of the existing five frames, then inserts the selected national flag and a separate tier-treatment layer behind the unchanged generic shirt and its shadow. Each SVG has isolated reference IDs. Uniform cover scaling preserves the original flag aspect ratio, clips edge overflow to the existing artwork window and never stretches the drawing.
- `assets/flags/`: 55 original SVG flag assets, locally bundled with source URLs, pinned upstream revision and SHA-256 hashes. Source: https://github.com/hampusborgos/country-flags . Complex emblems are retained from the source SVG, not redrawn approximately.
- `design/tier-models/index.html`: acceptance view. The same selected nationality and same generic shirt are displayed across all five tiers. Select another nationality to verify automatic switching. “View flag only” exposes original symbols beneath the shirt; grayscale is a separate optional comparison.

## Tier treatments

ACE uses faded paper and print grain; STALWART adds copper-panel recess and brushed texture; ELITE adds light foil reflections; LEGEND retains the ceremonial arch and gold edge; TITAN adds chamber illumination and spectral edge light. These finishes are separate from the original flag colours and geometry. The five frame architectures remain unchanged.

## Verification

- `node tests/national-flag-models.cjs`: passed mapping for 216 players / 53 labels, original asset hashes, aliases and safe fallback. Passed 280 nationality/tier combinations, exact original frame and shirt geometry, same-flag/same-shirt acceptance view, full artwork coverage, foreground order, native aspect ratios, local data embedding and unique SVG references.
- The complete 280-combination browser fixture also passed at an actual 390-pixel viewport. No horizontal overflow.
- Visually checked Italy across all five frames and Brazil's original symbols with the foreground shirt hidden. Checked Wales with the shirt visible on the phone layout.
- `node tests/v60-package-parity.cjs`: passed. Verified all flag and model source files against the generated offline package.
- Rebuilt `dist/TheCage.exe`; preserved `dist/TheCage-before-national-flags.exe`. The actual executable returned all 66 flag/model resources byte-identical to the tested package on temporary port 51932, then that temporary instance was stopped.

No ratings, tier assignments, roster records, balance parameters, game rules or match engine files changed. Main draft cards retain their previous presentation while these five base models are being refined.

Preview: http://127.0.0.1:51931/design/tier-models/index.html

After restarting the packaged executable, the same preview is available at `/design/tier-models/index.html` on the app's local origin.
