# THE CAGE: T3-14 Football Intelligence and Chemistry Audit

**Author:** Claude (lead engine developer), 2026-11-01.
**Phase:** A (read-only audit) and B (diagnostic simulation). C (engineering proposal) is in §8–§10.
**Engine audited:** `cage-t3-12` / `t3-space-6` on `main`: 194 outfield players, 50 goalkeepers, regulation scoring, mandatory 3+1, traits enabled (as in the shipped draft).
**No game source, ratings, saves, replay formats or release artifacts were changed.** New files only: this report, `tools/claude-t3-14-diagnostics.cjs`, ablation flags in the research harness `tools/claude-t3r13.cjs`, and the evidence in `tests/balance/t3-14/`.

> **Correction to my previous plan.** My T3-13 research aimed every composition at a 35–65% band. The brief rules out win-rate targets, so that goal is withdrawn. The mechanisms researched there are re-evaluated below only on football logic.

> **Principle count.** The brief refers to "23 owner-approved principles", but section 2 numbers 17 (2.1–2.17). The matrix covers all 17, plus six further explicit requirements from the brief (rows 18–23), giving 23 rows. Please confirm whether six other principles were intended.

---

## 1. Executive assessment

**Football realism today: partial.** T3-12 is a sound, deterministic and explainable platform. It has a spatial 4×3 model, real duels, the ability-based attributes that matter, the start of chemistry through support and help, and goalkeepers with distinct mechanics. But most of the decision-making the brief describes is missing or simplified:

1. **A hard threshold decides who may attack, not football intelligence.** A player defending ≥4 points above attacking is a "natural defender" and stays back, with shooting and carrying suppressed (`policy.js:3–7`, `tactical-match.js:78`). Beckenbauer, Roberto Carlos and Maldini are all treated identically. **This single rule is the largest driver of composition results** (ablation X2: DDD 22% → 34%; MMM 45% → 32%).
2. **Defending is binary where it matters most.** Shot difficulty uses the shooter's quality on a 1-logit-per-15-points scale, but the defender only counts as "present" (`tactical-match.js:50`, `P.shot.pressure = −0.6`). A shot under Maldini's pressure is exactly as hard as one under Riquelme's.
3. **Decisions don't weigh value.** Actions are chosen from static weights times trait multipliers. Traits multiply actions everywhere, regardless of situation (`traits.js:25`). A trio of Maestro/Magician/Surgeon players (Ronaldinho, Riquelme, Berbatov) under-shoots and **wins only 33% against median-quality control trios**, despite higher overalls.
4. **There is no danger assessment, no selfishness model and no match-state adaptation.** Defenders engage the nearest carrier (`spatial.js:13`). Shot preference has no individual dimension beyond shooting ability and two traits. Trailing teams commit exactly as many players as leading teams (measured: identical committed share).
5. **There is some real emergent chemistry.** Pirlo+Gattuso+Lewandowski win 78% against the controls, while Pirlo+Xabi Alonso+Lewandowski win 64%. Gattuso's recoveries cut goals conceded from 4.18 to 3.11. The structure exists to build on.

---

## 2. Implementation matrix

Status key: **IMPLEMENTED**, **PARTIAL**, **MISSING**, **INCORRECT** (contradicts the doctrine).

