# THE CAGE — collectible card design

Implemented 1 November 2026 in the existing random draft.

## Presentation

- ACE: cream printed paper, double-rule art frame.
- STALWART: copper border and diagonal engraving.
- ELITE: silver frame and icy geometric facets.
- LEGEND: gold frame and engraved sunburst.
- TITAN: dark body, prismatic border and geometric foil artwork.

Tier uses the authoritative careerTier value, independently of overall rating. Role colours and the existing primary-trait glyph identify playing style. Illustrated shirts are original generic artwork, not player portraits or club kit representations. The design adds no rarity odds, collection economy or stat bonuses.

The existing card builder was extracted into src/draft-cards.js. It preserves names, six headline attributes, all 17 scouting attributes, folklore, traits, natural positions, accessible draft labels and separate scout/compare controls. src/random-draft.js retains the draft state and actual claim actions. design/sticker-cards.css owns the new presentation. Quick View hides the illustrated artwork and preserves its compact function.

## Verified

- node tests/sticker-cards.cjs: all 216 roster entries, five distinct materials, exact names/OVR/ratings/styles, long-name fit, no horizontal overflow, disclosures and comparison isolated from claiming, correct claim action, unchanged input records and Quick View. Headless Chrome's measured widths were 1418, 678 and 512 pixels; its requested 390-pixel window is clamped by Chrome.
- The same complete 216-card audit ran in visible Chrome at an actual 390-pixel viewport and passed. No page overflow in normal or Quick View.
- Actual phone draft: 15 rendered candidates, correct tier variants, no horizontal overflow, Quick View hides artwork.
- node tests/v65-war-room.cjs: full scouting, two-player comparison, no accidental claim and handoff privacy passed.
- node tests/v64-cpu-browser.cjs: casual, competitive and ruthless complete solo draft / 3+1 / replay checks passed. Updated its stale 194-player expectation to the approved 216-player roster; the initial failure was that obsolete count.
- node tests/v60-package-parity.cjs: source/public byte parity passed, including the new JS and CSS files.
- Rebuilt dist/TheCage.exe after validating the package output directory. Previous executable preserved as dist/TheCage-before-sticker-cards.exe.
- Actual executable on temporary port 51929 returned byte-identical draft.html, src/draft-cards.js, design/sticker-cards.css and src/random-draft.js; its HTML includes the current approved 216-player loader. Stopped only that temporary executable after the check.

The package builder's console summary still labels its roster as 194; the loaded roster and executed card checks contain 216. No player records, tiers, ratings or engine rules were changed by this visual work.

## Preview

Source app: http://localhost:51928/draft.html

Five-tier comparison with additional role/style samples: http://127.0.0.1:51928/work/sticker-cards/gallery.html

The gallery and exhaustive visual audit are development fixtures under ignored work/, not production game modes. The previous goal-net and match-presentation improvements are preserved. This change styles the outfield cards shown in the owner's reference; the separate goalkeeper card design remains its existing edition.
