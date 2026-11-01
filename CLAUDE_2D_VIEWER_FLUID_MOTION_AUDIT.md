# THE CAGE: 2D viewer fluid-motion audit and proposal

**Author:** Claude, 2026-11-01. **Owner directive:** "Classic Football Manager-style 2D match presentation".
**Status:** audit and proposal. **Codex owns viewer implementation.** No viewer code is committed by Claude. Codex is currently editing `src/viewer-v4/*` in the main checkout, so this document hands over precise changes instead of touching those files.
**Scope:** presentation only. Engine results, replay hashes, keeper rules and gameplay are untouched. Required engine additions are passive (no RNG draws) and ship with the next engine version.

## 1. Diagnosis: why it looks like fast chess

Measured on 30 real 3+1 regulation matches (live T3-12, traits on), using the shipping timeline builder (`src/viewer/timeline.js`) and clock (`src/viewer/clock.js`):

| Fact | Value | Consequence |
|---|---|---|
| Events per regulation match | **696** on average (20 simulated minutes, plus overtime when tied) | — |
| Animation segments | **696**, one per event: the engine has no `step` index, so grouping falls back to one event = one beat ("approximate timing") | Every event gets its own hop |
| Dynamic playback budget | `clamp(duration × 0.3, 30, 45)` = **45 s** for every regulation match (`clock.js dynamicBase`) | **About 15 events per second, about 65 ms per event.** The budget dates from the first-goal format (about 70 events per match) and was never revised for regulation scoring |
| Authoritative positions | 4×3 grid cells, at most one cell per step per player | Motion between cells is a short hop |
| Motion layer rule | `motion.js cellSafe`: presentation movement may not leave the recorded cell | Within a beat players stand in place, then hop at the boundary |
| Goalkeepers | Engine records **no keeper position**; renderer pins each keeper to the centre of the goal line and moves them only during their own logged action (`renderer.js goalkeeperMarkers`) | Keepers look completely static |

So all six suspected causes apply, in this order of weight:
1. **Excessive playback speed.** The fixed 45 s budget is the dominant cause.
2. **Coarse positional snapshots** (cells).
3. **Discrete grid movement.**
4. **No continuous off-ball movement.**
5. **Insufficient interpolation physics.**
6. **Ball and player synchronisation** is acceptable (the receiver arrives before the ball is the contract), but invisible at 65 ms per event.

Slowing the same hops down alone would give a slower slideshow. The fix needs pacing, continuous motion and data together.

## 2. Proposal

### 2.1 Pacing: a highlights default plus true speeds (fixes cause 1)

- **Highlights (default):** every possession that reaches the attacking third, contains a shot, a turnover in a dangerous area, a counter, a save or a goal plays in full. Quiet build-up between them is skipped with a visible "≫ 03:12 → 04:05" time-jump card, and the clock jumps honestly. Target 2–4 minutes per match.
- **Full match** at **0.75×, 1×, 1.5×, 2×**, where 1× = 1 simulated second shown in 0.4 real seconds (a 20-minute match ≈ 8 minutes). Speed changes playback τ only.
- **Instant** stays as it is: final state and full commentary.
- Every event is still drawn in Full; Highlights never shows an event out of order and never hides a goal.
- The old pace names (fast, normal, dramatic, instant) map to the new set for saved settings.

### 2.2 Continuous movement (fixes causes 2–5)

**Steering instead of hopping.** Each player is a moving body with position, velocity and heading. Every frame it steers toward a target point, within limits of maximum speed and acceleration taken from its own attributes:
- top speed from pace;
- acceleration and turning from agility;
- ball-carrying smoothness from technique.

Fast players visibly accelerate harder. Technical players turn tighter with the ball. Deterministic, using fixed time steps from τ, independent of frame rate.

**Target points that follow football logic, within the recorded cell:**

| Player state (from the event log) | Target within the authoritative cell |
|---|---|
| Ball carrier | Ball path (carry or dribble line) |
| Committed supporting attacker | Point toward the forward or open side of the cell (away from the nearest defender, toward the goal), drifting continuously, giving a visible run into space |
| Rest-defence player | Goal-side, ball-side corner of the cell |
| Engaging defender (`roles.challenger`) | Between the carrier and goal, closing at contact time (contract T-V5: never more than 0.6 cell away at contact) |
| Helper (`roles.helper`) | Covering line between the carrier and the most advanced support |
| Out-of-position player (`availability > 0`) | Recovery run toward their own goal side of the cell, sprint gait until `recovery_run` |

