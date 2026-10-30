# CODEX — TACTICAL INTELLIGENCE TASKS

Prepared by Claude, 2026-10-30, from `TACTICAL_INTELLIGENCE_PROPOSAL.md` (§ references point there).

## STATUS — OWNER DECISIONS 2026-10-30 (read first)

**Authorized now:** T0, T1 (with ratings v1.1), T2, **T3**, and **T4.2–T4.4**, plus T4.1 *plumbing only* (see below).

**Held for Claude's research:**
- T4.1 midfield-payoff *formula refinement* (possession-as-denial / tempo);
- T5 tactic *recalibration*.

**Do not invent or tune formulas in these areas.**

**Owner rules that change acceptance:**
- **No underdog floor.** No rule may guarantee a specialist or weaker trio any minimum win rate. The old E11 targets (30–50%) are withdrawn. Quality differences must show. Comparable-quality unconventional trios must win through real mechanics, never composition bonuses.
- Ratings v1.1 (`proposals/ratings-v1.json`, version `ratings-v1.1`) are the approved working baseline. Apply them verbatim. Corrections are documented in `proposals/RATINGS_V1_VERIFICATION.md`; **don't adjust ratings to change match results.**
- Keep a working Git baseline. Run the full regression suite **and** `node tools/claude-tactical-balance.cjs` after each substantial change. Commit locally only; no push.
- Determinism, 3v3 golden goal (no escalation, no forced goal, no xG fallback) and commentary/simulation separation are unchanged.

### Exactly what to build in T3/T4 (validated by the spike)

Reference implementation: `proposals/tactical-spike/engine-tactical.src.js`. Results are in `proposals/tactical-spike/RESULTS.md`.

**Port the mechanisms; don't copy its shortcuts:** Math.exp, actor/opp roles, and missing input validation all need production treatment.

| Mechanism | Spike location | Start from these spike constants |
|---|---|---|
| 11 attributes (6 base + 5 new) and composites | `attrs()`, `comp()` | formulas as written |
| Team policy from capabilities: rest defence, commitment, compactness, risk, directness, press quality | `policy()` | as written |
| Zonal engagement + help defender | `defenders()`, `ZONE_PRI` | — |
| Overload support / help terms in duels | `supporters()`, `helpTerm()` | `support 0.45`, `help 0.75` |
| Duel slope and clamps | `P.k`, `P.clampLo/Hi` | `k 20`, `.10/.90` |
| Committed players caught upfield on turnover | `turnover()` | — |
| Counter-press window | `counterPress()` | `cpWindow 2` |
| Direct outlet after regains | `U.outlet` | `b.outlet 0.6` |
| Scramble shots after wall rebounds | `loose()`, `kind 'scramble'` | `shot.scramble −0.1` |
| Urgency after 150 s + fatigue incl. chasing | `urgency()`, `tire()` | `urgencyStart 150`, `rate 0.12`, `cap 0.8`, `chase 0.6` |
| Calibrated interceptions / fouls | `P.b.pass`, `P.foul` | `2.3`, `0.012` |

**T4.1 plumbing only:**
- Implement displacement δ as engine state: per possession, reset on turnover, halved on recycled rebounds, emitted as `delta` on events.
- Wire its hooks: help × (1−δ), shot base, through-ball and pass bias, block penalty.
- Use the spike's values in `params.displacement` with `provisional: true`.
- Claude will specify the refined formula. **Don't tune δ.**

**T5 interim:**
- Tactics become policy deltas exactly as in the spike's `TACTICS` table, because T3's policy layer needs a tactic input.
- **Don't recalibrate.** Known open issue: High Press is best for 8/10 compositions; Claude is researching it.

### Acceptance gate for T3/T4

On `node tools/claude-tactical-balance.cjs` (full size), the new engine must match or beat the spike:

| Check | Required |
|---|---|
| E1 | range within 40–60%; no cell > 75% |
| E2 | \|opp best DEF\| ≤ 2× own best ATT; team-defence clause |
| E6 | top vs bottom quartile 65–80% |
| E9 | 0 caps in random; ≤ 1 per 10k defensive pairing; median 60–200 s; p99 < 900 s |
| E10 | realism bands |
| E11 | quality gradient |
| E12 | guards |

**Not gated** (research in progress): the E1 "beats ≥ 3" clause, the E2 midfield clause, E4, E5.

Report any gate failure to Claude with the harness output instead of tuning around it.

### Research update (Claude, 2026-10-30, later) — see `RESEARCH_ABC_REPORT.md`

**No new work for Codex now; T3/T4 proceed as specified.**

Validated mechanisms, to be specified *after* the T3/T4 gate passes and re-validated on the production engine:
- **T4.5:** free man / numbers-aware blocking (A2);
- **T4.6:** bypassed press creates a transition, plus press decoupled from rest defence and counter-press calibration (C1, C2).

**Held** (Claude research): B2 receive-in-space, B4 pass-bias recalibration, A1 work-rate availability, C3 fatigue scale. Dropped: B1, B3.

**Please don't port anything from `engine-research.src.js` until it appears here with exact formulas.**

