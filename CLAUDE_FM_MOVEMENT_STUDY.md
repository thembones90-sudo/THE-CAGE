# How Football Manager handles player movement, and what THE CAGE should adopt

**Author:** Claude, 2026-11-01. **Status:** research and proposal.

**Scope:** general engineering principles from public Sports Interactive material, applied to THE CAGE's own 3+1 cage format. We adopt ideas, not FM's design, code or presentation.

## 1. What Football Manager does (public sources)

| # | Principle | Evidence |
|---|---|---|
| F1 | **Continuous, time-sliced simulation.** Every player, the officials and the ball decide every quarter of a second (a "slice"); since FM21 they can change a decision mid-slice | "the players and officials will each be making a decision every quarter of a second, which we call a 'slice'" (SI, FM21 match engine AI) |
| F2 | **Off-ball movement is simulation, not decoration.** Midfielders block passing lanes "rather than following the movement of the ball"; defenders hand off markers while closing another attacker; the defensive line acts as a unit; attackers move to create space or find gaps; forwards come short to drag defenders | SI, FM21 match engine AI |
| F3 | **Attribute-limited kinematics.** Speed, acceleration and turning were rebuilt from tracking data: no "unnaturally quick" recovery bursts and no turning "at unrealistic speeds" on off-ball runs | SI, FM27 deep dive (Hawk-Eye data) |
| F4 | **Intelligence decides run quality.** Anticipation and Off The Ball give "better, more intelligent runs"; poor cohesion produces "players doubling up in areas" | SI, FM27 |
| F5 | **Personality in execution.** Flair and Dribbling drive skill moves; elite Marking and Anticipation visibly separate defenders; stamina limits repeated sprints late on | SI, FM27 |
| F6 | **Presentation consumes the simulation.** Decision code was reworked to "supply the best information from the AI into the animation system". The 2D view draws simulated positions; it doesn't invent them | SI, FM21 |
| F7 | **Highlights are a first-class viewing mode.** Key, extended and full match modes, plus *dynamic* highlights: "the more important and more dramatic a game, the more highlights you'll see". A time bar flags key moments; a 2D overview tile sits between highlights and jumps to them | SI, FM26 match day; FM2009 feature notes |

## 2. Where THE CAGE stands today

| Area | THE CAGE (T3-13) | Gap vs F1–F7 |
|---|---|---|
| Time model | One decision step every 2–4 s; about 700 events per regulation match | Coarse (F1) |
| Positions | 4×3 grid cells; at most one cell per step; recorded only at events | No continuous positions; the viewer must infer everything inside a cell |
| Off-ball | Shared target rules: support ahead, rest deep, nearest defender engages, helper covers, third man tracks the deepest runner | No lane blocking, marking hand-off, line unit or danger-aware marking (F2); planned as T3-14 P3 |
| Kinematics | Move credit with an agility term; no velocity, acceleration or turning | F3 missing |
| Intelligence in movement | Only through traits and engagement probability | F4 partial; discipline (approved) is not yet wired |
| Presentation | The viewer interpolates cells (presentation inference); keepers are now ball-tracking, but still inferred | F6 inverted: presentation guesses where simulation should tell |
| Viewing modes | Fixed 45 s "Dynamic" squeezes about 700 events (about 65 ms each) | F7 missing |

**The core difference:** FM's 2D dots look natural because the simulation produces continuous positions and the view simply draws them. THE CAGE's view has to invent motion between coarse cells. Better animation alone can't close that gap. **The engine has to produce movement.**

## 3. What to adopt, and how to go beyond it

### A. Movement layer in the engine: passive first

- **A movement slice every 0.25 s between decision steps.** Each of the 8 bodies (6 outfield and 2 keepers) has a continuous position and velocity on a real pitch. They steer toward the targets the engine already computes (`spatial.update`), limited by their own attributes:
  - top speed from pace;
  - acceleration and turning from agility;
  - control while turning with the ball from technique;
  - a small stamina effect (doctrine P-03).
- **Passive in its first version.** The 4×3 cells and every decision stay exactly as today. Bodies are constrained to arrive in their authoritative cell on time, and no random draws are added, so results stay identical to T3-13. That's provable with the same strip-and-compare test used for the telemetry.
- **Recorded:** positions at 4 Hz for 8 bodies, plus the ball, in the replay (compact, delta-encoded). Keeper positions come from keeper style plus ball danger, so keepers become simulated, not drawn by guesswork.
- **Result:** the viewer draws authoritative motion (F6). Presentation guesses like `keeperStance` retire.

