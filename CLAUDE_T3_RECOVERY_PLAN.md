# T3 recovery plan

**Author:** Claude · **Date:** 2026-10-30 · **For:** Codex (implementation), owner (decisions in §7)
**Subject:** candidate `cage-t3-3 / t3-space-3` (commit `7e14dbb`), as reported in `CODEX_T3_IMPLEMENTATION_REPORT.md`.

**Status:** research and specification only.
- No production module was edited.
- Every number below comes from a flag-switchable research copy of T3. With all flags off it reproduces T3 byte for byte: 500/500 identical event hashes (see §8).
- Approved ratings v1.1 are untouched.
- Nothing here is a composition bonus, an underdog floor, a forced goal or an xG decision.

---

## 0. Summary

| Problem | Root cause (measured) | Recommended fix | Status |
|---|---|---|---|
| **Defensive stalls** (792.5 caps per 10k) | Defenders don't score (legitimate), *and* T3 has no way for a goalless match to evolve. Two of three defenders are barred from attacking, and urgency and second balls were held back as T4. Defender mirror: 0.033 goals/min, median 1,425 s. | **R1** urgency, then **R2** second-ball shot | **Validated**: 0 caps in 4,000 harness trials and 0 in 3,000 diagnostic trials |
| **Three-defender regression** (39.5% → 19.2%) | (a) T3 applies the "stay back" penalty to *every* uncommitted player, where the spike applied it only to the anchor. With rest defence 2, two of DDD's three players shoot on just 1.6–4.1% of their actions in the opponent's half. (b) Regains never add attackers, even when the opponent is caught upfield. (c) Stalls hide part of the picture. | R1 + R2, then **R5** cover-aware discipline, then **R6** the regainer joins the counter | **Validated**: DDD 19.2% → **35.1%** (full size) |
| **High Press** | Press tactic has a hidden in-possession overload (`rest −1`), and a beaten press costs nothing. *R1 + R2 make this worse: press becomes best for 9/10.* | **R3** press decoupled from rest defence, **R4** bypassed press opens a transition | **Validated**: E5 passes (press 5, counter 2, balanced 2, possession 1) |
| **Free man / artists** | In T3's grid the box is a 3-on-3 crowd (2.95 attackers vs 2.84 defenders within one cell at x=3). The spike's "more attackers than defenders" cut-back condition is almost never true. | **R7** free man created by the help defender doubling the ball | **Validated mechanically, provisional for balance** (costs DDD 2–5 pts) |
| **Midfield** (E2 −12%) | Controlled ablation: **+8 passing for a whole team lowers win rate by 0.8 pts.** Better passers choose to pass more, but passes barely succeed more (contested completion 81% → 88% across the whole passing range, pinned by the 0.88 ceiling). Normal passes go to a *random* teammate, and carrying is a free, uncontested zone gain. | **R8** pass ceiling, **R9** vision-led receiver choice, **R10** receive in space, **R11** contested carry | **Provisional**: passing sensitivity −0.8 → +1.3 pts; not yet a real function |
| **Quality-gap sensitivity** (E11 32%, E6 62.9%) | Two of the six stats in the "quality" mean (passing, tackling) have almost no causal effect in T3 (−0.8 / +0.9 pts per +8), so a big six-stat gap can be a small football gap. | R5 + R6 improve E6 to 66.9% (pass); E11 to 29.3% (still fails); midfield work is the real fix | **Open**, plus an owner measurement decision (§7) |

**Full-size results** (unchanged harness, 112,600 attempted simulations each; full output in `tests/balance/t3-research/`):

| Gate | T3 (Codex) | Stack 1: R1+R2 | **Stack 2: R1–R6** | Stack 3: R1–R8, R10, R11 |
|---|---|---|---|---|
| E1 range / max cell | 19.2–63.1% / 90.0% | 30.8–61.0% / 79.5% | **35.1–59.5% / 74.0%** | 29.8–60.6% / 78.8% |
| E1 DDD / FFF / MMM | 19.2 / 50.5 / 46.4 | 30.8 / 50.7 / 44.9 | **35.1 / 49.3 / 44.9** | 29.8 / 51.9 / 47.3 |
| E2 MID | −12% | −11% | −8% | **−3%** |
| E4 JSD (FFF vs DDD) | .110 ✓ | .071 ✗ | .058 ✗ | .037 ✗ |
| E5 best counts | press 5, counter 4, poss 1, bal 0 ✗ | press **9** ✗ | **bal 2, poss 1, press 5, counter 2 ✓** | bal 4, poss 0, press 4, counter 2 ✗ |
| E6 | 62.9% ✗ | 65.8% ✓ | **66.9% ✓** | 67.2% ✓ |
| E9 defensive caps per 10k; random median / p99 | 792.5; 112 s / 1,156 s ✗ | **0; 94 s / 701 s ✓** | **0; 92 s / 685 s ✓** | **0; 76 s / 518 s ✓** |
| E10 | ✓ | ✓ | anchor goals 12.5% (band ≤ 12) ✗ | ✗ (marginal) |
| E11 big-gap underdog | 32.0% | 30.2% | 29.3% | 26.9% |
| Gates passed (of 9) | 2 | 4 | **4** (E5, E6, E9, E12) | 3 |

