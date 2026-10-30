# THE CAGE · experimental 15-trait preview status (2026-10-30)
Owner asked Claude and REAL Big Pickle to develop a functional behavior-only trait engine.

## Claude specification
proposals/traits/CLAUDE_TRAIT_SPEC.md (628 lines, complete). It calls for H1-H8 positioning/engagement/action/receiver hooks, deterministic behavior, zero RNG additions, replay integrity and full statistical gates.

## Opt-in preview currently included in uncommitted source
- src/tactics/traits.js: 15 trait names, pure action weights/defensive engagement/receiver preference, primary 1.0 and secondary 0.5.
- src/engine/tactical-match.js: guarded simulate({traits:{enabled:true}}) hooks. Default is OFF. No user-interface switch and no replay mode integration.
- tools/build-t3.cjs bundles the module, rebuilt src/cage-engine.js; Windows EXE unchanged.
- No raw ratings, duel/shot probability formulas, fatigue, RNG definitions, or legacy engine changed.

## Verified
- proposals/traits/baseline-139.cjs --check: 500 seeded full T3 matches match their frozen event hashes/draws/durations exactly with traits off.
- proposals/traits/mechanics-contract.cjs: all 15 traits have at least one behavioral choice trigger; 100 untraited-only matches have exact event-hash and RNG parity with traits on; no reads of legacy role/stats.
- proposals/traits/preview-smoke.cjs: 75 matches with traits on repeat deterministically; 72 differ from off baseline; 78/139 players have traits, 61 do not.
- node tests/engine-guards.cjs: PASS; engine generation built 437,989 tactical trios.

## Major gaps before full release
- This lightweight preview is NOT Claude's complete H1-H8 implementation: defensive pursuit/cover target-cell movement, off-ball cuts, commitment and accurate trait activation telemetry are not yet built. Do not claim completion of the full 15-trait engine.
- Acceptance tests for primary/secondary half-strength, full 2,000-seed parity, probability invariants, counterplay, trait equity and composition balance still need implementation.
- A player who advances from a rest position must be marked committed for counters; currently this is unaddressed by the preview's Libero carry option.
- The 61 unassigned existing players need owner-approved trait pairs before fair activation in live mode.
- T3 recovery R1-R6 is still not integrated. Claude recommends balancing that first and then re-testing traits against the recovery stack.

## Big Pickle task
REAL Big Pickle (opencode/big-pickle) was invoked with its own isolated assignment BIG_PICKLE_TRAIT_TASK.md. It must write only under proposals/traits/big-pickle, and may independently implement fuller hooks and test harness. No agent code is considered verified until it exists and its tests pass.

## Safety
No commit, push, exe rebuild or deployment. All work currently local; default gameplay remains legacy/T3 unchanged unless explicit simulate({traits:{enabled:true}}) is passed.

## Update: REAL Big Pickle isolated implementation completed and verified
OpenCode Zen `opencode/big-pickle` finished successfully. It produced under `proposals/traits/big-pickle/`: `trait-hooks.js` (all 15 H1-H8 behaviors, movement/target/engage/weight/receiver/commitment hooks and telemetry), `engine-harness.cjs` (anchor checked in-memory integration), `tests.cjs` (28 tests), and `REPORT.md` (full reproduction instructions). All 28 tests passed on direct rerun. Independent `proposals/traits/independent-big-pickle-check.cjs` confirmed 500 identical OFF full results plus 75 deterministic ON matches showing 75 changed event streams and telemetry. The frozen 500-match production baseline and reproducible T3 bundle build check also passed. This is a successfully functioning **research prototype**, not a released/published game feature. Its full H1-H8 movement hooks live only in isolated in-memory patched game; default source has the earlier limited opt-in trait preview and does not include this full implementation. Still missing release/equity study, 61 approved trait pairs, and T3 R1-R6 recovery. No executable rebuild or Git commits.
