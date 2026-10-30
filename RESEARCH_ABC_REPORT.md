# THE CAGE — Research report: problems A, B, C

**Author:** Claude · **Date:** 2026-10-30 · **For:** owner (Skynet), Codex
**Status:** research findings. **No live engine or `src/` file was changed.**

**Rules followed:** no win-rate targeting, no rating changes, no composition bonuses. Every proposed change is a football mechanism, tested by switching it on and off.

### Instruments (all Claude-owned, reproducible)

- **`tools/claude-anatomy.cjs` (new).** Possession anatomy for any matchup. It reports how possessions start and end, where the ball is lost, progression, support and help numbers in duels, blocked shots, xG per attempt, initiators/shooters/scorers, goal types and what happens after losing the ball high.
- **`tools/claude-tactical-balance.cjs`.** The balance checks (E-suite).
- **`proposals/tactical-spike/engine-research.src.js` (new).** The validated tactical spike plus **switchable candidate mechanisms**: A1, A2, B1–B4, C1–C3. Build any combination with `node proposals/tactical-spike/build-research.cjs A2,C1,C2`. Output goes to `proposals/tactical-spike/variants/`, which is regenerable and not committed.

**Sample sizes:** anatomy runs 3,000–4,000 matches. Balance runs are `--quick` (25% size, so roughly ±3–4 points per cell) unless stated. Re-run at full size before any acceptance decision.

**Baseline for all experiments:** the tactical spike (the mechanisms Codex is porting in T3/T4), with ratings v1.1. I also measured the live engine where the root cause sits there.

---

## A. Why comparable-quality all-attacker trios are disproportionately weak

**Probe:** Ronaldinho / Rivaldo / Del Piero (rated 1.7 below) vs Maldini / Ballack / R9.

### A.1 Measured evidence (possession anatomy)

| | Live: artists | Live: MBR | Spike: artists | Spike: MBR |
|---|---|---|---|---|
| Wins | 7.1% | 92.9% | 29.1% | 70.9% |
| Reach the opponent's box per possession | **51.6%** | 44.8% | **44.7%** | 32.1% |
| Shots per possession | 0.25 | 1.02 | 0.46 | 0.71 |
| **Own shots blocked** | **62.0%** | 7.8% | **39.2%** | 18.8% |
| xG per shot attempt (blocked = 0) | 0.15 | 0.39 | 0.39 | 0.55 |
| Through balls completed | 31.9% | 84.9% | 70.1% | 84.9% |
| Duels with 2 supporting teammates | 0% | 0% | **56.7%** | 4.7% |
| Conceded a goal after losing the ball in the opponent's half | 41.1% | 4.3% | 38.3% | 16.1% |

### A.2 Root cause

**The artists' superiority is real up to the box. It stops translating at the final action.** They reach the box *more* often than Maldini/Ballack/R9 in both engines, then lose it in two places.

1. **Shot blocking is unaffected by numbers.**
   - In the spike, the engaged defender *and* a helper both get a block roll on every shot, however many attackers are around the ball.
   - Maldini (block composite ≈ 95) plus Ballack therefore smother shots: 39% blocked in the spike, 62% live.
   - In real football, a defender facing two threats can't commit to blocking one without freeing the other.
2. **Overloads exist but only help dribbles.**
   - The spike creates 2-man support in 57% of the artists' duels.
   - Support only enters dribble and wall-pass duels. The obvious football outcome of an overload, **the square ball to the free man**, doesn't exist as an action.
3. **Every defender is always available to defend** (secondary). R9 helps block shots in his own box regardless of his work rate (45). This hides a real trade-off: a forward who stays up doesn't defend, but he *is* the counter outlet.

The remaining gap is legitimate. The artists concede after **38–41%** of their high losses, because nobody tracks back. That's their genuine weakness, and it should stay.

### A.3 Mechanisms tested

| ID | Mechanism | Artists' wins | Artists' shots blocked | Artists' xG/attempt | MBR's shots blocked |
|---|---|---|---|---|---|
| — | spike baseline | 29.1% | 39.2% | 0.39 | 18.8% |
| **A2** | **Free man:** at the box with ≥ 1 committed supporter: (a) the engaged defender can't receive a second blocker, because the helper covers the supporter; (b) new **cut-back** action: square pass to the supporter (interception check against the helper), then a shot with no pressure | **34.0%** | **24.2%** | **0.51** | 10.2% |
| A1 | **Work-rate availability:** committed players with low work rate may stay up instead of rejoining the block, and become preferred counter outlets | 27.1% | 40.0% | 0.38 | 18.9% |
| A1 + A2 | both | 33.5% | 23.2% | 0.51 | 9.9% |

