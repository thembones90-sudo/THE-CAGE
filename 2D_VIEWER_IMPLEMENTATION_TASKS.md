# 2D Classic Match Viewer: implementation tasks

**Source of truth:** `CLAUDE_2D_MATCH_VIEWER_ARCHITECTURE.md` (section references below point there).
**Rules for every task:**
- the viewer never decides outcomes, never calls `simulate`, never mutates a record or the showdown state;
- no `Math.random` or wall-clock time in `timeline.js` or `layout.js`;
- no probabilities on screen;
- all six players always drawn.

**Owners:** **Codex** = engine and production integration; **BP** = Big Pickle (visual design); **Claude** = contract, tests, review; **Impl** = whoever the owner assigns to viewer code (Codex by default).

Status: `[ ]` open · `[x]` done · `[~]` in progress.

---

## V0: Contract (no production change except D1–D3 at the next engine version bump)

- [ ] **V0.1 (Owner)** Approve the architecture, schema additions D1–D3, the speed table (§E.3, including the new "Full" speed) and the token approach (§G).
- [ ] **V0.2 (Claude)** `tests/viewer/contract.cjs`, run against T3 golden seeds and 3,000 random matches:
  - C1: every event has six positions and the carrier is at `zone` (world conversion);
  - C2: positions are post-action for every action type [A1];
  - C3: pass receivers end at `to`; interceptors are at the turnover zone;
  - C4: moves per event of two or more cells occur only for the carry or turnover actor, the free-kick taker, or recovery and rotation (any other case fails).
- [ ] **V0.3 (Codex, at the R1 version bump)** Add D1 `step`, D2 `ball`, D3 `schema: 2`. Contract test: stripping D1–D3 reproduces the pre-bump event stream for the same seeds, field for field. Regenerate golden files and explain the hash change in the commit message.
- [ ] **V0.4 (Claude)** Fixture records under `tests/viewer/fixtures/`, plus the expected viewer behaviour for each:
  - v0.4;
  - T3 schema 1;
  - T3 schema 2;
  - an invalid future schema.

## V1: Functional viewer (standalone; no production file touched)

- [ ] **V1.1 (Impl)** `src/viewer/coords.js`: cell ↔ `(u, v)`; team frame → world (mirror `CageSpatial.world`); pitch → pixels with DPR. Unit tests for both teams' frames.
- [ ] **V1.2 (Impl)** `src/viewer/layout.js`: slot templates for 1–6 occupants; carrier-central and goal-side defender ordering; stable tiebreak `(team, duty, id)`; seeded jitter of at most 0.04 cell (§C.4). Test: same input gives the same output; no slot swaps without an occupancy change.
- [ ] **V1.3 (Impl)** `src/viewer/timeline.js` `buildTimeline(record, cfg)`:
  - beats (by D1 `step`, or the §C.1 heuristic for schema 1);
  - shape and action phases;
  - consequence holds;
  - player and ball keyframes per §C.2 for: restart, carry, pass (complete and intercepted), through ball and race, dribble duel, wall pass (off the boards), press, shot, block, miss, rebound, turnover, recovery, rotation, foul and free kick, goal.
- [ ] **V1.4 (Impl)** `src/viewer/clock.js`: play, pause, resume, seek, speed; τ ↔ simulation clock; holds freeze the clock; condensation map for Dynamic and Fast (§E.3).
- [ ] **V1.5 (Impl)** `src/viewer/renderer.js`: arena layer (placeholder art), six markers (team colour, abbreviated label, possession ring), ball, trails. Draws only from the Timeline.
- [ ] **V1.6 (Impl)** `src/viewer/viewer.js`: `CageViewer.mount(el, record, {speed, mode:'live'|'replay'})` returning a controller; events `beat`, `goal`, `end` (with `end` at most once per live mount).
- [ ] **V1.7 (Impl)** `viewer.html` (standalone): load a record JSON (existing download format), or run a fixed seed through the current engine in preview; scoreboard bar, clock, controls.
- [ ] **V1.8 (Claude)** Tests:
  - **T-V1:** Timeline hash is stable (I1).
  - **T-V2:** pause, speed and seek don't change the Timeline (I2).
  - **T-V3:** static guard: no `simulate(`, `Math.random` or `Date` in `src/viewer/{timeline,layout,coords}.js` (I5, I6).
  - **T-V4:** the ball is never at a receiver before the receiver reaches the final point (sample every 1/60 s).
  - **T-V5:** a challenger is never more than 0.6 cell from the carrier at a dribble, tackle or press contact frame.
  - **T-V6:** the clock never exceeds the current event's `t`; the clock is monotonic.
  - Build time < 20 ms on a p99 match.

