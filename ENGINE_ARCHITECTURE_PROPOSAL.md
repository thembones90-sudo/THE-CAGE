# THE CAGE — ENGINE ARCHITECTURE PROPOSAL (v2)

**Author:** Claude (lead engine architect, football-mechanics reviewer, balance auditor)
**Date:** 2026-10-30
**Status:** proposal for owner approval. It supersedes v1 of this file from earlier today. v2 adds a working engine spike, commentary architecture, playback modes and statistics.

- **No project code was changed.** `index.html`, `src/players.js` and `tests/*` are untouched.
- **New files:**
  - `proposals/engine-spike/` — reference prototype, clearly labelled, not production code.
  - `CODEX_ENGINE_TASKS.md` — actionable task list.

**Authority order used:** EXCLUSIVE_DRAFT_RULES.md > JOINT_BRIEF.md (newest override) > GAME_DESIGN_LOCK.md > PROJECT_SPEC.md > older task files > this brief (FM-style engine).

### How to read this

Every number marked **[measured]** comes from code run today on the real 57-player roster. Every number marked **[target]** is a design intent the owner should approve. Reproduction commands are in Appendix A.

To avoid recommending a design on paper only, I built a ~350-line spike of the proposed architecture. It runs a possession/event engine over a zone grid, plus a template commentary layer that reads only the event log. It runs about 9,000 knockout matches per second in Node. Its job was to find out what breaks. **It found seven design problems that are now built into this proposal (§2.4).**

---

## 1. Audit of the current engine

### 1.1 What works [measured]

| Item | Evidence |
|---|---|
| Roster test passes | `node tests/roster-integration.cjs` → PASS (57 unique players, 17 stats each) |
| The old crash bugs (CLAUDE_REVIEW S1–S3) are fixed | Headless Chrome, full draft → lock → 20× Simulate: 0 errors, match panel visible, Replay enabled |
| Exclusive claims block aliases across both teams | A claims `R9`; B tries `Ronaldo Nazario` → blocked |
| Same seed gives the same result | Asserted in the test |
| Prefix discovery removed | `search('nema')` → error |

### 1.2 Engine limitations (why it must be replaced, not tuned)

The whole engine is one line, `index.html:20`. Each simulated minute, each side rolls once against:

```
prob = clamp(.035 · attack/defence · control/control, .008, .12)
```

`attack`, `defence` and `control` are team averages (`team()`, line 19). Measured consequences:

| Problem | Evidence |
|---|---|
| **Team structure barely matters** | 400 random trios × 30 matches. Points share: MMM .524, DMM .515, **DFM (one of each) .499**, FMM .496, FFM .467, FFF .395. A balanced trio is exactly average. **Erratum (2026-10-30):** the random generator used for this table repeated after ~9,600 values (precision loss above 2^53), so these figures may be distorted. It describes the retired v0.2 engine; see TACTICAL_INTELLIGENCE_PROPOSAL.md §A for corrected live-engine measurements |
| **Too many draws, no knockout** | Draw rate 28–43%. No first-goal-wins mode exists |
| **Tactics are multipliers on strength, so one dominates** | Possession is the best response to every tactic; Press is strictly worst |
| **Chemistry is cosmetic** | `chem` is computed and displayed, but never enters `prob` |
| **Scorers are random** | Uniform pick from 3: Vidić scores as often as R9 |
| **Nothing is explained** | Two text templates. No defender is named, no reasons given, no causal chain |
| **Can't express positions, transitions, walls, fouls or fatigue** | The model has no state between minutes |

No choice of constants fixes this. The model has no concept of *who is defending whom*, which is the mechanism the owner's balance rule depends on.

### 1.3 Data audit: which attributes are sufficient, redundant, or missing [measured]

The 57 identities and their 6 base ratings are kept exactly as they are. The problem is the 11 "additional" fields. A least-squares fit against the 6 base stats reproduces every one of them to within 0.5 points across all 57 players:

| Stored field | Actually is | Verdict |
|---|---|---|
| dribbling, passing, finishing, physical, tackling | exact copies of tech, pass, finish, phys, def | **Redundant.** Keep for compatibility; the engine never reads them |
| first_touch | .66 tech + .34 pass | Redundant |
| vision | .50 tech + .50 pass | Redundant, and wrong for Riquelme/Berbatov-type players |
| shooting | .66 finish + .34 phys | Redundant |
| **stamina** | .50 pace + .50 phys | **Harmful.** Adriano 95, R9 93, Kanté 83, Scholes 66, Riquelme 46 |
| **positioning** | .50 pass + .50 def | **Harmful.** Defensive reading is half passing |
| **composure** | .50 tech + .50 finish | **Harmful.** Maldini 62, Vidić 45, Stam 42: composure punishes defenders |

Recommendation, which preserves the existing data:

- **Keep all 17 stored fields untouched** for compatibility. Mark the 11 derived ones `derivedLegacy` in a new `ratingMeta` block. The engine never reads them.
- **Engine attributes = the 6 base stats (renamed in code, not in the data) + 5 genuinely new independent ratings.** Each new rating has a named mechanical consumer (§4.1):

| New attribute | Why it's necessary (consumer) | What breaks without it [measured in spike] |
|---|---|---|
| `work_rate` | Pressing, tracking back, two-way phase credit | The spike's press proxy (def/pace/phys) makes Gravesen a better presser than Kanté is relative to the field, and makes Press dominant |
| `stamina` (re-rated) | Fatigue decay, 2v2 withdrawal order | The derived stamina has Riquelme gassing at 46 while Adriano lasts forever |
| `composure` (re-rated) | Pressure penalty on every action, finishing under pressure | The derived composure makes defenders panic on the ball |
| `agility` | Acceleration and turning in a tight cage: dribble duels, press escape, races | Okocha/Denílson-type players and Owen/Martins-type sprinters become indistinguishable from "fast" |
| `marking` | Interceptions, blocks, cover; separates *reading* from *tackling* | Vidić (reads and blocks) and Davids (snaps into tackles) look identical; the spike's block probability for Maldini came out unrealistically high |

**Explicitly not added:**
- `vision` — a separate rating is justified but optional. Use `pass` until a reviewer shows a case where it changes a decision.
- `heading` — no crosses in a 3v3 cage with small goals.
- `weak_foot`.
- `leadership`, `chemistry ratings` and similar "intangibles" — no mechanical consumer.
- **Optional flag:** `setPiece` (Mihajlović, Recoba, Del Piero…). This is the only binary flag, and it's consumed by free kicks.

This takes us to **11 engine attributes**. Each has ≥ 1 consumer, and that's enforced by a test (§8.2). The 5 new ratings need an editorial pass with a written rationale per player. Claude drafts it, the owner approves (§10).

### 1.4 Other gaps [measured]

- **Wrong-claim risk.** Surname aliases take a specific player: `keane` → Roy (Robbie exists), `toure` → Yaya (Kolo), `ferdinand` → Rio (Anton, Les), `alonso` → Xabi, `martins` → Obafemi. Under exclusive claims, a wrong alias permanently takes a player away from the opponent.
- **Misleading not-found.** `Ronaldo` → "Not in the pilot roster yet", although R9 is in it.
- **No turn order** for claiming, and the shared screen exposes typing to the opponent.
- **Missing:** knockout mode, walls, fouls, fatigue, the lockdown and street-flair tactics, a seed input, playback modes, statistics, rating provenance, git, an up-to-date README, and removal of `LEGACY_PLAYERS` (dead code).

