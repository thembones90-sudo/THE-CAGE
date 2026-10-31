# THE CAGE V6.7 — Goalkeeper Scouting / T3-9 Experimental

**Date:** 2026-10-31
**Branch:** feature/v67-gk-cards
**Base:** feature/v66-gk-dynamics (ca8de1a)
**Status:** Experimental. No production merge or silent goalkeeper ratings/tier changes.

## Agent contributions and provenance

**Qwen:** Local Ollama `qwen3.5:9b` produced the initial ~7.2 KB industrial-underground keeper selection stylesheet (`design/qwen-v67-gk-cards.css`). The generated draft included inaccurate selectors (`#gk-pool`), a five-stat rather than seven-stat grid, and a non-existent PRO tier. Integration corrected those items, added `design/qwen-v67-integration.css`, and wired a dedicated DOM-safe keeper-card component `src/keeper-card-ui.js`. Five candidates remain private in the existing same-device handoff flow.

**Claude:** Sonnet completed a read-only audit of the actual 30-player roster, seven goalkeeper stats, five role classes and the T3-8 engine, then supplied prioritized historical suggestions and two engine concerns. Claude did not modify files. Its exact historical judgments were not externally checked. A separate final diff audit was requested after implementation.

## What changed

1. **Responsive keeper cards:** all seven ratings displayed as individual values, tier and class, overall score, short specialty description and accessible selection label. Layout adapts from five columns to one. Existing private five-card pool, ten-second timer, optional counter hints OFF and 194 outfield player draft remain unchanged.
2. **T3-9 failed sweep carries risk:** after a completed through ball beats an attempted goalkeeper sweep, the keeper can be out of position briefly. If the attacker attempts a shot within the next two tactical steps, the logged goal probability receives a +0.52 logit exposure term. There is no free goal, no extra goal roll, and exposure clears on shot, turnover or restart. This affects keeper-mode games only.
3. **Historical replay archive:** `src/cage-engine-v68.js` freezes T3-8 before the new mechanic. The T3-7 and T3-6 archives and Classic v0.4 are retained. The generated registry dispatches all five versions.
4. **Keeper ratings identity:** `CageGoalkeepers.RATINGS_VERSION='gk30-v66-provisional-20261031'`. T3-9 match records carry and validate a `keeperRatingsVersion` so future editorial changes cannot silently masquerade as compatible records. The 30 card values and all career tiers are unchanged.
5. **Sound and cinema:** original pitch, commentary and optional audio unaffected. Historical keeper events still derive from the match log.

## Tests
- `powershell -ExecutionPolicy Bypass -File tools/v66-experimental-gate.ps1`: **21/21 suites PASSED**, reproducible generated T3-9 with 1,198,144 outfield combinations.
- `tests/v67-sweep-exposure.cjs`: 7 pinned historical T3-8 match hashes; 100 experimental matches containing 930 failed sweep events, 306 exposed shot attempts and 196 exposed shot resolutions; 50 non-GK comparison matches preserve identical T3-8/T3-9 hashes. Replay keeper ratings marker rejects forgery.
- Existing browser: five-card offer, 7 attributes/tier labels/ARIA, CPU concealment, best-of-five, 10 GK exhaustion, save recovery, 45-second dynamic viewer, historic Classic and v0.4 hash parity, and exact offline bundle parity.
- Paired sample `docs/V67_SWEEP_RISK_PAIRED.json`: 90 starting seeds each across 4 archetype/pair combinations and 2 engine versions (720 simulations). Mixed-team scoring changed modestly: Buffon/Neuer 5.93→6.13 and Higuita/Campos 6.71→6.87 goals per match; samples are not proof of universal balance.

## Claude historical audit, owner approval REQUIRED

These are **proposals only**, not changes:

| Goalkeeper | Proposed review | Reason |
|---|---|---|
| Buffon | Sweeping 87 → 81 | More box/line-oriented than aggressive high-line keeper |
| Dino Zoff | Aerial 91 → 86 | Aerial rating may overstate his strongest qualities |
| Fabien Barthez | Sweeping 92 → 88 | Distinguish frequency/risk from success rate |
| Oliver Kahn | Aerial 92 → ~88 | Secondary attribute, review era and style |
| Dida | Positioning 90 → 87, 1v1 93 → 90 | Balance exceptional peaks against inconsistency |
| Chilavert | Distribution 95 → ~90 | Separate set-piece shooting from distribution |
| Handanovic | Class Guardian → Reflex Monster | Penalty/shot-stopping emphasis |
| Alisson, Oblak, Donnarumma, Reina | Tier review only | Borderline historical classification requires owner decision |

**No numeric changes and no tier promotions/demotions were made.** Career tiers are *historical distinction*, not an OVR-based automatic label. OVR overlaps are expected and do not justify silently making ELITE players LEGEND.

## Unresolved release risks
- Hotseat privacy is a courtesy screen, not cryptographic secrecy: a local user with browser developer tools can inspect saved cards. Proper secrecy needs trusted server authority. Encoding localStorage does not fix that.
- A rare overtime safety throw is still theoretically possible. Browser has four bounded, replay-recorded seed retries. No sampled T3-9 defensive match hit the cap.
- Further goalkeeper animations, keeper-ball rebound continuity and match calibration may be worth separate work.
- Updated goalkeeper ratings need **historical rating archives and replay dispatch**, not just a marker, before any owner-approved roster edit.
- This build is unsigned and local. Do not deploy publicly until independent post-integration audit and owner review.

## Play
The Windows EXE is built with `build-exe/build-v67.ps1`. Enable the optional **3+1 goalkeeper mode** in the draft intro. The original T3-8 EXE is preserved separately.
POST-AUDIT: UTF-8 draft restored from ca8de1a; exact T3-8 archive restored; 21/21 regression suites and 12/12 EXE smoke routes passed. No third Claude re-signoff.