### B. Off-ball intelligence as simulation (outcome-changing; new engine version, T3-14 P1/P3)

- **Lane blocking:** the helper positions on the line between the ball and the most dangerous receiver, not just "near the ball" (F2).
- **Marking hand-off and danger-aware marking:** a defender passes his runner to a team-mate when the ball side changes; the engaging defender is chosen by threat, not only distance (doctrine P-07).
- **Runs into space:** a supporting attacker's target maximises distance from defenders and forward progress, scaled by intelligence. Low-discipline players drift; disciplined players hold shape (using the approved DISCIPLINE values, doctrine P-06 and P-02).
- **Line unit:** the rest-defender and the helper keep a shared depth, so a beaten line is visible and real.
- **Doubling up:** two players chasing the same space reduce each other's support value (doctrine P-11 overlap cost; F4).
- **Decisions read continuous geometry:** engagement distance, real passing lanes and interception points come from the movement layer, not cell adjacency.

### C. Viewing modes (presentation, Codex)

- **Highlights default** with *dynamic* highlight count by match state: more when it's close or in Golden Goal, fewer when it's one-sided (F7). Plus Extended, and Full at 0.75× / 1× / 1.5× / 2× (from `CLAUDE_2D_VIEWER_FLUID_MOTION_AUDIT.md`).
- **A time bar** with key-moment markers (shots, saves, claims, goals); clicking jumps there (deterministic seek already exists).

### D. Going beyond FM: things our design allows that FM doesn't offer

1. **"Why did he do that?"** Every action carries decision telemetry (options, chosen action, situation). The viewer can explain a moment: "Pirlo chose the through ball (vision); Maldini held the line (discipline 97)". FM shows outcomes, not reasons.
2. **Exact replays and seeking.** Our matches are deterministic and hash-verified, so any moment can be re-watched, shared or analysed exactly.
3. **Visible personality in movement.** DISCIPLINE and INDIVIDUALISM are owner-approved, so movement can show them directly: Roberto Carlos leaves his post, Busquets never does. The cage is small enough that every run matters.
4. **Small-pitch fidelity.** With 8 bodies, we can afford a finer slice (0.25 s or less) and full position recording, where an 11-a-side engine has to economise.

## 4. Roadmap (each step gated, deterministic, replay-safe)

| Step | Deliverable | Changes outcomes? | Proof |
|---|---|---|---|
| M1 | Movement layer (A): continuous bodies, attribute kinematics, 4 Hz positions recorded, keepers simulated | **No** (passive) | Stripped events identical to T3-13; positions always inside their authoritative cell at event times; speed and acceleration within each player's limits |
| M2 | Viewer draws recorded positions; Highlights and time bar (C) | No | Viewer tests: no inference for T3-14+ records; old records keep today's inferred motion |
| M3 | Off-ball intelligence (B) on continuous geometry | **Yes**, new engine version | Behaviour tests: lane blocking cuts completion through blocked lanes; hand-offs observed; discipline changes how far players drift; nothing tuned to win rates |
| M4 | "Explain this moment" overlay (D1) | No | Every explanation traces to a logged field |

**Recommendation:** start with **M1**. It's provably passive (no result changes), it fixes the root cause of the chess-piece look by making the engine produce movement, and it lays the geometry that M3's real off-ball intelligence needs.

## Sources

- [Sports Interactive: Match Engine AI in FM21](https://www.footballmanager.com/news/match-engine-ai-fm21)
- [Sports Interactive: FM27 tactical tweaks and match engine upgrades](https://www.footballmanager.com/node/1108)
- [Sports Interactive: FM26 match day experience](https://www.footballmanager.com/fm26/features/where-storytelling-evolves-fm26s-match-day-experience)
- [FMScout: FM21 match engine AI improvements](https://www.fmscout.com/a-fm21-match-engine-ai-improvements.html)
- [RealSport101: FM27 deep dive](https://realsport101.com/article/football-manager-27-deep-dive-reveals-major-match-engine-and-tactical-overhaul)
- [Worthplaying: FM2009 features (2D/3D, key-moment time bar)](https://worthplaying.com/article/2008/11/1/news/56290-football-manager-2009-pc-demo-available-now/)
