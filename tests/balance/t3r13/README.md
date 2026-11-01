# T3-13 research: making every composition viable (Claude, 2026-11-01)

**Tool:** `tools/claude-t3r13.cjs`. It loads the real `play.html` game and patches the built T3-12 engine in memory behind flags; with no flags it reproduces live T3-12 exactly (300/300 event hashes). Test conditions: 3+1 with random distinct keepers, traits on, regulation scoring, balanced tactics, 300 matches per composition against equal-quality mixed opponents (DMF/DDF/MMF/DFF/DMM/MFF), plus 1,800 random-trio matches for the quality gradient. Standard error is about ±2.9 points per cell.

## Diagnosis on live T3-12

- **DDD loses the ball near its own goal.** Against DDD, 70% of opponents' final-third entries are possessions that START there after DDD turns the ball over (48% against DMF, 36% against FFF). DDD makes twice as many actions in its own third as DMF. In duels it defends well: attackers win 48% against DDD, compared with 64% against DMF and 83% against FFF.
- **Attack outweighs defence.** In the shot formula the shooter's skill counts on a 1-logit-per-15-points scale, while defending is binary ("a defender is near"). Attack-side scoring varies about 4.6× between FFF and DDD; defence-side scoring only about 2.6×.
- **Every pass carries at least 12% risk** (success capped at .88; a defender sits "within one cell of the lane" on 99.8% of passes). Intercepted passes were also placed at the passer's feet.

## Mechanisms tested (flags)

| Flag | Mechanism | Effect alone (DDD / MMM / FFF win %) |
|---|---|---|
| — | T3-12 baseline | 16.3 / 33.7 / 51.0 |
| A | Contested carry (defender in the target cell) | 16.7 / 27.3 / 52.0, so carries aren't the leak |
| B1–B3 | Score-aware commitment; cover-aware discipline; ball winner joins the counter | 19.7 / 36.3 / 49.7 |
| C1 | Vision picks the best-placed receiver | 19.3 / 30.7 / 41.3 |
| C2 | Pass success cap .96 (from .88), steeper passing-vs-interception curve | 21.0 / 32.3 / 41.3 |
| I | Interception won where the interceptor stands | 17.7 / 34.0 / 45.3 |
| K | Clearance: long ball from deep under pressure, contested where it lands | 19.0 / 31.3 / 49.7 |
| **Q** | **Shot pressure scales with the pressuring defender's tackling and reading** (average defender = no change), scale 30 | **22.0 / 27.3 / 34.0** |

## Stacks

| Stack | DDD | MMM | FFF | DMF | DDF | MMF | Goals per match | Golden Goal | Gradient ≥ 8 points |
|---|---|---|---|---|---|---|---|---|---|
| S1 = I+C2+B+K | 24.3 | 30.3 | 45.3 | 50.7 | 57.3 | 43.7 | 8.00 | 13.4% | 80.0 |
| S2 = S1+C1 | 23.3 | 32.3 | 39.3 | 48.0 | 63.7 | 41.0 | 8.39 | 10.1% | 100 (n small) |
| **S4 = S2+Q (scale 30)** | **33.7** | **28.7** | **22.0** | 54.7 | **68.0** | 34.3 | 8.51 | 10.9% | 94.3 |
| S4, Q scale 15 | 44.0 | 25.0 | 15.3 | 54.0 | 71.3 | 33.0 | 8.80 | 12.1% | 94.3 |

## Reading

- **Q gives real pros and cons:** three defenders now concede far fewer goals (S4: 2.14 against, from 3.05), and three forwards score a lot but concede a lot (8.15 against). At scale 30 it overshoots for attack-heavy sides (FFF 22%) and makes two-defender trios the best choice (DDF 68%).
- **MMM is unsolved.** Midfielders defend at roster average (67), so Q gives them nothing, and nothing yet rewards keeping the ball. Midfield needs its own advantage: possession control, meaning fewer turnovers and fewer opponent possessions.
- None of these mechanisms tunes finishing or ratings; all are symmetric rules applied to every player.

## Next

1. A midfield retention mechanism, then re-balance the strength of Q, aiming for every composition in 35–65%.
2. Then implement the chosen set as engine cage-t3-13, with T3-12 frozen for replays, one mechanism per commit, gate green at each step.
