# THE CAGE: Owner Tier Decisions V1.7

**Date:** 31 October 2026
**Status:** Explicit owner-approved classification changes, not provisional scouting.

## Approved changes: LEGEND → ELITE

| Player | Previous tier | New tier |
|---|---|---|
| Hidetoshi Nakata | LEGEND | **ELITE** |
| Shunsuke Nakamura | LEGEND | **ELITE** |
| Ariel Ortega | LEGEND | **ELITE** |
| Robert Prosinečki | LEGEND | **ELITE** |
| Darko Pančev | LEGEND | **ELITE** |
| Alen Bokšić | LEGEND | **ELITE** |
| İlkay Gündoğan | LEGEND | **ELITE** |
| Miodrag Belodedici | LEGEND | **ELITE** |
| Safet Sušić | LEGEND | **ELITE** |
| Nwankwo Kanu | LEGEND | **ELITE** |

## Explicitly retained

- **Jay-Jay Okocha: LEGEND.** The owner expressly reversed the prior suggestion to demote him. This is a positive lock, not a pending review.
- **Park Ji-sung: LEGEND.** No owner-approved move.
- **Roy Makaay: LEGEND.** No owner-approved move.
- **Juan Carlos Valerón: ELITE** from the earlier confirmed correction, unaffected by this batch.
- All TITAN, STALWART and other LEGEND/ELITE classifications unchanged.

## Tier distribution after corrections

| Historical tier | Players |
|---|---:|
| TITAN | 30 |
| LEGEND | **69** |
| ELITE | **67** |
| STALWART | 18 |
| **Total** | **184** |

## What these decisions change

**Career-tier classification only.** They do not modify player ratings, calculated OVR, positional eligibility, aliases, nationality, folklore badges, TALISMAN club affiliations, primary/secondary traits, or tactical supplements. Career tier is a measure of historical exceptionality and is not a direct match-engine modifier.

The source of truth is `proposals/owner-tier-revisions-10-v17.json`. The generated, browser-loaded application overlay is `src/owner-tier-decisions-v17.js`. Both `index.html` and `draft.html` load it immediately after the complete 184-player roster and before card ratings. The T3 build includes the same overlay. Tests enforce the exact 10 changes and Okocha lock.

**Regenerate:** `node tools/build-owner-tier-overlay.cjs`, `node tools/build-t3.cjs`, `node tools/audit-roster.cjs`, `node tools/write-overall-report.cjs`.

**Regression:** `node tests/owner-tier-revisions-v17.cjs`. The test compares all player records before and after the overlay and refuses unauthorized tier changes or edits to player ratings, traits and folklore.