### T3 recovery (Claude, 2026-10-30, supersedes the research update above) — see `CLAUDE_T3_RECOVERY_PLAN.md`

The owner removed the "after the T3/T4 gate" condition. The specs are now delivered against T3 itself (`cage-t3-3`), with exact formulas, integration points, RNG ledger and per-mechanism tests:
- **Integrate in order, one mechanism per commit, full harness after each:** R1 urgency → R2 second-ball shot → R3 press `rest 0` → R4 bypassed press opens a transition → R5 cover-aware discipline → R6 regainer joins the counter. **R3/R4 must land before any build ships R1/R2** (R1+R2 alone make press best for 9/10).
- **Held:** R7 free man from help defence (validated mechanically; costs DDD 2–5 pts), R8–R11 midfield set, C3.
- **Not to port:** the spike-era A2 cut-back condition, D1, D5, D6, Q1, M1.

These supersede T4.5/T4.6 above: R3/R4 replace C1/C2 for T3, and R7 replaces A2.

---

**Original status line:** for owner review. *(Superseded by the status block above.)*

**Rules for every task:**
- Owner locks hold:
  - 3v3 throughout; first real goal wins.
  - No escalation, forced goal or xG fallback.
  - Alternating claims; no undo.
  - Best of five.
  - No win probability shown.
- **No composition switch statements or label-based modifiers.** The engine must never read `role`, the identity label or any legacy-derived field. This is enforced by T0.3.
- **Determinism:** any new RNG draw is documented per resolver; golden hashes are updated only with a `PARAMS_VERSION` / `VERSION` bump.
- Tests use plain Node (no new dependencies). No push, no deploy. Append to HANDOFF_STATUS.md per task.
- **File ownership:**
  - Claude owns `tools/claude-tactical-balance.cjs`, `tests/balance/**` and the content of the commentary template banks.
  - Codex owns `src/**` code, UI and unit tests.

---

## T0 — Baseline and guards (no behaviour change)

| ID | Task | Acceptance |
|---|---|---|
| T0.1 | Tag the current engine as baseline (`git tag tactical-baseline`). Keep `CODEX_BALANCE_*` reports | Tag exists |
| T0.2 | *(Claude)* Add `tools/claude-tactical-balance.cjs`: E1 matrix, E2 elasticity, E3 route tags, E4 behaviour divergence, E5 tactic matrix, E9 durations. Uses mulberry32, equal-quality filter, side swapping | `node tools/claude-tactical-balance.cjs --quick` prints all tables on the live engine |
| T0.3 | Guard test `tests/engine-guards.cjs`: grep `src/cage-engine.js` and `src/tactics/**` for `.role`, `identity`, and legacy fields (`first_touch`, `dribbling`, `passing`, `vision`, `finishing`, `shooting`, `stamina` (legacy), `physical`, `tackling`, `positioning`, `composure` (legacy)) | Fails on violation; allowlist only for explicit new-attribute names |
| T0.4 | Expose an engine hook for analysis without changing results: every event gets optional `tags: []` (empty for now) | Golden hashes unchanged (tags excluded from the hash until T3) |

## T1 — Five new ratings (prerequisite for T3+)

| ID | Task | Acceptance |
|---|---|---|
| T1.1 | *(Claude)* **DONE.** `proposals/ratings-v1.json` (version ratings-v1.1): work_rate, stamina, composure, agility, marking for all 63 players, each with a rationale; verification in `proposals/RATINGS_V1_VERIFICATION.md` | Owner approved 2026-10-30 |
| T1.2 | Apply ratings-v1.1 verbatim as a new `attributes` block per player (`attributes.{work_rate,stamina,composure,agility,marking}`; the legacy `r.stamina` / `r.composure` remain separate, and the engine must read only `attributes.*`), with `ratingsVersion: 'ratings-v1.1'`. **Existing 17 fields stay byte-identical** | `tests/records.cjs` original-57 check still passes; schema test requires all 5 fields with a range check |
| T1.3 | `src/engine/attributes.js` registry: attribute → consumer list | Test: every attribute has ≥ 1 consumer after T3 |

## T2 — Capabilities and identity (pure modules, not wired to the engine or UI yet)

| ID | Task | Acceptance |
|---|---|---|
| T2.1 | `src/tactics/capabilities.js`: composites and ATT/MID/DEF per player (§B1); six raw dimensions (§B2); `grade = clamp(round(50+12z),5,99)`, using calibration constants computed over all trios of the roster and stored per `rosterVersion` | Unit tests: formulas match the spec on 3 fixture trios; the calibration file is regenerated by a script; grades are deterministic |
| T2.2 | `src/tactics/identity.js`: capability role per player, two-way flag (second phase within 6), archetype by cosine similarity to the 10 prototype vectors (defined in the module, documented), cohesion points → S–D by roster percentile (§B4) | Unit tests: Vidić/Stam/Gravesen → Iron Fortress-like; R9/Ronaldinho/Rivaldo → All-Out Assault-like; Zanetti/Thuram-type technical defenders can land outside Iron Fortress; **no code path reads `role`** |
| T2.3 | Hide grades derived from `provisional` ratings behind a flag | Test |