---

## 2. Recommended simulation architecture

### 2.1 Choice: an event-driven possession engine with lightweight spatial positioning

| Option | Verdict |
|---|---|
| Per-minute dice (current) | Rejected (§1.2) |
| Continuous 2D (positions, velocities, steering, physics) | Rejected. Months of calibration, fragile determinism, and with 6 players in a tiny cage it shows little that zones can't. FM itself resolves outcomes with probabilistic decision models, not physics |
| **Possession chains over a zone grid (chosen)** | Every action is a decision by a named player, resolved against a named opponent, using that player's attributes, the tactic, the player's position and one controlled random draw. Cheap, deterministic, explainable, testable per mechanic |
| Spatial *presentation* | Later. A 2D view animates the event log; the simulation never depends on rendering |

**"Lightweight spatial positioning" means:**

- **The cage is a 4 × 3 grid**, as seen by the team in possession:
  - 4 columns: `own box`, `own half`, `opp half`, `opp box`.
  - 3 lanes: `left`, `centre`, `right`.
- **Each player has a cell and a status.** Status is either `in_shape` or `out_of_position(n actions)`.
- **Shape follows the ball, by duty:**
  - The anchor holds one column behind the ball, centre.
  - The link sits level with the ball.
  - The spearhead is one column ahead.
- **Defending players are goal-side of their marking assignment**, unless they are out of position.
- **Position changes outcomes in four ways:**
  - Which defender engages (marking map + cover).
  - Shot angle (a centre lane is better than the sides).
  - Transition danger (players caught upfield).
  - Wall proximity (side lanes produce more wall-pass and rebound events).

**Why this is the right level:** the spike showed that the decisive mechanism for team balance, *who ends up defending whom after a turnover*, needs exactly this much space and no more.

### 2.2 Modules (pure core, thin shell)

```
src/
  data/players.js            existing roster (unchanged identities) + ratingMeta + new attributes (P1)
  data/ambiguity.js          "ronaldo" → [ronaldo-nazario, cristiano-ronaldo(not rostered)], keane, toure…
  identity/normalize.js      accents, punctuation, token order
  identity/resolve.js        ambiguity → exact alias → token set → bounded edit distance
  draft/claims.js            pure reducer (state, command) → {state, events}; canonical-ID registry
  draft/turn-order.js        snake / alternating / blind rounds (owner decision, §9.3)
  engine/rng.js              sfc32 seeded via splitmix32; single stream; draw counter
  engine/mathx.js            logistic via fixed 241-entry lookup table (no Math.exp; §2.5)
  engine/params.js           EVERY tunable constant; versioned
  engine/attributes.js       registry: attribute → consuming functions (enforced by test)
  engine/derive.js           composites computed at load (never stored as ratings)
  engine/team-shape.js       duty assignment, phase coverage, chemistry pairings, explanations
  engine/positioning.js      grid, shape-follows-ball, marking map, out-of-position bookkeeping
  engine/decisions.js        carrier action utilities (player × zone × pressure × tactic)
  engine/duels.js            opposed checks: dribble, tackle, press, interception, race, rebound
  engine/shooting.js         angle, block(s), on-target, goal
  engine/rules.js            fouls, free kicks, restarts, walls, escalation, termination
  engine/match-engine.js     simulate(MatchInput) → MatchResult; modes: cageKO, exhibition
  engine/match-events.js     event constructors + schema validation (named roles, §5)
  analysis/stats.js          statistics derived ONLY from events
  analysis/report.js         post-match tactical analysis derived ONLY from events + team-shape
  commentary/lexicon.js      player display names, demonyms, style tags (from attributes)
  commentary/templates/*.js  template banks per event category, per style
  commentary/narrator.js     event log → narrated lines with importance + pacing hints
  ui/draft-view.js           memory-first entry, claims, turn order
  ui/match-view.js           renders narrated lines + scoreboard + stats
  ui/playback.js             Instant / Fast / Normal / Dramatic, pause, resume, replay (§7)
tools/
  balance.mjs                batch simulation reports (Claude-owned yardstick)
  serve.mjs                  ~25-line zero-dependency static server
tests/                       node:test (built into Node 24; no installs)
```

The **rule** for `engine/`, `draft/`, `identity/`, `analysis/` and `commentary/`: **no DOM, no `window`, no `Math.random`, no `Date`.** A static test greps for these.

Why this differs from the brief's illustrative tree:
- `analysis/` is separate, so stats and reports can never reach into engine internals.
- `commentary/` is separate from `ui/`, so a server or test can narrate without a browser.
- `draft/` and `identity/` are first-class, because exclusivity is the game's second pillar.

### 2.3 Data flow

```
players.js ─► derive ─┐
                      ▼
Draft UI ─commands─► claims.reduce ─► DraftState {pool, teams, claimLog}
                      │ both trios locked
                      ▼
MatchInput { engineVersion, paramsVersion, rosterVersion, mode, seed>>>0, teams:[{ids[3], tactic}] }
                      │
         match-engine.simulate(input)        ← pure; the only place randomness exists
                      ▼
MatchResult { events[], score, winner, endReason, durationSec, rngDraws, hash }
     │                 │                         │
 stats.derive     report.analyse         narrator.narrate(events, style, seed)
     │                 │                         │
     └───────────── ui/match-view ◄── ui/playback (speed never feeds back)
```

- **The event log is the single source of truth.** Score, stats, report and commentary are pure functions of it.
- `hash` = FNV-1a of the canonical event serialization.
- **Multiplayer later:**
  - Server: runs `claims.reduce` with authoritative ordering, then `simulate`, then sends `MatchInput` + `hash`.
  - Clients: re-simulate to animate and to verify the hash.
  - No engine change is needed.

### 2.4 What the spike taught us (each one is now a requirement)

| # | Spike finding [measured] | Requirement it creates |
|---|---|---|
| S1 | With duty-blind decisions, Maldini as anchor carried into the opponent's box and dribbled past Okocha 3 times in a row | Decision utilities are **duty-weighted** (§3.2). Anchors only rarely carry beyond halfway |
| S2 | First working version: Ballack/Maldini/R9 beat Okocha/Djalminha/Vidić **91%**, and Ronaldinho/Zidane/Rivaldo beat Kanté/Yaya/Hazard only 12%. Structure went from irrelevant to overwhelming | Many chained duels compound small edges. Duel slope `k` and clamps must be tuned by harness. Final targets in §4.4 |
| S3 | A global 12% minimum probability (meant for duels) let hopeless long shots score at 12%. Fixing it moved Gravesen/Stam/Vidić vs Ronaldinho/Zidane/Rivaldo from 17% to 9% | **Separate probability bounds per mechanic.** Shots [0.01, 0.80]; duels [0.10, 0.90] |
| S4 | Press became dominant (beats every tactic for all 4 test trios, e.g. Ballack/Maldini/R9 row: 57.8 / 68.1 / 51.1 / 57.4). KO matches last a median ~100 s, so fatigue never gets to punish pressing | In first-goal-wins, **pressing costs must be immediate**: a beaten press leaves the presser out of position for 2 actions, opening a transition |
| S5 | The commentary blamed the wrong player ("Blocked by Ronaldo", where Ronaldo was the shooter; "Ronaldo clatters into Djalminha", where Djalminha fouled). `actor`/`opp` meant different things in different event types | **Named roles in the event schema** (`attacker`, `defender`, `passer`, `receiver`, `blocker`, `fouler`…), plus a commentary-integrity test (§8.2) |
| S6 | A goal by Vidić was credited "made by Ballack", an opponent. The last passer carried across turnovers | Explicit `possession_start` / `possession_end` events. Assists must be same team, same possession. Enforced by log-integrity test |
| S7 | All-defender trio vs artists: 38% of matches reached the late-match decider; possession stats read 50/50 regardless of play | Escalation must **open play up** (2v2 and 1v1 boost attacking duels). Possession is computed from possession events, not inferred |

