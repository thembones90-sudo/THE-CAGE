# THE CAGE · 15-Trait Engine, Phase 1 Specification

**Author:** Claude · **Date:** 2026-10-30 · **For:** Big Pickle (prototype implementation), owner (decisions in §11)
**Brief:** `CLAUDE_BIG_PICKLE_TRAIT_BRIEF.md`
**Base engine:** `cage-t3-3 / t3-space-3` (`src/engine/tactical-match.js`, `src/tactics/*.js`, bundled by `tools/build-t3.cjs`).
**Status:** specification only. No production, test, config or ratings file was changed to write it.

---

## 0. Summary

- Traits are **behaviour policies**. They change *which* action a player chooses, *where* he moves, *whom* he marks or passes to, and *whether* he engages. They never change a duel's inputs, the logistic, the clamps, shot quality, fatigue maths or any rating.
- One mode switch: `traits: {enabled: true}`. **Off is the default.** When off, no trait code runs, no trait data is read, and results are byte-identical to `cage-t3-3`. That includes the event hash, the draw count and the frozen result shape.
- When on, traits add **zero RNG draws**. Each hook either reshapes weights that an existing draw already resolves, or makes a deterministic choice.
- Primary strength `s = 1.0`, secondary `s = 0.5`. Strength scales **choice weights and activation frequency only**.
- There are eight hook points (H1–H8). None of them is inside `probability`, `duel`, `shoot`'s probability block, `loose`'s duel or `recover`.
- Every trait has a defined counter: another trait, a tactic, or a geometry its holder can't control.
- The prototype is built in isolation (§9) by anchor-checked patches over the production modules. It is never merged into `src/` in Phase 1.

---

## 1. What the engine gives us to work with

Grid: `x ∈ 0..3`, oriented for the team in possession (3 = opponent box); `lane ∈ {0,1,2}`. Three players a side.

| Engine piece | Where | What a trait may legitimately touch |
|---|---|---|
| Off-ball movement | `CageSpatial.update` | The **target cell** passed to `move()`. Movement credit (agility-based) is untouched, so a trait can't make anyone faster. |
| Defensive assignment | `update`: `available` sorted by (oop, distance); slot 0 → ball, slot 1 → help cell, slot 2 → deepest runner | Slot order (a restricted swap) and per-slot target cell |
| Commitment | `S.commitment` at restart/turnover; `committed` drives discipline and "caught upfield" | A player who is moved forward by a trait must become `committed` (§4.4) |
| Engagement | `step()`: `engaged = !!d && R() < engage` | The threshold `engage`, by the engaging defender's traits. Same single draw. |
| Action choice | `step()`: utilities `U`, discipline multipliers, floor, one roulette draw | Multipliers on `U` after discipline, before the floor. Same single draw. |
| Pass receiver | Normal pass: `mates[floor(R()·n)]`. Through/outlet: `runner = forward[0]` | Weighted mapping of the same draw (normal); deterministic runner choice (through/outlet) |
| Outcomes | `probability`, `duel`, `shoot`, `loose`, `recover`, `turnover`, fouls | **Nothing.** These are off-limits. |

Two consequences follow, and the owner should accept them explicitly (§11.1):

1. **Positional traits change outcomes through geometry.** If an Anticipator stands in the passing lane, `passingDefenders` lists him and he gets the interception duel. His duel odds are the same as anyone's. "No outcome bonus" is therefore defined precisely: *for a given game state, every probability is the function T3 computes. Traits only change which state arises.*
2. **Choice-only traits can still raise or lower win rates**, because better or worse decisions matter. That's the point of the feature, and the equity gates bound it (§8.3).

### Roster trait data (static count from the working tree)

78 of 139 players have `traits:{primary, secondary}`. The 61 older players have none. Primary counts, by static grep (Big Pickle must recompute at runtime and include it in the report):

| Trait | Primary | | Trait | Primary | | Trait | Primary |
|---|---|---|---|---|---|---|---|
| Wall | 7 | | Maestro | 4 | | Predator | 12 |
| Enforcer | 4 | | Architect | 7 | | Magician | 6 |
| Anticipator | 4 | | Destroyer | 3 | | Executioner | 9 |
| Tracker | 5 | | Engine | 5 | | Phantom | 3 |
| Libero | **1** | | Surgeon | 4 | | Juggernaut | 4 |

Libero (1 primary, 1 secondary) and Destroyer (3 primary, 0 secondary) are thin. Their tests use constructed scenarios and assigned-trait probes (§8.2), not roster frequency.

---

## 2. Global rules

### 2.1 Mode and data access

- `simulate({teams, tactics, seed, mode, traits})`. `traits` is `undefined | false | {enabled: true, version: 'traits-proto-1', exclude?: string[]}`.
- `exclude` lists trait names to disable. It's used by ablation tests only.
- `TR = traits?.enabled === true`. Every trait code path is guarded by `if (TR)`. When `!TR`:
  - the trait module is not called;
  - `BY_ID[id].traits` is not read;
  - no fields are added to events or to the result.
- When on, each player gets a frozen trait record at setup: `q.tr = {p: 'Wall', s: 'Anticipator'}` or `null` (untraited). Nothing else reads the roster's `traits`.
- **Untraited players behave exactly as in T3.** No placeholder pairs, and nothing derived from role labels or ratings. The engine-guard regex (`.role`, legacy `r.*` fields) must keep passing on the trait files.
- An invalid pair is a setup error (`Error('Invalid trait pair: id')`), not a silent fallback. Invalid means unknown name, a duplicate, or a missing slot.

