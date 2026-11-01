# THE CAGE: 2D Classic Viewer V1, implementation report

**Author:** Claude Code, 2026-10-30. **Scope honoured:** new files only, under `src/viewer/`, `tests/viewer/`, plus `viewer.html` and this report. No engine, `index.html`, `src/showdown.js`, roster, tactics, dependency, executable or git changes. Nothing has been committed or pushed. **T3 is not promoted, and the engine is not declared accepted.**

## Created paths

| Path | Purpose |
|---|---|
| `src/viewer/coords.js` | V1.1. Cell to `(u,v)` mapping. Team frame to world, mirroring `CageSpatial.world`. The zone frame for defender-emitted events (`press`, `foul` and `block` are written in the carrier's frame). Pitch fit and pixel mapping |
| `src/viewer/layout.js` | V1.2. Within-cell slot templates for 1–6 players. The carrier takes the central slot; defenders go goal-side and the challenger sits beside the carrier. Stable tiebreak. Seeded jitter of at most 0.04 cell. `hash32` and broadcast labels |
| `src/viewer/timeline.js` | V1.3. Pure `buildTimeline(record, cfg)`. Also `playersAt`, `ballAt`, `clockAt`, `scoreAt`, `schedule` (commentary to τ) and `hash` |
| `src/viewer/clock.js` | V1.4. Playback state machine: play, pause, resume, seek, speed (Full, Dramatic, Dynamic, Fast, Instant). Dynamic condensation of safe build-up. Goal replay at 0.5× Full. `end` fires once per live mount |
| `src/viewer/renderer.js` | V1.5. Canvas 2D arena (placeholder art, faint recorded 4×3 grid), six markers, possession ring, contact ring, dimmed out-of-position players, ball with lift and shadow, trail, goal flash |
| `src/viewer/viewer.js` | V1.6. `CageViewer.mount(el, record, opts)` returns a controller `{play, pause, resume, toggle, seek, setSpeed, replayGoal, destroy, on}` with events `beat`, `goal`, `end` and `replayEnd` |
| `src/viewer/viewer.css` | Responsive shell (desktop split, tablet/mobile stack, sticky controls, 44 px touch targets), token variables, reduced motion |
| `src/viewer/fixture-default.js` | Built-in recorded fixture (seed 42, Maldini/Ballack/Ronaldo vs Ronaldinho/Rivaldo/Del Piero). **Generated** by `tests/viewer/make-fixture.cjs` (see Verification) |
| `viewer.html` | V1.7. Standalone offline page. Loads only local scripts. Imports a record, a `{record}` wrapper or a saved showdown (with a round picker), by button or drag-and-drop. Falls back to the built-in fixture. Shows a record verification badge (`CageRecords.validate`, read-only) |
| `tests/viewer/harness.cjs` | Loads modules into `vm` contexts. In the viewer context, `Math.random`, `Date` and `performance.now` are booby-trapped |
| `tests/viewer/make-fixture.cjs` | Developer tool that writes `tests/viewer/fixtures/t3-schema1-seed42.json`, `v04-seed42.json` and `src/viewer/fixture-default.js` from the current engines |
| `tests/viewer/invariants.cjs` | Shared invariants: six positions, clock never ahead or backwards, T-V4, T-V5, score from goal events, golden goal |
| `tests/viewer/timeline.test.cjs` | T-V1/I1, I5, I6, T-V4, T-V5, T-V6, goal score, schema-1/schema-2/future-schema/v0.4/bare-result tolerance, layout determinism, build time |
| `tests/viewer/clock.test.cjs` | T-V2/I2, I3, I4 (no double finish after replay, restart or instant), replay window and rate, speed ordering, segment events |
| `tests/viewer/static.test.cjs` | T-V3 static guards: no `simulate(`, no randomness or wall clock in pure modules, no `p`/`roll` reads, no event-log writes, no remote URLs, all local script files exist |
| `tests/viewer/contract.test.cjs` | V0.2 C1 (carrier at zone) and C3 (receiver at `to`, interceptor at turnover zone) on fresh T3 matches. Runs the full viewer invariants on every match and measures build time on the longest |
| `tests/viewer/run-all.cjs` | Runs all four test files in separate processes |

## How the event log becomes animation

- **One segment per recorded event**; the viewer never adds, drops or reorders events. If simulation time advanced, the segment moves the clock linearly over `[t_prev, t]`. Zero-time consequences (turnover, race, block, rebound, foul, free kick, recovery, rotation) are **presentation holds with the clock frozen**. The goal and the kickoff get a frozen-clock tail. The clock therefore never runs ahead of the current event and never runs backwards.
- **Beats:** grouped by `step` when present (schema 2). Otherwise the §C.1 heuristic is used and labelled "approximate timing" on screen.
- **Players:** each segment eases from the previous event's layout to this event's recorded snapshot. Receivers arrive by phase 0.85, before the ball lands at 1.0. On duels and presses, the challenger closes to 0.35 cell of the carrier at the contact frame (phase 0.7) and then eases back to his recorded cell.
- **Ball:** possession-aware pieces (attached to a player, or in flight to a player or a point):
  - pass: to the receiver's final point;
  - interception: stops at the path point nearest the interceptor, who then collects at the turnover;
  - wall pass: off the nearest side board, with no invented partner;
  - press and tackle won: squirts to the defender;
  - shot: to an inferred aim point (goal inside the mouth, miss outside or off the post, then the wall);
  - block, then loose ball, then rebound winner.
- **Race (through ball):** `defender_recovers` does **not** change possession, because the engine keeps the receiver as carrier. The viewer follows the engine, not the architecture table's wording.
- **Score:** only from `goal` events, ticked at the moment the ball reaches the net. A mismatch with the recorded `result.score` is reported, never "fixed". The showdown score is shown separately: the tally **before** the round, read from a saved showdown file, labelled read-only. A bare record shows "NOT IN FILE". The viewer never computes or writes showdown state.
- **Commentary:** the existing `CageCommentary.commentate` lines over the same events, scheduled to τ, with a hide toggle. If that module is unavailable, plain event-log lines are used, read from recorded fields only.
- **Goal:** flash (skipped under reduced motion), then a "GOLDEN GOAL" card with scorer, assist and winner, then a **Goal replay** button. The replay runs from the scoring possession's restart or turnover at 0.5× Full in REPLAY state, and never emits `end`.

## Documented limitations (shown on screen under "What is recorded vs inferred")

1. Sub-cell placement, run curves and timing inside a step are inferred presentation. The faint dashed 4×3 grid on the pitch shows the engine's real resolution.
2. Shot aim and miss side are inferred deterministically from `hash32(seed, i)` (L1). They are never used for anything else.
3. Schema-1 records have no `step` field, so beat grouping is heuristic (L2). An "approximate timing" badge is shown.
4. v0.4 records play in **ball-only mode**. Off-ball players stand in a static duty shape, and the carrier and duellists are placed at the recorded ball cell. This is labelled on screen.
5. Dynamic speed is condensed (safe build-up ×3, marked "≫"); every event is still drawn. If the match is short, Dynamic is never slower than Full.
6. V2 and V3 stretch items are not done: coverage rings, overload and lane hints, COUNTER wake trails, Big Pickle art. Only the minimal versions exist: contact ring, dimmed out-of-position players, and COUNTER, FOUL, FREE KICK and KICK-OFF banners.
7. Contract tests C2 (post-action snapshots for every type) and C4 (multi-cell moves) are not implemented. Reading `emit()` shows that duel, pass and shot events carry the **pre-action** context snapshot, while carry, turnover and restart carry post-action positions. The viewer handles this because the next event's snapshot carries the result. Assumption A1 in the architecture is therefore only partly true, and Codex should note it for D1/D2.

## Verification

**Status: PENDING.** Running Node scripts in this session needs owner approval, and that approval was not granted while I was working. The fixture file `src/viewer/fixture-default.js` and `tests/viewer/fixtures/*.json` **do not exist yet**. Until they are generated, `viewer.html` shows "Built-in fixture missing" but can still import a record JSON.

Run:

```
node tests/viewer/make-fixture.cjs
node tests/viewer/run-all.cjs
```


## Independent verification after Claude session — 2026-10-30

This section supersedes the earlier PENDING verification block, which reflects the Claude CLI permissions at the time it ran.

- Verified generated fixtures: `node tests/viewer/make-fixture.cjs` created a real deterministic T3 seed-42 record (38 events, hash b20c7f87), a legacy v0.4 record (15 events), and `src/viewer/fixture-default.js`.
- Verified `node tests/viewer/run-all.cjs`: all four test files pass in the latest complete run, including 120 T3 matches, 12,846 recorded events, 533,406 frame samples and zero C1/C3 violations.
- Verified `node tests/roster-139-integration.cjs` and `node tests/ui-regression.cjs`: both pass.
- Chrome browser smoke: recorded viewer loads at `http://127.0.0.1:51833/viewer.html` using a separate test-only Python static server; a screenshot confirms the pitch, six players, gold/scoreboard clock, commentary panel and playback controls render.
- The source `src/natural-positions.js` currently has 141 mappings for 139 players. The **isolated test-only VM harness** skips its terminal equality check after verifying that the guard text is unchanged. This does NOT change or repair the production roster, nor does it certify natural-position consistency for release.
- The tests originally compared cross-context VM arrays with Node-native arrays using strict deep equality, producing false negatives with identical data. Test comparisons were normalized to native arrays/JSON; no viewer simulation behavior was changed.
- **Performance caveat:** longest 709-event match measured 19.58 ms at the 95th-percentile of 20 warm samples in the most recent pass, but another run gave 20.71 ms. The strict 20 ms gate is marginal and flaky, and must be optimized or rigorously characterized before release. Do NOT claim full acceptance.
- Independent art prototype at `design/qwen-30b/arena/index.html` was visually verified in desktop and ~500px mobile Chrome, both goals visible. It remains separate from this canvas viewer pending owner approval.

No production source, `index.html`, match engine, roster ratings, deployed EXE or remote gameplay hosting were changed for these previews. T3 is still an experimental candidate.
