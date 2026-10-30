# THE CAGE — Showdown build test report

**Tester:** Claude · **Date:** 2026-10-30
**Build:** `index.html` (Showdown) with `src/cage-engine.js`, `src/cage-commentary.js`, `src/showdown.js`, `src/players.js`. Files dated 10:40–10:43 on 2026-10-30.

**Method:**
- Real game files loaded unchanged in Node.
- Thousands of seeded matches.
- A scripted full showdown in headless Chrome.

No project code was changed. The test scripts live in Claude's scratch folder.

## What works
- `tests/roster-integration.cjs` and `tests/showdown-engine.cjs` pass.
- **Full best-of-five flow in Chrome:** claim → lock → play × 5 rounds → "COMMANDER CONQUERS THE CAGE · 3–2". The used pool is kept across rounds (30 used / 27 left). No script errors.
- **Claims:** `R9` → R9. Then `Ronaldo Nazario` for the other side → "already claimed". Plain `Ronaldo` → rejected as ambiguous.
- **Commentary accuracy:** across 2,999 random matches (216,630 lines), there were 0 lines naming the wrong player, 0 broken placeholders, and every goal line names the real scorer.
- **Shots stat:** matches the event log in every match.

## Must fix (ranked)

| # | Problem | Evidence | Fix |
|---|---|---|---|
| 1 | **Matches can crash ("Simulation failed") when two defensive trios meet.** The engine throws if no goal comes within 6,000 simulated seconds, because the escalation/decider was removed | Maldini/Chiellini/Thuram v Gravesen/Stam/Vidić: **41% of matches error**. Random trios: 0.02% | Restore an ending that always finishes: 2v2 → 1v1 → cage runs, or golden goal with steadily rising chance quality. Never throw on a legal match |
| 2 | **Stronger trios win far too often; the game uses the untuned prototype constants** (`k=12`, clamps .06/.94, foul .035) | Ballack/Maldini/R9 beats Okocha/Djalminha/Vidić **92%**; beats 3 strikers 91%; Ronaldinho/Zidane/Rivaldo beats Kanté/Yaya/Hazard only 11% | Start from `k≈22`, clamps .12/.88, foul .01 (measured improvement in the proposal §4.4), then tune with the balance harness |
| 3 | **Free kicks decide too many matches** | Free-kick share of goals: 11–22% normally, **35–63%** when defensive trios play (target 2–6%) | Lower the foul rate; only fouls in the attacking third give direct free kicks |
| 4 | **Some matches are far too long, and the commentary floods** | Simulated length: median 133 s, but p99 951 s (16 min), max 98 min. Lines per match: median 43, p90 161, max 722, all squeezed into ≤ 42 s of "normal" playback (up to ~17 lines/second) | Fixing #1 caps the length. Also cap lines per second in playback, and merge more routine lines into quiet passages |
| 5 | **The Possession tactic is a trap** (never the right choice) | Mirror matrices: Possession loses to every other tactic for all 3 test trios (e.g. Ballack/Maldini/R9 row: 39.8 / 51.0 / 32.7 / 37.4); Press and Counter are best | Give possession a payoff (opponent fatigue, safer progression, fewer turnovers); gate press by work rate/stamina |
| 6 | **Wrong-claim risk** | `Keane` instantly offers **Roy** Keane (could mean Robbie); same for `Toure`, `Ferdinand`, `Alonso`, `Martins`. Claims are permanent for the whole showdown | Ambiguous surnames show a disambiguation list, like `Ronaldo` does |

## Should fix

| Problem | Evidence | Fix |
|---|---|---|
| **No typo tolerance** | `Djalminah`, `Okocha Jay Jay` → "not in roster" | Token-order matching + edit distance (proposal §B4/T1.4) |
| `Silva` says "not in roster" | Bernardo Silva and Gilberto Silva are both in it | Show both as a disambiguation |
| **Bad commentary names** | "Bruyne" (De Bruyne), "Piero" (Del Piero), "Rossi" (De Rossi), "Arfa" (Ben Arfa); both Silvas appear as "Silva" | A `displayName` per player in the roster |
| **Repetitive lines** | 34% of lines reuse a line pattern seen in the previous 20 lines | More variants per bank; never repeat within a window |
| **Defenders "dance" past people** | 28% of successful-dribble lines are by players with tech < 75 (Vidić/Stam types) using "as if he isn't there" | Style-aware banks ("muscles past", "bundles through") |
| **Tactic can be changed after locking** | The select stays enabled; the second player can react to the first's tactic | Disable the select on lock, or make tactic choice hidden or simultaneous |
| **No turn order** | Either side can claim at any time, and the opponent can watch you type on the shared screen | Snake order + masked input (proposal §9.3, owner decision) |
| **No seed shown, no replay** | The seed is `Date.now()` and never displayed | Show the seed; add "Replay match" |
| **Claim message says "claimed by A"** | Should say Commander/Opponent | Text fix |
| **Possession stat is sometimes wrong** | In 3.2% of matches it differs by > 15 points from an independent count (e.g. 40 vs 100); 1.6% don't sum to 100 | Compute from explicit possession start/end events |

## Fine as is
- Scorer realism: in Ballack/Maldini/R9, R9 scores 66%, Ballack 26%, Maldini ~0%.
- No autocomplete or browsing anywhere on the draft screen.