### 2.2 Strength

- `s(q, T) = 1.0` if `T` is q's primary, `0.5` if secondary, `0` otherwise.
- **Weight hooks (H4, H5, H6):** a multiplier `m = 1 + s·β`, with β per trait and action (§3). If both of a player's traits touch the same weight, the multipliers compose by product. The product is clamped to `[0.6, 1.6]` per action.
- **Engage hook (H4):** an additive term `s·δ`, then `lim(engage', 0, 0.95)`. At `x = 3`, T3's `engage = 1` stays 1 unless a trait says otherwise (only Wall does, and only outside the box; see §3).
- **Discrete hooks (H1, H2, H6 runner choice):** a duty cycle. The primary acts on every eligible tick. The secondary acts only on eligible ticks where `(tick + slotIndex(q)) % 2 === 0`, with `slotIndex` the player's index in `team.ps`. This is deterministic, needs no RNG, and gives the secondary half the frequency.
- **Precedence:** where both traits want to override the same discrete decision on the same tick, the primary wins.

### 2.3 RNG discipline

- **No new `R()` calls, ever.** Not when off, not when on.
- The normal-pass receiver uses the *same* draw `u` the T3 line uses, mapped onto cumulative weights (§3, H6).
  - When no passer trait is active, the code path is literally T3's `mates[Math.floor(u * mates.length)]`.
  - Don't rely on float equivalence of an equal-weight cumulative pick.
- Draw parity is a test (A3, B2): for any decision where the trait result equals the T3 result, both modes consume the same number of draws in the same order.

### 2.4 Never inside these

Trait code must not appear in, or feed values into, the following:
- `probability`, `duel`, `logistic`;
- the `shoot()` block from `base` to `p`, and block resolution;
- `loose()`'s duel and ranking;
- `recover`, `tire`, `eff`;
- the foul rule;
- `turnover`'s `caught` / `oop` assignment;
- `comp`, `raw`, `policy.derive`, `calibration`.

A test greps the patched functions for `tr.` / `TraitHooks` references (A4).

---

## 3. The fifteen traits

Notation: `s` is strength; "eligible" is the activation predicate; a "→" on an action is a multiplier `1 + s·β` (H5). Defensive orientation: `dx = 3 − x` (0 = own goal line). "Available" means `oop === 0`. Every value is an **initial, stated-once value**. Per recovery-plan rule 6, none of them is fitted to gates.

### 3.1 Defence family

#### Wall: holds the line, contains, blocks the lane

- **Position (H2):**
  - As slot 1 (help): target the cell goal-side of the ball *in the ball's lane* (`dx_ball − 1`, ball lane), instead of T3's adjacent-lane help cell. This puts him in the shooting lane.
  - As slot 2: hold zonally at `(max(0, dx_ball − 1), 1)` rather than following the deepest runner, *unless* that runner is already at `dx ≤ 1`, in which case T3's target applies.
- **Engagement (H4):** `δ = −0.20` when Wall is `d` and `x ≤ 2`. He contains rather than diving in. At `x = 3` there is no change (engage stays 1).
- **Carrier actions (H5):** none.
- **Eligible:** Wall is defending and available.
- **Counterplay:**
  - Executioner and other edge shooters: an unengaged carrier at x = 2 gets T3's `openShot ×1.6`.
  - Phantom: a zonal Wall doesn't follow the gap runner.
  - Carry: Wall concedes ground outside the box.
- **Telemetry:** `wall_contain` (engage threshold lowered and not engaged), `wall_lane` (slot-1 override).

#### Enforcer: man-marks the most dangerous attacker, engages hard

- **Target (H2):** in slot 2, mark the opponent with the highest `c.ATT` (ties: higher `c.shot`, then id order), not the deepest runner. Use that player's cell as the target. If that player is the carrier, fall back to T3's target.
- **Engagement (H4):** `δ = +0.15` when Enforcer is `d`.
- **Carrier actions (H5):** none.
- **Eligible:** defending, available, and the marked player is not the carrier.
- **Counterplay:**
  - Phantom or Predator decoys drag him out of shape, leaving the deepest runner free.
  - Surgeon and Maestro choose a different receiver.
  - Magician: higher engagement means more dribble duels, which a skilled dribbler can win.
- **Telemetry:** `enforcer_mark` (with `markId`), `enforcer_engage`.

#### Anticipator: reads the pass, sits in the lane

- **Position (H2):** in slot 2, target the **interception cell**. That is the first cell on the Manhattan pass path (same walk as `passingDefenders`) from the ball to the most advanced runner that is not the ball cell, taking whichever such cell is nearest the Anticipator (ties: nearer the runner).
- **Engagement:** no change.
- **Carrier actions (H5):** none.
- **Eligible:** defending, available, a forward runner exists, and the path has at least two cells.
- **Counterplay:**
  - Magician, Juggernaut: dribble or wall pass instead of passing.
  - Phantom: shifts lane and breaks the path.
  - Maestro: recycles square or back.
  - Runner left free: if the Anticipator doesn't intercept, the runner is unmarked.
