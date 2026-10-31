# THE CAGE V6.5: WAR ROOM + IRON AI 2.0 + REGULATION SCORING

Build date: 2026-10-31
Branch: feature/v65-war-room
Base: V6.4 IRON INTELLIGENCE, commit a07c892
Status: offline Windows preview candidate; not production-deployed.

## Major match-rule change

User-approved rule: match winner is the team that scores more goals during regulation. If tied, Golden Goal overtime begins and its next recorded goal wins.
- Regulation lasts 1,200 simulated seconds (20 simulated minutes); dynamic playback scales the recorded event timeline to a short viewing session.
- Regular scoring does NOT stop play; players restart from kick-off after each goal.
- A non-tied regulation score is final (e.g. 4-2).
- A tied regulation score triggers a logged `golden_goal_start` event; the first overtime goal is tagged `golden:true` and concludes the match.
- Real match records expose `regulationScore`, `regulationAt`, `regulationSeconds` and `decidedBy`, validated against the goal event log and replayed deterministically.
- Older `mode:'ko'` first-goal records remain replayable under their original semantics, without editing their result hashes. `mode:'timed'` remains available for legacy engine-analysis calls.
- HUD and cinematic distinguish regulation goals from actual overtime Golden Goals. Ordinary goals no longer prematurely announce a match winner.
- 194-player roster, attribute OVRs, match event probabilities, tactical params and best-of-five format are unchanged by the scoring-mode addition.

## THE WAR ROOM

Active drafter only:
- Select two of the current 15 cards to compare all 17 attributes, OVR and position roles.
- Show own trio composition and missing role families as factual indicators. This is not a projected winning percentage.
- Scouting requires no pick and keeps the 20-second timer running.
- Comparison state is erased on handoff. The CPU's pool is never rendered in the War Room.
- Optional class-counter guidance remains OFF by default.

## IRON AI 2.0

- Scouting heuristic uses all 17 attributes, position-specific weighting, complementary family traits and the already visible opposing draft.
- Casual stays random, Competitive has a small evaluation noise and Ruthless uses a sharper objective without access to match simulation.
- Tactical selection examines first touch, vision, composure, positioning, fatigue, passing and finishing, based on each locked trio.
- CPU still sees only its 15 legal candidates, obeys the same time, draft order, reroll and player-exhaustion restrictions, and has no match-engine outcome modifier.
- Old human hotseat saves remain recoverable.

## Balance study

`docs/V65_BALANCE_STUDY.json`: 8,000 simulations in regulation/Golden Goal mode, 4 different trio cohorts, 5 tactic pairings, 200 paired seeds per pairing mirrored by side.

Observed aggregate first-team win rates (each tactical pairing spans 1,600 simulations):
- Balanced versus Balanced: 64.6%
- Press versus Possession: 74.9%
- Possession versus Press: 55.4%
- Press versus Balanced: 63.7%
- Balanced versus Possession: 76.1%

**Interpretation:** differences between four fixed team matchups matter, so these are NOT universal tactic win rates. Relative to the 64.6% Balanced/Balanced baseline, changing only the *opponent* to Possession boosted the first team's win rate to 76.1%; this suggests that Possession is currently disadvantaged. Further balanced-team sampling and param-specific calibration is warranted before altering engine mechanics.

`docs/V65_CPU_BENCHMARK.json`: 90 common candidate-pool cohorts, 180 paired-side match simulations per difficulty against a fixed ELITE trio:
- Casual: 56.1% wins, mean OVR 88.18, complete D/M/F 28.9%.
- Competitive: 62.2% wins, mean OVR 91.69, complete D/M/F 100%.
- Ruthless: 62.8% wins, mean OVR 92.20, complete D/M/F 100%.
These descriptive samples support stronger drafting by difficulty but do not prove a statistically significant win advantage between Competitive and Ruthless.

## Acceptance gates

- `tests/v65-score-rules.cjs`: 240 deterministic multi-goal scoring rounds, checks regulation and overtime outcomes, real event-log score, record replay, past KO compatibility.
- `tests/v65-war-room.cjs`: desktop/mobile comparisons, 17 rows, no accidental selection, clear handoff, OFF counter hints.
- `tests/v65-cpu-quality.cjs`: descriptive CPU cohort benchmark and scouting grade.
- `tests/v65-package-contract.cjs`: offline parity and ordered script imports.
- Inherited Golden Goal, five-round, T3 traits, Class/folklore, saved-game, old Classic and replay regression tests.
- Full suite runner `tools/v65-release-gate.ps1`: **33/33 automated suites PASS** and `tools/build-t3.cjs --check` PASS (1,198,144 calibrated trios).

## Windows artifact verification

- `dist/TheCage-V65-WarRoom-Regulation-Preview.exe`: 110,273,536 bytes.
- SHA256: `A69695F18FDB9B87297136AFD6F0F7BCCBEFFF12CE11C681308AA83D10199CE5`.
- Single-executable server smoke: **12/12 HTTP routes PASS**. Both gameplay entry points, 194-player T3 engine and draft bundle, War Room, CPU 2.0, score/replay validator, Golden Goal presentation, historical Classic player and cache are present.
- Web/SEA distribution contains 141 offline assets.
- Windows executable remains unsigned; Node SEA injection reports a signature warning, but the 12 bundled HTTP resources and 33 regression suites were independently checked.

## Release notes

Changes remain in the isolated `A:\THE CAGE V65 WAR ROOM` worktree. No original checkout or deployed site is overwritten. Windows EXE is unsigned. Independent Claude sign-off unavailable with expired API credentials; release evidence is from unit/browser/paired-seed/packaging checks.