The spike also confirmed the parts that work [measured]:
- Determinism: same input → byte-identical result.
- Scorer realism: in Ballack/Maldini/R9, R9 scored 73% of goals, Ballack 27%, Maldini 0.2% (spearhead share slightly above the 55–70% target).
- Speed: ~27,000 matches in 3 s, single core.
- Commentary that reads only the log is viable.

### 2.5 Determinism rules

- One `sfc32` stream per match, seeded by splitmix32(`seed>>>0`). The UI shows and accepts `seed>>>0`.
- **No `Math.exp`/`pow`/`log`/trig in the engine.** ECMAScript allows their precision to vary between JS engines. Use `mathx.logistic` = fixed table over [−6, 6] at a 0.05 step, linearly interpolated. `+ − × ÷` are IEEE-deterministic.
- **Fixed draw order:** every resolver consumes a documented number of draws, even on early exit.
- Iterate arrays in canonical order, never object keys.
- `engineVersion` / `paramsVersion` / `rosterVersion` are stored in every result. Any golden-hash change requires a version bump (test-enforced).
- **The narrator uses no engine RNG.** Variant choice = hash(seed, eventIndex, bank). This means alternative commentary styles narrate the *same* match.

---

## 3. Detailed football-event mechanics

### 3.1 Possession loop

```
possession_start {team, carrier, cell, cause: kickoff|turnover|rebound|restart, transition: bool}
loop:
  recovery tick: each out-of-position defender attempts a recovery run (pace, work_rate)
  engaged defender = marker of carrier's duty if in_shape, else nearest in_shape cover, else NONE
  engagement: always in own box; elsewhere P = tactic.press + zoneBonus (high press engages early)
  carrier chooses action (decisions.js, §3.2)
  action resolved (duels.js / shooting.js / rules.js)
  emit event(s) with named roles, probability, roll, reason codes
until: goal | turnover | ball out of play to a restart | defensive clear from a rebound
possession_end {team, cause, durationSec, actions}
```

**Marking map** (defending duty marks attacking duty):

| Defending duty | Marks | Role |
|---|---|---|
| anchor | spearhead | last line |
| link | link | midfield battle |
| spearhead | anchor | first presser |

When the assigned marker is out of position, the in-shape anchor covers, which pulls him out of his own assignment. **This is where structural weakness becomes visible:** three strikers have nobody whose cover is worth anything.

### 3.2 Decisions (individual intelligence)

Each action's utility is built from the carrier's composites, cell, pressure, duty and tactic. Choice is a weighted draw (one RNG draw): players act to type, not robotically.

| Action | Available when | Utility drivers |
|---|---|---|
| shoot | opp half/box, or no defender | finishing/long-shot quality, angle (centre lane +), pressure −, tactic.shootBias |
| carry | not engaged, not in opp box | pace, space, duty (anchor beyond halfway ×0.2) |
| dribble | engaged | (dribble composite − defender tackle composite), tactic.flair, duty |
| wall pass (cage-only) | engaged, side lane | technique + pass, tactic.flair |
| pass | always (teammate available) | pass composite, patience, pressure (+ when engaged) |
| through ball | own half/opp half, spearhead available | vision proxy (pass+tech), transition ×1.6, tactic.direct |
| shield / hold | engaged in own half | press-escape composite, patience |

**Duty discipline** [spike S1]:
- Anchor: shoot/carry/dribble ×0.2 beyond halfway, pass ×1.6.
- Spearhead: attacking actions ×1.25.

These are stored as `params.dutyBias`, tunable and visible.

### 3.3 Duels (opposed checks)

```
p = clamp_mech( logistic( (A − D)/k + b_action + b_context ), lo_mech, hi_mech )
```

- `A` and `D` are composites (§4.1) **after** fatigue and pressure.
- `k` ≈ 18–24, tuned by harness.

| Duel | Attacker composite | Defender composite | Context terms |
|---|---|---|---|
| dribble | .45 tech + .25 agility + .15 pace + .15 composure | .45 tackle + .30 marking + .15 phys + .10 agility | transition +0.3; wall lane +0.1 |
| wall pass | (dribble + pass)/2 | marking-heavy tackle | side lane only |
| press escape | .40 tech + .25 composure + .20 agility + .15 phys | press: .45 work_rate + .25 pace + .15 agility + .15 marking | beaten press → presser out of position for 2 actions [spike S4] |
| interception | pass composite (.65 pass + .20 tech + .15 composure) | .55 marking + .25 work_rate + .20 pace | forward pass −0.5; through ball −0.6; under pressure −0.5 |
| race (after a through ball) | .5 pace + .3 agility + .2 tech | .6 pace + .4 marking | defender wins → "shepherded to the wall" |
| recovery run | .6 pace + .4 work_rate | fixed bar (70) | out-of-position counter decrements anyway |
| rebound | .4 pace + .3 agility + .3 marking | same | the defending side gets +6 (they face the play) |

### 3.4 Shooting (small goals, no goalkeeper)

There is no keeper, so the defence is **angle + blocks + the narrow target**.

1. **Blocks.** Up to two blockers: the engaged defender, then the in-shape anchor if different.
   `pBlock = clamp(logistic((.55 marking + .30 tackle + .15 phys − 75)/12 + b_block (+ b_cover for second)), .05, .85)`
2. **Conversion** of an unblocked shot:
   `pGoal = clamp(logistic(base[cell][lane] + (shotQuality − 75)/15 + transition + pressure + oneVone), .01, .80)`

   | Situation | Base (logit) [spike values; to be tuned] |
   |---|---|
   | box, centre | −0.4 |
   | box, side | −1.0 (narrow angle on a 2 m goal) |
   | edge (opp half), centre | −1.9 |
   | edge, side | −2.4 |
   | free kick | −1.3 |

   Modifiers: `pressure` −0.7 if engaged; `transition` +0.35; `one-v-one` (no defender at all) +0.9.
3. **Miss.** Classified *near* (off the frame) or *wide*. The ball stays live off the wall, so a **rebound duel** follows. Blocks also produce a rebound duel.

This prevents the "no keeper = every attack scores" failure. In the spike [measured], Ballack/Maldini/R9 vs Okocha/Djalminha/Vidić averages 4.2 shots per KO match before the first goal.

### 3.5 Transitions and counters