- **Telemetry:** `anticipator_lane`; on an interception by the Anticipator, `calc.traits` notes `on_path: true`.

#### Tracker: pursuit path, not pace

- **Position (H2):**
  - In slot 2, or whenever the Tracker has `oop > 0`, target the **pursuit point**: the cell one step goal-side of his quarry along the x axis, `(quarry.dx − 1, quarry.lane)`, clamped to 0. This cuts the angle instead of chasing the current cell.
  - Quarry: the deepest runner in slot 2; the ball carrier when `oop > 0`.
  - **Movement credit is unchanged.** He arrives no sooner per tick. He arrives in a better place.
- **Engagement (H4):** `δ = +0.15` when Tracker is `d` and the carrier's previous action was `carry` or a completed `through_ball`/`outlet` (a ball-carrier running into space).
  - This requires a trait-state field `prevAction`, which is written only when on.
- **Carrier actions (H5):** none.
- **Eligible:** defending, and either a forward quarry exists or `oop > 0`.
- **Counterplay:**
  - Maestro: recycling sideways or backwards defeats a pursuit angle aimed goal-side.
  - Wall pass and Magician: committed chasers are beaten by a lay-off.
  - Juggernaut: shield at x ≤ 1.
- **Telemetry:** `hunter_pursuit` (the quarry and pursuit point), `hunter_engage`.

#### Libero: sweeps behind, steps out with the ball

- **Position (H2):** when not slot 0, target the sweeper cell: `(max(0, min(dx of other defenders) − 1), 1)`. That's one row behind the deepest teammate, central. This puts him on the path of through balls.
- **Engagement:** no change.
- **Carrier actions (H5), when `x ≤ 1`:**
  - `carry` → β = +0.6 (steps out), applied after discipline, so it partly offsets the uncommitted ×0.6;
  - `through` → β = +0.4;
  - `shield` → β = −0.3.
- **Eligible:** position, defending and available. Actions, carrier with `x ≤ 1`.
- **Counterplay:**
  - Magician 1v1: the sweeper cell isn't the help cell, so `helper` is often absent.
  - Executioner: space at the edge.
  - High press: Libero carries into engagement at x = 1.
- **Telemetry:** `libero_sweep`, `libero_step_out`.

### 3.2 Midfield family

#### Maestro: tempo control, never forced shots

- **Carrier actions (H5):**
  - Unengaged and not in transition: `pass` β = +0.4, `through` β = −0.25, `carry` β = −0.2.
  - Engaged: `pass` β = +0.3, `wall` β = +0.2, `dribble` β = −0.3.
  - **`shoot` is never touched.**
