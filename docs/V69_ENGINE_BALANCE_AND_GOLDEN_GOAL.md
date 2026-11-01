# THE CAGE V6.9: Match Engine Before Set Pieces

**Prepared on LEVIATHAN (Ryzen 7 9800X3D), 2026-10-31**
**Branch:** `feature/v69-engine-balance`
**Base:** `feature/v68-keepers-50` @ `6cc81ba`
**Status:** Experimental match engine pass. DEAD-BALL SPECIALISTS ARE ON HOLD.

## Decision

Improve core engine fairness, scoring reliability and tactical balance **before** goalkeeper free kicks, penalties or new traits. This branch does not implement any set-piece specialists, change goalkeeper rankings, or alter the 194 outfielder / 50 goalkeeper roster.

## Baseline audit

- `tools/v69-engine-balance.cjs` / `docs/V69_ENGINE_BASELINE_BALANCE.json`: 1,536 simulated matches in T3-10 with starting side swapped but with tactics tied to each roster. **This is not a controlled tactic fairness study.**
- `tools/v69-controlled-tactics.cjs` / `docs/V69_ENGINE_CONTROLLED_TACTICS.json`: 1,920 additional matches (40 seeds × two roster/tactic assignments × two starting sides per team/tactic pairing, across 12 pairings). Controls for team identity and starting side.
- On the controlled comparison, Press versus Possession won **70.6%** for mixed sides, **51.9%** for creator-heavy sides and **72.5%** for all-defender sides. This suggests an archetype-dependent tactical imbalance, not a universal press advantage.
- Overall scoring across initial T3-10 archetypes: creator-heavy matches about **11–12 goals**; mixed sides about **4–7**; three-defender sides about **1.0–1.3** per 20-minute simulated regulation plus possible overtime. Their shot-quality and possession dynamics require dedicated review.
- The historical first cohort includes **no new player or GK attribute calibrations**.

## Fixed in experimental engine T3-11

1. **Fair Golden Goal kickoff.** If regulation is tied, T3-11 records `golden_goal_start`, then immediately records a seeded `restart` with reason `golden_kickoff`, ball zone x=0 and an impartial random starting side. No team carries an almost-complete regulation attack into sudden death.
2. **Universal late Golden Goal pressure.** The already tested `golden_goal_pressure` adaptation now applies both with and without keeper mode; previously no-GK games had no late-stall pressure escalation.
3. **Original T3-10 frozen.** `src/cage-engine-v610.js` is the exact generated old T3-10, loaded and registered for historic replay. All older engines T3-9/8/7/6/Classic remain untouched.
4. **Version-aware replay support.** T3-11 is added to allowed goalkeeper-aware replay versions while the original GK50 catalog and historical GK30 snapshots are preserved.

## Deterministic target tests

- `tests/v69-golden-kickoff.cjs` checks 380 paired seeded simulations across mixed/defender archetypes, with/without keepers, 121 Golden Goal starts, including 55 in no-GK. Each Golden Goal starts at a recorded x=0 kickoff. There are **27 no-GK prolonged-pressure events**.
- The older T3-10 engine stalled once on those inputs. T3-11 stalled **zero times**. A finite sample is not a mathematical guarantee that the 100-minute safety limit can never occur.
- **259 regulation-decided matches** were byte-identical at the event-hash level between archived T3-10 and T3-11.
- All archived T3-10 replays and new T3-11 replays reproduce from their seeds and rating catalogs.
- Full historical engine/CPU/draft/viewer suite: `tools/v66-experimental-gate.ps1` plus the new Golden Goal test.

## Risks, limits and next actions

1. **P1 Tactic calibration:** quantify and rebalance Press/Possession/Counters across mixed, creator and defender compositions. Prefer an isolated parameter sweep and varied trios, not a universal punishment for pressing.
2. **P1 Role balance:** attackers score an order of magnitude more goals per match than defense-only trios; check if the differences are intentional and how duty commitment/recovery functions. Make midfielders matter without hidden flat boosts.
3. **P1 Overtime finish:** the 100-minute safety throw is still theoretically possible. Never invent an arbitrary Golden Goal winner. Stress the engine and preserve transparent bounded replay-safe failure behavior.
4. **P2 Shot/rebound comparability:** non-GK `shot_miss` routes to rebound while keeper-on misses mostly restart. Do not compare cross-mode scoring without acknowledging these materially different possession chains.
5. **P2 Statistics quality:** no-GK `onTarget` currently counts goals as on-target, understating saves/on-target attempts. Address in separate versioned engine change.
6. **Keeper set pieces:** deferred per user's explicit instruction. Do NOT implement until engine mechanics are approved.

## How to use

- **Experiment worktree:** `A:\THE CAGE V69 ENGINE`
- **Original V6.8 playable baseline:** `A:\THE CAGE LEVIATHAN` remains untouched.
- **Prior V6.9 set-piece *plan only*:** `A:\THE CAGE V69 SET PIECES` remains untouched.
- Run `node tests/v69-golden-kickoff.cjs` and `powershell -NoProfile -ExecutionPolicy Bypass -File tools/v66-experimental-gate.ps1` before accepting a new Windows build.
