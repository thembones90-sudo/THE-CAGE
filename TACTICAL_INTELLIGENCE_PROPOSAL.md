# THE CAGE — TACTICAL INTELLIGENCE PROPOSAL

**Author:** Claude (lead football simulation architect) · **Date:** 2026-10-30
**Status:** proposal for owner review. **No production engine file was changed.**
**Companion:** `CODEX_TACTICAL_TASKS.md` (implementation order and acceptance criteria).

**Authority order:** owner directive "Tactical Identity, Team Grading & Dynamic Football Intelligence" (this brief) > CLAUDE_OWNER_DECISIONS.md > EXCLUSIVE_DRAFT_RULES.md > earlier proposals.

Owner locks respected throughout:
- 3v3 for the whole match; first real goal wins.
- No 2v2/1v1 withdrawals, no forced goals, no xG fallback.
- Alternating claims; no undo.
- Best of five.
- No pre-match win probability.
- Commentary never influences the simulation.

**Evidence base.** Every [measured] number comes from the **live engine** (`src/cage-engine.js` v`cage-0.4.0`, params `golden-goal-1`, roster `editorial-v0.4-63`), loaded unmodified in Node. Ablations ran on scratch copies only.

**Method change:** compositions are compared **at equal player quality**. Both trios' mean 6-stat rating must be within 1.5 points, so the result measures *structure*, not star power. Codex's fixture sweeps compare hand-picked trios, which mixes the two.

---

## A. Current tactical engine audit

### A1. The headline result [measured]

Random trios by roster role (D/M/F), equal quality, both sides Balanced, 23,755 matches:

| Composition | Owner archetype | Overall win share |
|---|---|---|
| D D F | Counterstrike | **70.6%** |
| D F F | Spear and Shield | 64.2% |
| D M F | Complete Unit | 63.1% |
| D D M | The Wall | 59.1% |
| D M M | Engine Room | 56.9% |
| M M F | Architects | 43.6% |
| M M M | Orchestra | 41.3% |
| D D D | Iron Fortress | 39.5% |
| M F F | Street Artists | 37.3% |
| F F F | All-Out Assault | **24.2%** |

Head-to-head examples (row win %):

| Matchup | Row win % |
|---|---|
| Complete Unit vs All-Out Assault | 81 |
| Counterstrike vs All-Out Assault | 91 |
| Complete Unit vs Iron Fortress | 72 |
| Street Artists vs Complete Unit | 26 |

The owner's diagnosis is right, but the cause is narrower than "balance". **Owning one good defender plus a finisher is what wins.** Four of the five losing compositions have no defender, and all-defender trios lose for lack of a finisher.

### A2. Why: the engine is a "best defender" engine [measured]

Weighted regression of goals per possession on phase capability (30,000 random matches):

| +1 standard deviation of… | Effect on goals per possession |
|---|---|
| **Opponent's best defender** | **−63%** |
| Opponent's mean defence | −13% |
| Own mean attack | +14% |
| Own best attacker | +9% |
| **Own mean midfield** | **+1%** |

A single defender is worth about 5× a whole attack, and **midfield is effectively cosmetic.**

Per-composition mechanics (50,000 matches, equal quality):

| Composition | Shots per possession | Goal per shot | Attacking dribbles won | **Defensive duels lost** | Passes intercepted |
|---|---|---|---|---|---|
| D M F | .31 | .174 | 76% | 76% | 32% |
| F F F | .29 | .206 | 76% | **89%** | 27% |
| D D D | .35 | .036 | 77% | **45%** | 31% |
| M M M | .29 | .159 | 76% | 77% | 26% |

### A3. Root causes in the code (file: `src/cage-engine.js`)

1. **Defending is one 1v1 check against one marker, repeated until it fails.**
   - `defenderFor()` returns one defender. Every dribble is `duel(attacker, thatDefender)` with no help, no numbers, no team shape.
   - A beaten defender goes out of position, and the next duel is against the cover, usually the same weak player again.
   - With `k = 12` and clamps `.06/.94`, a weak defender sits at the 94% ceiling for every duel in the chain. **Compounding across 3–6 duels per possession is what produces the −63%.**
   - Ablation: `k = 22`, clamps `.12/.88` alone reduces it to **−28%** (the largest single lever).
