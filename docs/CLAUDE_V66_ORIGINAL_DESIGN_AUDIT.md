# THE CAGE: Claude goalkeeper architecture audit

Date: October 31, 2026
Auditor: Claude Sonnet via locally installed Claude Code 2.1.316 (SKYNET)
Base audited: V6.5, feature/v65-war-room, commit 2035750
Audit mode: read-only, no source code changes or simulations.
Verdict: **APPROVE WITH CHANGES**.

## Claudes core findings (from source inspection)

### P0: Engine contract and old-game compatibility
- src/engine/tactical-match.js:13, src/cage-engine.js:239, and src/engine/legacy-v04.js:68 assume exactly 3 players per side; capabilities.js:7 and role duties anchor/link/spear are outfield-specific. Do NOT append goalkeeper IDs to config.teams.
- Use versioned config.keepers: [goalkeeperAId, goalkeeperBId], separate from outfield teams, with new version cage-t3-7. Preserve the V6.5 T3-6 engine unchanged in the historical engine registry.
- src/replay/records.js:9,28,54,58 validates three outfield players per side, six positions, save exhaustion cap 30, and three drafted players per side. src/tactics/evidence.js:4 and src/viewer/timeline.js:44 assume six player positions. Add version-gated GK IDs/positions, historical records remain untouched, and retain deterministic eventHash validation.
- Mid-match and draft save schema must gain a keeper-draft phase, private five-candidate offers, deadline and selected GK IDs without breaking legacy v60 hotseat or solo saves.

### P0: Shot outcomes and balance
- src/engine/tactical-match.js:32-35 currently has blocks followed by a single goal probability and a generic shot_miss, with reference odds already implicitly containing normal keeper quality. A second independent keeper save roll applied to successful goals would suppress scoring twice.
- Introduce a reference-keeper model. Adjust the original shot logit once by a bounded GK attribute effect; at reference skill the old goal probability is preserved. Resolve non-goal outcomes as wide, save, parry with recorded random rolls, plus lawful loose-ball rebounds.
- Add deterministic gk_save, gk_parry and gk_claim event types including keeper ID, chance and roll values. Rebounds and distribution cannot be invented by renderer code. Update recorded shots-on-target and keeper statistics.
- Maintain full regulation scoreline and Golden Goal ONLY when tied. New keeper suppression could cause too few goals and longer overtime. Add and test deterministic safety/fallback behavior rather than throwing an unrecoverable match error.

### Draft and CPU
- Preserve ABABAB for six outfield picks; start a separate private goalkeeper phase after trios are locked. Five GK offers, 10-second choices, no goalkeeper reroll at MVP, random timeout fallback, no repeats for the entire best-of-five.
- Blind picks should not reveal the opposing GK before both sides lock. Hotseat handoff must hide offers. CPU only evaluates its own five and already revealed picks, not the opponent GK pool.
- src/random-draft.js and src/cpu-draft.js require separate GK pick-count/offer handling. Do not repurpose 15-card outfield selection, which requires 15 candidates. New GK selection scoring must use only seven GK attributes, without match-engine access.
- Over five rounds, 10 unique GK picks are needed. Claude says 16 GKs is a practical minimum for a five-option offer near the end, and supports the proposed 25-30 for launch. **Additional mathematical correction:** if the two simultaneous five-card offers must be disjoint in the fifth round, eight keepers are already exhausted and ten distinct remaining candidates are needed: the theoretical minimum is 18, not 16. Recommend 25-30, with disjoint offers or a precisely defined overlap-resolution rule.

### Player identity, tier and gameplay feel
- Separate GK rating/OVR model from outfield's 17 skills; seven GK-specific dimensions: Reflexes, Positioning, Handling, One-on-One, Aerial Control, Distribution, Sweeping. Anchor TITAN/LEGEND/ELITE/STALWART/ACE on historical merit and their GK ratings on separate role-specific scale, never equate OVR ratings mechanically.
- Start each goalkeeper with **one GK-only class** such as Reflex Monster, Sweeper Keeper, Commander, Guardian, Distributor. Do not force a cross-family primary+secondary trait pair from the outfield class system.
- Render actual saves and parries in the 2D game from versioned recorded events, goal-line GK coordinates separate from six existing outfield positions, and condensed playback remaining near 45-60 seconds. Commentary must never invent a save.
- Use licensed/illustrated visuals rather than unlicensed photographs.

## Release gates to require
1. V6.5 and original Classic record hashes remain reproducible under frozen historical engines, including KO and full-regulation Golden Goal records.
2. All keeper IDs, event outcomes, save/parry distributions, on-target shots and keeper stats validate against the deterministic log and eventHash.
3. 25-30 GK cards with 7 attributes, valid OVR formula and one class each, no duplicates, no repeat choice across five rounds.
4. Browser tests for first/second GK offers, privacy, 10-second deadline, refresh without timer reset, auto-pick, exhaustion, serial/hidden hotseat and CPU fairness.
5. Paired-seed benchmark of reference GK versus no-change calibrated baseline, plus low/high GK extremes and heavy-defence combinations. Explicit bounds for goals per regulation and overtime duration must pass.
6. UI/replay tests for older six-marker records and new six-outfield-plus-two-keeper records; 45-60 second match view, reduced-motion safeguards and faithful goal cinematic.
7. Verify Windows/offline package integrity and full-showdown match/playback, historical saved games, and local CPU mode.

## Caveats
Claude inspected the principal engine, replay, draft, CPU and tactical modules, but explicitly did not fully read overall.js, roster-184.js, draft.html, renderer.js or all tests/viewer-v4 modules. No simulations were run during the audit. The line numbers above correspond to the audited V6.5 state and can change after implementation.

No implementation was authorized by this audit. Source code stays unchanged.
