# Balance under regulation scoring: cage-t3-12, 2026-11-01

**Probe:** `tools/claude-balance-probe.cjs`. It runs the `play.html` engine in a VM, in `mode:'score'`, with balanced vs balanced tactics, equal-quality trios (within 1.5 points), 300 matches per pairing (standard error about ±2.9 points) and mirrored sides. `GK=1` gives each side a different goalkeeper drawn at random from the 50 cards, with the current (provisional) keeper ratings.

| Measure | No goalkeepers | **3+1 (approved format)** |
|---|---|---|
| Errors or safety caps | 0 / 4,500 | 0 / 4,500 |
| Goals per match (median / mean) | 9 / 9.02 | **7 / 7.34** |
| Decided by Golden Goal | 11.3% | **13.8%** |
| Duration p99 | 1,652 s | **1,877 s** (longer overtimes) |
| DMF / DDF / FFF / MMF | 63.1 / 66.1 / 61.0 / 53.2 | 63.5 / 64.9 / 58.8 / 53.5 |
| **MMM** | 39.8 | **40.2** |
| **DDD** | 16.9 | **19.1** (vs FFF 18.7, vs DDF 13.3) |
| Quality gradient: ≥ 8 points stronger | 81.3% | 84.4% |
| Quality gradient: ≥ 8 points weaker | 23.8% | 23.8% |
| Tactic swing (best minus worst), DDD / MMM / FFF | 12.7 / 11.0 / 8.4 | 10.3 / 4.4 / 8.0 |

## Verdict

- **Goalkeepers don't fix composition balance.** Under owner rule D3 every composition must be viable, but three-defender teams still win only about 19% and all-midfield teams about 40%.
- Possession is no longer the worst tactic for MMM in 3+1 (40.0, against 37.3 for balanced). For DDD, press and counter (about 26%) are clearly better than balanced or possession (16–18%).
- Better trios are still clearly rewarded.
- Next step: re-target the creation and midfield research (`CLAUDE_T3_RECOVERY_PLAN.md` R5, R6, R8–R11) to 3+1 regulation scoring. Measure it with the proposed goalkeeper ratings (`proposals/goalkeeper-ratings-v1-proposal.json`) as well as the current ones, once the owner has reviewed them.