## T3 — Policy layer and numbers-aware engine (**owner approval required**)

| ID | Task | Acceptance |
|---|---|---|
| T3.1 | `src/tactics/policy.js`: policy vector `{blockHeight, restDefence, commitForward, tempo, riskAppetite, pressTrigger, directness, rotation}` from grades + composites + tactic (§D1). Formulas in one documented table; constants in `params` | Unit tests on the D1 examples (R9/Ronaldinho/Rivaldo → restDefence 0, commitForward 3; Vidić/Stam/Gravesen → restDefence 2, high directness) |
| T3.2 | Engine shape from policy: replace the fixed `MARK` map with zonal assignment (nearest in-shape engages; second nearest within 1 cell = helper); per-possession dynamic duties; `rotation` lets two-way players swap (§D2) | Events record `roles.helper`; log-integrity tests pass |
| T3.3 | Numbers-aware duels: `+ s·support − h·help` in dribble, wall-pass, pass and shot-block resolution (§D3); recalibrate `k` (start at 22) and clamps (start .12/.88) | Claude's E2: \|opp best DEF\| ≤ 2× own best ATT; E1 no composition below 35% (interim gate) |
| T3.4 | Event tags: `overload`, `help_defence`, `rest_defence_exposed`, `counter_press`, `direct_outlet` | Tags present; included in the hash from this version on |

## T4 — Midfield payoff, transitions, termination

| ID | Task | Acceptance |
|---|---|---|
| T4.1 | Displacement δ per possession (§D4): gain on completed passes / press escapes, decay from defending actions with help, effects on help count, shot base and through balls; reset on turnover; emit `delta` in event `calc` | E2: own mean MID ≥ +8% goals per possession; E3: Orchestra ≥ 40% of wins after δ ≥ 0.5 |
| T4.2 | Counter-press window (2 actions, players within 1 cell, press vs escape) and directness outlet after regains (§D5) | E3: Iron Fortress ≥ 50% of wins via transition / second ball / set piece / technical defender |
| T4.3 | Urgency (after 180 s: riskAppetite +0.1 per minute, capped; restDefence −1 allowed for TA ≥ 60) and fatigue effects on pace, agility and marking (§D6). **No forced goals** | E9: 0 cap hits in 100k random matches, ≤ 1 per 10k in defender mirrors, median 60–200 s, p99 < 900 |
| T4.4 | Interception and foul calibration | E10: interceptions 12–22% of passes; free kicks 2–8% of goals |

## T5 — Tactics as policy modifiers

| ID | Task | Acceptance |
|---|---|---|
| T5.1 | Remove utility multipliers as the main tactic effect; each tactic becomes a delta on the policy vector + press/possession costs (§E): failed press = presser out of position + δ spike for the opponent | E5: no tactic best for > 5/10 compositions; each best for ≥ 1; ≥ 6 compositions swing ≥ 5 points by tactic |

## T6 — Commentary

| ID | Task | Acceptance |
|---|---|---|
| T6.1 | Rolling statistics in the narrator (last 60 s: blocks, interceptions, δ, pass streaks, overloads) | Deterministic |
| T6.2 | Identity-aware banks (Claude content). Phrases are licensed only by rolling statistics or event tags (rules C1–C3) | Integrity test extended: every identity phrase maps to its licensing statistic; no identity phrase without one |

## T7 — Dossier and report UI

| ID | Task | Acceptance |
|---|---|---|
| T7.1 | After both trios lock: dossier per team (identity, six grades with bars, cohesion letter, one-sentence capability description). **No win estimate, no player suggestions, no unclaimed names** | UI test: the dossier appears only after both locks; no forbidden content; hidden while ratings are provisional (T2.3) |
| T7.2 | Post-match "how your identity played": possession, overloads, regains, δ peaks, route of the winning goal, citing event indices | Rendered from the log + capabilities only |

## T8 — Calibration loop

| ID | Task | Acceptance |
|---|---|---|
| T8.1 | All new constants in `params`; each change bumps `PARAMS_VERSION` and links a Claude balance report | Version bump test |
| T8.2 | Final gate: proposal §F E1–E12 all pass, or owner-accepted deviations listed | Signed off in HANDOFF_STATUS.md |

---

## Dependency graph

```
T0 ──► T1 ──► T2 ──► T3 ──► T4 ──► T5 ──► T8
                 └──► T7.1 (behind provisional flag)      T6 after T4
```

## Interim gates (stop and report to Claude if they fail)

- **After T3:** E2 elasticity, E1 no composition < 35%, E9 no regression in cap hits.
- **After T4:** E3 routes, E9 termination, E10 realism.
- **After T5:** E5 tactics.

### Update 2026-10-30 (Claude): midfield bundle promoted to next candidate
See CLAUDE_ENGINE_REWARD_FINDINGS.md. After R1-R6, integrate R8, R9, R10 and R11 one per commit (still not R7). Acceptance per step: MID improves, the finisher premium shrinks (proposals/t3-research/player-value.cjs), DDD at or above 33%, and gates do not regress. Daily challenge spec: CLAUDE_DAILY_CHALLENGE_SPEC.md (awaiting owner approval; launch after engine acceptance).