Two notes on these results.
- **Stack 2 is the recommended integration target for now.** Stack 3's midfield and free-man mechanisms are real mechanics, but they lose E5 and cost DDD 5 points. They need one more research iteration (§5).
- **E4 regresses with urgency** (.110 → .058). Part of this is real: late in a goalless match, every team commits and risks more. Part is how it's measured (§7.1).

---

## 1. Ground rules for integration (owner instruction 7)

1. **One mechanism per commit**, in the order of §3. After each: run the deterministic suite (`build-t3 --check`, engine-guards, records, mechanics, golden fixtures re-recorded with a new params version), `node tools/claude-tactical-balance.cjs` at full size, and the per-mechanism test in its card. A mechanism that fails its own test is reverted, not tuned.
2. **Version every step:** `t3-space-3` → `t3-recovery-1`, `-2`, … so replays stay reproducible.
3. **Nothing reads role labels.** Every mechanism keys off positions, commitment, availability (`oop`), capabilities and time, so the E12 guards keep passing.
4. **Evidence:** each new tag gets a predicate in `src/tactics/evidence.js`. New tags: `urgency` (calc field), `scramble` (shot kind), `press_bypassed`, `free_man`, `received_in_space`, and carry outcome `checked`.
5. **Watch both ends.** After each step, report DDD, FFF and MMM from E1 together. The owner asked that improving one archetype never silently costs another.
6. **No parameter search against the gates.** Parameters below are the spike's where one exists; otherwise they are stated once and justified. If a gate still fails, the answer is another mechanism or an owner decision, not a fitted constant.

---

## 2. Findings in detail

### 2.1 Defensive stalls: why the mirror runs for 24 minutes

The E9 pairing is Maldini/Chiellini/Thuram vs Gravesen/Stam/Vidić on T3. Diagnostic: 1,500 matches, sides swapped.

| | Maldini trio | Gravesen trio |
|---|---|---|
| shots per minute | 0.34 | 0.35 |
| goals per shot | 0.063 | 0.032 |
| shots by an uncommitted player | 6.9% | 23.0% |
| actions in opponent half by uncommitted players | 32% | 54% |
| … of which are shots | **1.6%** | **4.1%** |
| shots blocked | 36% | 46% |

The goal rate is 0.34 × 0.063 + 0.35 × 0.032 ≈ **0.033 goals/min**: median 1,425 s, with 920 caps per 10k.

There are two separate things here, and the owner asked us to tell them apart:

- **Absence of a natural finisher: legitimate, keep it.** Shot quality is 0.60 finishing + … . A defender with finishing in the 30s–40s converts unblocked box shots at roughly 5%. No mechanism here changes conversion for a given shot.
- **Inability to create attacking situations: a structural fault.**
  - `restDefence = count(DEF ≥ ATT + 4)`, so every DDD trio has rest defence 2. Two of three players are uncommitted.
  - In `step()`, uncommitted carriers get carry/dribble/shoot/wall ×0.6 (deep) or **×0.2 in the opponent's half**, plus pass ×1.6.
  - The spike applied this only to the *anchor* (`c.duty === 'anchor' && !c.committed`). T3 applies it to every uncommitted player. That deviation from the validated spike is the main cause.
  - Nothing in T3 changes as a goalless match goes on. The spike's urgency, which ended stalls there (0 caps), was classed as T4 and not imported.

### 2.2 The three-defender regression beyond stalls

DDD (Maldini/Thuram/Lúcio, 77.4) vs DMF (Ferdinand/Scholes/Del Piero, 77.1) on T3: DDD wins **7.8%**.
- DDD reaches the box on 30% of possessions (DMF 53%), takes 0.15 shots per possession (DMF 0.27), and converts 0.032 per shot (DMF 0.22).
- DMF is caught upfield on 56% of its possessions, but DDD's regains never add a runner. The regainer stays "uncommitted" and is penalised for carrying.