- **Cell changes** become a run started early, during the previous beat once the next cell is known (lookahead on the timeline), so the player arrives on time instead of hopping. The cell rule is kept: the player is in the recorded cell at each event's τ, and moves continuously between.
- **Idle drift:** small, seeded, continuous movement inside the cell (scanning, adjusting), so nobody freezes.

### 2.3 Ball

Every ball flight already has a start and end (contract §C.2). Make travel time physical:
- **Ground pass:** 0.35–0.7 s real at 1×, scaled by distance.
- **Through ball:** leads the runner.
- **Shot:** 0.25–0.4 s.
- **Clearance and long ball:** an arc with visible height.
- **Loose ball after a save, block or parry:** a bounce.

Possession is always readable: a carrier ring, plus a team-coloured trail during passes.

### 2.4 Goalkeepers (owner report: keepers don't move)

**Immediate presentation fix (for Codex to apply in `goalkeeperMarkers`):** keepers track the recorded ball across the goal (narrowing the angle) and step off the line as play approaches. Derived from the ball position only, so outcomes are untouched:

```js
// Presentation-only stance (the engine records no keeper position): track the recorded ball across the goal
// to narrow the angle, and step off the line as play approaches. Derived from the ball, so it never changes outcomes.
const goalU=side===0?0:1,near=f.ball?Math.max(0,1-Math.abs(f.ball.u-goalU)/.55):0;
let lane=f.ball?Math.max(.36,Math.min(.64,.5+(f.ball.v-.5)*(.22+.38*near))):.5,depth=.035+.04*near;
if(active&&event.zone?.lane){const target={left:.39,centre:.5,right:.61}[event.zone.lane]??.5;
  lane=f.reducedMotion?target:lane+(target-lane)*Math.sin(Math.PI*phase/2);
}
const outSweep=active&&event.type==='gk_sweep',at=px({u:side===0?(outSweep?.12:depth):(outSweep?.88:1-depth),v:lane}),radius=R*.82;
```

Claude tested this patch: syntax-checked, and viewer tests passed. It was then removed again because the file has Codex's uncommitted edits. Combined with 2.2 steering, keepers move smoothly. Save and parry dives keep the existing logged-event animation.

**Real keeper positioning** (sweeper keepers holding a higher line) belongs to the engine work in T3-14, roadmap P11.

### 2.5 Readability

- **Persistent possession marker.** Plus a short action caption on danger moments (existing `LABEL`).
- **Run arrows** for committed supporting runs during a pass.
- **Defensive line shading.**
- **Goal sequence** as now.
- **Commentary** stays event-driven and appears in time with the action.

## 3. Data additions needed from the engine (passive)

| Field | Why | Cost |
|---|---|---|
| `step` on every event (contract D1, specified 2026-10-30, not yet shipped) | Group events into real beats; removes "approximate timing" | Already computed (`tick`) |
| `targets`: each player's movement target cell for this step (from `spatial.update`) | Honest off-ball runs: the viewer can show where a player was heading even when they didn't reach the next cell | Already computed inside `update()` |
| `keeper` position line (one value per side: depth class) | Later, with T3-14 P11 | Engine design needed |

These ship with the T3-13/T3-14 engine version (new event hash, T3-12 frozen for replays).

## 4. Acceptance (Owner: "at 1×, a viewer understands possession, runs, defending, passes and chances")

**Automated, deterministic:**
- per-frame velocity and acceleration within each player's limits (no teleports, no position jump larger than vmax·dt);
- the player is in the recorded cell at every event τ;
- the receiver is in place before the ball arrives;
- no frame without movement for any on-pitch player longer than 1.5 s at 1× during active play;
- 60 fps budget: under 4 ms render on a mid laptop, measured in Chrome headless with tracing;
- identical frames for identical τ (seek-safe).

**Owner review:** a recorded side-by-side comparison of old and new on the same seed, at 1× and 2×.

## 5. Order of work (Codex)

1. Pacing (2.1). On its own it removes the "too fast" problem.
2. Keeper patch (2.4).
3. Steering bodies plus target points (2.2), behind `?motion=v2`.
4. Ball physics (2.3).
5. Readability layer (2.5).
6. Switch to the engine `step`/`targets` fields when T3-13 ships.