2. **Attacking quality barely changes chance creation.**
   - Every composition takes .29–.35 shots per possession and wins ~76% of its attacking dribbles.
   - That's a **selection effect**: players only choose to dribble when the matchup is already favourable. So skill decides *which* option is taken, not how many chances the team creates.
   - Three elite attackers can't "overwhelm", because nothing rewards having two or three threats around the ball.
3. **Midfield has no payoff mechanism.**
   - A completed pass changes nothing about the defence. It only adds another interception roll (~26–32% per pass for **every** composition, which is very high).
   - So possession is pure risk. This is why the Possession tactic loses to everything (Codex's matrix: Possession 35.0% vs Press, 34.9% vs Counter) and why the Orchestra is weak.
4. **Every trio plays the same football.** Decisions use individual composites plus a fixed duty bias. There's no team-level behaviour:
   - no block height;
   - no number of players committed forward;
   - no rest defence;
   - no counter-press;
   - no tempo.

   Three hardmen and three artists choose actions by the same rules.
5. **The duty map forces every trio into anchor / link / spearhead with man-marking** (`MARK = {spear:'anchor', link:'link', anchor:'spear'}`). An all-attacker trio must nominate an "anchor" who man-marks the opposition striker alone. That's a structural trap no real three-forward side would choose; they'd press as a unit.
6. **Iron Fortress scores almost only by volume and fouls.** Goal per shot is .036. 22% of its shots are free kicks. Its median match is 486 simulated seconds, and **0.9% hit the safety cap** (Codex: 501 and 689 cap hits per 10,000 in defensive pairings). There's no mechanism for a defensive side's *real* routes: winning the ball with opponents committed, second balls, set pieces, technical defenders stepping out.
7. **Tactics multiply utilities but don't change structure.** Press raises the engagement probability; Possession multiplies pass utility (more interception rolls). Neither changes who stands where, so neither creates counterplay.

### A4. Parameter tuning alone can't fix this [measured, ablations on scratch copies]

| Variant | Best-defender effect | Midfield effect | All-Out Assault | Iron Fortress | Complete Unit |
|---|---|---|---|---|---|
| Live | −63% | +1% | 24% | 40% | 63% |
| k 22, clamps .12/.88 | −28% | −3% | 39% | 30% | 60% |
| Simple help defence (blend marker with best helper) | −67% | 0% | 24% | 35% | 64% |
| Finishing ×1.7 sensitivity + receiver-aware passing | −59% | −1% | 30% | 22% | 66% |
| Fewer interceptions (pass bias 1.7 → 2.6) | −55% | 0% | 26% | 39% | 64% |
| All four combined | −25% | −7% | 47% | **12%** | 63% |

Tuning moves the weakness between archetypes; it doesn't create identities. **Midfield stays at or below zero in every variant.** This needs new mechanisms (§D), not constants.

### A5. Data prerequisite (unchanged from earlier audits, now critical)

- The tactical model depends on **work rate, stamina, composure, agility and marking** (owner-approved in principle, not yet rated).
- With today's stand-ins, pure passers are mis-graded. Scholes/Xabi Alonso/Pirès scores Midfield Control 51, because the work-rate stand-in is built from defending, pace and physique.
- Collective pressing by attackers can't work while "work rate" is mostly the defending stat.
- **The 5 independent ratings are a hard prerequisite for phase T2 onward.**

**Correction to an earlier report.** The "400 random trios" composition table in ENGINE_ARCHITECTURE_PROPOSAL.md §1.2 used a random generator whose multiplication exceeded 2^53, so it repeated after about 9,600 values. That table described the retired v0.2 engine and may be distorted. All numbers in *this* document use mulberry32.

---

## B. Tactical capability model

### B1. Inputs

**11 engine attributes:**
- 6 existing editorial base ratings: pace, tech, pass, finish, def, phys.
- 5 new independent ratings: work_rate, stamina, composure, agility, marking.

The 11 legacy-derived fields are **never read**; a test enforces this.

**Player composites** (also consumed by duels):

```
dribble   = .45 tech + .25 agility + .15 pace + .15 composure
tackle    = .45 def + .30 marking + .15 phys + .10 agility
press     = .45 work_rate + .25 pace + .15 agility + .15 marking
escape    = .40 tech + .25 composure + .20 agility + .15 phys        (press resistance)
passX     = .65 pass + .20 tech + .15 composure
intercept = .55 marking + .25 work_rate + .20 pace
shotQ     = .60 finish + .25 composure + .15 tech
ATT_i = .30 finish + .25 dribble + .15 tech + .15 composure + .15 pace
MID_i = .30 passX + .20 escape + .20 tech + .15 work_rate + .15 stamina
DEF_i = .40 tackle + .30 marking + .15 work_rate + .15 pace
```

### B2. The six dimensions

Values are sorted per trio (top, second, third). **None of the formulas requires a defender, midfielder or attacker.** Three attackers can max Attacking Threat; three defenders can max Defensive Security.

| Dimension | Raw formula | Engine consumers (what it actually drives) |
|---|---|---|
| **A. Attacking Threat** | .45·ATT₁ + .30·ATT₂ + .25·ATT₃ (several threats count) | policy `riskAppetite`, `commitForward`; support quality in overload duels (§D3); shot selection |
| **B. Defensive Security** | .35·DEF₁ + .35·DEF₂ + .30·DEF₃ (collective, not best-man) | policy `blockHeight`, `restDefence`; help-defence quality; displacement resistance (§D4) |
| **C. Midfield Control** | .40·MID₁ + .40·MID₂ + .20·min(escape) | displacement gain per pass; interception resistance; policy `tempo` |
| **D. Transition Efficiency** | .35·mean(top-2 intercept) + .35·max over i≠j of (passX_i + pace_j)/2 + .30·mean pace | counter trigger and counter quality; recovery-run success; counter-press window |
| **E. Physical Dominance** | mean of (.35 phys + .25 stamina + .25 work_rate + .15 press) | shielding, second balls/rebounds, fatigue decay, press duration, foul drawing |
| **F. Tactical Adaptability** | .50·mean(second-best phase per player) + .50·min(team-best ATT, MID, DEF) | duty rotation (§D2), urgency response, policy flexibility between phases |

**Grade scale (0–100).**
- `grade = clamp(round(50 + 12·z), 5, 99)`, where z is relative to **all possible trios of the current roster version** (39,711 trios for 63 players).
- The calibration constants (mean and SD per dimension) are stored with `rosterVersion`, so grades are reproducible and don't drift silently when players are added.
- The spike used 15·z and produced 0s at the extremes; 12·z with a floor of 5 is proposed.

Illustrative output [computed with stand-ins for the 5 unrated attributes, so indicative only]:

| Trio | AT | DS | MC | TE | PD | TA |
|---|---|---|---|---|---|---|
| Vidić / Stam / Gravesen | 0* | 75 | 0* | 37 | 77 | 18 |
| R9 / Ronaldinho / Rivaldo | 86 | 25 | 86 | 43 | 49 | 23 |
| Maldini / Ballack / R9 | 63 | 59 | 64 | 73 | 69 | 65 |
| Okocha / Djalminha / Vidić | 40 | 41 | 27 | 39 | 31 | 50 |
| Maldini / Chiellini / Thuram | 8 | 84 | 35 | 66 | 79 | 34 |
| Zanetti / Makélélé / Kanté | 28 | 83 | 51 | 73 | 69 | 49 |
| Yaya / Vieira / Gerrard | 62 | 73 | 80 | 66 | 83 | 68 |

\* clamps from the old 15·z scale.

Note the last row: **all-rounders score high everywhere.** See §H, risk 2.

### B3. Proof that a grade isn't decorative

A grade is valid only if it predicts the in-match quantity it claims to measure. Each is tested against a **fixed neutral reference opponent**, which avoids circularity:

| Grade | Must correlate (Spearman ≥ 0.5) with |
|---|---|
| Attacking Threat | xG created per possession |
| Defensive Security | xG conceded per opponent possession |
| Midfield Control | possession retention per pass sequence; mean displacement reached |
| Transition Efficiency | share of turnovers converted to a shot within 3 actions |
| Physical Dominance | rebounds/second balls won; late-match (t > 180 s) duel win rate |
| Tactical Adaptability | win-rate spread across the 4 tactics (*lower* spread = more adaptable) |

If a grade fails, it's removed from the dossier until fixed. This is the rule the owner asked for: no decorative scores.

### B4. Tactical Cohesion (S–D), separate from strength

Cohesion is scored from **complementarity**, not from position labels. Points:

- **Ball-winning route exists:** max DEF ≥ 80, OR mean press ≥ 78 (a pressing front three qualifies).
- **Progression route exists:** max passX ≥ 85, OR max escape ≥ 85, OR max dribble ≥ 88.
- **Finishing route exists:** max shotQ ≥ 85, OR two players ≥ 78.
- **Named complementary pairings** (each +1, max +3):
  - creator → runner (passX ≥ 88 with pace ≥ 88);
  - destroyer behind artists;
  - target + supplier;
  - two press-resistant circulators.
- **Conflicts** (each −1):
  - ≥ 2 ball-dominant players with work_rate < 55;
  - no player with stamina ≥ 70.

Grades by roster-wide percentile: **S** top 10% · **A** next 25% · **B** 30% · **C** 25% · **D** bottom 10%.

**Cohesion never enters a probability.** It summarizes the same mechanics the engine uses: pairings are real mechanical interactions (§D5), and routes are capabilities. The test that it doesn't secretly decide matches is §F, E8.

---

## C. Tactical identity system

- **Capability roles, not career labels.** Each player's *capability role* = argmax of (ATT_i, MID_i, DEF_i) after per-phase normalization. A player is **two-way** if his second phase is within 6 points of his first: Yaya, Vieira, Ballack, Zanetti, Gerrard, Davids. Roster labels (D/M/F) are display only, and the engine never reads them (grep test).
- **Identity = nearest archetype prototype in 6-D grade space.** The ten owner archetypes each get a prototype profile vector, e.g.:
  - Iron Fortress: AT 30, DS 90, MC 40, TE 60, PD 90, TA 40.
  - All-Out Assault: AT 90, DS 30, MC 70, TE 45, PD 45, TA 35.

  The identity shown is the nearest prototype by cosine similarity. A two-way-heavy trio (Yaya/Vieira/Gerrard) can land on "Engine Room" or "Complete Unit" whatever its labels; technical defenders (Zanetti/Thuram) can land on "The Wall" rather than "Iron Fortress".
- **The label is a description, never an input.** The engine consumes the continuous grades and composites through the policy layer (§D1). Two trios with the same label but different grades play differently.
- **Post-match identity check.** The report states whether the team *played* to its identity, from event statistics: possession share, counter count, blocks, dribble share. Commentary may only use identity language that those statistics support (§G, rule C3).

---

## D. Decision-making architecture

Three layers. Only layer 3 uses the RNG; layers 1–2 are deterministic functions of the trios and tactics.

```
Layer 1  Team policy        (at kickoff; from grades + composites + tactic)  → policy vector
Layer 2  Situation model    (each action; positions, numbers, displacement, urgency, fatigue)
Layer 3  Player decision    (utilities = individual composites × policy × situation) → weighted draw → resolution
```

### D1. Team policy vector (continuous, derived; no composition switch statements)

| Parameter | Derived from | Effect |
|---|---|---|
| `blockHeight` (0 deep … 1 high) | DS distribution, mean press, PD, tactic | where defenders engage; turnover location |
| `restDefence` (0–2 players held back when attacking) | gap between team DEF₁ and the attacking need (AT), TA, tactic | numbers left for transitions |
| `commitForward` (0–3 support runners) | AT, mean work_rate, 3 − restDefence | support count in attacking duels |
| `tempo` | MC vs TE balance, tactic | actions per possession; displacement build vs directness |
| `riskAppetite` | AT, composure, urgency | through balls, dribbles, early shots |
| `pressTrigger` | mean press, stamina, tactic | engage probability outside the box; counter-press window |
| `directness` | TE, max pace, max passX, tactic | long outlet to the furthest runner after a regain |
| `rotation` | TA, two-way count | duty swaps during play (an anchor stepping into midfield, etc.) |

**Examples of what the formulas produce** (no labels involved):

- **R9/Ronaldinho/Rivaldo** (AT 86, DS 25)
  - `restDefence` 0, `commitForward` 3, high `riskAppetite`, low `blockHeight`.
  - They attack as a three, with 2 support options in every final-third duel.
  - When they lose the ball, nobody is goal-side.
- **Vidić/Stam/Gravesen** (DS 75, PD 77, AT low)
  - `restDefence` 2, `commitForward` 1, mid-deep block, high `directness`, low `tempo`.
  - Compact, win it, go long or shoot when space appears.
- **Maldini/Ballack/R9**
  - `restDefence` 1 (Maldini), `commitForward` 2, moderate everything, high `rotation` (Ballack covers both phases).

### D2. Positions and numbers (lightweight spatial)

- **Grid:** the existing 4 × 3 grid. Each player has a cell. The shape follows the ball according to `blockHeight`, `restDefence` and `commitForward`, instead of a fixed anchor/link/spear map.
- **Defensive assignment:** zonal by default.
  - The nearest in-shape defender engages.
  - The second nearest is the **help defender** if within one cell.
  - Man-marking is kept only as a tactic behaviour (Press marks tighter).
- **Duties are dynamic labels per possession** (who is deepest, who is highest), not fixed roles. `rotation` lets two-way players swap.

### D3. Numbers-aware duels (fixes root causes 1, 2, 5)

```
p = clamp( logistic( (A − D)/k + b_action + s·support − h·help + context ), lo, hi )
support = Σ in-shape teammates within 1 cell × (their dribble or passX)/100   (capped at 2)
help    = Σ in-shape defenders within 1 cell besides the engaged one × (their tackle or intercept)/100   (capped at 1)
```

- **Overloads emerge.** Three committed attackers create 2-support situations against a lone defender: Maldini *can* be outnumbered.
- **Compact blocks emerge.** Iron Fortress defends most duels with help = 1.
- **Weak individual defenders are partially rescued by teammates** (collective security), **but only if the shape kept them nearby.** All-Out Assault with restDefence 0 has no help after a turnover. That's the vulnerability, produced by position rather than by a penalty.
- **Compounding is controlled** by calibrated `k`/clamps (A4) and because a beaten defender is replaced by the help defender, not by the same weakest link.

### D4. Midfield payoff: defensive displacement (fixes root cause 3)

Each possession carries a **displacement** value δ ∈ [0, 1] for the defending block:

```
on completed pass / successful press escape vs an in-shape block:
    δ += g · (passX_passer − mean(intercept of nearest defenders))/100 · tempoFactor     (g ≈ 0.12)
on switch of lane:  δ += 0.05 · agility-weighted
each defending action with help available: δ −= 0.04 · (defender marking/100)
δ effects: help count reduced when δ > 0.5; shot base +0.8·δ logit; through-ball success +0.6·δ
δ resets to 0 on turnover; partly persists (×0.5) after a recycled pass back
```

- **Possession now *does* something.** Patient circulation by good passers against weaker readers opens chances. Possession teams also tire defenders (chasing costs stamina, §D6).
- This gives the **Orchestra** and **Engine Room** a credible route, and gives the **Possession** tactic a real payoff. Its risk stays the interception rolls, now properly scaled by passing quality.

### D5. Transitions and the counter-press

- **On a turnover:** the losing side's players committed beyond the ball are out of position, in numbers set by `commitForward`. The winning side's counter is resolved with `directness` (long outlet to the fastest runner) or by carrying.
- **Counter-press window:** for the first 2 actions after losing the ball, the losing side's players within 1 cell may attempt a regain (press vs escape).
  - High-work-rate attackers defend this way. A pressing front three is not defenceless.
  - Low-work-rate artists don't, and get punished.
- **Iron Fortress routes to goal (no bonus, all capability-driven):**
  1. Regains in midfield against opponents with high `commitForward` → numerical transitions.
  2. Second balls and rebounds off walls (Physical Dominance).
  3. Fouls drawn by strong carriers → free kicks. The *rate* is calibrated to 2–8% of goals; free kicks are a route, not *the* route.
  4. Technical defenders stepping out (marking + passX).
  5. Opponent fatigue late in long matches.

### D6. Urgency and fatigue (stalling fix that respects the owner lock)

There is no escalation and no forced goal. Two football-real, behavioural mechanisms instead:

- **Urgency.** After 180 simulated seconds, `riskAppetite` rises by +0.1 per minute up to a cap, and `restDefence` may drop by one for high-TA teams. Teams chase the game, which opens space at both ends.
- **Fatigue.** Every sprint, press and duel costs stamina, scaled by stamina and Physical Dominance. Tired defenders lose pace, agility and marking. Long matches therefore naturally open up, and favour fitter trios.

**Target:** safety-cap hits = 0 in 100,000 random matches, and ≤ 1 per 10,000 even in defender-vs-defender pairings. The void-round safety path Codex built stays as a last guard.

### D7. Same situation, different decisions (illustration)

Ball at the right edge of the opponent's half, one defender engaged:

| Team | Policy-driven choice weights (approx.) |
|---|---|
| R9/Ronaldinho/Rivaldo | dribble .35 · one-two/wall .25 · through ball .20 · shot .15 · recycle .05 (two support runners present) |
| Vidić/Stam/Gravesen | recycle .35 · shot from range .25 · long switch .20 · carry .15 · dribble .05 (one support, two held back) |
| Scholes/Alonso/Pirès | pass .45 (builds δ) · lane switch .20 · through ball .20 · shot .10 · dribble .05 |

---

## E. Tactical counterplay (emergent, not a rock-paper-scissors table)

Each tactic adjusts the policy vector. **Its effectiveness comes from player encounters:**

| Tactic | Policy change | Works when (personnel) | Exploited by |
|---|---|---|---|
| **Balanced** | none (policy = derived from personnel) | always reasonable; never a bonus | — |
| **Possession** | tempo ↓, risk ↓, δ gain ↑ | passX, escape and composure high; MC > opponent's pressing | high pressing with strong press composites (interceptions in your half → short counters) |
| **High Press** | blockHeight ↑, pressTrigger ↑, counter-press window +1 | mean press + stamina high | press-resistant circulators (escape) → beaten press = presser out of position + δ spike; fast outlets behind |
| **Counterattack** | blockHeight ↓, restDefence +1, directness ↑ | TE high: interceptors + vertical passer + pace | patient possession (δ builds against a deep block) and high-stamina sides in long matches |

Typical profile matchups and how each side wins. These are **all routes, not outcomes**:

| Profile vs profile | How the first side wins | How the second side wins |
|---|---|---|
| All-Out Assault vs Complete Unit | overloads: 2 support vs the lone anchor; dribble + one-two chains; finishing | regains with 3 committed attackers out of position; the anchor's 1v1 when overloads fail |
| Iron Fortress vs Complete Unit | help = 1 in most duels starves the striker; midfield regains → direct transitions; second balls | δ built by the link player breaks the block; fatigue of three physical defenders; the striker's finishing quality |
| Orchestra vs Iron Fortress | displacement over long possessions; lane switches tire the block | interceptions when passing quality falls short; direct counters after regains |
| Street Artists vs Engine Room | dribble overloads in the final third | possession denial; transitions into the space the artists leave |

**Rule:** no tactic or profile has a hard-coded advantage over another. A test (§F, E5) proves no fixed cycle dominates.

---

## F. Balance methodology

All experiments use a **Claude-owned harness** (`tools/claude-tactical-balance.cjs`) that loads the real engine, uses mulberry32 seeds, and swaps sides on alternate seeds. "Equal quality" = mean base rating within 1.5.

| # | Experiment | Acceptance |
|---|---|---|
| E1 | **10 × 10 composition matrix**, equal quality, all Balanced (≥ 40k matches) | Every composition's overall share in **40–60%**; no cell above 75% |
| E1b | Same, each composition using its best tactic | Every composition 42–62%; **each composition beats ≥ 3 others** (credible routes) |
| E2 | **Elasticity table** (regression as in A2) | \|opp best DEF\| ≤ 2× own best ATT; opp *mean* DEF ≥ 60% of opp *best* DEF (collective); **own mean MID ≥ +8%** (midfield not cosmetic) |
| E3 | **Route of victory** per composition (event tags on the winning possession) | Iron Fortress: ≥ 50% of wins from transition / second ball / set piece / technical defender. All-Out Assault: ≥ 50% from settled overloads. Orchestra: ≥ 40% of wins after δ ≥ 0.5. Free kicks 2–8% of all goals |
| E4 | **Behaviour differentiation** | Action-mix Jensen–Shannon divergence All-Out Assault vs Iron Fortress ≥ 0.10. Dribbles per possession: All-Out ≥ 2× Fortress. Passes per possession: Orchestra ≥ 1.5× Counterstrike. Possession share and blocks differ in the expected direction |
| E5 | **Tactic matrix** per composition (4 × 4 × 10) | No tactic best for > 5 of 10 compositions. Each tactic best for ≥ 1. Tactic choice moves the win rate ≥ 5 points for ≥ 6 compositions. No fixed 3-cycle holds for all compositions |
| E6 | **Quality still matters** | Within one composition, top-quartile vs bottom-quartile trios 65–80% |
| E7 | **Grade validity** (§B3) | Each grade Spearman ≥ 0.5 vs its in-match counterpart against the neutral reference |
| E8 | **Cohesion isn't a power score** | At equal quality, S vs D cohesion 50–62%. Cohesion explains < 5% of win variance once grades are controlled |
| E9 | **Termination and duration** | 0 cap hits in 100k random matches; ≤ 1 per 10k in defender mirrors; median 60–200 simulated seconds; p99 < 900 |
| E10 | **Realism** | Shots per match 3–10; scorers mostly the most advanced players (anchors 2–12%); interception rate 12–22% of passes (today 26–32%) |
| E11 | **Quality gradient** (revised per owner decision 2026-10-30: **no underdog floor**). Random trios binned by rating gap; showcase matchups reported for information only | Win rate rises monotonically with the rating gap; equal quality 45–55%; gap ≥ 8 underdog wins ≤ 25%. **No minimum win rate for any trio.** Comparable-quality unconventional trios must win via mechanics (E1/E3), never bonuses |
| E12 | **Guards** | Engine never reads role labels, identity labels or legacy-derived fields (grep test). Same seed gives the same events. Commentary-integrity test still passes |

**Don't nerf legends to hit targets.** Fix football logic first (mechanisms in §D). Rating changes need an editorial rationale, not a balance motive. The 55–65% reference target stays provisional, as the owner stated.

---

## G. Implementation (summary; the details are in `CODEX_TACTICAL_TASKS.md`)

**Integration order** (each step gated by the listed experiments):

1. **T0** Freeze the baseline + Claude harness (E1, E2, E9 recorded on the live engine).
2. **T1** Five new ratings (Claude drafts rationale → owner approves → Codex applies). *Prerequisite for everything below.*
3. **T2** `src/tactics/capabilities.js` (composites, six grades, calibration per roster version) + `identity.js` (identity, cohesion). Pure, tested; **not shown in the UI until E7 passes.**
4. **T3** `src/tactics/policy.js` + engine: zonal assignment, shape from the policy, support/help in duels, `k`/clamp recalibration (E1, E2, E4).
5. **T4** Engine: displacement δ, counter-press window, directness outlet, urgency + fatigue (E3, E9, E10).
6. **T5** Tactics as policy modifiers (E5).
7. **T6** Commentary: identity-aware banks driven by event tags and rolling statistics (C-rules below).
8. **T7** Dossier UI after lock (six grades, identity, cohesion; no win estimate); post-match "how your identity played".
9. **T8** Calibration loop: constants only in `params`, each change versioned with sweep evidence.

**Commentary rules for tactical identity:**
- **C1.** Identity phrases ("they're absorbing everything", "the Orchestra is in full flow") require supporting rolling statistics over the last N events: e.g. ≥ 3 blocks/interceptions in 60 s; δ ≥ 0.6; ≥ 4 consecutive passes.
- **C2.** The dossier label may be *named* at kickoff, but in-play claims must be event-backed.
- **C3.** The commentary-integrity test is extended: every identity phrase maps to the statistic that licensed it.

---

## H. Risks and safeguards

| Risk | Signal | Safeguard |
|---|---|---|
| **1. Dominance migrates** (seen in A4: fixing attack collapsed Iron Fortress to 12%) | E1 cell > 75% or a composition outside 40–60% | Tune mechanisms in pairs; E1 and E1b run on every params change |
| **2. All-rounder inflation** (Yaya/Vieira/Gerrard grade 62–83 on everything) | Top marginal-value players mostly two-way; Adaptability dominant | Honest work_rate/composure/stamina ratings; E2 elasticity on TA must stay modest; the editorial anchor rule (≥ 95 needs rationale) |
| **3. Overly passive defending** (Fortress vs Fortress stalls) | E9 cap hits, long medians | Urgency + fatigue (D6); help reduced by δ; never forced goals |
| **4. Unrealistic scoring** (no-GK chains, free-kick farms) | E10 bands, free-kick share | Shot bounds per mechanic; help-defence blocks; foul calibration |
| **5. Ineffective or dominant tactics** | E5 | Personnel gating; failed-press cost; possession payoff via δ |
| **6. Rating inflation / stand-ins** | Grades driven by stand-ins (Scholes MC 51) | T1 before T3; provenance flags; the dossier hides grades computed from provisional ratings |
| **7. Grades become a hidden power score** | Cohesion or grades predict wins too well | E8; grades are summaries validated against *specific* quantities, never inputs to win probability |
| **8. Circular validation** (policy derived from grades, then grades "validated" by policy outcomes) | E7 fails against a different reference | Validate against fixed neutral reference trios; keep a frozen reference field |
| **9. Labels leak into the engine** | Grep test | Labels are display only (E12) |
| **10. Commentary invents identity** | Integrity test | C1–C3 |
| **11. Complexity and performance** | < 2,000 matches/s | Policy computed once per match; support/help are O(1) per action; profile in CI |
| **12. Determinism** | Golden hashes | No new RNG draws without spec; draw order documented per resolver |

**Bottom line:** the current engine already lets team structure matter, but through a single channel: the opponent's best defender against one man at a time. The proposal adds what real 3v3 football has and the engine lacks:
- **numbers around the ball** (overloads and help);
- **a payoff for keeping the ball** (displacement);
- **transitions that depend on how many you committed**;
- **team-level behaviour derived from the players**;
- **urgency and fatigue** so tight matches open up.

With those, three artists can overwhelm, three hardmen can strangle, three midfielders can control, and a complete trio can beat all of them, none of it guaranteed.

---

## Appendix — Reproduction

Scratch harness (Claude's scratchpad, to be moved to `tools/claude-tactical-balance.cjs` in T0):
- `archetypes.js`: equal-quality 10 × 10 matrix.
- `diag.js`: per-composition mechanics.
- `elastic.js`: regression.
- `variants.py`: ablation engine copies.
- `dims.js`: grades over all 39,711 trios.

Live engine loaded via `vm` with `players.js`, `roster-expansion.js` and `cage-engine.js`, unmodified. Seeds from mulberry32. Node v24.18.0.

---

## Addendum (2026-10-30, later): spike validation

A working spike of §D (`proposals/tactical-spike/`, results in `proposals/tactical-spike/RESULTS.md`), run with the draft ratings (`proposals/ratings-v1.json`), raised the balance harness from **1/9 to 5/9 checks**:
- composition range 41–59%;
- best-defender effect −65% → −8%;
- 0 safety-cap hits (was 475 per 10k in defensive pairings);
- realism bands met.

**Validated for Codex** (T3, T4.2–T4.4): zonal help, overload support, policy-derived rest defence and commitment, counter-press, urgency, scramble shots, recalibrated clamps.

**Not yet validated** (held for another Claude iteration):
- the midfield payoff (T4.1): the midfield effect is still 0%; the likely missing mechanism is possession-as-denial;
- tactic counterplay (T5): High Press is best for 8/10 compositions.


## Addendum 2 (2026-10-30): owner decisions applied

- **Ratings v1.1 approved** after the editorial verification pass (`proposals/RATINGS_V1_VERIFICATION.md`; 12 corrections, chosen without consulting simulations).
- **No underdog floor.** E11 is now a quality-gradient check (above). Both the live engine and the spike pass it. The open signal is in *comparable-quality* unconventional matchups. Ronaldinho/Rivaldo/Del Piero is rated only 1.7 below Maldini/Ballack/R9 but wins 6% on the live engine and 26% on the spike. That's research item 1 (All-Out Assault strength through overloads), not a floor.
- **Codex authorized for T3 and T4.2–T4.4**, plus T4.1 plumbing. T4.1 formula refinement and T5 recalibration are held for Claude. Details and acceptance gate are in the `CODEX_TACTICAL_TASKS.md` status block.