**A2 is the effective, symmetric mechanism.** It's a football rule, not an attacker bonus: Maldini/Ballack/R9 benefit too (19% → 10% blocked). It helps the artists more because they generate far more overloads.

**A1 barely changes this matchup** (R9 staying up cuts both ways). It *does* matter elsewhere: it lifts Iron Fortress (see the combined results).

### A.4 Unintended consequences (measured, combined runs)

- The all-attacker composition is still **38–40% overall** at equal quality, and still beats only ~2 others. A2 fixes the final action but not the cost of 40% transition concessions.
  - **Next experiment:** recovery runs currently weigh work rate at 0.4. Pace without work rate may be under-credited (Ronaldinho and Rivaldo *can* run back). This must be tested, not assumed.
- More conversions at both ends shorten matches (median 64 s → 51 s, below the 60 s floor) and slightly raise the big-gap upset rate (24.7% → 27–30%, just over the 25% bound).
- Free-kick share falls (fewer fouled dribbles once cut-backs exist): 3.2% → 1.2–1.5% (band 2–8%).

### A.5 Tests that prove A is fixed

- **Anatomy, artists vs MBR:**
  - the artists' blocked-shot share falls to within 1.5× MBR's;
  - xG per attempt is within 0.08 of MBR's;
  - every goal type traceable to an overload, cut-back or dribble event.
- **E1:** the all-attacker composition beats ≥ 3 compositions at equal quality, with no composition bonus in the code (E12 guard).
- **Behaviour:** cut-backs ≥ 15% of the artists' box actions, ≤ 5% for Iron Fortress.
- **Regression:** E9 (median ≥ 60 s) and E11 (big-gap underdog ≤ 25%) must not break. If A2 pushes them over, re-check the shot bases; never add floors.

---

## B. How midfield quality can create a measurable advantage

### B.1 Measured evidence

**Elasticity (spike):** what +10 to all three players buys, against 3,000 equal-field opponents.

| Team | Boost | Win | Pass completion | Reach opp half | Opponent shots per minute |
|---|---|---|---|---|---|
| Orchestra (Scholes / Xabi / Riquelme) | +10 pass | +2.3 pts | **+0.5 pts** | −0.9 pts | −0.02 |
| Complete (Thuram / Lampard / Owen) | +10 pass | +3.3 pts | **−0.3 pts** | −2.5 pts | −0.04 |

Baseline progression: the Orchestra reaches the opponent's half on **56%** of possessions; Iron Fortress (Vidić/Stam/Gravesen) on **76%**.

### B.2 Root cause (three structural faults, none of them a missing bonus)

1. **Pass completion is pinned to the ceiling.** With pass bias 2.3 and slope 20, a typical pass computes to about 96% and is clamped to 90%. Passing quality is therefore nearly invisible: +0.5 points of completion per +10 passing.
2. **Progression doesn't require midfield quality.**
   - Crossing halfway is mostly an *uncontested carry*: the opponent's middle line only engages through press probability.
   - Forward passes advance by the receiver's *duty* (spearhead +1), not by the pass.
   - That's why physical defenders progress more than the Orchestra.
3. **A good pass doesn't improve the next action.** The receiver faces the same engagement roll whether the pass was perfect or barely completed. "Quality of the next attacking action", the core of midfield play, doesn't exist.

**Possession-as-denial is a consequence, not a mechanism.** It appears only when retention (fault 1) and next-action quality (fault 3) depend on passing. It should not be added as a stand-alone bonus.

### B.3 Mechanisms tested

Effects are on the Complete trio unless noted:

| ID | Mechanism | +10 pass → win | +10 pass → completion | +10 pass → opponent shots/min | Notes |
|---|---|---|---|---|---|
| — | baseline | +3.3 | −0.3 | −0.04 | |
| B1 | Settled middle line contests the halfway crossing (engagement ≥ 0.75 × (1−δ)) | +4.5 | −0.3 | −0.04 | Little effect: halfway is mostly crossed by passes, not carries |
| **B2** | **Receive in space:** a completed pass gives the receiver an unpressured next action, with probability from pass quality, receiver agility and δ | **+4.9** | +0.7 | **−0.09** | Orchestra baseline win 40.4% → 43.1%; shots per possession 0.32 → 0.40 |
| B3 | Steeper pass slope only | +3.9 | +0.8 | −0.06 | Useless while passes sit at the ceiling |
| **B4** | **Pass bias off the ceiling** (−1.1 logit, slope 12, cap 0.97) | +4.6 | **+2.5** | −0.07 | Passing quality becomes visible; interceptions rise to 24.7% (band 12–22%) |
| B2 + B4 | both | +4.0 | **+3.1** | −0.07 | **E2 midfield effect +1% → +5%** (first positive reading) |