With Stack 2 the same matchup is **32.1%**:
- DDD reaches the box on 46% of possessions and takes 0.34 shots per possession.
- 9.2% of DDD shots are by uncommitted players; 65% of DDD goals come in transition possessions.
- DMF is caught upfield on 46.5% of its possessions. DDD now pays a price too: it is caught on 34.2% of its own possessions (T3: 0%).
- **Route of victory:** scramble 52%, box 32%, one-v-one 14%.

The hardmen now win through transitions and second balls, not by out-finishing anyone. That's the intended identity, but see the risk on R2: second-ball goals may now be *too* dominant a share.

### 2.3 Artists and the free man in T3's geometry

Ronaldinho/Rivaldo/Del Piero vs Maldini/Ballack/R9, T3, events by zone:

| Zone | Attackers near ball | Defenders near ball | Overload share |
|---|---|---|---|
| x=0 dribbles | 2.77 | 1.96 | 69% |
| x=2 dribbles | 2.80 | 2.52 | 32% |
| **x=3 (box) actions** | **2.95** | **2.84** | **7–12%** |

At the box all six players are within one cell. A free man exists only when a defender is *doing something else*: helping on the ball or out of position. So the spike's cut-back condition (`attackers > defenders` near the ball) fired 0.02 times per possession and changed nothing (30.2% → 30.7%).

R7 re-derives the free man from T3's own assignments:
- the nearest defender engages the carrier;
- the helper doubles him;
- the third tracks the deepest runner;
- any further committed attacker is unmarked.

### 2.4 Midfield: a decision/outcome mismatch

From 4,000 random T3 matches:

| Action | Zones gained per attempt | Loss rate |
|---|---|---|
| carry | **1.00** | **0%** (never contested) |
| pass (normal) | 0.23 | 13.7% |
| through ball | 0.65 | 36.5% |
| dribble | 0.37 | 27.2% |

Contested pass completion by passer composite (<70 / 70–78 / 78–86 / 86+): 81.3 / 85.3 / 86.1 / **87.7%**. The 0.88 ceiling flattens it.

**Controlled attribute ablation** (`proposals/t3-research/attr-ablation.cjs`): +8 to one attribute for all three players of one side, 2,500 random pairings × both sides, identical seeds, tactics rotated. The figure is the change in that side's win rate.

| Engine | fin | com | pace | mrk | agi | phys | wr | tech | def | sta | **pass** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T3 | +5.4 | +2.6 | +2.4 | +2.2 | +1.4 | +1.6 | +1.5 | +1.4 | +0.9 | +0.5 | **−0.8** |
| + R8 only | +5.7 | +2.9 | +3.7 | +2.8 | +2.8 | +1.8 | +1.6 | +2.1 | +0.8 | +0.1 | **+0.4** |
| Stack 3 + R9 | +3.9 | +2.5 | +3.2 | +2.8 | +2.9 | +2.1 | +2.1 | +1.7 | +0.7 | +0.3 | **+1.3** |

The regression of win rate on team means (8,000 matches) agrees. +1 SD of own MID, holding ATT and DEF, gives −6.1 pts win and **+0.1 pts possession share**. Midfield buys neither goals nor the ball.