On a turnover:
- **The ball is mirrored:** column `x → 3 − x`.
- **The losing side's players committed upfield go out of position.** The ball-loser always does if the ball was lost in the opponent's half. Spearhead and link do if the loss was in an attacking third.
- **The possession is flagged `transition`.** Through-ball utility ×1.6, and attacking duels get +0.3 until the defence recovers.
- **Counter emerges mechanically:** a low-block team (`tactic.deep`) concedes territory, wins the ball deep, and the opponent's committed players are out of position.
- **Press emerges mechanically:** winning the ball high means a short distance to goal, but every beaten press opens the space behind.

### 3.6 Fouls, free kicks and restarts

- **Foul check** only when the defender *loses* a dribble/press duel (cynical or late challenges):
  `pFoul = base · (1 + 2·tactic.aggression) · (1.25 − tackle/100) · fatigueFactor`
- **Foul in the opponent's half or box:** direct free kick. Taker = best `setPiece` flag, else the best long-shot composite. One-man wall (block check ×0.5).
- **Foul elsewhere:** indirect restart in place.
- **Target share:** free-kick goals 2–6% of KO goals. The spike over-produced them at first (12–18%) until the foul base was cut.
- No cards in v0.3. A team-foul accumulation rule (futsal-style) is optional later.
- **Restarts:** kickoff (anchor, own box, settled); after an exhibition goal the conceding team restarts; after an escalation, a fresh kickoff.

### 3.7 Fatigue and pressure

- **Effort costs:** sprint/press 3, duel 2, pass 1, multiplied by `(1.6 − stamina/100) · tactic.fatigueMult`.
- **Effect:** physical composites (pace, agility, work_rate, tackle) lose up to 25% at full fatigue; technical ones lose up to 10%.
- **Pressure:** −0.8 · pressure · (1 − composure/100) on the attacker's logit. This is where re-rated composure matters.
- **Momentum:** **not implemented.** It snowballs and reads as scripted. Revisit only if playtests feel flat, capped at ±3%.

---

## 4. Mathematical reasoning and team balance

### 4.1 Composites (derived at load, never stored as ratings)

Built from the 6 base stats + 5 new attributes. During P1, before the new ratings exist, proxies are used and flagged `proxy: true` in the match report:

```
dribbleAtk = .45 tech + .25 agility + .15 pace + .15 composure
tackleDef  = .45 def  + .30 marking + .15 phys + .10 agility
pressAtk   = .45 work_rate + .25 pace + .15 agility + .15 marking
pressEsc   = .40 tech + .25 composure + .20 agility + .15 phys
passExec   = .65 pass + .20 tech + .15 composure
intercept  = .55 marking + .25 work_rate + .20 pace
shotQual   = .60 finish + .25 composure + .15 tech
longShot   = .55 finish + .25 phys + .20 tech      (+ setPiece flag on free kicks)
blockDef   = .55 marking + .30 def + .15 phys
reboundWin = .40 pace + .30 agility + .30 marking
```

Each composite is listed in `attributes.js` with the duels that consume it. A test fails if an attribute feeds nothing.

### 4.2 Worked duel examples [measured with today's ratings, spike composites, k = 12]

| Attacker → defender | Attacker composite | Defender composite | P(beat man) |
|---|---|---|---|
| Okocha → Vidić | 91.7 | 87.8 | 0.48 |
| Okocha → Maldini | 91.7 | 92.5 | 0.39 |
| R9 → Maldini | 98.2 | 92.5 | 0.52 |
| R9 → Vidić | 98.2 | 87.8 | 0.61 |
| Okocha → Djalminha (as a covering defender) | 91.7 | 45.3 | 0.92 (cap) |
| R9 → Batistuta (3-striker "anchor") | 98.2 | 46.8 | 0.92 (cap) |

**Interpretation:** elite against elite is a coin flip. **Structure decides who gets to take duels against a weak defender.** That's the whole team-balance mechanism, and it's visible in the log.

### 4.3 Team-balance model (explainable, no forced 1-1-1)

Per-player phase scores:

```
ATT_i = .30 finish + .25 dribbleAtk + .15 tech + .15 composure + .15 pace
MID_i = .30 passExec + .20 pressEsc + .20 tech + .15 work_rate + .15 stamina
DEF_i = .40 tackleDef + .30 marking + .15 work_rate + .15 pace
```

**Duty assignment.** All 6 permutations of anchor/link/spearhead are scored as `DEF(anchor) + MID(link) + ATT(spear) + 0.5·min(of the three)`, and the best is chosen. The min term rewards having no hole.

**Coverage per phase:**

```
cover_k = .70 · Phase_k(assigned) + .30 · mean over others j of [ Phase_k(j) · work_rate_j/100 ]
```

The second term is how versatile players earn credit:
- Vieira, Davids and Gerrard add real cover outside their duty.
- Riquelme and Djalminha add almost none.

No position labels are used; F/M/D stays display-only.

**Report output** (shown after lock, before kickoff). Spike example [measured]:

> Ballack/Maldini/R9 — Maldini anchors · Ballack links · Ronaldo spearheads. Cover DEF 83.8 / MID 81.8 / ATT 91.1.
> Okocha/Djalminha/Vidić — Vidić anchors · Djalminha links · Okocha spearheads. Cover 76.1 / 78.0 / 79.7.
> Edge: Ronaldo vs Vidić is the decisive duel; Djalminha's link role gives little protection when Vidić is drawn out.

**Coverage is not added to a win probability.** It decides *who stands where and who marks whom*. The penalty for three strikers comes from the duels they then have to defend. That's what makes team balance "substantially affect probabilities without predetermining victory".

**Chemistry** is bounded, mechanical, and never invented friendship. Total effect is capped at ±4%:

| Pairing | Condition | Effect |
|---|---|---|
| Creator → runner | pass ≥ 90 and a teammate pace ≥ 88 | +through-ball and race |
| Destroyer behind artists | anchor tackleDef ≥ 88 and ≥ 1 teammate dribbleAtk ≥ 90 | +transition defence |
| Ball-hog clash | ≥ 2 players with work_rate < 55 and flair-dominant utilities | −press, −pass choice |
| Twin threat | 2 players finish ≥ 90 | +rebound conversion |

### 4.4 Balance targets and where the spike stands

KO mode, both sides Balanced, sides swapped on alternate seeds. The spike column uses `k = 22`, clamps .12/.88 and the shot-bound fix.

| Matchup | [target] first side wins | [measured] spike | Gap and fix |
|---|---|---|---|
| Ballack/Maldini/R9 vs Okocha/Djalminha/Vidić | **55–65%** | 85.5% | R9's ratings (98/98/99) dominate any duel model. Raise `k`, narrow clamps. **Rating review:** R9 is 99 for both finish and composure; flag for the peak-scale anchor rule (§9.1) |
| Ballack/Maldini/R9 vs Batistuta/Ibrahimović/Adriano | **62–72%** | 76.0% | close |
| Mirror (Ballack/Maldini/R9 vs itself) | 49–51% | 51.8% | kickoff bias; swap sides in harness ✔ |
| Ronaldinho/Zidane/Rivaldo vs Kanté/Yaya/Hazard | **40–50%** | 28.5% | All-rounders over-rewarded (Yaya's 6-stat mean is the roster's highest, 86.8). Needs honest work_rate/composure ratings |
| Martins/Owen/Stam (Counter) vs Riquelme/Quaresma/Davids | 50–60% | 70.2% | — |
| Same trio, but Martins/Owen/Stam on Possession | **35–45%** | 67.0% | **Tactic doesn't matter enough.** It should drop ~20 points. Personnel-gated tactics (§4.5) |
| Maldini/Chiellini/Thuram vs Okocha/Aimar/Denílson | 35–50% | 15.7%; 38% reach the decider | Defensive trios can't create. Escalation must open play (2v2/1v1 bonuses) |
| Gravesen/Stam/Vidić vs Ronaldinho/Zidane/Rivaldo | 35–45% | 8.9% | Same issue, plus no finishing in that trio |