**V1 acceptance:** the owner watches Maldini/Ballack/Ronaldo vs Ronaldinho/Rivaldo/Del Piero (fixed seed) and can follow possession and the goal with commentary hidden.

## V2: Football intelligence visualisation

- [ ] **V2.1 (Impl)** Shape-phase runs show intent:
  - committed supporting players drift ahead or wide (from the `roles.support` and `calc.commitment` deltas);
  - rest-defence holders stay deep.
- [ ] **V2.2 (Impl)** Defensive coverage: a challenger pressure ring; a helper link line; `calc.defenderIds` engagement radius shown faintly on danger beats.
- [ ] **V2.3 (Impl)** Overload highlight when `numbers.attackers > numbers.defenders` with the `overload` tag; a passing-lane line during pass flight.
- [ ] **V2.4 (Impl)** Transitions: "COUNTER" on `transition`; caught players' wake on `rest_defence_exposed`; "PRESS BEATEN" on `press_bypassed` (after R4).
- [ ] **V2.5 (Impl)** Beaten state: dim while `calc.availability > 0`; clears on `recovery_run`.
- [ ] **V2.6 (Claude)** Review against the log: every highlight traces to a field or tag. **T-V7:** with commentary hidden, a scripted observer test (event-to-visual cue map) finds a visible cue for every action event.

## V3: Premium presentation (BP leads design)

- [ ] **V3.1 (BP)** `design/big-pickle/DESIGN_SYSTEM.md`: agree the token names in §G (or propose replacements); arena art direction; marker and label styles; goal card; motion timing values.
- [ ] **V3.2 (Impl)** Renderer reads the tokens; arena layer per BP (dark turf, steel cage, chain link, floodlights, metal goals); `prefers-reduced-motion` handling.
- [ ] **V3.3 (Impl)** Scoreboard bar with both scores kept clearly separate (§E.2); REPLAY chip; FULL TIME state.
- [ ] **V3.4 (Impl)** Commentary panel synchronised to τ (§E.4), burst-limited during fast-forward; goal sequence (§E.5) with scorer and assist; goal replay of the scoring possession.
- [ ] **V3.5 (Impl)** Responsive layout: desktop split; tablet and mobile stack; 16 px gutters; no horizontal scroll.
- [ ] **V3.6 (Claude)** Accessibility check: commentary `aria-live`; canvas `aria-label` plus a hidden action ticker; contrast of team colours against the turf.

## V4: Production integration (Codex)

- [ ] **V4.1** Behind `?viewer=2d`: `showdown.js` `playback()` mounts `CageViewer` instead of `preparePitch`/`renderEvent`/`paintThrough`; the viewer `end` → `finish(record, isReplay)` exactly as now; replays mount with `mode:'replay'`.
- [ ] **V4.2** Map the existing `pace` values (`instant`, `fast`, `normal` → Dynamic, `dramatic`) and add Full; saved `pace` values remain valid.
- [ ] **V4.3** Old records: T3 schema 1 uses heuristic timing (with a note); v0.4 uses ball-only mode (labelled); a future schema gets an explicit refusal message (I7).
- [ ] **V4.4** Packaging: add `src/viewer/*` to `index.html` and `build-exe/sea-config.json`; rebuild the `.exe`; smoke-test it in the default browser.
- [ ] **V4.5** Regression:
  - existing `tests/records.cjs`, `persistence-browser.cjs`, `ui-regression.cjs` and `showdown-engine.cjs` pass;
  - **T-V8:** replaying a round or a goal leaves `wins`, `history` and claims deep-equal (I3);
  - **T-V9:** live `end` fires once (I4);
  - saved showdowns resume correctly.
- [ ] **V4.6 (Owner)** Remove the flag and retire the old pitch once V4.5 passes and the owner signs off.

## Dependencies

V0.2 → V1.3 · V0.3 → (optional for V1, required for V4 exact timing) · V1 → V2 → V3 → V4 · V3.1 can start immediately in parallel · Engine recovery (R1–R6) runs in parallel; the viewer is schema-driven and doesn't wait for it.