| # | Principle | Status | Evidence (code and measurement) |
|---|---|---|---|
| 2.1 | D-M-F is the structural ideal, not a guarantee | **PARTIAL** | `capabilities.js:10` `shape()` assigns anchor, link and spear from the best DEF+MID+ATT permutation, so coverage is real. But the composition results (§5) are driven more by the natural-defender rule and binary defence than by coverage. DMF is mid-table (52.5%) while DFF leads (72.5%) |
| 2.2 | Players keep real identities; position matters but doesn't restrict | **INCORRECT** (commitment), PARTIAL (rest) | The engine never reads the role label (guard E12), which is good. But `policy.js:3` turns ability into a hard label: `DEF ≥ ATT + 4` gives rest defence plus `boxDiscipline .2` and `deepDiscipline .6` (`tactical-match.js:78`). Beckenbauer (ATT 83, DEF 91), Roberto Carlos (86/90) and Maldini (72/92) are all held back alike. Only the Libero trait lets a covered defender carry |
| 2.3 | Maximum effort, different behaviour; willingness vs recognition vs ability | **PARTIAL** | Work rate feeds ability formulas: press (.45 wr), intercept (.25), recover (.40) in `capabilities.js:3`. Willingness to engage is team policy (`intelligence.js` `engagement`) plus five defender traits. There's no individual willingness dimension; recognition isn't modelled. Stamina effect is modest (fatigueScale 140, mobile loss up to 25%), appropriate for the format |
| 2.4 | Intelligence influences which action is chosen | **PARTIAL** | Through-ball target ranking uses depth, pace, attack and lane risk (`intelligence.js` `forwardTarget`), but it's identical for every passer. The normal-pass receiver is **random** unless the passer has a Surgeon/Architect/Maestro trait (`tactical-match.js:89`, `traits.js:60`). Vision only scales the through-ball weight. Measured: 4–6.5% of normal passes go backwards or sideways while a team-mate ahead stands in a cell with no opponent |
| 2.5 | Awareness separate from execution | **MISSING** | No awareness layer exists. Execution (duels) and choice (weights) are separate, but no player "recognises" a situation |
| 2.6 | Individual defensive personalities; aggression separate from discipline | **PARTIAL** | Aggression: trait engagement modifiers (Wall −, Enforcer +, Anticipator −, Hunter +, Destroyer +; `traits.js:46`). Positional discipline: none. Defender positions follow one shared rule (nearest to the ball, second helps, third tracks the deepest runner; `spatial.js:7`). Maldini and Ramos differ only through ratings and trait engagement rate |
| 2.7 | Defensive reactions account for opponent danger | **MISSING** | The engaging defender is the **nearest available** (`spatial.js:13` `context`); the third tracks the *deepest* runner, not the most dangerous. No threat assessment of carrier or receivers |
| 2.8 | Creative midfielders improve team-mates through real actions | **PARTIAL** | `creativeLink`: a completed forward pass into x ≥ 2 by a high-vision player adds up to +0.22 logit to the receiver's shot within 2 ticks (`tactical-match.js:91`). It's a real action, but gated on a **phase profile** (MID within 3 of ATT and of DEF), so Ronaldinho (MID 86 < ATT 92 − 3) is excluded despite vision 89. Receiver choice is mostly random (2.4) |
| 2.9 | Intelligent risk vs selfishness | **MISSING** | No decision-quality concept. Risk appetite is team-level (`policy.js` `riskAppetite`) |
| 2.10 | Selfishness has consequences, not a chemistry penalty | **PARTIAL** | Executioner and Predator traits raise shooting at x = 3; Maestro softens it. No individualism dimension. Measured: 2–9% of edge shots are taken while a team-mate stands unmarked in the box. They exist, but as noise, not personality |
| 2.11 | Chemistry emerges from complementary abilities | **PARTIAL** | Emergent through `supportQ`/`helpQ` (`spatial.js:13`), duty shape, rotation of two-way players (`spatial.js:7`). Measured: Pirlo+Gattuso 78% vs Pirlo+Alonso 64%. **No positional overlap cost** (two players wanting the same zone or role isn't modelled) |
| 2.12 | Exceptional talent can overcome structural weakness | **PARTIAL** | Quality is strongly rewarded (stronger trios win 74–87% at 8 or more points). Maldini+Cristiano+R9 beat controls 90%, but against Makélélé+Ballack+Drogba it's 47% (pair-win 22.8%, split 48.4%). Not a target; explained in §6 |
| 2.13 | Technical superiority can beat defensive intensity; press resistance | **INCORRECT** | Ronaldinho+Riquelme+Berbatov vs Gattuso+Makélélé+Kanté is **52.5%**, and only 33.3% against median controls. Cause: trait multipliers suppress shooting (Maestro ×0.74 at x ≤ 2) and push dribbling (Magician ×1.56). 8.9 shots per match against 12.5. Press resistance (`escape`) only enters the shield duel and the pass-pressure penalty |
| 2.14 | Attack-heavy teams volatile, emerging from play | **PARTIAL** | Cover failures (`rest_defence_exposed`): FFF-like trios 15–18 per match vs 0.16 for Gattuso+Makélélé+Kanté. Good. But binary shot pressure means poor defenders cost little at the shot (ablation Q: FFF 51% → 38%) |
| 2.15 | Defensive-heavy teams have realistic attacking limits; progressive defenders can attack | **PARTIAL** | The limit is real: Gattuso+Makélélé+Kanté score 1.24 per match, at xG per shot 0.21. But **progressive defenders are throttled by the same rule** (2.2). Beckenbauer+R. Carlos+Maldini commit only 42% of their players |
| 2.16 | Losing teams adapt | **MISSING** | Committed share when chasing equals the share when leading for all ten named trios (e.g. 0.42 vs 0.44). Only golden-goal pressure after 15 overtime minutes (`tactical-match.js:112`) and an all-defender press surge (`:67`) exist, and both are time-based, not score-based |
| 2.17 | Goalkeepers have distinct identities | **PARTIAL** | Real: 7 attributes; shot-stopping composite with context (one-v-one, free kick); save/parry split by handling; distribution by quality and press; sweeping on through balls (`goalkeeper-rules.js`). Missing: build-up participation beyond restarts, positioning style, attacking or set-piece actions (on hold by owner decision). **Hidden class bonuses** (`goalkeeper-rules.js:10–12`: +1.5, +1.2, +0.7, distribution +5, sweeping +5) are not shown on the card |
| 18 | No artificial composition balancing / no label bonuses | **IMPLEMENTED** (no balancing code) / **INCORRECT** in effect | No composition code exists. But the natural-defender threshold acts like a label (2.2) |
| 19 | Determinism and replay compatibility | **IMPLEMENTED** | sfc32 RNG, frozen events, event hash; historical engines in `CAGE_ENGINE_REGISTRY`; the 35-suite gate passes |
| 20 | No universal personality shared by every player | **PARTIAL** | Traits differentiate (15 classes, primary plus secondary), but as context-free multipliers |
| 21 | No team-wide chemistry multiplier | **IMPLEMENTED** | None exists. The link boost is per pass |
| 22 | No double-counting of the same advantage | **PARTIAL** | Marking enters both `tackle` (.30) and `DEF` (.30 direct, plus .12 via tackle); technique enters dribble, escape, pass, vision and ATT. The same DEF − ATT gap then also gates behaviour (2.2), so one rating difference changes both ability *and* permission |
| 23 | Explainable outcomes (telemetry) | **PARTIAL** | Rich event log (positions, roles, calc, commitment). Not logged: decision alternatives, defender threat assessment, why a receiver was chosen |

---

## 3. Evidence: strengths and weaknesses

**Strengths:**
- Ability-based capabilities with no label reads.
- A duel model shared by every contest.
- Help and support that changes outcomes.
- Measurable emergent complementarity (Pirlo+Gattuso).
- Exposure after losing the ball upfield.
- Determinism, plus a large regression suite.

**Weaknesses:** the five points in §1. Supporting numbers are in §7 and in `tests/balance/t3-14/`.

## 4. Chemistry and decision-making deficiencies

| Deficiency | Effect | Where |
|---|---|---|
| Random receiver for normal passes | Playmakers barely choose; vision mostly doesn't steer the ball | `tactical-match.js:89` |
| Trait multipliers ignore situational value | A creative trio over-passes and over-dribbles and under-shoots (T6: Riquelme 1.5 shots per match) | `traits.js:25` |
| No danger-aware marking | R9 is marked like anyone else; the third defender follows the deepest runner | `spatial.js:7, 13` |
| No overlap cost | Two players with the same role don't get in each other's way | — |
| No awareness/execution split | Can't express "recognises the gap but can't close it" | — |
| No score-aware behaviour | Trailing teams never change shape | `step()` |

## 5. Position and composition mechanics

Ten compositions, 200 matches each against equal-quality opponents drawn from all ten compositions (3+1, traits on). This reproduces Codex's table: DFF 72.5 (Codex 75.1), DDD 22.0 (17.4), DDF 61.5 (64.2), MMM 45.0 (36.8).

| Variant | DDD | DDM | DDF | DMM | DMF | DFF | MMM | MMF | MFF | FFF |
|---|---|---|---|---|---|---|---|---|---|---|
| Live T3-12 | 22.0 | 39.0 | 61.5 | 43.0 | 52.5 | **72.5** | 45.0 | 56.0 | 63.0 | 51.0 |
| X1: no rest discipline | 26.0 | 36.0 | 67.5 | 44.0 | 63.0 | 61.5 | 40.5 | 48.5 | 59.5 | 54.0 |
| **X2: no natural-defender rule** | **34.0** | 39.5 | 61.5 | 45.5 | 63.5 | 69.5 | **32.0** | 51.0 | 58.0 | 50.5 |
| Q: defender-quality shot pressure | 30.5 | 45.0 | 69.5 | 48.0 | 62.0 | 70.0 | 39.0 | 50.5 | 53.0 | **38.0** |

**Why each composition wins or loses today:**
- **DFF leads under every variant.** Its second forward adds a lot of attack (5.30 goals per match against DDF's 3.84), while its one defender gives nearly the protection of two (3.35 against 2.92 conceded). The defensive value of a third, or even a second, defender saturates because **only the nearest defender engages, plus one helper**; the other's value is mostly positional. That is a real modelling property, not a bug, but it overstates the "one defender is enough" effect.
- **DDD loses through possession, not defence.** Of opponents' attacking-third entries against DDD, 70% start there after a DDD turnover (48% against DMF). Attackers win only 48% of duels against DDD. The natural-defender rule makes two of three hold back and pass, increasing time on the ball in their own third.
- **MMM's middle position depends on the rule.** Midfielders are never "natural defenders", so all three commit. Remove the rule and MMM falls to 32%.
- **Composition labels are not read anywhere.** The effects come from the DEF − ATT threshold and the binary defence term.

## 6. Goalkeeper intelligence

**Implemented:**
- context-sensitive shot-stopping (`score`: reflexes .34, positioning .25, one-on-one .20, handling .13, aerial .08);
- the save/parry split by handling;
- the sweep before a shot on through balls (sweeping, positioning);
- distribution success and long-ball choice by distribution and press;
- a sweep exposure window after a beaten sweep.

**Missing:**
- build-up participation in open play (passing back to the keeper);
- positioning style (a high line for Neuer);
- attacking or set-piece actions (Chilavert, on hold);
- keeper-specific decision tendencies.

**Concerns:**
- Class bonuses are invisible mechanics.
- Keeper impact is small. The shot-logit shift between the best and worst keeper is about ±0.2, roughly 3–4 points of goal probability per shot.

## 7. Controlled experiment results

**Setup:**
- `node tools/claude-t3-14-diagnostics.cjs --pairs 40`.
- Seeds `0x5eed0000 + i·7919`, i < 40, each played in both orientations. The pair is the sample unit.
- Matched keepers Víctor Valdés and Ederson (composites closest to the reference), swapped with orientation.
- Four control trios of median quality (DMF/DDF/MMF/DMM types). All four tactics for the named team; balanced for the control.

**Against the controls (all tactics pooled; win %, with the range across tactics):**

| Team | Win % (by tactic) | Goals for / against | Shots per match | xG per shot | Key passes | Recoveries | Lost in own half | Cover failures |
|---|---|---|---|---|---|---|---|---|
| Beckenbauer+R. Carlos+Maldini | 80.4 (70–86) | 3.81 / 1.68 | 13.8 | .403 | 9.8 | 39.3 | 44.9% | 7.0 |
| Zidane+Kaká+Ballack | 77.4 (73–81) | 6.22 / 3.72 | 18.1 | .466 | 10.7 | 33.3 | 35.7% | 17.8 |
| Maldini+Ballack+R9 | 89.0 (88–90) | 6.60 / 2.88 | 20.2 | .467 | 13.6 | 35.0 | 39.1% | 13.3 |
| Maldini+Cristiano+R9 | 90.2 (88–92) | 7.38 / 3.22 | 20.1 | .515 | 12.8 | 32.7 | 40.3% | 12.5 |
| Pirlo+Maldini+R9 | 74.0 (65–86) | 5.44 / 3.35 | 15.6 | .491 | 10.6 | 32.8 | 41.4% | 13.6 |
| **Ronaldinho+Riquelme+Berbatov** | **33.3 (29–40)** | 3.95 / **5.39** | **11.5** | .465 | **7.1** | **23.3** | 42.5% | 15.4 |
| Gattuso+Makélélé+Kanté | 38.7 (32–44) | **1.24** / 1.76 | 8.3 | **.213** | 5.0 | 37.7 | **55.1%** | **0.2** |
| Pirlo+Gattuso+Lewandowski | 78.1 (72–83) | 5.48 / **3.11** | 17.3 | .458 | 11.6 | 35.3 | 40.2% | 14.5 |
| Pirlo+Xabi Alonso+Lewandowski | 64.1 (59–73) | 5.41 / **4.18** | 15.6 | .481 | 10.1 | 32.3 | 39.9% | 17.4 |
| Makélélé+Ballack+Drogba | 89.6 (87–92) | 6.50 / 2.67 | 22.0 | .428 | 15.4 | 35.9 | 39.6% | 13.5 |

**Head-to-head (16 tactic pairings × 40 seed pairs):**

| Matchup | A win % | Pair-win A / split | Tactic range | Key telemetry |
|---|---|---|---|---|
| Maldini+Cristiano+R9 vs Makélélé+Ballack+Drogba | 47.0 | 22.8 / 48.4 | 34–63 | A: better chances (xG per shot .499 vs .412), but fewer shots (18.8 vs 23.5) and fewer key passes (11.6 vs 16.7). Ballack's two-way role feeds Drogba more often |
| Ronaldinho+Riquelme+Berbatov vs Gattuso+Makélélé+Kanté | 52.5 | 27.7 / 49.7 | 33–65 | A: much better chances (.457 vs .212) but only 8.9 shots and 77% passing under the press. Cover failures 16.8 vs 0.07 |
| Pirlo+Maldini+R9 vs Gattuso+Makélélé+Kanté | 85.3 | 74.8 / 20.9 | 70–96 | A converts: 2.91 goals vs 1.05 |
| Beckenbauer+R. Carlos+Maldini vs Zidane+Kaká+Ballack | 57.7 | 33.9 / 47.7 | 41–74 | Versatile defenders attack effectively (4.37 goals) |

**Player-level observations:**
- **Riquelme** takes 1.5 shots per match with 2.7 key passes. He creates, but the trio around him under-shoots.
- **Maldini** in Maldini+Cristiano+R9 makes 7.7 key passes and 3.0 assists per match, plus 20 recoveries. He is the team's distributor; that's plausible given his ratings, but notable.
- **R9** takes 10 shots per match and **Cristiano** 8.7, and both create (2.0 and 3.1 key passes). They cooperate; there's no selfishness model.

## 8. Proposed additions and corrections (for owner review; none implemented)

Each item is a football mechanism, measured by behaviour, not win rate. **Bold** marks new data.

| ID | Layer | Mechanism | Replaces or extends | Data needed |
|---|---|---|---|---|
| **P1** | 3 | **Commitment by role and intelligence, not a threshold.** Each player's willingness to join the attack = f(attacking capability, work rate, tactical discipline, team cover, match state). A versatile defender (Beckenbauer) commits when cover exists; a pure stopper (Vidić) rarely does | `policy.js:3–7` natural count; discipline multipliers | Reuses existing attributes. Optional new attribute **`discipline`** (positional discipline, 1–100) |
| **P2** | 5 | **Defender-quality shot pressure** (research flag Q): pressure = −0.6 − (pressuring defender's tackling and reading − roster mean) / scale. Average defender unchanged | Binary `P.shot.pressure` | None |
| **P3** | 2–3 | **Danger-aware marking.** The engaging defender and the third man's target are chosen by threat (carrier's ATT, dribble and shot, plus the receiver's position and pace) weighed against distance and cover | `spatial.js` `update`/`context` | None |
| **P4** | 3 | **Situational action values replace context-free trait multipliers.** Each option gets a value (shot quality vs best pass vs carry), and the player's intelligence chooses among them. Traits become **preferences between near-equal options**, not ×1.56 multipliers | `traits.js` `weights`; static U weights | Reuses vision, composure and traits. New **`individualism`** (shot vs pass preference) for owner-reviewed players only |
| **P5** | 3–4 | **Intelligent receiver choice.** Choice quality scales with vision and composure, using space and progress (research C1). Gate the creative link on vision and passing, not on phase profile | Random receiver; creative-link phase gate | None |
| **P6** | 3 | **Score-aware adaptation.** A trailing team progressively commits, raising risk appetite with time and deficit, filtered by each player's intelligence and personality (research B1). No new abilities | — | None |
| **P7** | 4 | **Overlap cost.** Two players competing for the same role or zone reduce support quality and passing options (for example two deep playmakers both wanting to receive deep) | `shape()` duty assignment | None |
| **P8** | 5 | **Press resistance in all pressured actions.** Escape (technique, composure, agility) moderates pass and carry risk whenever engaged, not only in shield duels | Shield duel, pass-pressure penalty | None |
| **P9** | 5 | **Safer build-up realism** (research C2, I, K): pass success cap .96 for simple passes; an interception is won where the interceptor stands; a clearance option when pressed deep | `P.clampHi` .88 for all passes; interception placed at the passer | None |
| **P10** | 1 | **Defensive personality.** Aggression (exists: traits) plus positional discipline (new, see P1). Discipline governs how far a defender steps out, both on the ball and off it | Shared positioning rule | **`discipline`** |
| **P11** | 1 | **Goalkeeper identity.** Show or remove hidden class bonuses; a sweeper positioning style (high line affects through-ball and exposure odds); open-play build-up for distributor keepers. Set pieces stay on hold | `goalkeeper-rules.js` | None |
| **P12** | 6 | **Decision telemetry.** Log the chosen option's value and the best alternative's value on each action, so "better option ignored" is measured, not inferred | `emit` | None |

**Proposed new dimensions (names, scale, meaning):**
- **`discipline`** (1–100): how strictly a player holds his position and responsibilities. High for Maldini and Makélélé, low for Ramos and Roberto Carlos.
- **`individualism`** (1–100): preference for personal action (shot or dribble) over an equal-value pass. It changes only near-equal choices.

Both would be drafted editorially with a rationale and an owner-review flag, like ratings v1.1. Nothing is generated until the owner approves the definitions.

## 9. Regression and replay risks

- **Every gameplay change creates a new engine version** (`cage-t3-13` or `cage-t3-14`). T3-12 is frozen as `src/cage-engine-v612.js` and registered, so old records replay exactly (the pattern Codex used for v611).
- **Event-schema additions** (P12 decision telemetry) must be passive: no RNG draws. Old viewers must ignore new fields; the viewer contract tests guard this.
- **The page-weight cost of another frozen engine** (about 2.5 MB each, 8 already) is a known problem. Lazy loading of historical engines is recommended alongside.
- **Saves:** no format change needed for P1–P11.
- **Gate:** 35 suites plus a reproducible build must pass at every step.
- **New measurement suites:** this diagnostic suite, plus behaviour assertions, become part of the gate. Examples: trailing teams commit more; danger-aware marking engages the higher-threat attacker more often; receiver choice improves with vision.

## 10. Prioritised roadmap

| Order | Item | Why first | Validation (behaviour, not win rate) |
|---|---|---|---|
| 1 | **P12 decision telemetry** | Every later change needs explanations | Passive; event hashes change only through new fields |
| 2 | **P1 commitment by role and intelligence** (+ `discipline` definition) | Largest distortion today (2.2, 2.15) | Beckenbauer commits when covered, Vidić rarely; committed-share distributions per player |
| 3 | **P2 defender-quality pressure** | Defence must matter at the shot (2.6, 2.14) | Shot quality conceded falls with defender quality; FFF concede more |
| 4 | **P4 + P5 situational decisions and receiver choice** | Creative and technical football (2.4, 2.8, 2.13) | Ronaldinho+Riquelme+Berbatov shot volume and key passes; recycle-with-free-forward rate falls with vision |
| 5 | **P6 score-aware adaptation** | 2.16 | Committed share chasing > leading, scaled by intelligence |
| 6 | **P3 danger-aware marking** | 2.7 | R9 draws the engaging defender more often than his distance alone implies |
| 7 | **P8 press resistance, P9 build-up realism** | 2.13, possession football | Pass risk vs escape under engagement |
| 8 | **P7 overlap cost** | 2.11 trade-offs | Pirlo+Alonso support quality vs Pirlo+Gattuso |
| 9 | **P10 defensive personality, P11 goalkeeper identity** | Need the new data | Maldini vs Ramos step-out rates; Neuer exposure profile |

**Owner decisions requested:**
1. Approve the roadmap order, or change it.
2. Approve the two new dimensions (`discipline`, `individualism`), or require existing attributes only.
3. Goalkeeper class bonuses: show them on the card, or remove them?
4. Confirm the principle count (17 numbered vs 23 referenced).
5. David Luiz is named in the brief but isn't in the roster. Should he be added through the usual recruitment process?

## 11. Reproduction

- **Named and head-to-head:** `node tools/claude-t3-14-diagnostics.cjs --pairs 40 --only named|h2h --json <out>`, giving `tests/balance/t3-14/named.json` and `h2h.json`.
- **Composition attribution:** `node tools/claude-t3r13.cjs --flags none|X1|X2|Q --comps all --opp all --n 200`, giving `tests/balance/t3-14/comp-*.json`. Identity check: `--identity` (300/300 matches identical to live T3-12).
