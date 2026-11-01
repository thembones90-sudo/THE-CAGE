# THE CAGE: canonical football doctrine (traceable specification)

**Status:** consolidation of owner-approved rulings, 2026-11-01. **No new principles are introduced.** Every item cites its source. Engine work references these IDs (for example "implements P-07").

**Sources:**
- **[B]** the T3-14 brief ("Football Intelligence & Chemistry Engine");
- **[D]** the T3-14 owner decisions, 2026-11-01;
- **[L]** `GAME_DESIGN_LOCK.md` with its 2026-11-01 amendments, and `EXCLUSIVE_DRAFT_RULES.md`;
- **[A]** owner answers recorded in `CLAUDE_PROJECT_AUDIT_20261101.md` §5 and §7.

**On the count.** The brief has 17 numbered principles (B §2.1–2.17) and refers to "23 discussion rulings". Per owner decision D-4, the canonical set below is what the sources actually contain: 17 football principles, plus the core philosophy, the safeguards, the success criteria and the game rules, each listed separately. **The number 23 is not padded.**

## C: core philosophy

| ID | Ruling | Source |
|---|---|---|
| C-01 | No win-rate targets; formations are not balanced toward equal win rates (absolute) | B §1 |
| C-02 | A poorly constructed team deserves to struggle; an intelligently constructed one benefits from complementary abilities | B §1 |
| C-03 | The engine never predetermines results from composition labels | B §1 |
| C-04 | Tactics define the plan, intelligence interprets it, abilities and personalities execute it, chemistry emerges from the interaction | B §1 |

## P: football principles (17)

| ID | Principle | Source |
|---|---|---|
| P-01 | D-M-F is the structural ideal: an advantage, not a victory condition | B §2.1 |
| P-02 | Players keep real identities; position and attributes both influence behaviour without fully restricting it | B §2.2 |
| P-03 | Maximum effort differs by player; separate willingness, recognition and ability; stamina small, work rate meaningful | B §2.3 |
| P-04 | Football intelligence influences which action is selected, not merely success odds | B §2.4 |
| P-05 | Awareness and execution are separate | B §2.5 |
| P-06 | Individual defensive personalities; aggression and positional discipline are independent | B §2.6 |
| P-07 | Defensive reactions account for real opponent danger (no name bonuses) | B §2.7 |
| P-08 | Creative midfielders improve team-mates through real actions; no generic team-wide boost | B §2.8 |
| P-09 | Calculated creative risk is distinct from selfishness; outcomes don't define decision quality | B §2.9 |
| P-10 | Selfishness affects decisions (risk), not an automatic chemistry penalty; no stereotype-based personalities; uncertain cases flagged | B §2.10 |
| P-11 | Chemistry emerges from complementary abilities and overlap costs; no fixed name or club scores | B §2.11 |
| P-12 | Exceptional talent can overcome structural weakness (owner examples are judgments, not required results) | B §2.12 |
| P-13 | Technical superiority can beat defensive intensity; press resistance is important | B §2.13 |
| P-14 | Attack-heavy teams are volatile, emerging from play, with no volatility multiplier | B §2.14 |
| P-15 | Defensive-heavy teams have realistic attacking limits; progressive defenders can still attack | B §2.15 |
| P-16 | Losing teams adapt progressively, filtered by personality and intelligence; no new abilities | B §2.16 |
| P-17 | Goalkeepers have distinct identities; 3+1 is permanent; attacking involvement is situational | B §2.17 |

## S: safeguards

| ID | Safeguard | Source |
|---|---|---|
| S-01 | No artificial composition balancing, scripted winners, name-based bonuses, or unconditional team chemistry multiplier | B §6 |
| S-02 | No forced equality between positions; no universal personality; no arbitrary downgrading of exceptional players | B §6 |
| S-03 | No change to owner-approved ratings or to the 15-trait system without explicit authorisation | B §6, D |
| S-04 | Seeded determinism, historical replay compatibility and user saves are preserved | B §6, D |
| S-05 | No regression of mandatory 3+1 or of the best-of-five showdown | B §6 |
| S-06 | New personality dimensions are proposed (names, meanings, scales) and reviewed before values are integrated | B §6, D-2 |
| S-07 | Existing valid chemistry interactions (defensive coverage, ball recovery, passing relationships) are preserved | D |
| S-08 | Every new mechanism has deterministic tests and measurable behavioural evidence; a new engine version and explicit release gates | D |
| S-09 | Real football behaviour is not replaced with generic class multipliers | D |
| S-10 | Goalkeeper class effects are transparent; arbitrary class advantages are removed or redesigned only after evidence and a proposed replacement | D-3 |

## K: success criteria (behavioural, not win rates)

| ID | Criterion | Source |
|---|---|---|
| K-01 | Great players act consistently with their abilities and tendencies | B §7.1 |
| K-02 | Intelligent decisions are rewarded and poor decisions carry consequences | B §7.2–7.3 |
| K-03 | Complementary team-mates coordinate; positional conflicts create understandable problems | B §7.4–7.5 |
| K-04 | Technical superiority can overcome pressing; defensive superiority suppresses inferior attacks | B §7.6–7.7 |
| K-05 | Exceptional individuals can overcome imperfect formations | B §7.8 |
| K-06 | Goalkeepers affect matches through distinct styles | B §7.9 |
| K-07 | Losing teams adapt intelligently | B §7.10 |
| K-08 | Deterministic, stable, explainable; no advantage from composition labels | B §7.11–7.12 |

## G: game rules in force

| ID | Rule | Source |
|---|---|---|
| G-01 | Random 15-card draft is the primary mode; memory recall is the secondary mode | L, A |
| G-02 | 3 outfield players + 1 goalkeeper, goalkeepers mandatory for new matches | L, A |
| G-03 | Regulation scoring; Golden Goal only if tied | L |
| G-04 | Any composition is allowed and has pros and cons (read with C-01: no win-rate targets) | L, A |
| G-05 | Best-of-five showdown, first to 3; exclusive claims; no reuse within a showdown | L |
| G-06 | Commentary reads events only; no pre-match win probability | L |

## Owner decisions on T3-14 (2026-11-01)

- **D-1:** build order approved: telemetry, then commitment, then defender-quality pressure, then situational traits and passing, then score-aware adaptation.
- **D-2:** DISCIPLINE and INDIVIDUALISM approved as dimensions (0–100, distinct tendencies, not quality). Values to be reviewed before integration.
- **D-3:** goalkeeper class effects to be made transparent and audited.
- **D-4:** doctrine numbering consolidated (this document).
- **D-5:** recruit David Luiz as a proposed ELITE defender, for approval before roster insertion.