**The honest reading:** the architecture now makes structure matter, which the current engine can't do. The spike overshoots, and it overshoots in diagnosable places: rating extremes, missing work_rate/composure, tactic personnel-gating, escalation. That is exactly what P3–P5 tuning is for. **No trio is hard-coded anywhere.**

### 4.5 Tactics as behaviour parameters (no strength multipliers)

| Tactic | Press freq | Aggression | Patience | Flair | Directness | Shoot bias | Fatigue | Line |
|---|---|---|---|---|---|---|---|---|
| Balanced | .35 | .3 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | mid |
| Possession | .25 | .2 | 1.6 | .8 | .7 | .8 | .9 | mid |
| Press | .75 | .5 | .9 | .9 | 1.0 | 1.0 | 1.35 | high |
| Counter | .12 | .3 | .6 | 1.0 | 1.6 | 1.25 | .9 | deep |
| Lockdown (P4b) | .10 | .4 | 1.0 | .7 | .9 | .9 | .85 | very deep |
| Street flair (P4b) | .35 | .2 | .7 | 1.8 | 1.0 | 1.1 | 1.1 | mid |

**Personnel gating** (the fix for spike S4):
- Press effectiveness scales with the team's mean `pressAtk` and work_rate.
- A beaten press costs the presser 2 actions out of position.
- Possession scales with min(passExec, pressEsc) across the trio.

Intended counter-cycle: Press > Possession > Lockdown > Counter > Press. Flair is high-variance.

**Ship 4 tactics; add Lockdown and Flair once the 4×4 matrix passes §8.4.**

---

## 5. Event system

### 5.1 Principles

- **Engine events are facts.** Each one records: the participants (by named role), where it happened, the probability, the roll, the outcome and machine-readable reasons.
- **No prose in the engine.** No event is ever created by commentary, stats or UI.
- Events are append-only and indexed. `t` is in simulated seconds.

### 5.2 Schema (v1)

```js
{
  i: 57,                       // index in log
  t: 172,                      // simulated seconds since kickoff
  phase: "3v3",                // 3v3 | 2v2 | 1v1 | cage_runs
  poss: { team: 1, id: 14 },   // possession number; every event belongs to one
  type: "dribble_duel",
  roles: { attacker: "ronaldo-nazario", defender: "nemanja-vidic" },   // NAMED roles, never actor/opp
  cell: { col: "opp_box", lane: "right" },
  calc: { a: 96.1, d: 88.4, p: 0.61, roll: 0.734, k: 22, terms: { transition: 0.3, fatigue: -0.04 } },
  outcome: "defender_wins",
  reasons: ["defender_recovery", "forced_to_wall"],
  tags: ["duel", "transition"]
}
```

Event types and their role keys:

| Group | Types (roles) |
|---|---|
| Structure | `kickoff`, `possession_start`, `possession_end`, `escalation`, `withdrawal`(player), `match_end` |
| Ball movement | `carry`(carrier), `pass`(passer, receiver, interceptor?), `through_ball`(passer, receiver, interceptor?), `wall_pass`(attacker, defender) |
| Duels | `dribble_duel`(attacker, defender), `press`(presser, carrier), `race`(attacker, defender), `recovery_run`(player), `rebound`(attacker, defender, winner) |
| Finishing | `shot`(shooter, pressure?), `block`(blocker, shooter), `shot_off_target`(shooter, near: bool), `goal`(scorer, assist?) |
| Rules | `foul`(fouler, fouled), `free_kick`(taker), `restart`(player) |

### 5.3 What it supports

| Need | How |
|---|---|
| Replay | Same `MatchInput` → identical log, `hash` matches. Or store the log and replay it without re-simulating |
| Alternative commentary styles | The narrator is a pure function `(events, style, seed)`. Same log, different voice |
| Statistics | `stats.derive(events)` (§9) |
| Debugging | Every event has `calc` (inputs, p, roll, terms), so you can trace any outcome |
| Tactical analysis | `report.analyse(events, shapes)` aggregates by duel pairing, zone and tactic term |
| Future visuals | `cell` + roles + `t` are enough to animate a 2D cage |

### 5.4 Integrity rules (test-enforced)

- Every role ID belongs to the right team.
- `goal.scorer` equals the shooter of the immediately preceding `shot` in the same possession.
- `goal.assist` is a teammate who completed the last pass in the same possession [spike S6].
- Score = count of `goal` events. A KO match has exactly one goal and ends there.
- Every `calc.p` is inside its mechanic's bounds.
- RNG draw count equals the spec.

---

## 6. Commentary architecture

### 6.1 Pipeline

```
events ─► segmenter ─► interpreter ─► selector ─► renderer ─► lines[{t, text, importance, pace}]
```

1. **Segmenter.** Groups events into *passages*: build-up, duel, chance, aftermath, lull. Routine passes in your own half (3 or more in a row) collapse into a single **quiet passage** line. These are deliberate lulls, so the big moments stand out.
2. **Interpreter** (context memory, read-only). It tracks:
   - a duel ledger per player pair ("that's twice now Vidić has had the better of Ronaldo");
   - shots so far and near misses;
   - escalation state and time since the last chance;
   - first appearance of each player (full name the first time, short name after);
   - streaks ("Djalminha is running this game").
3. **Selector.** Picks a template from a bank keyed by `type/outcome/style`. The variant is chosen by `hash(seed, eventIndex, bank)`, rejecting the last 2 used in that bank. This is deterministic and uses no engine RNG.
4. **Renderer.** Fills slots from **role names** (never positional actor/opp, spike S5) and adds the build-up/climax punctuation. Lines are `importance` 0–3; the UI uses this for pacing.

### 6.2 Personality without fabrication

Personality comes from attribute-derived **style tags**, never from invented anecdotes:

| Tag | Derived from | Effect on templates |
|---|---|---|
| `artist` | tech ≥ 94 and dribble-dominant | "drops the shoulder", "outrageous", "with the outside of the boot" variants |
| `destroyer` | def ≥ 93, phys ≥ 90 | "clatters", "stands him up", "wins it cleanly" |
| `sprinter` | pace ≥ 95 | "burns him", "gone", "can't live with the acceleration" |
| `metronome` | pass ≥ 94, low dribble share | "probing", "dictating", "sets the tempo" |
| `powerhouse` | phys ≥ 94 and finish ≥ 90 | "bullies his way through", "thunderous" |
| `low-skill dribble win` | dribble composite < 70 wins | "muscles past", "bundles through" (so Vidić never "dances past" anyone) |

