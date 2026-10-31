# THE CAGE: OVR V2.0 Formula and Archetypes

> V2.0 PROVISIONAL: a custom, position-sensitive formula for our 17 prime attributes. Three attributes are duplicated aliases, so we use 14 unique skills.

## 1. Eight skill domains

| Domain | Calculation |
|---|---|
| Mobility | PACE |
| Ball mastery | 0.30 TECH + 0.35 FIRST TOUCH + 0.35 DRIBBLING |
| Creation | 0.58 PASS + 0.42 VISION |
| Scoring | 0.70 FINISH + 0.30 SHOOTING |
| Defending | 0.45 DEF + 0.30 TACKLING + 0.25 POSITIONING |
| Physical | PHYS |
| Composure | COMPOSURE |
| Endurance | STAMINA |

PASS and PASSING, FINISH and FINISHING, PHYS and PHYSICAL are duplicate fields; the extra copies contribute nothing. No tactical supplemental attributes are included.

## 2. Position archetypes (all percentages)

Each card computes every archetype of its natural position and keeps the highest result. Every row below has weights summing to exactly 100%. This rewards a traditional poacher, a false nine, a deep orchestrator, a midfield ball-winner or a defending fullback for their actual strengths rather than one universal skill mix.

| Position | Archetype | Mobility | Control | Creation | Scoring | Defending | Physical | Composure | Endurance |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ST | Poacher | 8 | 10 | 4 | 48 | 0 | 12 | 11 | 7 |
| ST | Mobile striker | 25 | 21 | 4 | 32 | 0 | 8 | 6 | 4 |
| CF | False nine | 9 | 26 | 23 | 23 | 0 | 5 | 12 | 2 |
| CF | Second striker | 15 | 18 | 12 | 34 | 0 | 8 | 10 | 3 |
| CAM | Classic playmaker | 3 | 29 | 37 | 6 | 0 | 2 | 21 | 2 |
| CAM | Attacking runner | 17 | 22 | 18 | 24 | 0 | 5 | 10 | 4 |
| CM | Deep orchestrator | 3 | 28 | 38 | 3 | 3 | 2 | 20 | 3 |
| CM | Box to box | 12 | 17 | 20 | 17 | 10 | 6 | 12 | 6 |
| CM | Ball winner | 16 | 9 | 11 | 0 | 41 | 8 | 5 | 10 |
| CDM | Defensive screen | 3 | 8 | 21 | 0 | 47 | 8 | 10 | 3 |
| CDM | Deep distributor | 2 | 14 | 36 | 0 | 26 | 5 | 15 | 2 |
| LW | Goalscoring winger | 18 | 25 | 13 | 28 | 0 | 6 | 8 | 2 |
| LW | Wide creator | 16 | 30 | 26 | 11 | 0 | 3 | 12 | 2 |
| RW | Goalscoring winger | 18 | 25 | 13 | 28 | 0 | 6 | 8 | 2 |
| RW | Wide creator | 16 | 30 | 26 | 11 | 0 | 3 | 12 | 2 |
| LM | Two-way wide midfielder | 16 | 20 | 23 | 11 | 7 | 7 | 10 | 6 |
| LM | Wide playmaker | 17 | 24 | 32 | 6 | 4 | 4 | 10 | 3 |
| RM | Two-way wide midfielder | 16 | 20 | 23 | 11 | 7 | 7 | 10 | 6 |
| RM | Wide playmaker | 17 | 24 | 32 | 6 | 4 | 4 | 10 | 3 |
| LB | Defending fullback | 13 | 7 | 10 | 0 | 53 | 10 | 4 | 3 |
| LB | Attacking fullback | 22 | 12 | 25 | 0 | 23 | 6 | 8 | 4 |
| RB | Defending fullback | 13 | 7 | 10 | 0 | 53 | 10 | 4 | 3 |
| RB | Attacking fullback | 22 | 12 | 25 | 0 | 23 | 6 | 8 | 4 |
| CB | Traditional centre-back | 5 | 2 | 2 | 0 | 70 | 15 | 5 | 1 |
| CB | Ball-playing centre-back | 7 | 12 | 18 | 0 | 43 | 10 | 8 | 2 |

## 3. Final formula

For each archetype: score = SUM(domain value × positional percentage) / 100.
Raw OVR = clamp(round(highest archetype score), 1, 99).
Displayed OVR = raw OVR, unless a transparent provisional correction is recorded.

## 4. Exclusions and limitations

- Career tier, fame, trophies, club, folklore, nationality and special traits provide zero OVR bonus.
- OVR is display-only. It does not influence match results, tactics or card selection probability.
- Prime rating inputs are unchanged. Most of the 184 historical attribute dossiers are still editorial estimates and require further auditing.
- Exactly one explicit, provisional calibration remains: Alex de Souza displays 89 despite raw V2 = 94. His technical input grades are still too generous to treat the raw calculation as authoritative.
- No individual overrides for the other 183 players.
- Source code: src/overall.js. This document is generated from the same weights as the game.

## Verification

Run: node tests/overall-v2.cjs
Run: node tests/overall-match-invariance.cjs
Run: node tests/ui-regression.cjs
Run: node tests/random-draft.cjs