### B.4 Unintended consequences

- **B4 raises interceptions overall** (24.7%, above the realistic band). It needs a partner change, for example lower interception composites for players not engaged, so average passing stays realistic while *differences* become visible.
- **Better passers progress *less* often** (reach-half −1 to −2.5 points). Good passers recycle patiently while δ is low. That's behaviour, not a defect, but δ's payoff must be large enough that patience pays.
- **Denial is real but modest** (−0.07 to −0.12 opponent shots per minute per +10 passing).
- In combination, E4 behaviour divergence *fell* (0.072 → 0.046–0.055). Fewer completed passes for everyone makes styles converge. Watch this.

### B.5 Tests that prove B is fixed

- **E2:** own mean midfield ≥ +8% goals per possession, controlling for attack and defence.
- **Win effect:** with attack and defence level, the trio with +3 midfield wins ≥ 55% (n ≥ 1,000).
- **Elasticity:** +10 passing → completion +2 to +4 points; opponent shots per minute −0.08 or better; next-action quality (unpressured share) +5 points.
- **Behaviour (E4):** Orchestra passes per possession ≥ 1.5× Counterstrike; the Orchestra's share of goals after ≥ 4 completed passes ≥ 30%.
- **Realism (E10):** interceptions stay within 12–22%.

---

## C. Why High Press is disproportionately effective

### C.1 Measured evidence

Spike, the same trio (Thuram/Lampard/Owen) on both sides, Press vs Balanced, 4,000 matches:

| | Press | Balanced |
|---|---|---|
| Wins | 53.2% | 46.8% |
| **Duels with 2 supporting teammates (in possession!)** | **57.0%** | 4.2% |
| Possessions starting from a counter-press win | 41% | 32% |
| Counter-press success rate | 45.6% | 46.7% |
| Reach opponent's box | 45.2% | 25.7% |

**Fatigue scale:** a pressing player costs ~3.1 fatigue per press, and the effect saturates at 140. That takes **about 45 presses**, but a median match lasts ~65 s (15–20 actions per side). **Fatigue never bites.**

**Tactic matrix (spike):** Press is the best tactic for 7–8 of 10 compositions.

### C.2 Root cause (four faults)

1. **The press tactic secretly commits everyone forward.** It lowers rest defence by one (`rest: −1`), so the pressing side gets 2-man attacking support in 57% of its duels. Much of "press" is an *in-possession* advantage unrelated to pressing.
2. **A bypassed press costs nothing.** The pressing side's block doesn't move up, so beating the press yields an ordinary situation, not space behind.
3. **The counter-press is too strong for everyone.** Roughly 46% success, starting 32–41% of all possessions. That rewards whichever side counter-presses more.
4. **Fatigue is mis-scaled** for first-goal-wins match lengths.

### C.3 Mechanisms tested

Full-size E5 tactic matrix, 240 matches per cell:

| ID | Mechanism | Press best for | Balanced | Possession | Counter | Compositions swinging ≥ 5 pts |
|---|---|---|---|---|---|---|
| — | spike baseline | **7** | 0 | 3 | 0 | 9 |
| **C1** | **Bypassed press:** a high engagement that's beaten (dribble, press escape, or forward pass into the opponent's half) creates a *transition* with the presser stranded | 4 | 2 | 4 | 0 | 8 |
| C2 | Press decoupled from rest defence; counter-press calibrated (probability ×0.55, −0.6 logit) | 6 | 1 | 3 | 0 | 5 |
| C3 | Fatigue saturates on match timescales (55 instead of 140) | 6 | 0 | 4 | 0 | 8 |
| **C1 + C2 + C3** | all | **2** | 3 | 5 | 0 | 6 |

**C1 is the key mechanism:** it gives pressing its real trade-off, *space behind*. **C2 removes the hidden in-possession bonus.** **C3 makes stamina matter, but only in combination.**

### C.4 Unintended consequences