Lexicon:
- Display name (Ronaldo Nazário → "Ronaldo"; Jay-Jay Okocha → "Okocha").
- Second reference by **nationality only** ("the Brazilian", "the Serb"). That's a fact from the roster.
- **No nicknames unless they're already in the verified alias list** ("Il Fenomeno" is; invented nicknames are not).

### 6.3 Template banks

**Minimum** per event outcome: 4 variants per style, plus 2 "callback" variants that need context, e.g. "Again Vidić wins the duel", "After that miss earlier…".

Banks:
- kickoff
- carry
- pass (forward / recycle / interception)
- through ball (in / cut out)
- race (attacker clear / defender recovers)
- dribble (win / lose, per style tag)
- wall pass (win / lose)
- press (beaten / won)
- foul
- free kick (build-up / result)
- shot build-up (normal / one-v-one / long range)
- block
- miss (near / wide)
- goal (per kind: box / edge / one-v-one / rebound / free kick)
- rebound (attack keeps / defence clears)
- quiet passage
- escalation
- withdrawal
- decider
- full time

**Styles:** `classic` (measured, FM-like) ships first. `terrace` (louder) is added later. Same events, different banks.

### 6.4 Rules for drama

- **Build-up.** When a passage ends in a shot, the shot line gets its own beat ("Ronaldo sets himself...") before the result line ("HE SHOOTS! Blocked by Vidić!"). Capitals appear only on importance 3 (shot results, goal), and only once per passage.
- **No fabricated content.** Every sentence must map to ≥ 1 event. A test parses each line's player names and checks them against that event's roles.
- **Variety.** Within any 20-line window, no template repeats. In 1,000 narrated matches, no bank's top variant exceeds 45% use. Both are measured in tests.
- **Tone.** Dramatic, adult, football-literate. Banned list: "epic", "insane", emojis, and anything that names a real club or tournament.

### 6.5 Sample [measured, spike narrator, classic bank, seed 22, Ballack/Maldini/R9 (Balanced) vs Okocha/Djalminha/Vidić (Press), final 30 seconds]

Each line is derived from one engine event. The `!` marks are importance levels for pacing.

```
03:03 !!  The one-two with the boards! Ronaldo leaves Vidić behind.
03:07     Ronaldo finds Ballack between the lines.
03:10 !!  A feint, a touch, and Ballack is beyond Djalminha.
03:10 !!  Space for Ballack...
03:12 !!! HE SHOOTS... wide, and it cannons back off the wall.
03:12 !!  Off the boards, and Ronaldo is first to it!
03:12 !!  Ronaldo sets himself...
03:14 !!! The strike comes in, and Vidić throws himself in the way!
03:14 !!  The wall gives it back and Maldini pounces!
03:18     Maldini slides it into Ballack.
03:21 !!  Ballack plays it off the wall and collects it past Djalminha. Pure cage football!
03:21 !!  Ballack has a sight of goal...
03:23 !!! Fizzing past the post! The cage groans!
03:23 !   Loose off the wall, Vidić gets there first and clears the danger.
03:26     Vidić strides on. Room to run.
03:30 !   Vidić looks for Okocha, but Maldini reads it and steps in.
03:34     Neat from Maldini, threaded to Ballack.
03:34 !!  Space for Ballack...
03:36 !!! Snatched at. Well wide.
03:36 !   Vidić reacts quickest to the rebound and calms everything down.
03:39     Vidić drives into the space.
03:42     Vidić carries it forward, nobody stepping out.
03:46     Vidić finds Okocha between the lines.
03:50     Okocha slides it into Djalminha.
03:50 !!  Djalminha sets himself...
03:52 !!! Djalminha! IT'S IN! First goal, and it wins it! Made by Okocha.
```

What this sample proves:
- Event-faithful narration works: Ballack/Maldini/R9 out-shot Okocha/Djalminha/Vidić 5–2, and still lost on the one chance that went in. Upsets are genuine, not scripted.

What it shows is still missing:
- callbacks for the 5–2 shot count ("All that pressure, and it's the visitors who strike");
- the `destroyer` style for Vidić carrying (should be "strides out from the back");
- a quiet-passage line at 03:39–03:46.

---

## 7. Recommended UI behaviour

### 7.1 Match flow

1. **After lock:** a pre-match card shows duties, phase-cover bars, the key duel, and the tactic choice. No win percentage is shown, to avoid a predetermined feel. Owner decision: show it after the match only.
2. **Kickoff:** the narration panel (FM-style, newest at the bottom, auto-scroll that can be pinned off), a scoreboard with clock and phase (3v3 → 2v2 → 1v1), and a mini cage diagram highlighting the ball cell from `cell`.
3. **End:** result banner, then the report tab (§9) and timeline tab.

### 7.2 Playback (presentation only)

| Mode | Behaviour |
|---|---|
| Instant | Show the final result + report immediately. The full narration stays available in the timeline |
| Fast | Only importance ≥ 2 lines, 250 ms apart |
| Normal | All lines; delay = 600 ms + 25 ms per word, ×0.5 for importance 0 |
| Dramatic | Normal × 1.4, plus extra beats: 1.2 s before every shot result, 2.5 s hold on goals; quiet passages at normal speed so they contrast |

- Controls: Pause / Resume (Space), speed switch at any time (1–4 keys), Skip to end, Replay (same log, from the start), Replay seed (re-simulate with an entered seed).
- **Guarantee:** playback consumes a finished `MatchResult`. It never calls the engine and never feeds back. A test asserts that the result hash is identical regardless of speed.
- **Accessibility:** narration in an `aria-live="polite"` region (goals use `assertive`); a reduced-motion setting disables Dramatic holds; full keyboard operation.

### 7.3 Draft UI (claim rules)

- Turn order indicator.
- Masked input until confirm (H4 below).
- "Already claimed by [team]" message.
- Disambiguation shows only identities matching what you typed.
- Pilot-roster label.
- No browse.
- Undo only inside the confirm step (owner decision, §9.3).

---

## 8. Testing and balancing methodology

Everything runs with `node --test` (built into Node 24, no install). Browser checks use headless Chrome `--dump-dom` with an injected script, as in this audit. Playwright only if the owner authorizes a dependency.

### 8.1 Determinism

- Golden hashes for 20 fixed `MatchInput`s. A change requires a version bump.
- The same 1,000 seeds produce the same hashes in Node and in headless Chrome (cross-engine).
- The narrator gives the same output for the same (log, style, seed), and changes when the style changes while the log stays identical.

### 8.2 Contract and integrity tests

- **Log integrity** (§5.4).
- **Commentary integrity:** every rendered line's player names ⊆ the roles of its source event. Every goal line references the scorer from the `goal` event. No line exists without a source event.
- **Statistics integrity:** every stat is re-derivable by a second, independent counter over the log. Possession sums to 100. Shots ≥ on-target ≥ goals.
- **Attributes:** every attribute in `attributes.js` has ≥ 1 consumer, and no engine code reads a `derivedLegacy` field.
- **Purity:** a grep test bans `Math.random`, `Date`, `window` and `document` from the core folders.
- **Draft:** EXCLUSIVE_DRAFT_RULES acceptance tests 1–10. Races are tested by applying conflicting commands in both orders through the pure reducer: exactly one succeeds, and the loser gets `ALREADY_CLAIMED{owner}`.
- **Identity:**
  - `R9`/`Ronaldo Nazário`/`ronaldo fenomeno` → one ID.
  - `Ronaldo` → disambiguation with ≥ 2 identities.
  - `Keane` → disambiguation.
  - `Okocha Jay Jay`, `Djalminah`, `Mihajlovich` → resolve.
  - `nema`, `juan` → nothing.

