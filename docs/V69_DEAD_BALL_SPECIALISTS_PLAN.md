# THE CAGE V6.9 — DEAD BALL SPECIALISTS
## Implementation charter and acceptance gate

**Prepared:** 2026-10-31 on LEVIATHAN / SKYNET (Ryzen 7 9800X3D)
**Git branch:** `feature/v69-gk-set-pieces`
**Worktree:** `A:\THE CAGE V69 SET PIECES`
**Baseline:** `feature/v68-keepers-50`, commit `6cc81ba`
**Status:** PREPARATION ONLY. No set-piece feature activated or released.

### Objective
Allow select historical goalkeepers to take meaningful attacking set pieces in the 3 outfield + 1 goalkeeper mode, without damaging score integrity, outfield lineup size, replay reproduction, keeper positioning, match viewing time, or historical ratings.

### Football identity and owner rules
- **José Luis Chilavert**: fixed owner-approved career tier **LEGEND** with **STREET HERO**, **STREET VILLAIN**, **TALISMAN**. His current seven-attribute **90 GK OVR remains provisional** pending owner numerical review. **Do not promote to TITAN.**
- **Rogério Ceni**: an obvious second keeper set-piece specialist. His historical tier/grades remain provisional and unchanged until owner review.
- **All other 48 goalkeepers**: no automatically invented free-kick or penalty taking expertise.
- Existing **seven keeper attributes** only represent goalkeeping, especially **Distribution** for passing/restarts. Do **not** use Distribution as a proxy for dead-ball shooting.
- Add a new independent, explicit **`deadBall` profile** later with distinct free-kick and penalty skill values after historical audit and approval. Never silently alter the seven-goalkeeper-attribute OVR calculation or career tiers.
- Existing folklore labels remain separate from set-piece abilities. Being a TALISMAN does not confer a flat goal bonus.

### Current code audit (T3-10)
1. `src/engine/tactical-match.js`: `simulate({teams,tactics,seed,mode:'score',traits,keepers})` has two sets of **exactly three outfield footballer IDs**, plus two separate goalkeeper IDs.
2. Fouls from dribble/wall duels may emit `foul`; if `x>=2`, they emit `free_kick` then `shoot('fk')`. The existing taker is the outfielder with the best long-shot stat, not the goalkeeper.
3. `shoot(kind)` derives attacker attributes via `eff(sh,'long')`, assumes `carrier` is in the three-player outfield squad, and emits actor IDs in `shot_attempt`, `goal`, `gk_save` and `gk_parry`.
4. `src/replay/records.js` verifies `event.actor` belongs to the recorded **outfield** team; simply replacing the actor with Chilavert/Ceni would fail the replay contract.
5. `CageEngine.stats`, the renderer and commentary also distinguish three outfield actors from the separately owned GK identity. New event handling must not add a fourth outfielder.
6. The current simulation has **no standard penalty-award/penalty-kick event**. Do not invent a penalty action without corresponding rule/event evidence.
7. Historical T3-7, T3-8 and T3-9 use the immutable 30-keeper catalog; T3-10 uses the current 50-keeper catalog and stamps ratings identity. New gameplay requires a frozen T3-10 engine archive and an additive T3-11 replay route.

### Milestone implementation order

**Phase 1 — Set-piece identity & rules**
- Create an immutable `goalkeeperSetPieceProfile` registry, versioned independently from goalkeeper OVR.
- Eligible initial identities: `jose-luis-chilavert` and `rogerio-ceni`. No guessed numerical values in the preparation branch.
- Keep original three-player outfield arrays unchanged.
- A GK attempt is a temporary set-piece taker role. GK never becomes an extra player in normal possession.
- Add an explicit `gk_set_piece_decision` event with side, taker GK ID, kind, opportunity ID, and reason. No false attempts.

**Phase 2 — Direct free-kick goal resolution**
- Trigger ONLY from an actual `foul` and eligible attacking-zone `free_kick`.
- Derive the chance from new, audited FK-shooting skill, distance/zone, defensive pressure, and opposing goalkeeper skills; use an authoritative seeded RNG roll **once** per chance.
- Record `gk_free_kick` attempt and actual `goal` / `gk_save` / `gk_parry` / `shot_miss` with consistent shooter provenance.
- Extend replay validation for a goalkeeper shot actor without loosening validation for ordinary outfield events. Reject counterfeit GK attempts and ineligible takers.
- Attribute the scoring action to the goalkeeper in keeper stats, not a phantom outfield player.

**Phase 3 — Goal vacated / recovery**
- On a GK advancing for an attacking free kick, record a `gk_out_of_goal` or equivalent factual event.
- A genuinely failed attempt can trigger recorded positional vulnerability and a later recovery event. **No free goals** and no second save roll. One extra vulnerability event is not enough to score.
- The risk cannot survive indefinitely or pass to another round. It expires on return, legitimate restart or episode expiry and cannot silently affect no-GK matches.

**Phase 4 — Penalties as an explicit, separate rule**
- First introduce and test `penalty_awarded` with a grounded foul/location decision. Only then implement taking and saving.
- Penalty event evidence must identify referee decision, taker, goalkeeper, one seeded result, and official score.
- Avoid automatically granting a penalty just because a specialist keeper was drafted.
- Evaluate whether a separate penalty shootout mini-mode is desirable **only after** normal match-rule penalties are stable. Golden Goal still follows tied regulation rounds.

**Phase 5 — Pitch and commentary**
- Move the goalkeeping marker upfield on a logged keeper set piece and return it after a logged return/restart.
- Clearly show if the keeper has left his goal. No 3D rendering or invented player motion.
- Goal overlays credit Chilavert or Ceni by real GK identity. Historical commentary must not assign their goals to an outfielder.
- Preserve reduced-motion behavior and the **~45-second Dynamic** match viewing target.

### Hard acceptance checks before a playable V6.9 EXE
- **Zero changes** to non-GK T3-10 match event hashes for identical input/seed.
- **Zero changes** to historical T3-7/8/9 and frozen T3-10 replay hashes.
- Same 194 outfielders and 50 goalkeeper cards, same ABABAB 15-choice / 20-second outfield draft, same five-private-choice / 10-second GK draft, no repeats, best-of-five first to three.
- Original EXE and ZIP at `A:\THE CAGE LEVIATHAN\dist` remain untouched.
- No new tier or seven-stat GK numerical modification without owner review.
- Replays reject goalkeeper free kicks without a preceding valid foul/free-kick or with a tampered shooter, roll, outcome, identity, or rating version.
- Tests cover both eligible keepers, ordinary goalkeeper non-specialists, no-GK matches, saved showdown recovery, invalid event injection, goals, misses, saves, blocked shots, position return and overtime.
- Run the whole `tools/v66-experimental-gate.ps1` regression gate plus new V6.9 tests before building the unsigned EXE.
- Verify actual EXE launches and serves all required assets before publishing a separate Git branch and file archive. Do not merge to production automatically.

### Preflight gate for next development session
`node tests/v69-preflight.cjs` confirms the exact 50-GK / T3-10 / Chilavert baseline and reproducible replay, with **no new set-piece gameplay activated yet**.

### Next session's first coding objective
Implement the **versioned set-piece profile registry and event contract** with unit tests; integrate real GK free kicks only after the identity/replay invariants pass. Keep V6.9 feature off by default until the actual engine and browser tests are complete.
