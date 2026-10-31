# THE CAGE V6.10 | T3-12 Tactical Engine Balance

**Branch:** feature/t3-12-tactical-balance. **Base:** T3-11 commit 1a1a77d. **Status:** Experimental. No production deployment or automatic V6.8 replacement.

## Scope and provenance

- **No dead-ball specialists.** Their separate V6.9 plan remains on hold.
- Keep all 194 outfield players and 50 goalkeepers, exact historical tiers/OVRs, drafts and trait rules.
- Tactical profile candidates evaluated with a 4-variant parameter sweep (baseline, gentle, moderate, strong), three team archetypes and four matchup pairs. These are finite-seed, archetype-conditioned outcomes, NOT universal tactic win rates.
- Adopt **strong parameter candidate** for T3-12: Press engageHigh .80 -> .69 and cp 1.60 -> 1.30; Possession tempo 1.50 -> 1.13 and risk .80 -> .97. Other tactic parameters unchanged.
- Those tactical profiles are **scoped to T3-12**. Historical global T3-11 tactic table remains intact. Legacy engines never inherit T3-12 tactical changes.
- Add actual completed forward-pass **creative links**: when an eligible technical playmaker connects a forward pass into attacking zone x>=2, the immediate receiver may earn at most **+0.22 logit shot quality** if shooting within two tactical ticks. The pass must succeed and the passer must satisfy MID >= ATT-3, MID >= DEF-3, vision >= 78; bonus scales from actual pass+vision skill and cannot appear from a phantom extra outfielder.
- Creation is logged on the pass as calc.creativeLink; the later shot records creator and linkBoost; goal/save records calc.linkBoost. Link clears on missed pass, turnover, restart, loose ball, shot or expiry. No direct goal or extra shot roll is awarded.
- Frozen T3-11 engine: src/cage-engine-v611.js; older engine versions and goalkeeper catalogs retained. New current engine: cage-t3-12, parameter identity t3-space-6. Replay validations use each historic engine's own TACTICS for keeper-distribution verification.

## Fresh-seed controlled benchmark

Per row: 40 seeds x 2 tactical assignments x 2 starting-side swaps = **160 games on EACH of two engines** (T3-11/T3-12), with identical named trio archetypes and elite goalkeeper identities.

| Team archetype | Tactic matchup | T3-11 A win % | T3-12 A win % | Delta (pp) | T3-12 goals / match |
|---|---|---:|---:|---:|---:|
| mixed | press vs possession | 65.6% | 63.1% | -2.5 | 5.59 |
| mixed | possession vs balanced | 45.6% | 48.8% | +3.2 | 5.78 |
| mixed | counter vs press | 42.5% | 42.5% | 0 | 6.57 |
| mixed | counter vs balanced | 48.8% | 48.8% | 0 | 6.47 |
| creators | press vs possession | 53.1% | 44.4% | -8.7 | 12.06 |
| creators | possession vs balanced | 51.3% | 51.3% | 0 | 11.58 |
| creators | counter vs press | 51.3% | 61.3% | +10 | 11.31 |
| creators | counter vs balanced | 46.9% | 46.3% | -0.6 | 11.11 |
| defenders | press vs possession | 76.9% | 64.4% | -12.5 | 1.1 |
| defenders | possession vs balanced | 35% | 43.1% | +8.1 | 1.17 |
| defenders | counter vs press | 41.3% | 40% | -1.3 | 1.26 |
| defenders | counter vs balanced | 49.4% | 49.4% | 0 | 1.26 |

## Results and limitations

- Press vs Possession moved toward balance in the tested mixed and defender-only squads; it may be favorable to other tactics in specific rosters.
- Presence of technical midfielders yields measurable logged creator plays. This does NOT make a midfield-only trio automatically win.
- Defender-only trios still produce roughly one goal a match and frequently reach Golden Goal. We have **not** artificially boosted defenders' shooting or invented guaranteed winners.
- Star-heavy creator matchups still score substantially more than two-defender or all-defender trios. That may be partly authentic to the chosen three players and needs wider scrutiny before any further changes.
- Study samples are intentionally limited, use fixed archetypes and repeated seeds, and are not statistical proof of universal tactical fairness.

## Verification gate

- tests/t312-creative-link.cjs exercises finished link actions in both keeper and non-keeper mode, legal creator identity and logged benefit.
- tests/v69-golden-kickoff.cjs runs frozen T3-11 rules, validating previous fair overtime behavior.
- Full 24-suite tools/v66-experimental-gate.ps1 includes archived replay, 194-player roster, goalkeeper, CPU, full draft, War Room, timed viewer, Classic parity, and reproducible engine build.
- Windows EXE built separately after green gate; previous EXEs kept unchanged.

## Next engine checkpoint

Broaden matchups to many matched-strength trios, add tactical play-by-play analytics (turnovers in final third, midfielder key passes) and separately decide whether defensive-only trios should generate better chance quality. Keep all adjustments evidence-driven.
