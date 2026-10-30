# THE CAGE: does recall pay off? Engine reward findings

**Author:** Claude, 2026-10-30.
**Scope:** research only, on the flag-switchable copy of T3 (`proposals/t3-research/`), using the pinned 63-player roster. No production file changed; nothing committed.
**Builds on:** `CLAUDE_T3_RECOVERY_PLAN.md` (R1–R11). **Companion:** `CLAUDE_DAILY_CHALLENGE_SPEC.md`.

## 1. Question

A memory game is rewarding when recalling a better player, or a better-fitting trio, measurably wins more, and when the players that pay off are the ones football knowledge says should.

Method: 30,000 random 3v3 matches, balanced tactics, with each player's win rate measured when fielded with random partners and opponents. Sampling noise is about ±0.9 points per player. The probe is `proposals/t3-research/player-value.cjs` and the evidence is in `tests/balance/t3-research/player-value-*.json`.

## 2. Results

| Build | Player value spread (sd) | Correlation with quality | Finisher premium (Owen / Adriano vs quality) | Riquelme / Aimar / Zidane / Scholes |
|---|---|---|---|---|
| T3 as built | 5.1 | 0.63 | +10.4 / +10.1 | 44.2 / – / 56.0 / – |
| Stack 2 (R1–R6) | 5.1 | 0.73 | +11.6 / +11.5 | 43.1 / 43.5 / 54.2 / 49.1 |
| **Stack 2 + midfield (R8–R11)** | 5.2 | **0.79** | **+8.8 / +5.5** | 42.8 / **48.1** / **56.5** / **51.6** |
| Stack 2 + midfield + free man R7 | 5.1 | 0.77 | +8.9 / +8.2 | 43.0 / 46.9 / 55.8 / 50.2 |

How to read it:
- The spread of 5.1 points is healthy. The best player raises their side's win rate by about 11–13 points over the average player, so who you recall matters.
- **The problem: the engine rewards one kind of recall.** On T3 and on Stack 2, pure finishers (Owen, Adriano, Batistuta, Martins) win 8–12 points more than their quality predicts. Playmakers and holders sit at or near the bottom: Riquelme, Aimar, Pedersen, Rodri, De Rossi. The best strategy is "remember a striker".
- **The midfield fixes correct much of this:**
  - The finisher premium roughly halves.
  - Kanté, Bernardo Silva and Zidane enter the top ten.
  - Aimar rises 4.6 points.
  - Correlation with quality rises from 0.73 to 0.79.
- The free man (R7) partly undoes that by putting the premium back on attackers. That is one more reason to keep it held.
- **Riquelme is still bottom-five in every build.** His base quality is 65 because he has low pace, defence and physique, and his value lies in vision and passing. The engine doesn't yet turn elite vision into chances. That is the next midfield target, not a ratings problem.

## 3. Full harness: Stack 2 vs Stack 2 + midfield (R8–R11), with no free man

| | Stack 2 | + midfield | |
|---|---|---|---|
| Gates passed | 4 (E5, E6, E9, E12) | 4 (same) | no regression |
| MMM overall | 44.9%, beats 2 | **47.3%, beats ≥ 3** | the Orchestra now a real option |
| Own-MID effect (E2) | −8% | **−4%** | still short of +8% |
| Quality gradient, big-gap underdog | 29.3% | **26.8%** | target ≤ 25% |
| Quality gradient, ≥ 8 points better | 70.1% | 70.7% | |
| E6 top vs bottom quartile | 66.9% | **70.4%** | |
| Median duration / p99 | 92 s / 685 s | 78 s / 585 s | |
| DDD overall | 35.1% | 33.4% | **cost** |
| DDD's best-tactic swing | press 45.4% | counter 36.3% | **cost:** hardmen lose their press identity |

Files: `tests/balance/t3-research/t3r-full-D1b+D3+D4+D5b+C1+C2+B2+B4t+B5+M2.{txt,json}`.

## 4. Recommendation

1. **Integrate R1–R6 first,** as already ordered in `CODEX_TACTICAL_TASKS.md`.
2. **Move the midfield bundle from "held" to "next candidate":**
   - R8: pass-success spread;
   - R9: vision picks the best option;
   - R10: receive in space;
   - R11: carries can be checked.

   Integrate one per commit after R1–R6, re-running player value and the full harness after each. Accept only if:
   - MID improves;
   - the finisher premium shrinks;
   - DDD stays at or above 33%.
3. **Keep R7 (free man) held.** It restores the striker meta and costs DDD.
4. **Open research items, in priority order:**
   - (a) Turn vision into chances, so Riquelme-type creators carry value. Candidate: a through-ball or key-pass option whose success depends on vision and the receiver's movement.
   - (b) Restore the hardmen's pressing identity under the midfield bundle; R11 likely makes the press less necessary.
   - (c) Close the last 2 points on big-gap upsets through midfield value, not by tuning finishing.

## 5. Why this matters for the daily challenge

The daily (see `CLAUDE_DAILY_CHALLENGE_SPEC.md` §6) needs the best answer to beat the median answer by at least 15 points. If the striker meta stays, the "best answer" to every round is the same pattern and the puzzle collapses. The midfield bundle is what makes five different rival trios pose five different problems.
