# THE CAGE: 2D Classic Match Viewer architecture

**Author:** Claude (technical architect for the viewer), 2026-10-30.
**Status:** architecture proposal. No production file changed.
**Companion:** `2D_VIEWER_IMPLEMENTATION_TASKS.md`.
**Engine audited:** T3 `cage-t3-3 / t3-space-3`, from the byte snapshot of commit 7e14dbb in `proposals/t3-research/base-cage-t3-3.js` (3,000 random matches, 335,369 events), and archived v0.4 `cage-0.4.0`.

Assumptions are marked **[A#]** and unresolved data limitations **[L#]**; both are collected in §9.

---

## 0. Summary

1. **T3 already records enough to animate a real match.** Every T3 event carries a full six-player snapshot, plus the carrier, receiver, challenger, helper, supporting players, interceptor, blocker, rebound winner, out-of-position state and commitment. 97.4% of player moves between events are zero or one cell, so the data never forces teleports. The viewer can show Maldini closing down Ronaldinho, Ballack's through ball to Ronaldo, and Vidić intercepting and launching a counter, all straight from recorded fields.
2. **Positions are coarse, and the timestamps need one field.** Positions are on a 4×3 grid; three or more players share one cell in 68% of snapshots, and up to six at once. Everything below cell size is presentation and must be inferred deterministically and labelled as such. 51% of events share a timestamp with the previous one, so the viewer needs presentation holds. The only *essential* schema addition is a `step` index on each event (§5). Everything else is derivable or optional.
3. **Rendering:** Canvas 2D for the arena, markers, ball and effects. HTML and CSS for the scoreboard, clock, commentary and controls. No library or engine. Works in any browser the Windows `.exe` opens, because the `.exe` is a Node single-executable that serves files to the default browser.
4. **The core is a pure function.** `buildTimeline(record, viewerConfig) → Timeline` (beats, paths, ball flights, holds). The renderer only samples the Timeline at a time τ. The renderer never decides an outcome; the showdown, not the viewer, owns scoring. Playback speed, pause, seek and replay change τ only.
5. **v0.4 records** (today's default engine) have no off-ball positions. They play in a labelled "ball-only" mode or keep the existing view. Full animation needs T3 or later.

---

## A. Feasibility audit: what the data already supports

### A.1 What every T3 event carries

| Field | Content | Use in the viewer |
|---|---|---|
| `i`, `t`, `n` | Index, simulation seconds (end of the action), team size | Ordering; clock |
| `type`, `team`, `actor` | Event kind, acting team and player | Choose the animation |
| `target` (pass, through ball, rotation) | Intended receiver | Pass destination; who the interception was meant for |
| `opp` | Opponent in the duel (challenger, interceptor-in-waiting, presser's victim, rebound loser) | Contact pairing |
| `zone`, `from`, `to` | Ball cell in the **acting team's attacking frame** (`x` 0–3 is attacking progress, `lane` left/centre/right) | Ball path; must be converted to world coordinates (§A.3) |
| `positions` | **All six players**, world cells `{x:0–3, y:0–2}`, taken **after** the action | Player paths |
| `roles` | `carrier`, `challenger`, `helper`, `support[]`, `receiver`, `blocker` | Who closes, who doubles up, who offers a pass |
| `calc.availability` | Out-of-position counter per player (0 means available) | "Beaten" or recovering state |
| `calc.commitment` | Committed forward or holding rest-defence, per player | Shape: who holds back |
| `calc.defenderIds` | Defenders within engagement radius (1 cell) | Defensive coverage visual |
| `numbers` | Attackers vs defenders near the ball | Overload highlight |
| `tags` | `overload`, `help_defence`, `counter_press`, `rest_defence_exposed`, `press_bypassed` (R4 adds this) | Highlight effects |
| `outcome`, `p`, `roll` | Resolved result. `p` and `roll` are never shown (no probabilities on screen) | Choose the success or failure animation |
| `transition` (turnover, goal) | Counterattack possession | "COUNTER" overlay |
| `assist` (goal) | Last passer; present for 71% of goals | Goal card |
| `kind` (shot, goal) | `box`, `long`, `fk`, `one_v_one`, `scramble` (R2) | Shot style |

### A.2 Measured properties (3,000 matches)

| Property | Measurement | Consequence |
|---|---|---|
| Events with a full six-player snapshot | **100%** | Every frame can be anchored to authoritative cells |
| Player move per event: 0 / 1 / 2 / 3 / 4 cells | 1,437,134 / 545,155 / 10,095 / 1,816 / 14, so **0.6% move two or more** | Smooth paths everywhere. Long moves are almost all the carrier on a carry (one cell forward plus a lane change), the new carrier on a turnover, or the free-kick taker |
| Carrier located at the event zone | **100%** (64,482 checked) | The ball's position is always derivable |
| Pass receiver ends at the `to` cell, having moved 0 or 1 cell | **100%** (0: 55,810; 1: 31,477) | The receiver can always be in place before the ball arrives |
| Interceptor at the turnover zone | **100%** (15,527) | Exact interception cell is known |
| Most players sharing one cell | 1: 1%; 2: 31%; 3: 37%; 4: 26%; 5: 5%; **6: 0.4%** | Within-cell layout is needed and must be inferred |
| Time gap between consecutive events | 0 s: **51%**; 2 s: 4%; 3 s: 18%; 4 s: 26% | Same-second consequences need presentation holds |
| Events per match | median 71, p99 670; 1.71 simulation seconds per event | A 45 s Dynamic playback needs condensing for long matches (§E.3) |
| Event mix | recovery_run 29%, pass 21%, turnover 10%, dribble_duel 10%, through_ball 5%, carry 4%, shot_attempt 4%, rebound 3%, race 3%, wall_pass 2%, press 1%, other | recovery_run is a state change; render it as movement, not as a beat |

### A.3 Coordinate frames

- `positions` are **world** cells: x runs from Commander's goal (0) to the Opponent's goal (3), y is the lane (0 left, 1 centre, 2 right as seen from Commander's attack).
- `zone`, `from` and `to` are in the **acting team's frame**. World x = `team === 0 ? zone.x : 3 − zone.x`, and world y = `{left:0, centre:1, right:2}[lane]`. This is the same as `CageSpatial.world`, and the viewer must call or mirror it, never reimplement it differently.
- Simulation steps: `step()` moves players once (each player at most one cell, with agility-based move credit), then emits any `recovery_run` and `rotation` events, then the action and its consequences. All events of one step share a positions snapshot until the action changes the carrier.
- **[A1]** The positions snapshot is taken at emit time and reflects the step's movement plus the action. Verified for carry and pass events; assumed for the rest. Codex to confirm in contract test C2.

### A.4 What can be animated exactly vs inferred

| Requirement | Status | Source |
|---|---|---|
| Every player before and after an action | **Exact at cell level** | Before = previous event's `positions`, after = this event's |
| Ball carrier | **Exact** | `roles.carrier` / `actor`, located at `zone` |
| Intended and actual pass recipient | **Exact** | `target`; on interception, the following `turnover.actor` |
| Defensive participants | **Exact** | `roles.challenger`, `roles.helper`, `opp`, `calc.defenderIds` |
| Movement destinations | **Exact at cell level** | Next snapshot. Sub-cell destination is inferred (§C.4) |
| Interception location | **Exact cell** | Interceptor's cell. The point on the ball's path is inferred as the path point nearest that cell |
| Shot origin | **Exact cell** | Shooter's zone |
| Shot target in the goal mouth | **Not modelled by the engine** | Inferred deterministically (§C.2), labelled presentation-only [L1] |
| Miss direction | Partial | `outcome` is `wide` or `off_post_or_wide`; the side is inferred [L1] |
| Block position | **Exact cell** | Blocker's cell |
| Rebound position | **Exact cell** | Winner's cell after `rebound`. `source` (`wall` or `block`) gives the bounce origin |
| Goal | **Exact** | `goal` event, `kind`, `assist`, `transition` |
| Timestamps and ordering | **Exact order**; time has 1 s resolution, steps 2–4 s, and 51% zero gaps | Holds needed (§C.3). Grouping by step is a heuristic until `step` is added [L2] |
| Sub-cell positions; body orientation; run curvature | **Not in data** | Presentation inference, deterministic, labelled [L3] |
| Out-of-position (beaten) players | **Exact** | `calc.availability` > 0, cleared by `recovery_run` |
| Wall pass | **Exact meaning** | A play off the cage boards; commentary confirms ("plays it off the wall … one-two with the boards"). There is no teammate partner, so the viewer must not draw one |

**Conclusion:** everything in the owner's examples is drawable from recorded fields. Within-cell geometry, shot placement and the timing inside a step are presentation and must be marked as such.

---

## B. Rendering architecture

### B.1 Recommendation: Canvas 2D plus an HTML/CSS shell

| Option | Verdict | Reason |
|---|---|---|
| **Canvas 2D** | **Chosen** for the pitch, markers, ball and effects | Seven moving objects plus trails, glows and a goal flash at 60 fps cost almost nothing. Crisp with `devicePixelRatio`. Trails, motion blur and floodlight vignettes are cheap. No DOM churn. Present in every browser |
| SVG | Rejected for animation | Per-frame attribute writes on many nodes; filters (glow, blur) are slow; harder to do trails. It would suit a static pitch, but a cached offscreen canvas does that too |
| CSS-positioned DOM (today's markers) | Rejected | It's why markers "teleport": CSS transitions on left and top can't follow curved paths, collide labels or synchronise the ball |
| WebGL / PixiJS / Phaser | Rejected | Unneeded weight and a new dependency. Canvas meets every requirement |

**HTML/CSS** for the scoreboard, clock, commentary, controls and goal card. This gives text accessibility, Big Pickle's styling hooks (CSS variables) and screen-reader live regions.

### B.2 Layers

1. `arenaLayer`: an offscreen canvas drawn once per resize. Turf, markings, cage frame, chain link, goals and floodlight vignette.
2. `playLayer`: the main canvas, cleared each frame. Shadows, passing-lane hints, players, ball, trails, labels.
3. `fxLayer`: drawn on the main canvas last. Goal flash, "COUNTER", whistle, overlays.
4. DOM shell: `#viewer-scoreboard`, `#viewer-commentary`, `#viewer-controls`, `#viewer-goal-card`.

### B.3 Modules (all new, under `src/viewer/`)

| File | Purity | Responsibility |
|---|---|---|
| `src/viewer/coords.js` | Pure | Cell ↔ normalized pitch `(u, v)`. Team-frame to world conversion (mirrors `CageSpatial.world`). The pitch-to-pixel transform |
| `src/viewer/layout.js` | Pure | Within-cell slot assignment; stable ordering; label collision avoidance |
| `src/viewer/timeline.js` | **Pure, Node-testable** | `buildTimeline(record, cfg)` → `{beats[], holds[], tracks{id: keyframes}, ball: keyframes, meta}` |
| `src/viewer/clock.js` | Pure state machine | Playback ms ↔ τ. Speed, pause, seek, goal-replay segment, condensation map |
| `src/viewer/renderer.js` | Canvas only | Draws the Timeline at τ. Reads style tokens. **No game logic and no RNG** |
| `src/viewer/viewer.js` | Glue | `CageViewer.mount(el, record, opts)` returns `{play, pause, resume, seek, setSpeed, replayGoal, destroy, on(evt, fn)}` |
| `src/viewer/viewer.css` | Styling | Shell layout. Tokens supplied by Big Pickle (§G) |

**Data flow:** engine result → `R.make` record (unchanged) → `buildTimeline` → `clock` → `renderer` + DOM shell. Commentary keeps reading the same `record.result.events` through `CageCommentary.commentate`. The viewer only *schedules* its lines against τ and never generates text.

### B.4 Performance and packaging

- `requestAnimationFrame`. On hidden tabs the clock pauses automatically (`visibilitychange`).
- Timeline build target: under 20 ms for a p99 670-event match.
- `prefers-reduced-motion`: no camera nudge, no flash; the ball still moves.
- Packaging: add the new files to `build-exe/sea-config.json` assets and to `index.html` script tags. The `.exe` serves files to the user's browser, so there are no extra runtime requirements. **[A2]** The default browser supports Canvas 2D and `Path2D`, which any browser from 2018 or later does.

---

## C. Event-to-animation specification

### C.1 Building the timeline

1. **Normalise:** convert each `zone`/`from`/`to` to world cells. Read `positions` as world cells.
2. **Group into beats.** A beat is one simulation step. Until `step` exists (§5), use the rule: start a new beat at each *action* event (`restart`, `carry`, `pass`, `through_ball`, `dribble_duel`, `wall_pass`, `press`, `shot_attempt`, `free_kick`). Attach the preceding `recovery_run` and `rotation` events and the following *consequence* events (`turnover`, `race`, `block`, `shot_miss`, `rebound`, `foul`, `goal`). **[L2]**
3. **Beat window:** simulation time `[t_prevBeatEnd, t_actionEvent]`, which is 2–4 s.
4. **Phases inside a beat:**
   - **Shape (0 → 0.55):** every non-actor player moves from the previous snapshot to this beat's snapshot cell. This matches the engine, which moves players at the start of the step.
   - **Action (0.40 → 1.0):** the ball and the duelling players perform the action, overlapping the end of the shape phase so motion is continuous.
   - **Consequence holds:** each zero-duration consequence gets a presentation hold during which the simulation clock **does not advance**. Default lengths at 1× Dynamic: turnover 0.35 s, race 0.5 s, block 0.4 s, shot_miss 0.5 s, rebound 0.5 s, foul 0.6 s, goal 1.6 s. The holds are honest because simulation time really did not pass.
5. **Player tracks:** keyframes at beat phases, with sub-cell targets from `layout.js`, eased with `easeInOutCubic`. Maximum displayed speed is clamped to a sprint ceiling, and the rare two-to-four-cell moves get the full beat as a visible run.
6. **Ball track:** possession-aware. Attached to the carrier with a small lead in the run direction, or in flight along a computed curve for passes, shots, rebounds and blocks.

### C.2 Per-event mapping

Notation: **C** carrier, **R** receiver, **D** challenger (`roles.challenger` / `opp`), **H** helper, **S** supporting players. World cells are converted by `coords.js`.

| Event | Players | Ball | Effects | Exact or inferred |
|---|---|---|---|---|
| `restart` (kickoff, after a goal or clear) | Everyone eases to the snapshot (kickoff shape); 0.8 s hold "KICK-OFF" | Placed at C's cell; C on the ball | Centre-circle pulse | Exact cells |
| `carry` | C runs `from` → `zone` (one cell forward, lane may change) on a curve; others follow the shape phase | Rolled at C's feet, about 0.6 m ahead in the run direction, touch pulses every 0.5 s | Faint run trail | Exact cells; curve inferred |
| `pass`, `complete` | R moves to the `to` cell and **arrives by phase 0.85**; S adjust | Ground pass from C to R's *final* point, released at about 0.55 and arriving at 1.0; flight time scaled by distance | Short lane line while the ball travels (V2) | Exact |
| `pass`, `intercepted` | Interceptor (next `turnover.actor`) steps into the path from his snapshot cell; R keeps running | Travels toward R's target point and **stops at the path point nearest the interceptor's cell**; possession ring switches | "Intercepted" flash on the interceptor | Interceptor cell exact; contact point on the path inferred |
| `through_ball` (also outlet) | R sprints into space ahead to `to`; D turns to chase | Lofted or ground ball *leading* R into the `to` cell; arrival equals R's arrival | Lead arrow (V2) | Exact cells |
| `race` (after a through ball) | R vs `opp` sprint for the ball. `attacker_clear`: R reaches it and D falls behind (dims, beaten). `defender_recovers`: D gets there first | Ball at the contact point, then with the winner | "Clear!" or "Recovered" | Outcome exact |
| `dribble_duel` | C and D converge to a **contact point** inside C's cell. **D is never drawn tackling from more than 0.6 cell away**: the presentation path brings D in, and D eases back to his snapshot cell afterwards. `attacker_wins`: C feints and moves past D toward goal, D is beaten (dims while `availability` > 0). `defender_wins`: ball pops to D and possession switches. `fouled`: both stop | At C's feet; on a defender win it squirts toward D | Shake for the tackle; whistle for a foul | Outcome and players exact; contact geometry inferred |
| `wall_pass` | C plays the ball against the **nearest side board** and runs around D | Ball to the board point, then back into C's path one cell on. On `defender_wins`, D intercepts the rebound angle | Board flash on impact | Meaning exact ("off the boards"); no teammate partner is drawn |
| `press` (shield) | Presser closes C at speed. `ball_won`: presser takes the ball (turnover follows). `press_beaten`: C turns away and the presser overruns, dimmed if out of position | Shielded at C's feet | Pressure ring on C; "PRESS BEATEN" when R4's `press_bypassed` tag is present | Exact |
| `shot_attempt` | Shooter strikes; nearby defenders lunge (only those in `calc.defenderIds`) | Leaves the shooter's cell toward an aim point in the goal mouth | Brief floodlight flare | Origin exact; **aim point inferred [L1]**, seeded by `hash32(seed, i)`: inside the frame for goals and blocks, outside for misses |
| `block` | Blocker steps into the line | Ball stops at the blocker, then loose (rebound follows) | Impact burst | Blocker exact |
| `shot_miss` | — | Ball goes wide of the post (`wide`) or clips the frame (`off_post_or_wide` near the post), then hits the cage wall | Clang on post contact | Outcome exact; side inferred |
| `rebound` | The two nearest players (`actor` and `opp`) race to the loose ball | Bounces from `source` (wall or block point) to the winner's cell | "Second ball" label when the attack keeps it | Exact winner and cell |
| `turnover` | New carrier gains a possession ring; all markers start transitioning. On `transition`: the "COUNTER" banner. With `rest_defence_exposed`: caught players (`calc.caught`) get a red wake | At the new carrier | Possession colour sweep | Exact |
| `recovery_run` | That player's dim "beaten" state clears as he rejoins the shape (no separate beat) | — | — | Exact |
| `rotation` | The two players swap duty badges, with small swap arrows | — | — | Exact |
| `foul` → `free_kick` | Play stops; free-kick taker (the actor) jogs to the spot during a 0.9 s hold, which covers the 132 recorded long moves; the wall of defenders forms in the cells recorded | Placed at the spot; the shot follows as `shot_attempt` `fk` | Whistle | Exact cells |
| `goal` | Scorer strikes; everyone freezes on contact | Into the net: the net bulges and the ball drops | Goal flash, scorer and assist card, scoreboard 1–0 or 0–1, winner banner, optional goal replay | Exact |

### C.3 Time and the clock

- **Simulation clock** shown as `mm:ss`: interpolated linearly within each beat window from `t_start` to `t_end`. Frozen during holds.
- **The clock never runs ahead of the events:** the consequence events stamped at `t` appear inside a hold at `t`.
- Commentary lines are released at the τ of the event they describe (`line.i` maps to the event to the beat phase). §E.4.

### C.4 Within-cell layout (presentation, deterministic)

- Cell size in pitch units is a quarter of the length by a third of the width; the cell centre is `((x + .5)/4, (y + .5)/3)`.
- **Slot templates by occupancy:** 1: centre; 2: two slots along the attacking axis; 3: triangle; 4: diamond; 5–6: two rows. Slot radius 0.32 of a cell.
- **Football-meaningful ordering inside a cell:**
  - the carrier takes the slot nearest the ball centre;
  - defenders take the slots **goal-side** of the attacker, between him and their goal;
  - the engaged challenger is placed adjacent to the carrier;
  - the helper goes second goal-side.
- Ties are broken by `(team, duty, id)`, so the result is stable across beats and players don't swap slots without reason.
- **Labels:** an abbreviated surname above each marker, about 3–8 characters, from a deterministic abbreviation table (`Ronaldinho` → `R'DINHO`, `Del Piero` → `DEL PIERO`). If two labels overlap, offset below or fade the non-involved player's label. The full name and duty appear on hover or tap in the info panel.
- **Jitter:** a seeded micro-offset of at most 0.04 cell per player per beat, from `hash32(seed, beatIndex, id)`, so players don't stand like chess pieces. It is reproducible (§E.6).

---

## D. Data-schema additions

Principle: **no simulation change for presentation.** Additions must not consume RNG draws and must not alter decisions. They are recorded facts, emitted alongside existing fields.

| # | Field | Priority | Why | How (no determinism impact) |
|---|---|---|---|---|
| D1 | `step` (integer tick) on every event | **Essential** | Exact beat grouping. Removes the heuristic in §C.1 step 2 [L2] | `emit()` already runs inside `step()`; record `step: tick`. It is not an RNG input |
| D2 | `ball: {x, y}` world cell on every event (or only when the ball isn't at the carrier) | Recommended | Removes inference for loose balls (block, miss, rebound) and makes the ball's position explicit | Derived from `zone()` at emit; no RNG |
| D3 | `schema: 2` on result and record; `viewerSchema` in the record | **Essential** with D1 | The viewer chooses full or ball-only mode explicitly | Record field only |
| D4 | `dtWindow: [tStart, tEnd]` on action events | Optional | Removes reliance on the previous event's `t` | Computed from `t` before and after `t += P.dt[...]` |
| D5 | `shotSide: 'near'/'centre'/'far'` | **Not recommended** | The engine doesn't model placement. Adding it would invent a gameplay fact. Keep it as a viewer inference [L1] | — |

**Introducing D1–D4:**
- They change event content and therefore `eventHash`. Ship them **with the next engine version bump** (the R1 recovery commit will bump `cage-t3-3` anyway), so the hash change is attributed to that version.
- Old records stay valid through `CAGE_ENGINE_REGISTRY` and version checks.
- Golden files: `tests/tactical/golden-*.json` regenerate in the same commit, and the hash change must be explained in its message.
- Contract test: removing D1–D4 from events must yield the same event stream as before, field for field. This proves they are passive.

**Old records:**
- **T3 schema 1** (no `step`): full animation using the beat heuristic, with a small "approximate timing" note.
- **v0.4 records:** ball-only mode. The carrier and ball are animated from `zone`; off-ball players are drawn in a static duty shape with a visible "positions not recorded in v0.4" note. Never pretend they are tracked.
- **Unknown future schema:** refuse with an explicit message ("Replay recorded with viewer schema N; this build supports ≤ M").

---

## E. Football Manager-style match interface

### E.1 Desktop layout (≥ 1100 px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ROUND 3 │ COMMANDER 0–0 OPPONENT │ 04:32 │ SHOWDOWN 1–1 │ ● LIVE   │  ← scoreboard bar (HTML)
├──────────────────────────────────────────────┬───────────────────────┤
│                                              │ COMMENTARY            │
│                                              │ 04:28 Ballack slips…  │
│            PITCH CANVAS (≈ 70% width)        │ 04:31 Ronaldo races…  │
│            stable overhead, full cage        │                       │
│                                              │ ───────────────────── │
│                                              │ ON THE BALL: Ronaldo  │
│                                              │ Duty: Attacker        │
├──────────────────────────────────────────────┴───────────────────────┤
│ ⏮  ▶/❚❚  speed [Fast|Dynamic|Dramatic|Full]  ⟲ goal replay   timeline│  ← controls
│ Stats (collapsible): possession · shots · passes · duels            │
└──────────────────────────────────────────────────────────────────────┘
```

- **Tablet and mobile (< 1100 px):** scoreboard on top, pitch at full width (aspect kept), commentary below as a 5-line ticker, controls sticky at the bottom. 16 px gutters, no horizontal scroll.
- Pitch aspect **[A3]:** 1.8:1 inside the cage frame. Cells are not square; only logical coordinates matter.

### E.2 Scoreboards (two, never confused)

| Element | Content | Changes when |
|---|---|---|
| **Match score** | `COMMANDER 0–0 OPPONENT` | Only on the `goal` event's τ (to 1–0 or 0–1); the round then ends |
| **Showdown score** | `SHOWDOWN 1–1`, first to 3 | Only when the showdown's `finish(record, false)` runs for a **live** round. Never in a replay |
| Round | `ROUND 3 OF 5` | From the record |
| Clock | Simulation `mm:ss` | Driven by τ (§C.3) |
| State | `● LIVE` / `❚❚ PAUSED` / `REPLAY` / `FULL TIME` | Controller state |

The two scores use different visual weights and positions: the match score sits centre and large, the showdown score sits right and smaller. **During replays the showdown score is shown read-only with a "REPLAY" chip.**

### E.3 Playback speeds (the existing options are kept and mapped)

| UI label | Existing `pace` | Real-world duration | Behaviour |
|---|---|---|---|
| Instant | `instant` | 0 s | Jumps to the final frame; commentary listed in full |
| Fast | `fast` | 0.45 × Dynamic | Same condensation as Dynamic |
| **Dynamic** (default) | `normal` | `clamp(duration × 0.3, 30, 45)` s, today's formula | **Condensed:** danger beats play at the base rate. Safe build-up (possessions that never reach world `x ≥ 2` in their attacking frame and contain no shot or transition) is fast-forwarded with a visible "≫" and a racing clock |
| Dramatic | `dramatic` | 1.4 × Dynamic | Less condensation, longer holds |
| **Full** (new) | — | 1 simulation second = 0.35 s real (a 7:26 match takes 2:36) | No condensation. **Slower speeds show more movement, not longer pauses**: shape-phase keyframes get more time |

- **Condensation is presentation-only.** The clock still shows real simulation time, and every event is still drawn, only faster.
- If even fully condensed playback exceeds the budget (very long matches, p99), the rate rises uniformly. The budget is a target, not a hard cap, so beats are never dropped silently.

### E.4 Commentary synchronisation

- `CageCommentary.commentate(result, seed, names)` runs as today. Each line maps to its event (`line.i`), then to a beat, then to a release τ:
  - the action phase midpoint for action events;
  - the start of the hold for consequences.
- Lines appear in the right panel with the simulation clock. The goal line fires with the goal flash.
- Commentary can be hidden, and the pitch alone must communicate the action. Tested by T-V7.
- During fast-forward, commentary lines still appear in order; a burst limit of at most 3 lines per 250 ms groups them.

### E.5 Goal sequence (about 2.5 s total at Dynamic)

1. The ball hits the net (net bulge).
2. The pitch flashes (0.25 s, reduced-motion: none).
3. Goal card: scorer, and `assist` if present.
4. The match score ticks to 1–0 or 0–1.
5. The winner banner shows "COMMANDER WINS ROUND 3".
6. A **Replay goal** button appears.

Goal replay plays the beats from the start of the scoring possession (the last `restart` or `turnover` before the goal) at 0.5× Full speed, in REPLAY state. The controller emits **no** `end` event to the showdown during a replay.

### E.6 Determinism invariants (viewer)

| # | Invariant | Test |
|---|---|---|
| I1 | Same record and viewer config give an identical Timeline | `hash(buildTimeline(r, cfg))` stable across runs and machines |
| I2 | Pause, speed and seek change τ only | Timeline hash unchanged; event stream untouched |
| I3 | Replaying a goal or a round never mutates showdown state | `wins`, `history` and claims are deep-equal before and after |
| I4 | Live end fires **exactly once** per live mount | Counter in the integration test |
| I5 | The viewer never calls `E.simulate` and never writes `record` | The record is frozen (`E.freeze`); a static check finds no `simulate(` in `src/viewer/` |
| I6 | No `Math.random`, `Date.now` or `performance.now` inside `timeline.js` or `layout.js` | Static guard, like the engine's E12 |
| I7 | Old records play or fail with an explicit version message | Fixture records for v0.4, T3 schema 1 and the future schema |

---

## F. Development plan

See `2D_VIEWER_IMPLEMENTATION_TASKS.md` for the checklist. In outline:

| Phase | Deliverable | Owner | Production files touched |
|---|---|---|---|
| **V0: contract** | This document; contract tests C1–C4 on T3 events; `step`/`ball` schema decision | Claude (spec, tests), Codex (D1–D3 in the engine at the next version bump) | Engine only at the bump |
| **V1: functional viewer** | Standalone `viewer.html` loading a record file or a fixed seed: canvas, six markers, ball, scoreboard, clock, play, pause, speed | Codex or Claude implements, by owner choice; Claude reviews the contract | **None.** Standalone page and `src/viewer/*` |
| **V2: football intelligence** | Shape-phase runs, defensive coverage rings, overload and lane hints, transitions, beaten-player state | Same | None |
| **V3: premium presentation** | Big Pickle tokens and art: Industrial Underground arena, scoreboard styling, goal card, commentary sync, responsive layout | Big Pickle (design and tokens), implementer wires them | None |
| **V4: production integration** | `showdown.js` mounts the viewer in place of `preparePitch`/`renderEvent`/`paintThrough`; packaging; browser and `.exe` tests | Codex | `index.html`, `src/showdown.js`, `src/cage-ui.css`, `build-exe/sea-config.json` |

The existing pitch stays the fallback until V4 passes. A feature flag (`?viewer=2d`) runs both side by side during V4.

---

## G. Coordination contract

| Party | Owns | Must not |
|---|---|---|
| **Codex** | Engine mechanics; D1–D3 fields; `showdown.js` integration (V4); packaging | Change gameplay to suit animation; drop fields the viewer depends on without a schema bump |
| **Big Pickle** | Visual identity: colour, type, arena art, marker styles, motion timing values, goal-card look. Delivered as `design/big-pickle/DESIGN_SYSTEM.md` and CSS custom properties | Change data mapping or timing semantics (when a hold happens); only its look and length |
| **Claude** | The data-to-animation contract (this document); `buildTimeline` semantics; contract and invariant tests; review of the viewer for fabricated events | Edit engine mechanics or Big Pickle's visual design |

**The interface between design and code is a token set** the renderer reads (CSS custom properties, read once via `getComputedStyle`):
`--cage-turf`, `--cage-line`, `--cage-steel`, `--cage-mesh`, `--cage-flood`, `--team-a`, `--team-a-ink`, `--team-b`, `--team-b-ink`, `--ball`, `--danger` (crimson), `--momentum` (amber), `--verified` (green), `--label-font`, `--marker-radius`, and the motion values `--hold-goal`, `--hold-turnover`, `--flash-ms`.

Defaults exist so V1 runs before Big Pickle delivers. **[A4]** Big Pickle's `design/big-pickle/` deliverables were not present when this was written. The token names above are a proposal to agree with Big Pickle, not a constraint on their design.

**Absolute-rule compliance:**
- the viewer shows no win probability, `p`, `roll` or any odds;
- it creates no events;
- it never changes a score;
- commentary still only reads events;
- all six players are always drawn.

---

## 9. Assumptions and unresolved limitations

| ID | Item | Impact | Resolution |
|---|---|---|---|
| A1 | The positions snapshot reflects the step's movement plus the action, for every event type | Beat phasing | Contract test C2 (Codex confirms) |
| A2 | The `.exe` opens a modern browser with Canvas 2D | Packaging | `.exe` smoke test in V4 |
| A3 | Pitch aspect 1.8:1 | Art | Big Pickle may change it; logic uses normalised coordinates |
| A4 | Big Pickle's token names and deliverables are not yet present | Styling | Agree token names at the start of V3 |
| A5 | Final shipped engine = T3 plus recovery R1–R6, plus later R8–R11 | Event mix | R2 adds `scramble` shots, R4 `press_bypassed`, R11 checked carries; all mapped above or in C.2 extensions |
| L1 | Shot aim point and miss side are not modelled | Presentation-only | Deterministic inferred placement, never used by anything else; labelled in the code |
| L2 | No `step` field; 51% of events share a timestamp | Beat grouping heuristic | D1 |
| L3 | 4×3 cells; up to six players in one cell; no sub-cell positions | Inferred layout | §C.4 rules; the "football-meaningful ordering" is inference consistent with engagement roles, not tracked data |
| L4 | Time resolution: 2–4 s steps | Motion pacing inside a step is inferred | Shape/action phases |
| L5 | v0.4 has no off-ball positions | Full animation impossible for v0.4 records | Ball-only mode, labelled |
| L6 | Through-ball delivery height (ground or lofted) is not modelled | Cosmetic | Ground by default; lofted only for `through_ball` beyond one cell; documented |
| L7 | Very long matches (p99 670 events) exceed 45 s even when condensed | Budget | The rate rises uniformly, or the owner accepts a longer Dynamic for long matches |
| L8 | Today's T3 still fails acceptance (stalls, three-defender teams) | What the viewer shows depends on the engine | The viewer is engine-agnostic over the schema; build it in parallel with the recovery plan |