### 8.3 Balance sweeps (`tools/balance.mjs`)

All sweeps swap sides on alternate seeds.

| Report | Method | Flag if |
|---|---|---|
| Named matchups | §4.4 table, 20k seeds | outside the target band |
| Composition league | 2,000 random trios × 50 KO matches. Points share by coverage class (complete / one gap / two gaps) | complete − two-gap < 15 or > 35 points |
| Player marginal value | Substitute each player into 500 trios against a fixed field | > +8 points over the duty median (overpowered), or < −8 (unusable) |
| Generalist check | Share of top-10 marginal players with all three phase scores ≥ 75 | > 60% |
| Underdogs | Upset rate between adjacent strength deciles | outside 35–48% |
| Skill signal | Spearman (team strength index, win rate) | outside 0.55–0.80 (noise vs spreadsheet) |
| Mirror | team vs itself | outside 49–51 |
| First-pick advantage | Bot drafts using marginal values; alternating vs snake | first picker > 55% |

### 8.4 Tactic counterplay

- Matrix for 6 archetypes: complete, artists, strikers, grit, counter-pace, galácticos.
- No tactic is the best response to all others for any archetype.
- Mirror row spread ≤ 6 points.
- Each tactic is the best response somewhere.
- Press is negative for low work-rate trios.

The spike currently **fails** this (Press dominant). That's the first regression target.

### 8.5 Attribute influence (kills cosmetic ratings)

- +10 to one attribute of one player, across 200 contexts.
- Mean |Δ win%| must be ≥ 0.7 points for every attribute.
- Publish the full sensitivity table each sweep.

### 8.6 Realism and variety

| Metric | Target |
|---|---|
| KO duration | median 1.5–3 sim-min; reaches 2v2 15–30%; reaches decider ≤ 1% (spike: 0–2% except defensive trios, 38%) |
| Shots before the KO goal | 3–7 (spike: 3–10) |
| Goal mix (KO) | combination 30–45%, dribble 15–25%, transition 20–35%, rebound 8–15%, free kick 2–6% |
| Scorer realism | spearheads 55–70% of goals, anchors 2–12% (spike: R9 73%, slightly high; Maldini 0.2% ✔) |
| Exhibition (20 min) | goals mean 4–7, draws 10–18% |
| Event variety | every event type appears in ≥ 2% of matches; no identical 5-event sequence in > 3% of matches |
| Commentary variety | §6.4 thresholds |

### 8.7 Performance budget

≥ 2,000 KO matches per second per core in Node. The spike does ~9,000 [measured] with string-free events, so this has headroom for the full model.

### 8.8 "Engine v0.3 done" acceptance

- §8.1–8.2 all green.
- §8.3–8.6 inside their bands, or deviations accepted by the owner in writing.
- Claude reads 50 random narrated matches and finds zero causally impossible chains and zero misattributed lines.
- Keyboard-only full flow works in Chrome and Edge.

---

## 9. Match rules for the cage, statistics and open decisions

### 9.1 Cage rules (recommended defaults; owner approval needed)

| Rule | Recommendation | Reason |
|---|---|---|
| Dimensions | Presentation: 24 m × 16 m, goals 2 m × 1 m. Engine: 4 × 3 grid | Tight enough that every turnover matters |
| Goalkeepers | None, and **no protected area** | A protected area would make anchors useless. Blocks, angles and the narrow goal are the defence |
| Walls | Always in play: misses, blocks and over-hit passes produce contested rebounds; wall-pass is an action. No throw-ins or corners | This is the signature mechanic |
| Restarts | Kickoff from the anchor in the own box. Foul in the opponent's half → direct free kick (one-man wall). Elsewhere → indirect restart | Few, explainable restart types |
| Fouls | Probability on losing defensive duels. No cards in v0.3 | Physicality matters without bookkeeping |
| **Headline KO** | First goal wins. **Escalation:** at 5:00, each side withdraws its most fatigued player → 2v2. At 8:00 → 1v1. At 10:00 → alternating "cage runs" (one possession each from halfway), sudden death after 3 each. If still level → the side with more accumulated shot quality (xG) wins | Every match ends. Each step opens space. The final fallback is *earned* (chances created), never a coin flip. **The spike first used a coin flip and it decided 21% of all-defender matches; that's unacceptable** |
| Escalation balance | 2v2 and 1v1 add +0.4 / +0.8 logit to attacking duels, plus a shot-base bonus | Spike S7: defensive trios otherwise stall into the decider |
| Exhibition | 2 × 10 min, golden goal if level, then cage runs | Secondary mode |
| Series | Optional best-of-3 KO | A single first goal makes the better trio lose ~20–30% of the time; best-of-3 roughly halves that |

**Rating-scale anchor rule** (for the P1 rating pass):
- 99 is reserved for era-defining outliers in that specific skill.
- Any rating ≥ 95 needs a written rationale.
- Per-attribute roster standard deviation ≥ 10.
- [measured] Today, 14 of 57 players have tech ≥ 95, and R9 has 98 pace / 98 tech / 99 finish / 99 composure (derived). The spike shows this alone pushes Ballack/Maldini/R9 past its target band.

### 9.2 Statistics (derived only from events)

| Stat | Source events |
|---|---|
| Possession % | sum of (`possession_end.t` − `possession_start.t`) per team. **Not inferred** (spike S7: an inferred version read 50/50) |
| Shots / on target / off target / blocked | `shot`, `goal`, `shot_off_target(near)`, `block` (on target in a no-GK game = goal or blocked on the line; define once and test) |
| Passes attempted / completed | `pass`, `through_ball` outcomes |
| Dribbles attempted / successful | `dribble_duel`, `wall_pass` |
| Tackles / interceptions / blocks / press wins | defender roles in duels, `pass.interceptor`, `block.blocker`, `press(won)` |
| Chances created | the passer of the last completed pass before a `shot` in the same possession |
| xG | sum of `calc.p` on `shot` (already computed by the engine, not re-estimated) |
| Player ratings 1–10 | a published formula over that player's events. Labelled "match rating (formula)" |

**Post-match analysis** (`report.analyse`) is generated only from events + team shape:
- the decisive duel pairing (most-contested, highest swing);
- zone of most turnovers;
- tactic effects (press wins, transitions created);
- the passage that led to the goal, as a chain;
- "what nearly happened" (top-xG misses);
- each claim in the report cites event indices, so the UI can link them to the timeline.

### 9.3 Risks and unresolved decisions