- **Counterattack is never the best tactic** in any C variant, so the matrix fails the "each tactic best somewhere" clause. In the full combination with A2/B2/B4 it becomes best for 1–3 compositions, through transitions. The counter tactic needs its own work: faster directness payoff and a deeper block that baits presses.
- **Iron Fortress weakens.** Its tactic-matrix row falls to 37–43% under C1+C2+C3 (was 48–57% in the spike). Its main route was the over-strong counter-press. Its credible route should become *counterattack*, which links to the previous point. In the full combination its E1 composition share is 46.4% without A1 and **50.7% with A1** (forwards staying up give it targets to counter against).
- **C3 shortens long matches.** Combined with A2, the median falls below 60 s.

### C.5 Tests that prove C is fixed

- **E5:** no tactic best for > 5/10 compositions; each tactic best for ≥ 1; ≥ 6 compositions swing ≥ 5 points.
- **Press trade-off (anatomy, press side):**
  - `press_bypassed` events ≥ 10% of high engagements;
  - goals conceded after a bypassed press ≥ 2× the baseline transition rate;
  - pressing team's late-match (t > 120 s) duel win rate ≥ 3 points below early.
- **The strongest pressing trio isn't the strongest overall:** the top-5 by mean press composite must not exceed 60% win share at equal quality.
- **No hidden bonus:** a tactic only changes policy fields (rest, engagement, tempo, risk, directness, fatigue). Unit test.

---

## Combined picture (quick runs, ±3–4 pts)

| Check | Spike | A2 + B2 + B4 + C1 + C2 + C3 | + A1 |
|---|---|---|---|
| E1 composition range | 40.7–58.3% | 38.4–58.3% | 39.4–56.1% |
| All-Out Assault / Iron Fortress / Complete / Orchestra | 40.7 / 45.2 / 52.2 / 49.1 | 38.4 / 46.4 / 55.3 / 51.0 | 39.4 / **50.7** / 54.7 / 48.3 |
| E2 midfield effect | +1% | +4% | **+6%** |
| E4 behaviour divergence (FFF vs DDD) | 0.072 | 0.046 | 0.055 |
| E5 tactics | FAIL (press 5) | **PASS** | **PASS** (4/3/2/1) |
| E9 duration median | 64 s ✓ | 51 s ✗ | 51 s ✗ |
| E10 realism | ✓ | ✗ (int 22.7%, free kicks 1.2%) | ✗ (int 23.1%, free kicks 1.5%) |
| E11 quality gradient | ✓ | ✗ (big-gap underdog 27.5%) | ✗ (29.7%) |

Read this as "mechanisms that work, plus the side effects they bring", not as a candidate build. The side effects are mostly **one shared cause**: more turnovers and conversions shorten matches and add variance. They need shot-base and interception recalibration *after* the mechanisms land, not instead of them.

## Recommendations and Codex coordination

| Mechanism | Verdict | When |
|---|---|---|
| **A2** free man / numbers-aware blocking | **Validated, ready to specify** | After the T3/T4 gate passes (proposed task T4.5) |
| **C1** bypassed press creates a transition | **Validated, ready to specify** | T4.6 |
| **C2** press decoupled from rest defence + counter-press calibration | **Validated, ready to specify** | T4.6 (adjusts the T5 interim tactics table; not a recalibration) |
| **B2** receive in space | Promising; needs the B4 partner fix | Hold: Claude iteration |
| **B4** pass bias off the ceiling | Mechanism right; interception level too high | Hold: Claude iteration |
| **A1** work-rate defensive availability | Realistic; helps Iron Fortress, neutral for attackers | Hold: test with the recovery-run review |
| **C3** fatigue scale | Only useful combined; shortens matches | Hold |
| B1, B3 | No meaningful effect | Drop |

**Codex is not asked to implement anything new now.** T3/T4 proceed as specified. Ready-to-specify items get exact formulas in `CODEX_TACTICAL_TASKS.md` once Codex's T3/T4 engine passes its gate, so the research mechanisms are re-validated on the production engine rather than ported blind from the spike.

## Next research steps (Claude)

1. **Recovery runs:** should pace count more than work rate when a forward is caught upfield? This is the remaining All-Out Assault question.
2. **B4 partner:** lower interception for unengaged defenders, so passing *differences* show while average completion stays realistic.
3. **Counter tactic:** a deeper block that invites presses, plus a faster direct payoff.
4. **Shot-base recalibration** after A2/B2: restore the median duration of 60+ s and the big-gap upset rate of ≤ 25%. Shot bases only; no floors.
5. **Re-run everything at full size** on Codex's T3/T4 engine.