- **Receiver (H6):** a normal-pass receiver weight `w = 1 + s · openness`, where `openness = min(2, distance to the nearest available defender)` (0–2). The mapping uses the existing draw.
- **Score state (optional, flag `maestroScore`, default off in Phase 1):** in timed mode, when his team leads, `through` gains a further β = −0.15. (Recovery R1's urgency would make the opposite case; see §10.)
- **Eligible:** Maestro is the carrier.
- **Counterplay:**
  - Press tactic or Destroyer: more engagement, so more `pressPenalty` on passes.
  - Anticipator: lanes.
  - Low-risk recycling concedes progression. A Maestro trio may out-possess a side and still lose.
- **Telemetry:** `maestro_tempo`, `maestro_receiver` (chosen receiver ≠ the T3 receiver for the same draw).

#### Architect: progressive passing from deep

- **Carrier actions (H5), when `x ≤ 1`:** `through` β = +0.5, `carry` β = −0.15.
  - Engaged: halve both β (he needs time).
- **Receiver (H6):** a normal-pass weight `w = 1 + s · max(0, oriented x of mate − x)`, so forward mates are preferred.
- **Eligible:** carrier at `x ≤ 1`.
- **Counterplay:**
  - Press: engagement halves the effect and raises interception bias.
  - Anticipator and Libero on the path.
  - Tracker: pursuit angle on the receiver.
- **Telemetry:** `architect_progress`, `architect_receiver`.

#### Destroyer: midfield ball-winner, counter-press

- **Assignment (H2):** when the ball is at the defending team's `dx ∈ {1, 2}` and the Destroyer is available and within distance 2 of the ball, he takes **slot 0** (the ball). The T3 slot-0 player moves to his slot.
  - Only one Destroyer per team does this per tick (the lowest `team.ps` index).
- **Engagement (H4):**
  - `δ = +0.15` when Destroyer is `d` and the ball is at `dx ∈ {1, 2}`;
  - a further `+0.10` when the possessing team regained within the last tick (`recentRegain`). That's the counter-press.
- **Carrier actions (H5):** "win it, give it": `pass` β = +0.3, `dribble` β = −0.3, `carry` β = −0.2.
- **Eligible:** as stated per hook.
- **Counterplay:**
  - Juggernaut shield and Magician dribble against an engaged Destroyer.
  - Through balls behind him: when he leaves the back line, slot 1/2 positions are thinner.
- **Telemetry:** `destroyer_step`, `destroyer_engage`, `destroyer_counterpress`.

#### Engine: box-to-box runner

- **Position (H1):** in possession, if Engine is uncommitted, **covered** (some other available teammate is at oriented x < Engine's oriented x or at the rest cell), and the ball is at `x ≥ 1`, target the second support cell `(zone.x, adjacent lane)` instead of the rest cell. Engine becomes `committed` (§4.4).
- **Position (H2):** out of possession, if Engine was committed at the turnover and `oop === 0`, target the goal-side cell of the ball `(max(0, dx_ball − 1), ball lane)` ahead of the T3 slot target, for 2 ticks after the turnover. That's the recovery run.
- **Carrier actions (H5):** `carry` β = +0.3 when unengaged.
- **Eligible:** as stated per hook.
- **Counterplay:**
  - Tracker and Destroyer: committing forward exposes the team to `rest_defence_exposed`, because Engine is now `committed` and can be caught upfield.
  - Fatigue: no extra cost, since carries already cost `sprint`.
- **Telemetry:** `engine_forward`, `engine_recover`.

#### Surgeon: the final ball to the right man

- **Carrier actions (H5):** at `x = 2`, `through` β = +0.5. Engaged: β = +0.25.
- **Runner choice (H6, through ball only):** pick the forward mate whose pass path has the **fewest** available path defenders (the `passingDefenders` length). Ties go to the more advanced mate, then the T3 order.
  - This replaces `forward[0]` **for the pass target only**. `U.through`'s existence test is unchanged.
- **Eligible:** carrier at x = 2 with at least two forward mates (otherwise there's no choice and no activation).
- **Counterplay:**
  - Compact defence, Wall and Anticipator: when every path has ≥ 1 defender, his choice adds nothing.
  - Enforcer marking his preferred runner.
- **Telemetry:** `surgeon_select` (with `chosen` and `t3Runner`).

### 3.3 Attack family

#### Predator: lives in the box

- **Position (H1):** committed, ball at `x ≥ 1`: target `(3, lane*)`, where `lane*` is the lane at x = 3 with the fewest available defenders within distance 1. Ties go to centre, then the T3 lane. With two Predators, the second takes the next best lane.
- **Carrier actions (H5):**
  - at `x = 3`: `shoot` β = +0.4, `pass` β = −0.2, `dribble` β = −0.2;
  - at `x ≤ 1`: `pass` β = +0.2. He doesn't build play; he lays it off.
- **Eligible:** position, in possession, committed, not the carrier. Actions, carrier as stated.
- **Counterplay:**
  - Wall: blocks in the box, and ctx.d/helper are in the shooting lane.
  - Absence from build-up: when he's at x = 3, he isn't support at x = 1, so `supportQ` is lower and press-vulnerable.
  - Libero sweeping the through-ball path.
- **Telemetry:** `predator_box`, `predator_shoot`.

#### Magician: takes players on, draws defenders

- **Carrier actions (H5), when engaged:**
  - `dribble` β = +0.5, `wall` β = +0.3;
  - if `ctx.defenders ≥ 2`, a further `dribble` β = +0.2 (he invites the double, which frees a teammate);
  - `pass` β = −0.2.
- **Eligible:** Magician is the carrier and engaged.
- **Counterplay:**
  - Enforcer and Wall: help defence. `helpQ` applies in the duel itself, unmodified.
  - Destroyer engagement.
  - A failed dribble at x ≥ 2 is a turnover with transition.
- **Telemetry:** `magician_take_on`.

#### Executioner: shoots from range

- **Carrier actions (H5):** at `x = 2`, `shoot` β = +0.6. At `x = 3`, no change. No change to the free-kick taker (T3's highest `long` stays).
- **Eligible:** carrier at x = 2.
- **Counterplay:**
  - Tracker and Destroyer: engaging at the edge keeps T3's `engagedShot ×0.7`.
  - Wall in the lane: block.
  - Self-limiting: edge shots have low base logits (−2 / −2.5), so overuse wastes possessions.
- **Telemetry:** `executioner_range`.

#### Phantom: finds the gap, releases early

- **Position (H1):** committed, ball at `x ≥ 1`. Target `(min(3, zone.x + 1), lane†)`, where `lane†` maximises the minimum distance to any available defender. Ties go to the lane different from the ball lane, then centre.
  - Phantom is between the lines; Predator is on the last line.
- **Carrier actions (H5):** engaged: `pass` β = +0.3, `wall` β = +0.3, `dribble` β = −0.3. Unengaged at `x ≤ 2`: `carry` β = −0.2.
- **Eligible:** position, committed in possession and not the carrier. Actions, carrier.
- **Counterplay:**
  - Enforcer man-marking.
  - Anticipator, who is on the path whatever the lane.
  - Compact help: a Phantom in the gap at x = zone.x + 1 is still within radius 1 of a compact helper.
- **Telemetry:** `phantom_gap`.

#### Juggernaut: holds it up, plays through contact

- **Position (H1):** committed, ball at `x ≥ 1`: target `(3, 1)`, the centre target man.
- **Carrier actions (H5):**
  - engaged at `x ≤ 1`: `shield` β = +0.5;
  - engaged at `x ≥ 2`: `dribble` β = +0.3, `pass` β = −0.2.
- **Runner choice (H6, outlet only):** in transition, if a forward Juggernaut exists, he is the outlet target, instead of `forward[0]`.
- **Eligible:** as stated per hook.
- **Counterplay:**
  - Enforcer and Destroyer: the tackle composite wins the duel.
  - Tracker: pursuit angle to the outlet target.
  - Phantom-free attack: a central target man is easy to find, so Anticipator benefits.
- **Telemetry:** `juggernaut_hold`, `juggernaut_outlet`.

### 3.4 Distinctness check

No two traits share both a hook and a predicate:

| Hook | Traits | Distinguishing predicate |
|---|---|---|
| H1 attack position | Predator, Phantom, Juggernaut, Engine | x = 3 least-marked lane / x = zone + 1 max-gap / (3, centre) / support cell when covered |
| H2 defensive position | Wall, Enforcer, Anticipator, Tracker, Libero, Destroyer, Engine | lane goal-side zonal / best-attacker mark / path cell / pursuit point / sweeper / slot-0 swap in mid third / post-turnover goal-side |
| H4 engage | Wall −, Enforcer +, Tracker + (chase), Destroyer + (mid third, counter-press) | different predicates |
| H5 shoot | Predator (x = 3), Executioner (x = 2) | zone |
| H5 dribble | Magician +, Juggernaut + (x ≥ 2) | Magician scales with defenders, Juggernaut with shield at x ≤ 1 |
| H5 pass/through | Maestro (retain), Architect (x ≤ 1 through), Surgeon (x = 2 through), Destroyer (release) | zone and direction |

---

## 4. Hook points

All hooks live in a single module, `CageTraitHooks` (prototype: `proposals/traits/prototype/traits.js`). Each one is a pure function of the state it receives, plus a per-match `traitState` (allocated only when on). Hooks return either the T3 value unchanged or an override, plus a telemetry record.

| # | Where (patched copy) | Signature (suggested) | Called |
|---|---|---|---|
| H0 | `simulate` setup | `init(T, BY_ID, opts) → traitState` | once, when on |
| H1 | `S.update`, attacker loop, before `move(q, target)` | `attackTarget(q, target, ctx) → target'` | per non-carrier attacker, per tick |
| H2a | `S.update`, after `available` is sorted | `defSlots(available, ctx) → available'` | per tick |
| H2b | `S.update`, defender loop, before `move` | `defendTarget(q, slot, target, ctx) → target'` | per defender, per tick |
| H3 | after H1 moves, inside `update` | `commitAdjust(attack, ctx)` | per tick (Engine only, §4.4) |
| H4 | `step()`, after `engage` is computed, before `R() < engage` | `engage(d, engage, ctx) → engage'` | per step |
| H5 | `step()`, after the discipline loop and `restPass`, before `Q.floor` | `utilities(c, U, ctx) → U'` | per step |
| H6a | normal-pass receiver line | `receiverWeights(c, mates, ctx) → w[] \| null` | per normal pass |
| H6b | through/outlet `runner` used as pass target | `runner(c, forward, action, ctx) → runner'` | per through/outlet |
| H7 | `emit` | attach `calc.traits` (on only) | per event |
| H8 | after the match | `summary(traitState) → result.traits` (on only) | once |

`ctx` carries the following:
- `x`, `lane`, `poss`, `tick`, `transition`, `recentRegain`, `engaged` (H5 only);
- the T3 `context()` object;
- `S` helpers.

Hooks **must not mutate** `ctx` or players, except as follows:
- H1/H2 return targets;
- H3 may set `committed`;
- `traitState` writes its own fields.

### 4.1 Utility multiplication (H5) exactly

```
for each action a in U (iteration order = T3's insertion order):
  m = Π over carrier traits T with rule(T, a, state):  (1 + s·β)
  U[a] = U[a] * clamp(m, 0.6, 1.6)
```

Then T3's `Math.max(Q.floor, u)` and roulette run unchanged, with the same single `R()`. Record `weightsT3` (pre-hook) and `weights` (post-hook) in `calc.traits` when on.

### 4.2 Receiver mapping (H6a) exactly

```
u = R()                                // the draw T3 already makes
if (!TR || w === null)  receiver = mates[Math.floor(u * mates.length)]   // literal T3 path
else  receiver = first i with u * Σw < cumulative(w)_i   (fallback: last)
```

The `mates` order is T3's (`T[poss].ps` without the carrier).

### 4.3 Defensive slot swap (H2a)

Only Destroyer swaps slots. All other defensive traits act on the **target** of the slot T3 assigned. This keeps the T3 invariant: exactly one defender goes to the ball and at most one to the help cell.

### 4.4 Commitment rule (H3)

A trait may never move an *uncommitted* player forward of the rest cell without making him `committed`. Otherwise he escapes `turnover()`'s caught-upfield check, which would be a free lunch.

- Engine's forward run sets `committed = true` only if another teammate stays uncommitted, so at least one player remains back. This mirrors recovery R1's safety rule.
- The flag is reset by T3's own `S.commitment` at the next restart or turnover.
- Predator, Phantom and Juggernaut act only when already committed. They never change commitment.

### 4.5 Ordering and ties

- Hooks iterate players in `team.ps` order.
- Lane ties: centre (1), then the T3 target lane, then the lower index.
- Never iterate over object keys whose order depends on insertion of traits.
- Never use `Array.prototype.sort` without a full tie-break chain ending in id order.

---

## 5. Telemetry (on only)

### Per event: `calc.traits`

An array, present only when on and non-empty. Each entry is `{id, trait, slot: 'p' | 's', hook: 'H1'..'H6b', tag, before, after, flip}`.

- **`flip`** (for H4/H5/H6): whether the T3 decision for the **same draw value** would have differed.
  - For H5: re-run the roulette on `weightsT3` with the same `roll`.
  - For H4: `roll < engage` vs `roll < engage'`.
  - For H6: the T3 receiver index vs the chosen one.
  - This is an exact counterfactual for that decision, at no RNG cost. It doesn't account for downstream divergence.
- **Do not add trait tags to `e.tags`.** `CageEvidence.validate` rejects unknown tags. Trait evidence lives in `calc.traits` and gets its own validator (§8.2, B4).

### Per match: `result.traits`

For each traited player and each of his traits:
- `eligible` (ticks where the predicate held);
- `active` (the hook changed a value);
- `flips`;
- `posOverrides`;
- `engageDelta` (count, sum).

Team totals, plus `trait-version`.

### Harness rollups

For each trait, as primary and as secondary:
- activation rate per eligible tick;
- flip rate per eligible decision;
- the behaviour metric of §8.2;
- win-rate delta, on − off, with paired seeds.

---

## 6. Mode and versioning

- Prototype engine object: `CageTraitEngine`, `VERSION: 'cage-t3-3+traits-proto-1'`, `PARAMS_VERSION` unchanged.
- The trait β/δ table is versioned separately as `TRAIT_PARAMS_VERSION: 'traits-proto-1'`.
- A replay records `{engine, params, traits: {enabled, version, exclude}}`. A trait-on replay must not load in an engine with a different trait version.
- Production `CageEngine.simulate` ignores the `traits` key and is not modified in Phase 1.

---

## 7. Interaction with the T3 recovery plan (R1–R11)

The production base still has none of R1–R6. Trait balance measured on T3 **will move** when they land.

| Recovery item | Trait interaction | Rule |
|---|---|---|
| R1 urgency | Multiplies `shoot`/`dribble`/`through`/`wall` by `(1 + u)`. It composes with H5. | Apply H5 **after** urgency. The trait clamp applies to the trait product only. |
| R5 cover-aware discipline | Overlaps Libero/Engine stepping out | Libero's `carry` β is defined *after* discipline. Re-measure Libero once R5 lands; it may need lowering. |
| R6 regainer joins counter | Overlaps Engine's forward run and Destroyer's release | No change to the hooks; report the overlap. |
| R7 free man | Phantom's gap-seeking manufactures the free man | Hold the Phantom balance verdict until R7's status is decided. |
| R9 vision receiver | Supersedes Architect/Maestro H6a if adopted | If R9 lands, H6a for these traits becomes a bias on R9's `best` choice, not on the uniform pick. Re-spec at that point. |
| R11 contested carry | Reduces the value of Libero/Engine `carry` β | Re-measure. |

**Recommendation:** run every ON test twice:
- (a) on the production T3 modules (the identity anchor);
- (b) on the Stack 2 research variant (`tools/claude-t3-research.cjs --build D1b,D3,D4,D5b,C1,C2`), with the trait patch applied on top.

Report both, but make gates binding on (a) only until R1–R6 are integrated.

---

## 8. Acceptance tests

Proposed location: `proposals/traits/tests/`, run under Node using `vm`, like `tests/tactical/mechanics.cjs`. Sample sizes follow §8 of the recovery plan.

### 8.1 Baseline identity: traits OFF (all binding)

| ID | Test | Pass |
|---|---|---|
| A0 | `node tools/build-t3.cjs --check`, engine-guards, records, mechanics and both golden fixtures still pass. Proves the prototype touched nothing. | all pass |
| A1 | Trait engine with `traits` undefined, `false`, and `{enabled: false}` vs production `CageEngine` (`?engine=t3` candidate). 2,000 seeds × random trios from all 139 × all 16 tactic pairs, both modes. | `eventHash`, `score`, `duration`, `draws` and `JSON.stringify(result)` identical in 100% |
| A2 | Off, with every player's `traits` stripped vs present | identical results, so off never reads trait data |
| A3 | Instrumented `R`: draw sequence (index → call site) identical on/off when every hook returns T3's value. Force this with `exclude: all 15` on an *enabled* engine. | identical sequence and hash. Proves "enabled but inert" = T3 |
| A4 | Static: trait files and patched functions contain no `Math.random`, `Date.now`, `.role`, legacy `r.*`; the §2.4 functions contain no trait references | grep pass |
| A5 | Golden fixtures `golden-t3-space-2/3` replay unchanged off | pass |

### 8.2 Mechanics: traits ON (all binding)

| ID | Test | Pass |
|---|---|---|
| B1 | Determinism: same input twice gives the same hash; run on → off → on in one context, no state leaks | identical |
| B2 | Draw parity: the per-step draw count by action type equals T3's formula (engage 1, roulette 1, carry +1, duels +1, foul +1, normal pass +1); no extra call sites | 0 violations over 2,000 matches |
| B3 | Outcome audit: for every duel and shot event, recompute `p` from the recorded `calc` with T3's `probability()` / shot formula, with no trait inputs | exact match (to rounding) in 100% |
| B4 | Trait evidence validator: each `calc.traits` entry re-derivable from `positions`, `availability`, `commitment`, `zone`. Examples: an Anticipator target cell is on the path; a Tracker target is the pursuit point; Destroyer swap only at dx ∈ {1,2}; Predator only when committed. | 0 violations |
| B5 | Unit scenarios, one constructed state per trait, hook called directly: expected target, multiplier and engage value; secondary duty cycle exactly half on 100 ticks | 15/15 |
| B6 | Activation reach: each trait activates in ≥ 50% of matches where a holder plays (random trios with a holder) | 15/15 |
| B7 | Behaviour metric moves in the specified direction, paired seeds, on vs off, ≥ 2,000 matches per trait (table below) | direction correct, and \|Δ\| ≥ 2 SE |
| B8 | Primary vs secondary: behaviour Δ for secondary holders / primary holders between 0.3 and 0.7. Use the **assigned-trait probe** (§8.4) for Libero, Destroyer, and any trait with < 3 holders in a slot. | 15/15 |
| B9 | Not overbearing: flip rate ≤ 25% of a holder's eligible decisions; no trait flips > 10% of *all* team decisions | pass |
| B10 | Commitment safety: never 0 uncommitted players because of H3; no uncommitted player at oriented x ≥ 2 because of a trait | 0 violations |

**B7 behaviour metrics:**

| Trait | Metric (holder or holder's team) | Direction |
|---|---|---|
| Wall | dribble duels faced at x ≤ 2 per opposition possession; blocks by holder | ↓, ↑ |
| Enforcer | shots by the opponent's top-ATT player | ↓ |
| Anticipator | the holder's share of `passingDefenders[0]` on through balls | ↑ |
| Tracker | mean distance to the quarry after 2 ticks of `oop` | ↓ |
| Libero | holder on the through-ball path; carries from x ≤ 1 | ↑, ↑ |
| Maestro | team possession share; pass share of actions | ↑, ↑ |
| Architect | through balls from x ≤ 1 | ↑ |
| Destroyer | engagements at dx ∈ {1,2}; counter-presses | ↑, ↑ |
| Engine | committed ticks; carries | ↑, ↑ |
| Surgeon | path defenders on through balls from x = 2 | ↓ |
| Predator | holder at x = 3 when the ball is at x ≥ 2; box shot share | ↑, ↑ |
| Magician | dribble and wall share when engaged | ↑ |
| Executioner | edge shot share | ↑ |
| Phantom | min distance to the nearest defender when receiving | ↑ |
| Juggernaut | shields at x ≤ 1; outlet receptions | ↑, ↑ |

### 8.3 Counterplay and equity: traits ON

**Counterplay (C1), binding.** For each trait X with its listed counter Y (a trait or a tactic), measure the marginal effect `Δ_X = win%(X on) − win%(X off)` on a fixed probe trio.
- Measure it against a **neutral** opponent (untraited, or traits excluded) and against a **counter** opponent (same trio with Y enabled, or the counter tactic).
- Pass: `Δ_X(counter) < Δ_X(neutral)` by ≥ 2 SE, for **all 15**.
- 3,000 paired matches per cell.

The counter for each trait is the first one listed in §3.

**Equity:**

| ID | Gate | Band | Status |
|---|---|---|---|
| Q1 | Mean on − off win-rate effect per trait (as primary), averaged over random trios containing a holder | within ±3 pts for every trait | binding |
| Q2 | Trios of only untraited players vs random traited trios: on − off effect on the untraited side | within ±2 pts | binding. If it fails, see §11.2 |
| Q3 | No trait (as primary) has an on − off effect above +5 pts in any of the 10 E1 compositions | ±5 | binding |
| Q4 | Goals per shot, **by shot kind and zone (box C/S, edge C/S, one_v_one, fk)**, on vs off | ±0.02 each | binding: the "no conversion bonus" check |
| Q5 | E1 range, E5 best counts, E9 stalls/caps, median duration | not worse than off by > 1 pt / 1 tactic / any caps / 10% | binding |
| Q6 | E4 JSD on vs off | report; information | information |
| Q7 | No pair (primary + secondary combination) present in the roster exceeds +4 pts | ±4 | information (sample sizes small) |

### 8.4 Assigned-trait probe (test-only)

For thin traits, a test-only override `traits: {enabled: true, assign: {id: {p, s}}}` lets a harness give a probe player a trait for measurement.
- This **never** writes to roster data.
- It's only accepted when `opts.testProbe === true`.
- It records `probe: true` in the result.
- It's used for B8, C1 and Q1 when the roster has fewer than 3 holders in that slot.

---

## 9. Technical handoff to Big Pickle

**Goal:** a working, isolated prototype that passes §8.1 and §8.2 and reports §8.3, without changing any existing file.

### 9.1 Files to create, and only these

```
proposals/traits/prototype/traits.js            CageTraitHooks + TRAIT_PARAMS (β/δ table, §3)
proposals/traits/prototype/patches.cjs          anchor-checked string patches (below)
proposals/traits/prototype/build-traits.cjs     assembles the engine → work/traits/cage-engine-traits.js
proposals/traits/tests/identity.cjs             A1–A5
proposals/traits/tests/mechanics.cjs            B1–B10 (incl. evidence validator for calc.traits)
proposals/traits/tests/balance.cjs              B7, C1, Q1–Q7, with the --stack2 option of §7
proposals/traits/PROTOTYPE_REPORT.md            results, run commands, sample sizes, failures as-is
```

Generated bundles go under `work/traits/`. Don't write to `src/`, `tests/`, `tools/`, `proposals/ratings*`, `index.html` or any roster file.

### 9.2 Build approach

1. Read the production modules exactly as `tools/build-t3.cjs` does: the same ratings merge, roster file list, calibration and LUT.
   - Re-use its output by importing the generated `src/cage-engine.js` text, and patch only the T3 segment (the `tactical-match.js` and `spatial.js` portions).
   - Before patching, record the SHA-256 of `src/engine/tactical-match.js` and `src/tactics/spatial.js` in the report.
2. Apply the patches in `patches.cjs`. Each one is `{name, file, anchor, replacement}`; the anchor is an exact substring that must occur **exactly once**, otherwise the build fails. This catches drift when R1–R6 change the files.
3. Each patch inserts `TR ? H.x(...) : original` at the hook sites in §4. Nothing else changes.
4. Rename the exported object to `CageTraitEngine` so both engines can live in one `vm` context for A1.

### 9.3 Implementation order

Commit nothing. Report each stage.

1. Skeleton: all hooks return T3's value. Then **A1–A5** must pass, including A3 with `exclude: all`.
2. Telemetry plumbing (H7/H8, `flip`). Re-run A1 (off unaffected).
3. One family at a time: defence, then midfield, then attack. After each, run B1–B5 and B10.
4. Full B6–B9, then the §8.3 balance on (a) T3 and (b) Stack 2.
5. Write `PROTOTYPE_REPORT.md`:
   - every gate, with pass or fail, unedited;
   - the trait distribution (§1), recomputed at runtime;
   - flagged editorial anomalies (§10, item 8).

### 9.4 Things not to do

- Don't tune β/δ to pass gates. If a gate fails, report it and propose a mechanism change for review. This is recovery-plan rule 6.
- Don't add RNG draws.
- Don't fall back to role labels or ratings for untraited players.
- Don't put trait tags in `e.tags`.
- Don't use the word `urgency` or the T4 names in any file intended for later production, because the engine-guards regex rejects them. Prototype files are outside that guard, but avoid it anyway for ease of porting.
- Don't touch the uncommitted work of other agents in the tree. Don't stage or commit anything.

---

## 10. Scope and pitfalls

### In scope (Phase 1)

- All 15 behaviours.
- On/off mode.
- Telemetry.
- The isolated prototype.
- Tests and the report.

### Out of scope

- UI.
- Commentary.
- Production integration.
- Trait assignment for the 61 untraited players.
- Any change to ratings or pairs.
- Score-state Maestro (flagged, default off).
- Set-piece taker selection.

### Pitfalls

1. **Free lunch via commitment.** Moving uncommitted players forward without `committed` hides them from the caught-upfield check. §4.4 is mandatory.
2. **Byte identity can break silently**, through event fields added when off, a changed key order in `calc`, `undefined` vs absent keys, or freezing differences. A1 compares `JSON.stringify(result)`, not just the hash.
3. **Same-draw receiver mapping** must take the literal T3 path when inactive (§4.2), or float rounding will cause rare divergences.
4. **Trait stacking in one trio.** Three Predators all target the same lane, and two Destroyers both want slot 0. The tie-break rules in §3 and §4.5 handle this; B4 checks it.
5. **The coarse grid.** At x = 3, all six players are usually within one cell (recovery §2.3). Box positioning traits (Predator, Phantom, Juggernaut) will show small effects there. B7 thresholds are in SE, not absolute, for this reason.
6. **Positional traits change who duels.** That's legitimate (§1), but the Q4 conversion check by shot kind is what proves there is no hidden bonus. Don't drop it.
7. **A moving baseline.** R1–R6 alter discipline, commitment and transition. Every trait verdict on T3 is provisional until re-run after integration (§7).
8. **Editorial pairs are provisional**, on provisional ratings, for many of the 78. A trait whose key composite is weak for its holder will act *against* him: for example, a low-dribble Magician dribbles more and loses more. That's correct behaviour, but the report should list holders whose relevant composite is below the roster's 25th percentile, for editorial review. That listing is not an engine gate.
9. **The evidence validator rejects unknown tags.** Use `calc.traits` (§5).
10. **The engine-guard regex.** The trait files must pass it if they are ever ported.

---

## 11. Owner decisions needed

1. **Definition of "no outcome bonus".** Accept §1: probabilities given a state are T3's; traits only change which states arise (positions, engagements, choices). The alternative, forbidding positional traits, would leave Wall, Anticipator, Tracker, Libero, Enforcer, Phantom and Predator with almost nothing to do.
2. **The 61 untraited players.** If Q2 fails (traits are net positive or net negative for a side), trait mode can't ship until all 139 have approved pairs. **Recommendation:** treat trait mode as unshippable outside research until every player in the roster has an owner-approved pair, regardless of Q2. A neutral player in a traited world is a design asymmetry even when it measures as balanced.
3. **The strength ratio.** Is 1.0 / 0.5 (primary / secondary) acceptable? B8 checks that it shows up as roughly half the behaviour.
4. **Thin traits.** Libero (1 holder) and Destroyer (3 primary, 0 secondary) can only be validated through the test-only probe of §8.4. Accept probe evidence for these, or hold them until more holders are approved.
5. **Order relative to recovery.** Recommendation: build and test the prototype now (on T3 and Stack 2), but integrate nothing into production until R1–R6 are in and the §8.3 gates are re-run on that base.