1. **Ratings are the game.** A biased rating becomes a dominant pick. Mitigations: anchor rule, rationale for ≥ 95 values, marginal-value audit every roster version, two reviewers for outliers.
2. **Generalist dominance.** This is the most likely way the balance rule fails (Yaya/Gerrard/Vieira lead raw means). Mitigations: honest work_rate/composure, the `.70` specialist weight, the generalist check.
3. **First-pick advantage under exclusive claims.** Owner decision: **snake** order (A,B,B,A,A,B) recommended; alternating; or **blind rounds** (each side privately enters one name per round; a conflict is resolved by a seeded draw or a server timestamp).
4. **A shared screen spoils recall.** Masked input plus a pass-the-device interstitial.
5. **Wrong claims are irreversible** (released players stay used). Mitigations: ambiguity table for surnames; owner decision on a confirm-step undo.
6. **KO variance frustrates experts.** Mitigation: best-of-3 option.
7. **Cross-browser drift** if anyone uses `Math.exp`/`pow`. Mitigations: lint + parity test.
8. **Tuning overfit to 57 players** (24 M / 13 D / 20 F labels, mostly 1995–2010). Mitigations: re-sweep every roster version; keep a frozen reference field.
9. **Commentary misattribution destroys trust faster than any balance bug** (spike S5). Mitigation: commentary-integrity test is a release blocker.
10. **Scope creep toward physics.** Resist until §8.8 passes.
11. **Rights.** Original ratings (no FIFA/PES/FM numbers), original commentary text (FM-*inspired* presentation, no copied lines), no Nike/Scorpion KO/Cantona assets (JOINT_BRIEF).

**Owner decisions needed before P2/P3:**
(a) draft turn order; (b) undo window; (c) KO escalation + xG fallback; (d) best-of-3; (e) §4.4 targets; (f) the 5 new attributes and the rating pass; (g) 4 tactics first; (h) dev server vs single-file build (ES modules don't load over `file://` in Chrome); (i) show the pre-match win estimate or not.

---

## 10. Prioritized roadmap and task split

### 10.1 Phases (each ends at a Claude review gate; no phase starts on red tests)

| Phase | Outcome | Size |
|---|---|---|
| **P0 Housekeeping** | git init (CODEX_TASK step 2), README, remove `LEGACY_PLAYERS`, `tools/serve.mjs`, `node --test` scaffold | ½ day |
| **P1 Data & identity** | `ratingMeta` (legacy-derived flags), 5 new attributes (proxies, then reviewed values), `attributes.js` registry, ambiguity table, resolver with typo tolerance | 1–2 days + rating pass |
| **P2 Draft claims** | pure claims reducer, turn order, masked input, "Already claimed by X", EXCLUSIVE 1–10 tests | 1–2 days |
| **P3 Engine core** | rng, mathx, params, positioning, decisions, duels, shooting, rules, KO with escalation, named-role events, integrity tests, golden hashes | 3–5 days |
| **P4 Analysis + commentary** | stats, report, narrator (classic bank), commentary-integrity test | 3–4 days |
| **P4b Tactics** | 4 tactics with personnel gating → matrix → then Lockdown/Flair | 1–2 days |
| **P5 Tuning loop** | only `params.js` changes, versioned; BALANCE_REPORT per sweep | iterative |
| **P6 Match UI + playback** | match view, 4 speeds, pause/resume/replay/seed, timeline, report tab; replace the old engine call in `index.html` | 2–3 days |
| **P7 Polish & expansion** | terrace commentary style, cage visuals, roster growth via the rating pipeline | ongoing |

**Migration plan (no big-bang):**
1. The new engine is built beside the old one.
2. `index.html` keeps calling the old `match()` until P6.
3. P6 swaps in the new engine behind a `?engine=v3` URL flag for owner playtesting.
4. The old engine is deleted only after the owner approves.

### 10.2 Who does what

| Area | Claude | Codex |
|---|---|---|
| Architecture, event schema, formulas | **Owns** (this doc, schema spec, params proposals) | Implements; raises infeasibility |
| Engine modules (`src/engine`, `src/draft`, `src/identity`, `src/analysis`) | Reviews | **Owns** |
| Commentary | **Owns the template banks** (`src/commentary/templates/*.js` content) and style rules | **Owns** `narrator.js` mechanics and integration |
| Ratings | Drafts new-attribute values + rationale in `proposals/ratings-*.json`; owner approves | Applies approved diffs to `src/data/players.js` |
| `params.js` values | Proposes deltas with sweep evidence | Applies, bumps version |
| `tools/balance.mjs`, `tests/balance/**` | **Owns** (the auditor owns the yardstick) | Runs, doesn't edit |
| Unit/integration tests, UI, performance | Reviews | **Owns** |
| Design docs | Proposes | Proposes. **The owner decides** |

**Collision rules:**
- Each file has one owner (table above).
- Handoffs are dated lines appended to `HANDOFF_STATUS.md`, naming the files touched.
- Claude never edits Codex-owned files; it files findings in CLAUDE_REVIEW.md or a proposal.
- `proposals/engine-spike/` is reference only: Codex reads it for intent, and must not import or copy its shortcuts (README lists them).

The concrete Codex task list, with acceptance criteria per task, is in **`CODEX_ENGINE_TASKS.md`**.

---

## 11. Final recommendation

1. **Replace the engine; keep everything else.** The memory-first draft, identities and base ratings stay. The per-minute dice engine goes, because its structure can't express the owner's central rule.
2. **Build an event-driven possession engine with lightweight spatial positioning.**
   - A 4 × 3 grid.
   - Duty-based shapes and marking.
   - Opposed duels between named players.
   - Walls as a rebound channel.
   - Tactics as behaviour, never multipliers.
   - One RNG stream, table maths, and the event log as the only truth.

   The spike shows this already makes structure decisive. Its remaining errors are diagnosable and belong to tuning and ratings, not architecture.
3. **Commentary is a pure reader of the log**, with deterministic template selection, context memory, style tags derived from attributes, quiet passages, and an integrity test that makes misattribution a release blocker.
4. **Fix the data honestly.** Add 5 real attributes with written rationale. Keep the 11 legacy-derived fields only for compatibility, and never let the engine read them.
5. **The auditor owns the yardstick.** Claude owns `tools/balance.mjs` and the commentary banks. Codex owns the engine code. Tuning happens only in `params.js`, with evidence.
6. **Headline product:** first-goal KO with 3v3 → 2v2 → 1v1 escalation and an earned xG fallback; snake or blind-round exclusive drafting; FM-style narration at four speeds.

---

## Appendix A — Reproduction (2026-10-30, Node v24.18.0, Chrome headless)

**Existing project:**
- `node "A:\THE CAGE\tests\roster-integration.cjs"` → PASS.
- **Derived-field detection:** least-squares fit of each of the 11 extra fields against `[1, pace, tech, pass, finish, def, phys]`. Max absolute residuals 0.34–0.47; 5 fields are exact equalities.
- **Current-engine composition league:** 400 random trios, LCG seed 7, 30 random opponents each, balanced/balanced, draw = 0.5. Uses the inline pure functions between `const LEGACY_PLAYERS=` and `function slotUI(`.
- **UI flow:** a script injected into a *copy* of `index.html`, loaded with `chrome --headless=new --dump-dom`.

**Spike** (`A:\THE CAGE\proposals\engine-spike\`, no install):

```
node sweep.js 1 det
PP='{"k":22,"clampLo":0.12,"clampHi":0.88,"foul":0.01}' node sweep.js 2000 main
PP='{"k":22,"clampLo":0.12,"clampHi":0.88,"foul":0.01}' node sweep.js 1500 tactics
node demo.js 22
```

The spike's statistics module is known-incomplete (possession inference, chances created). §9.2 specifies the production method.
