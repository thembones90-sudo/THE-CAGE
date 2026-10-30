# T3 implementation contract

Scope: T0–T3 only. No displacement, urgency, scramble-shot resolver, multi-action counter-press window, free-man/cut-back system, experimental receive-in-space mathematics, or tactic recalibration. The spike's approved composites, rest/commitment rules, support/help sensitivities and starting tactics are used; its later-phase mechanisms are not imported.

## Inputs and reproducibility

The 63 existing `r` blocks remain unchanged. `attributes.{work_rate,stamina,composure,agility,marking}` is generated verbatim from approved ratings-v1.1. No neutral fallbacks. `src/engine/attributes.js` lists the consumers. All 39,711 roster trios determine the version-stamped grade calibration. Identity/cohesion is display-only and not consumed by simulation; no dossier is shown before the grade-validity research is complete.

`tools/build-t3.cjs` builds the standalone `src/cage-engine.js` from reviewed modules, the approved data and a precomputed sigmoid lookup table. `--check` verifies byte-reproducibility. Runtime never uses `Math.exp`, `Math.random` or wall-clock time. The original v0.4 engine is archived byte-for-byte separately for old saved replays.

## Policy formulas

All fields use capability values and attributes, never career-role or archetype labels. `AT/DS/MC/TE/PD/TA` are raw capabilities from proposal B2, not predicted win probabilities. `tac` values are the approved spike's interim tactic constants; they are not recalibrated here.

| Field | Formula / consumer |
|---|---|
| restDefence | `clamp(min(2, count(DEF >= ATT + 4)) + tac.rest, 0, 2)`; holds real players behind the ball |
| commitForward | `3 - restDefence`; most attack-minded players occupy attacking support cells |
| blockHeight | `clamp(tac.engageHigh * clamp(meanPress / 75, .6, 1.3), 0, .95)`; engagement outside the box |
| compactness | `clamp(.35 + .5 * meanWorkRate/100 + .15 * (DS > AT), .3, 1)`; helper placement/quality |
| tempo | `tac.tempo * clamp(1 + (MC - TE)/200, .85, 1.15)`; patient passing choices, not a T4 payoff |
| riskAppetite | `tac.risk * clamp(1 + (AT - DS)/60, .7, 1.4)`; dribble/wall/through/shot choices |
| pressTrigger | `clamp((meanPress - 55)/40, 0, 1) * tac.cp * clamp(meanStamina/80, .6, 1.2)`; engagement immediately after losing possession |
| directness | `tac.direct * clamp(1 + (DS - AT)/50, .7, 1.5)`; actual forward pass to an available runner after a regain |
| rotation | `clamp(.15 + TA/200 + .1 * twoWayCount, 0, .95)`; rotation frequency. Two-way means the second normalised phase is within 6 of the first |

The spike did not supply complete formulas for rotation or MC/TE tempo. Those bounded definitions complete the requested vector and are explicitly implementation choices for review. They were not fitted to match results.

## Positions and resolution

Each player has an integer world cell `(x=0..3, y=0..2)`. Movement is deterministic and accumulates agility-dependent movement credit. One committed teammate runs a cell ahead on the carrier's lane; another offers a lateral outlet. Held players provide deeper outlets. This forward-run correction is versioned as `cage-t3-3 / t3-space-3`; the earlier abreast-only implementation and its failed full sweep are preserved in `CODEX_T3_SPACE2_*`. The nearest available defender moves toward the ball, the helper closes a neighbouring cell, and another defender follows the advanced runner. Defending requires actual proximity and availability; being the nominal anchor is insufficient. Out-of-position players recover while their real cells still limit coverage. Dynamic duties follow actual depth; eligible two-way players can exchange commitment and covering responsibility.

Passing uses defenders near the actual Manhattan path to the receiver, rather than the receiver's fixed marker. Receiver movement affects pass execution. Support and help affect dribble/wall/pass resolution, and overloads reduce shot-block opportunity while genuine nearby help strengthens it. A strong defender retains his individual tackle/read values; distance can make him unavailable.

`p = clamp(LUT((A-D)/22 + bias + .45*supportQ - .75*helpQ), .12, .88)` for contested duels. Shot goal probabilities retain separate small-goal bounds and quality calculation. There is no composition-level winner modifier.

Immediate regain pressure and a direct outlet are only tagged when an existing spatial action satisfies their conditions. No T4 two-action counter-press window or newly researched transition formula is added. Rest-defence exposure arises from committed players actually caught at/beyond a high loss while at most one teammate is goal-side.

## Evidence and replay contract

Each event contains all six positions, explicit carrier/challenger/helper/support/receiver roles as applicable, nearby player counts, support/help calculation inputs, availability/commitment snapshots, and evidence-backed tags. `src/tactics/evidence.js` independently checks participants, proximity, passing paths and tag predicates. Hashes include tags and all evidence. Results are deeply frozen before commentary. A knockout ends only on its single actual final goal. The safety guard still voids a failed match; it never chooses a winner.

Default browser play remains on v0.4 until acceptance. `?engine=t3` selects the candidate and has a separate save key. The registry can reproduce v0.4 and current T3 rounds; old fingerprints exclude newly attached attributes to preserve existing saved records.

## RNG draws

Kickoff: one. Each recovering player: one. Available engagement: one. Weighted action choice: one. Carry lane: one. Normal-pass receiver choice: one; directed passes do not draw a receiver. Each contested or open recorded pass: one; a non-routine race can add one. Dribble/wall: one duel and one foul draw. Shield pressure: one. Each available shot blocker: one until blocked; an unblocked shot adds one goal draw. Rebound: one. Policy, positioning, dynamic duties, tags and hashes consume no random draws. Early exits determine how many resolvers run, as recorded by `draws`.