Two hypotheses were tested and rejected:
- **Codex's unreviewed tempo formula** (`MC − TE`): neutralising it (flag M1) changes nothing (−6.1 → −6.1).
- **The duel slope** (spike k 20 and .10/.90 vs T3's 22 and .12/.88; flag Q1): no effect on E6 or E11. Our own task file was inconsistent here: the constants table says 20/.10/.90, but the T3.3 row says "start 22/.12/.88". Codex followed T3.3, and the measurement says it doesn't matter. Keep T3's values.

### 2.5 High Press on T3

- **Pressing hardmen vs passers** (Keane/Kanté/Mascherano on press vs Zidane/Alonso/Scholes on balanced, 3,000 matches): 43.6% on T3, 31.2% with R3+R4.
  - With R4, a beaten press puts the passers into an open transition **0.27 times per possession**. Those possessions score **7.9%** of the time, against roughly 4.7% for an ordinary possession.
  - The press tactic's own box reach falls from 56.6% to 36.9%: R3 removes its hidden extra committed attacker.
- **Same pairing, passers on counter:** 41.2% → 32.1% with R3+R4. Counter is now a credible answer to the press.
- **Stack 1 alone (urgency + second ball) makes press best for 9/10 compositions.** Pressing gains most when everybody commits late. **R3/R4 must follow R1/R2 immediately.** Do not release a build with R1/R2 but without R3/R4.

### 2.6 Quality sensitivity (E6, E11)

v0.4 passed E11 (19.8%) for the wrong reason: tackling dominated everything. In T3, finishing dominates (+5.4 per +8), and passing and tackling are near zero. The six-stat mean weights all six equally, so an 8-point six-stat gap made mostly of passing and tackling is a small football gap.

- **Engine side:** R5/R6 bring E6 into band (66.9%). Making passing and tackling matter (midfield work, §5) is the principled route for E11.
- **Measurement side:** owner decision §7.2.

---

## 3. Mechanism cards, in integration order

Every card maps onto existing T3 functions in `src/engine/tactical-match.js` (`step`, `shoot`, `loose`, `turnover`, `restart`) and `src/tactics/params.js`. Exact reference code for every card is in `proposals/t3-research/make_research.py`, as patches against the frozen T3 bundle, with the flag name shown.

### R1: Urgency (flag D4)

**Priority 1. Status: validated, a spike constant; T4.3 was already authorized.**

- **Root cause:** nothing in T3 changes as a goalless match goes on (§2.1).
- **Calculation:** `u(t) = clamp((t − 150) / 60 × 0.12, 0, 0.8)`, with t in simulated seconds. Then:
  1. **Risk:** in `step()`, after the discipline multipliers, multiply the utilities `shoot`, `dribble`, `through`, `wall` (and `cutback` if R7 is present) by `(1 + u)`.
  2. **Commitment:** wherever T3 calls `S.commitment(team)` (in `restart()` for both teams, and in `turnover()` for the regaining team), after it, if `u > 0.35`, set `committed = true` on the uncommitted player with the highest `ATT − DEF`. Only do this if at least two players are uncommitted, so **at least one player always stays back**.
  3. Symmetric for both teams, with no composition or role input.
- **Parameters:** start 150 s, rate 0.12/min, cap 0.8, commitment threshold 0.35 (reached at 325 s). All spike values.
- **Integration points:** `params.js` (an `urgency` block); `step()` utilities; a wrapper around `S.commitment` in `restart()` and `turnover()`; event `calc.urgency`.
- **RNG:** none.
- **Expected behaviour:** after about 5½ goalless minutes both teams push one more player forward and gamble more. Matches that reach that point open up.
- **Risks:**
  - homogenises late-match behaviour (E4 falls);
  - pressing gains (press becomes best for 9/10 in Stack 1, so R3/R4 are required next);
  - a slight overall shortening.
- **Tests:**
  - Unit: `u = 0` at t ≤ 150; `u = 0.12` at 210 s; cap 0.8; never fewer than one uncommitted player.
  - Alone, defender-mirror caps fall from 920 to about 120–135 per 10k (median 1,068 s).
  - Acceptance is evaluated *with R2*: E9 defensive ≤ 1/10k.

### R2: Second-ball shot after an attacking rebound (flag D5b)

**Priority 2. Status: validated for termination; parameters provisional.**

- **Root cause:** after a block or miss, T3's attacking rebound winner simply resumes normal play at x=3 and is usually engaged again. In the spike, the scramble was half of what ended stalls.
- **Calculation:** in `loose()`, when the attack wins the rebound, set `scramble = true`. At the start of the next `step()`, if `scramble`, clear it, then with probability **0.6** call `shoot('scramble')`. Otherwise continue normally.

  The scramble shot uses T3's blockers unchanged (`ctx.d`, `ctx.helper`). It differs from a box shot as follows:
  - `base = P.shot.box.C` (−0.55), the same as a central box shot;
  - `quality = 0.7 × eff(shot) + 0.3 × phys`;
  - **no `P.shot.pressure` term**, because the defence is reorganising.

  Reset `scramble` in `restart()` and `turnover()`.
- **Why these values:**
  - It is a box shot, so it gets the box base. The spike's −0.1 was stronger than a settled shot, with no football reason.
  - Physical strength matters in a loose-ball scramble, but finishing still dominates (70/30). The spike used 50/50.
  - The spike's stronger version (flag D5) lifted DDD further (37.2% quick) but made scrambles 62% of DDD goals. Rejected.
- **Integration points:** `loose()`, the start of `step()`, `shoot()` (base, quality, pressure), shot kind `scramble`.
- **RNG:** one draw (shoot or not) per scramble opportunity, then the usual shot draws.
- **Expected behaviour:** blocked shots stop being dead ends. Teams that win second balls (pace, agility, physique via the rebound composite) get real chances. This is the first route to goal for trios without a striker.
- **Risks:**
  - Scramble goals become the dominant DDD route (52–56% under Stack 2). In real football, rebounds and second balls are a minority of goals, so this may still be over-weighted. **Information band, not a gate:** report the scramble share of goals per composition; if it exceeds about 40% for any composition, revisit the 0.6 shot probability before anything else.
  - MMM drops about 3 pts (low physique).
- **Tests:**
  - With R1: defender-mirror caps **0** (0/1,000 quick, 0/4,000 full harness, 0/2,000 diagnostic); mirror median 596 s, p99 3,122 s; random median 94 s, p99 701 s.
  - A scramble never fires after a defensive rebound.
  - The shot kind is recorded.

### R3: Press no longer removes rest defence (flag C2)

**Priority 3. Status: validated.**

- **Root cause:** `TACTICS.press.rest = −1` silently commits an extra attacker *in possession*. Pressing teams attack with more players (box reach 56.6% vs 36.9%).
- **Calculation:** `TACTICS.press.rest = 0`. Engagement height, counter-press trigger and fatigue are unchanged. In T3, the immediate counter-press is already limited to `0.2 × pressTrigger` for one action, so the spike's other C2 terms (counter-press ×0.55 and −0.6 logit) have no T3 counterpart and are **not** needed.
- **Integration point:** `params.js` only.
- **RNG:** none.
- **Expected behaviour:** pressing becomes a defensive choice with a defensive cost, not a free attacking overload.
- **Risk:** pressing compositions weaken; DMF is −1 to −2 at E5 scale.
- **Test:** E5 with R3 alone, against Stack 1: press best count falls.

### R4: A beaten high press opens a transition (flag C1)

**Priority 4. Status: validated.**

- **Root cause:** in T3 a press that is beaten costs nothing beyond one action of `oop`.
- **Calculation:**
  - In `step()`, if the carrier is engaged at `x ≤ 1` and the defending team's **tactic** `engageHigh > 0.5` (Press only), set `pressedHigh = true` for this possession.
  - The press is *bypassed* when any of these happens while `pressedHigh` is set:
    - the carrier wins a dribble or wall duel and reaches `x ≥ 2`;
    - the carrier beats a shield press (`press_beaten`);
    - a pass or through ball is completed to `x ≥ 2`.
  - On bypass: `transition = true` (T3's existing transition effects apply: shot +0.4, through-ball utility ×1.6, outlet available), the beaten presser gets `oop = 2` (pass case: unchanged), `pressedHigh = false`, and the event gets tag `press_bypassed`.
  - Reset `pressedHigh` on `restart()` and `turnover()`.
- **Integration points:** `step()` (dribble/wall win branch, shield `press_beaten` branch, pass-complete branch); evidence predicate for `press_bypassed` (pressedHigh was set, and progression reached x ≥ 2 or the press duel was lost).
- **RNG:** none.
- **Expected behaviour:** press-resistant players (escape, composure, passing) punish the press, and Counter becomes a credible reply (§2.5).
- **Risk:** Counterattack is rarely *best* (E5 counter 2). That's acceptable; the gate requires each tactic best ≥ 1 and none best for more than 5.
- **Tests:**
  - Unit: no `press_bypassed` without Press.
  - With R3, on Stack 1 + R3 + R4 + R5 + R6: **E5 passes** (full size: balanced 2, possession 1, press 5, counter 2; 9/10 compositions swing ≥ 5 pts).
  - Report "presses beaten into transition per possession" and "goal rate in bypassed possessions" (`tools/claude-t3-research.cjs --diag`).

### R5: Cover-aware discipline (flag D1b)

**Priority 5. Status: validated.**

- **Root cause:** §2.1. Restricting all uncommitted players is the deviation from the spike.
- **Calculation:**
  - In `step()`, `covered = (count of teammates with oop = 0 whose oriented x < carrier x) ≥ 1`.
  - For an uncommitted carrier who is `covered`, the discipline multiplier is **1.0 for `carry` and `shoot` only**. Dribble and wall keep T3's 0.6 / 0.2, and the pass ×1.6 preference stays.
  - Committed players and uncovered uncommitted players are unchanged.
- **Why only carry and shoot:** a covered centre-back may step into space and may shoot when he arrives. He still doesn't take players on.
  - The broader variant (flag D1: everything ×1, no pass preference) gave a similar DDD gain but pulled E4 JSD down further (0.051 vs 0.066 quick), so defenders played like forwards. Rejected.
- **Integration point:** the discipline line in `step()`.
- **RNG:** none.
- **Expected behaviour:** defenders contribute to attacks when someone is behind them. Uncovered last men behave exactly as in T3.
- **Risks:**
  - The anchor goal share rises. Stack 2 gives 12.5% against the E10 band 2–12%: anchors score a little more than the band. Treat this as a band to review (§7.3), not a constant to fit.
- **Tests:**
  - Unit: an uncovered uncommitted carrier gets exactly T3's multipliers.
  - Report "shots by uncommitted players" for DDD; target "> T3, < committed" (Stack 2: 9.2% vs T3 6.1%).
  - E6 stays in band.

### R6: The regainer joins the counter when the opponent is caught (flag D3)

**Priority 6. Status: validated.**

- **Root cause:** "defensive players contributing to attacks after regaining possession". In T3, commitment is reset by policy at every regain, so the ball-winner is penalised for carrying into the space he has just created.
- **Calculation:**
  - In `turnover()`, after the regaining team's commitment is set, if `transition` (loss at x ≥ 2 or a press win) **and** at least one opponent was caught (the existing `caught` list is non-empty), set `winner.committed = true` until the next `restart()` or `turnover()`.
  - Nobody else changes. The space must actually exist (`caught`), so this is not a blanket bonus.
- **Integration point:** `turnover()`.
- **RNG:** none.
- **Expected behaviour:** Maldini intercepts with two forwards caught upfield, then carries into midfield and becomes a runner. Iron Fortress's attacking route becomes "win it, then go".
- **Risk:** more transition goals overall. Monitor the conceded-goal-after-high-loss rate for FFF (`tools/claude-anatomy.cjs`).
- **Test:** R5 + R6 on top of R1–R4 give DDD 30.8% → **35.1%** at full size (FFF 49.3%, MMM 44.9%), with E1 max cell ≤ 75%.

---

## 4. Free man (R7): validated mechanism, provisional for balance

### R7: Free man created by help defence (flag A2t)

- **Root cause:** §2.3.
- **Calculation:** in `step()`, when the carrier is engaged at `x ≥ 2`:
  - `sup` = teammates with oop = 0 who are committed or at oriented x ≥ 2.
  - `markers` = available defenders other than the engaging defender `d` and the current helper.
  - If `sup.length > markers.length`, a free man exists. He is the member of `sup` farthest from any marker (tie: better shot).
  - Add `U.cutback = (0.3 + (pass − 70) / 30) × (sup.length − markers.length) × riskAppetite`. No discipline multiplier; R1's urgency multiplier applies.
  - **Resolution:**
    - The interceptor is the nearest available defender within distance 1 of the receiver, excluding `d`.
    - If there is one, `duel(0.75 × eff(pass) + 0.25 × (receiver agility + pace) / 2, eff(interceptor, intercept), bias 1.0)`. If there isn't, the pass is complete (one roll is still drawn).
    - On completion, `d.oop = 1`, and the helper (if he isn't the interceptor) gets `oop = 1`, because both committed to the ball. The receiver shoots from his own cell (box or edge) through T3's normal `shoot()`, so blockers are whoever is genuinely near him.
    - On interception: turnover, reason `read_cutback`.
- **Why it's genuine:** it exists only when the defence spends a second man on the ball and the attack has an extra committed player. Its value scales with commitment and passing, not finishing.
- **Measured** (artists vs Maldini/Ballack/R9, 3,000 matches):
  - artists wins 30.2% → 34.2% (T3 base) and 29.5% → 33.2% (on Stack 2);
  - cut-backs 0.16–0.18 per possession at 86% completion;
  - **goals per shot unchanged** (0.311 → 0.323);
  - shots per possession 0.30 → 0.37; blocked 36% → 31%.
  - The gain comes from more and cleaner chances, not better conversion, which is what the owner asked for.
- **Risk (why provisional):**
  - Compact, doubling defences concede more: DDD −2.3 (quick, T3 base) and −5.3 at full size inside Stack 3.
  - Matches shorten (median 77 s), and E11 worsens slightly.
  - A defence's choice to double should carry a cost, but DDD shouldn't lose more than it gained from R5/R6.
- **Before adopting:** test a defensive counterpart. A compact defence (compactness ≥ 0.7) whose third defender is closer to the free man than to the runner should take him instead (zonal "pass-on"). Not yet researched.
- **Integration points:** `step()` utility block and a new `cutback` branch; tag `free_man` with the free man's ID, `sup` and `markers` for the evidence validator.
- **RNG:** one draw per cut-back, then the shot draws.
- **Tests:**
  - Cut-backs only when `sup.length > markers.length`; the evidence lists all markers.
  - The FFF gain comes with unchanged goals per shot (±0.02).
  - DDD's E1 share falls by no more than 2 pts at full size.

---

## 5. Midfield (R8–R11): provisional, one more research iteration

These are real mechanics, but together they don't yet produce a positive midfield effect. Integrate them only after R1–R6 pass, and one at a time.

### R8: Passes get their own ceiling (flag B4t)

- **Calculation:** for **normal passes only** (not through balls or outlets, which aren't at the ceiling):
  - `p = clamp(logistic((A − D) / k + bias − 0.45 + support − help), 0.12, 0.96)`, where A, D, bias, support and help are T3's existing pass terms.
  - The −0.45 holds the population pass-loss rate at T3's level: 13.8% vs 13.7%, measured over 4,000 random matches.
- **Effect:** contested completion by passer band 76.7 / 82.4 / 86.0 / 90.5%, a spread of 13.8 pts (T3: 6.4). The pass ablation moves from −0.8 to +0.4.
- **Note:** an earlier version shifted through balls too, and their loss rate rose from 36.5% to 46.8%. Hence normal passes only.
- **Status:** provisional, but low-risk. The aggregate interception rate is unchanged by construction.

### R9: Vision-led receiver choice (flag M2)

- **Calculation:** T3 picks a normal pass's receiver *uniformly at random*.
  - Instead, `best = argmax over mates of ((oriented x − carrier x) + min(2, distance to nearest available defender))`.
  - With probability `clamp((vision − 60) / 40, 0.2, 0.9)`, pass to `best`; otherwise to a random mate.
- **RNG:** one extra draw per normal pass; the random draw happens only on the "not best" branch.
- **Effect:** alone, it lowers the pass ablation (−1.6), because more progressive passes means more interceptions. Combined with R8 and R10 it gives **+1.3**, the best passing sensitivity measured.
- **Status:** provisional; only useful together with R8.

### R10: Receive in space (flag B2)

- **Calculation:** after a completed normal pass, with probability `clamp(0.10 + (eff(pass) − 75) / 35 + (receiver agility − 75) / 70, 0.03, 0.75)`, the receiver's next action is unengaged. This is the spike formula minus the displacement term, which T3 doesn't have.
- **RNG:** one draw per completed normal pass.
- **Effect:** alone, E2 MID −12% → −9% (quick); in Stack 3, −3% at full size.
- **Status:** provisional.

### R11: Contested carry (flag B5)

- **Calculation:** after T3 picks the carry's destination (x + 1 and a new lane), if an available defender stands **in the destination cell**, the carrier doesn't advance. The lane change still happens; outcome `checked`. Next action, the carrier is engaged if a defender is near.
- **Effect:** 27% of carries are checked; the average carry gain falls from 1.00 to 0.73 zones; progression shifts towards passing.
- **RNG:** none.
- **Status:** provisional.
- **Risk:** slows play. Check E9 medians.

**What the midfield set achieves (Stack 3):** E2 MID −3% (T3 −12%), MMM 47.3% (T3 46.4%), and passing turns from harmful to slightly helpful. But E5 fails (possession tactic never best) and DDD loses 5 pts. **Next research step (Claude):**
- make retention under pressure depend on escape and pass, so that MID moves possession share, which is currently +0.1 pts per SD;
- add a midfield-denial metric (§7.1);
- then re-test R8–R11 on Stack 2.

---

## 6. Tested and not recommended

| Flag | Idea | Result | Verdict |
|---|---|---|---|
| D5 | Spike-strength scramble (base −0.1, 50/50 physique) | DDD 37.2% quick, but 62% of DDD goals were scrambles | Replaced by R2 |
| D1 | Covered uncommitted players fully free (incl. dribbles, no pass preference) | Same DDD gain as R5, E4 JSD 0.051 | Replaced by R5 |
| D6 | Corners from 35% of blocked shots, aerial duel, header | DDD 21.6% (no gain), adds an event type | Dropped for now |
| Q1 | Spike slope k 20, clamps 0.10/0.90 | No effect on E6/E11 | Keep T3's 22 / 0.12 / 0.88 |
| M1 | Remove the MC − TE tempo scaling | No effect on midfield (−6.1 → −6.1) | Not the cause; Codex's formula can stay pending review |
| A2 | Spike cut-back condition (attackers > defenders) | Fires 0.02 per possession in T3 | Replaced by R7 |
| C3 | Fatigue saturates at 55 instead of 140 | Stamina sensitivity +0.5 → +1.1; mirror median 544 → 540 s | Harmless, small; hold for the midfield iteration |

**One unexamined T3 behaviour, for Codex to confirm:** `transition` is set at a regain and never cleared until the next turnover or restart. Every shot in a possession that began with a regain in its own half gets +0.4 logit, however long the possession lasts. If that's unintended, clear it after the first pass completed at x ≥ 2 or after N actions. Not tested here.

---

## 7. Owner decisions needed

1. **E4 and E2 measure the wrong window or the wrong quantity.**
   - E4 compares behaviour over whole matches. Under urgency, long defensive matches converge, which is intended adaptation. **Proposal:** measure identity over the first 150 s (before urgency); keep whole-match E4 as information.
   - E2 measures midfield by goals per possession, which can't see denial. **Proposal:** add E2w (win-probability effect of +1 SD MID, holding ATT/DEF) and possession share. Today both are flat or negative, so this changes the measurement, not the verdict.
2. **E11's quality basis.** The "≥ 8-point gap" uses the six-stat mean, where passing and tackling count a third but have about zero causal weight in T3 (§2.6). Either:
   - (a) keep it, and accept that E11 can only pass once the midfield work makes passing and tackling matter; or
   - (b) define quality as the mean of all 11 attributes.

   I recommend (a): don't change the yardstick to pass the test.
3. **E10 anchor band.** With R5/R6, anchors (the deepest player by duty) score 12.0–12.5% of goals, against the 2–12% band. Defenders joining counters is the intended behaviour. Widen the band to 15%, or treat it as an alarm rather than a gate.
4. **Scramble share.** Is about 50% of DDD's goals from second balls an acceptable identity ("hardmen win the scraps")? If not, R2's 0.6 is the knob, at some cost to termination.
5. **Roster expansion provenance (found during this work):** the working tree is adding 37 players (Gattuso to Salah) to `proposals/ratings-v1.json` and the roster.
   - The file still says `ratings-v1.1`, "approved", author Claude. The 63 approved players are unchanged; I checked every value.
   - The new ratings haven't had the owner approval or editorial verification pass the 63 had.
   - **Recommendation:** version them separately (e.g. `ratings-v1.2-draft`, with `status` per player) and route them through the same verification.
   - All research here used the committed 63-player roster (`proposals/t3-research/roster-expansion-63.js`). Results must be re-run on the 100-player roster once it's approved.

---

## 8. Reproduction

| Item | Command |
|---|---|
| Rebuild research engine from the frozen T3 snapshot (`proposals/t3-research/base-cage-t3-3.js`, SHA-256 `df8ee54b…515ce`, commit `7e14dbb`) | `python proposals/t3-research/make_research.py` |
| Identity check: no flags = T3 | `node tools/claude-t3-research.cjs --identity` → `IDENTITY PASS: 500/500` |
| Build a variant | `node tools/claude-t3-research.cjs --build D1b,D3,D4,D5b,C1,C2` → `work/t3-research/engine-….js` |
| Full harness on a variant | `node tools/claude-tactical-balance.cjs --roster proposals/t3-research/roster-expansion-63.js --engine <variant>` |
| Matchup anatomy | `node tools/claude-t3-research.cjs --diag --flags <F> --a <ids> --b <ids> [--ta press --tb counter --n 3000]` |
| Attribute ablation | `node proposals/t3-research/attr-ablation.cjs <engine> 2500 8` |
| Progression and pass sensitivity | `node proposals/t3-research/midfield-probe.cjs <engine>` |
| Midfield regression | `node proposals/t3-research/midfield-regress.cjs <engine> 8000` |
| Full-size outputs | `tests/balance/t3-research/t3r-full-*.{txt,json}` |

Sample sizes:
- Full-size runs: 400 matches per E1 pairing (SE about ±0.8 pts on a composition's overall share).
- Quick runs: a quarter of that. E5 at quick size is noise; use full size for E5.
- Diagnostics: 1,500–3,000 matches.
- Ablations: 5,000 paired games per attribute (SE about ±0.6 pts on a difference).

`--roster` was added to `tools/claude-tactical-balance.cjs` (default unchanged) because the live roster changed mid-study.

## 9. Handoff summary for Codex

- **Integrate now, in order, one per commit:** R1 → R2 → R3 → R4 → R5 → R6. R3/R4 must land before any build that ships R1/R2.
- **Hold:** R7 (pending the zonal pass-on counterpart), R8–R11 (midfield iteration), C3.
- **Don't port** D1, D5, D6, Q1, M1 or A2.
- **Reference code:** the flagged patches in `proposals/t3-research/make_research.py`. Re-implement them in the modules (`params.js`, `tactical-match.js`, `evidence.js`). Don't copy the research bundle.
