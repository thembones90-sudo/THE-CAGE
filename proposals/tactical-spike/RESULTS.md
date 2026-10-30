# Tactical engine spike — results (REFERENCE ONLY, not production)

**Author:** Claude · **Date:** 2026-10-30
**Purpose:** test whether the mechanisms in `TACTICAL_INTELLIGENCE_PROPOSAL.md` §D actually fix the live engine's balance problems, *before* Codex builds them.

**Files:**
- `engine-tactical.src.js`: the spike (same `window.CageEngine` API as `src/cage-engine.js`).
- `build.cjs`: inlines the draft ratings `../ratings-v1.json` into `engine-tactical.js`.
- Raw outputs: `tests/balance/baseline-live-v0.4.*` and `tests/balance/tactical-spike-1.*`.

Reproduce:

```
node proposals/tactical-spike/build.cjs
node tools/claude-tactical-balance.cjs --engine proposals/tactical-spike/engine-tactical.js
node tools/claude-tactical-balance.cjs                      # live engine, for comparison
```

**What the spike adds over the live engine:**
- reads the 5 draft ratings;
- team policy derived from capabilities (rest defence, commitment, compactness, risk, directness);
- zonal engagement with a help defender;
- overload support in duels;
- displacement δ (the payoff for keeping the ball);
- counter-press window and direct outlet after regains;
- scramble shots after wall rebounds;
- urgency after 150 s, and fatigue (including chasing passes);
- tactics as policy deltas;
- recalibrated duel slope/clamps.

**No role labels and no composition switches are used** (guard E12 passes).

## Live engine vs spike (full-size runs, 82,600 simulations each)

| Check | Target | Live v0.4 | Spike |
|---|---|---|---|
| E1 composition range (equal quality) | 40–60% | 24.9–68.6% ✗ | **41.2–58.7%** ✓ |
| E1 strongest single matchup | ≤ 75% | 86% ✗ | **68%** ✓ |
| E1 every composition beats ≥ 3 others | yes | no ✗ | no ✗ (All-Out Assault, Iron Fortress, Architects, Street Artists beat 1–2) |
| E2 opponent's best defender, per SD | ≤ 2× own best attack | **−65%** vs +10% ✗ | **−8%** vs +9% ✓ |
| E2 team defence matters more than one man | mean ≥ 60% of best | 0.19 ✗ | 3.49 ✓ |
| E2 midfield effect | ≥ +8% | +1% ✗ | **0%** ✗ |
| E4 different football (FFF vs DDD action-mix divergence) | ≥ 0.10 | 0.023 ✗ | 0.064 (improved) ✗ |
| E4 dribbles FFF ÷ DDD | ≥ 2× | 1.01 ✗ | 1.62 (improved) ✗ |
| E5 tactics: no tactic best for > 5 compositions | yes | press 6, counter 4 ✗ | **press 8** ✗ |
| E6 quality still matters (top vs bottom quartile) | 65–80% | 71.0% ✓ | 71.6% ✓ |
| E9 safety caps: random / defensive pairing | 0 / ≤ 1 per 10k | 0 / **475 per 10k** ✗ | **0 / 0** ✓ |
| E9 duration median / p99 | 60–200 s / < 900 s | 148 s / 1,321 s ✗ | **65 s / 425 s** ✓ |
| E10 interceptions / free-kick goals / shots / anchor goals | 12–22% / 2–8% / 3–10 / 2–12% | 29.9% / 16.7% / 8.6 / 2.7% ✗ | **15.3% / 3.0% / 4.1 / 8.8%** ✓ |
| E11 (revised: quality gradient, no floor) | monotonic; equal 45–55%; gap ≥ 8 underdog ≤ 25% | ✓ (51% / 16.5%) | ✓ (52% / 24.7%) |
| *Info only:* artists vs Maldini/Ballack/R9 (gap −1.7) | — | 5.8% | 26.2% |
| *Info only:* Vidić/Stam/Gravesen vs Maldini/Ballack/R9 (gap −11.4) | — | 10.2% | 4.4% |
| E12 guards | pass | fail (reads legacy stamina) | **pass** ✓ |

**Score: live 1/9 checks pass → spike 5/9** (6/10 with the revised E11, which both pass), and E1 is close (only the "beats ≥ 3" clause fails).

Composition shares (equal quality):

| Composition | Live | Spike |
|---|---|---|
| Counterstrike | 68.6 | 58.7 |
| Wall | — | 55.0 |
| Complete Unit | ~63 | **53.1** (no longer a hidden advantage) |
| Spear & Shield | — | 52.6 |
| Engine Room | — | 52.6 |
| Orchestra | — | 47.0 |
| Iron Fortress | ~40 | 46.9 |
| Architects | — | 46.4 |
| Street Artists | — | 46.4 |
| All-Out Assault | 24.9 | 41.2 |

## What this proves

1. **The core diagnosis is right.** Replacing "one marker, repeated until he fails" with zonal help, overloads and rest defence removes the best-defender dominance (−65% → −8%) **without any composition penalty or bonus**.
2. **Stalling is solved within the owner's rules.** There are no forced goals and no escalation, only urgency, fatigue and scramble chances. Defensive pairings went from 475 safety-cap hits per 10k to 0, and matches got shorter (median 65 s).
3. **Realism bands are reachable:** interceptions, free kicks, shots and scorer roles all land in band at the same time.

## What it does NOT solve yet (design input for the owner and Codex)

1. **Midfield still adds nothing** (0%), even with displacement, receiver movement and press-resistance terms.
   - In first-goal-wins, the main value of keeping the ball is probably **denial**: time the opponent spends without it.
   - Goals per possession can't see denial.
   - **Proposed:** measure midfield by win-rate effect with attack and defence held level; model possession *tempo* so that retention burns clock while the opponent tires (fatigue from chasing exists but is small).
   - Needs another iteration before T4.1 is specified to Codex.
2. **High Press dominates** (best for 8/10). The beaten-press cost only applies when a press is attempted through the shield action. **Proposed:** every high engagement in the opponent's half becomes a press duel, with the presser out of position on failure. Possession sides with press-resistant players should then punish it.
3. **Behaviour differs more, but not enough.**
   - Orchestra trios still pass less than Counterstrike ones (0.87×), because everyone with poor dribbling passes by default.
   - Needs a stronger tempo/patience term for high-passing trios, or a "long-ball / clear" option for low-passing ones, so they *don't* circulate.
4. **Vidić/Stam/Gravesen vs Maldini/Ballack/R9 is 4.9%.** That's mostly a quality gap, not structure:
   - mean base rating ~69 vs ~81;
   - at equal quality, Iron Fortress is 46.9%.
   - **Owner question:** is an 11-point quality gap supposed to give the hardmen 30–50%? If yes, that needs a rating review, since the 6-stat mean penalizes specialists. If no, the E11 target should be restated as "credible, ≥ 10%".
5. **All-Out Assault is still the weakest (41.2%)** and beats only Iron Fortress and Architects-type trios. Elite attackers' overloads help, but no-rest-defence transitions still punish them more than their extra chances repay.

## Recommendation

**Adopt the spike's mechanisms 1–4 into CODEX_TACTICAL_TASKS T3/T4:** zonal help, overload support, policy-derived rest defence and commitment, counter-press, urgency, scramble shots, recalibrated clamps. They're validated.

**Hold T4.1 (displacement formula) and T5 (tactics) for one more Claude iteration** on the midfield-denial and press-cost problems above.

The ratings draft (`proposals/RATINGS_V1_REVIEW.md`) should be approved first; the spike depends on it.
