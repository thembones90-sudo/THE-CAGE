# THE CAGE: project audit, 2026-11-01

**Auditor:** Claude.
**Mode:** read-only. Tests and measurements ran on a `git archive` snapshot of `feature/v68-keepers-50` (commit 6cc81ba) in Claude's scratchpad. No repository file was changed except adding this report.

## 1. Verdict

There is major, real progress. The project has gone from a gated engine preview (2026-10-30) to a complete, tested game:
- a random draft and the memory-recall mode;
- a solo AI opponent;
- regulation scoring with a Golden Goal decider;
- a 2D match viewer;
- a goal broadcast;
- experimental goalkeepers.

The full regression gate passes. The biggest risks are no longer the engine:
1. **There is no mainline.** Work is split across two diverged lines, 46 worktrees and a stale `main`.
2. **Composition balance is still wrong:** three-defender teams are close to unplayable under the new scoring rules.
3. **Page weight:** about 15 MB of engine code loads on every page.

## 2. What now exists (v68 line)

| Area | State | Evidence |
|---|---|---|
| Match format | Regulation scoring over 20 simulated minutes; Golden Goal only if tied (user-approved, V6.5) | `docs/V65_WAR_ROOM_RELEASE_REPORT.md` |
| Draft | 15-card random draft (default route `/draft.html`), ABABAB order, exclusive claims, reroll; memory-recall mode kept at `/play.html` | `RANDOM_DRAFT_V1_REPORT.md`, `EXCLUSIVE_DRAFT_RULES.md` |
| Solo | IRON AI 2.0 opponent (Casual, Competitive, Ruthless); fair inputs only | v64 and v65 CPU tests |
| Scouting | War Room: 17-stat two-card comparison | `tests/v65-war-room.cjs` |
| Viewer | 2D viewer built on the Claude contract (`src/viewer/` coords, layout, timeline, clock) plus the `viewer-v4` renderer, kinetics, effects, goal experience; 45 s Dynamic playback | `tests/viewer/run-all.cjs` passes, including Claude's contract test (120 matches, 10,382 events) |
| Goalkeepers | Experimental opt-in 3+1 mode: 50 ranked keepers, 7 attributes, save, parry and sweep events, versioned engines T3-7 to T3-10 | v66 to v68 tests |
| Roster | 194 outfield players (role split D 42, M 74, F 78) plus 50 goalkeepers; overall ratings, tiers and traits | roster and OVR tests |
| Replays | Historical engines kept for older replays (v0.4, T3-6 to T3-9) | `tests/v54-classic-parity.cjs`: 150 hashes preserved |

**Gate run (snapshot):** `tools/v66-experimental-gate.ps1` gives **22/22 suites pass, plus a reproducible T3-10 build**. That includes the real-browser tests (keeper draft, CPU solo, five-round, restore and discard, cinematic with reduced motion), classic parity, the viewer suite and package parity.

**Public repository:** no secrets or owner email found in the tracked snapshot. `vercel.json` targets `public/`; deployment status was not checked.

## 3. Engine balance (T3-10, regulation scoring)

Probe: `scratchpad/probe68.cjs`, run on the v68 snapshot. It uses the default `play.html` engine in `mode:'score'` with balanced vs balanced tactics, equal-quality trios (within 1.5 points), 300 matches per pairing (standard error about ±2.9 points), sides mirrored.

| Measure | Result | Reading |
|---|---|---|
| Errors or safety caps | 0 in 4,500 | **Stalls are solved by the format.** |
| Duration median / p99 | 1,202 s / 1,564 s | Golden Goal decides 11.2% of matches |
| Goals per match | median 9, mean 8.97 | High-scoring, as cage football should be |
| **Quality gradient** (stronger side's mean quality advantage → its win rate) | <−8: 23.8% · −8..−4: 37.2% · ±1.5: 47.5% · 4..8: 71.9% · ≥8: 82.7% | **Now passes** the E11 targets (big-gap underdog ≤ 25%). Better recall and picks are clearly rewarded |
| Composition overall (equal quality) | DDF 65.7 · DMF 63.0 · FFF 61.3 · MMF 52.7 · **MMM 39.9** · **DDD 17.4** | Balanced trios lead, as the owner rules want, but **DDD is close to unplayable** (vs FFF 9.0%, vs DMF 15.3%) and MMM is weak |
| Tactic vs a random balanced opponent | DDD: possession **9.3**, others 22–24 · MMM: possession **33.0**, press 46.0 · FFF: 47.7–52.0 | **Possession is the worst tactic for every composition tested**, so the passing identity is still punished |

**Interpretation:** multi-goal regulation scoring cuts randomness, so strength differences now show properly. That's good for the quality gradient, but it also magnifies the structural weaknesses the recovery plan identified:
- **Hardmen can't create;** that worsens from 19.2% in T3 to 17.4%.
- **Midfield and possession aren't rewarded.**

`CLAUDE_T3_RECOVERY_PLAN.md` was measured under first-goal scoring. Its stall fixes (R1, R2) no longer matter. Its creation and midfield fixes (R5, R6, R8–R11) remain the relevant ones, but **must be re-measured under regulation scoring** before integration. I can re-target my research tools to `mode:'score'`.

## 4. Repository and integration risks (priority order)

| # | Finding | Risk | Recommendation |
|---|---|---|---|
| P0 | **No mainline.** `origin/main` is stuck at abe1d9e (2026-10-30). The latest game is `feature/v68-keepers-50`. `codex/t3-tactical-space` (where `A:\THE CAGE` sits) has **9 commits not in v68** (overall formula V2, the 67 approved ELITE overalls, Valerón and Okocha decisions). v68 has 49 commits not in it. The two diverged at 4cf45c5 | Approved rating decisions could be lost or applied twice; nobody knows which build is "the game" | Choose v68 as the integration base; merge or cherry-pick the 9 ratings commits with their tests; then point `main` at the result and tag it |
| P0 | `A:\THE CAGE` has **49 uncommitted files** on `codex/t3-tactical-space`. Some match v68's versions byte for byte (for example `src/elite-ovr-approved-v21.js`), so files are being copied between lines by hand | Silent overwrites; work that can't be audited | Commit or discard on purpose, as part of the P0 merge |
| P1 | **46 git worktrees** on `A:` (about 0.8–1.6 GB each), **26 with uncommitted changes**. Executables are scattered: `A:\THE CAGE\dist` holds only v0.4, and the latest is `A:\THE CAGE V66 KEEPERS\dist\TheCage-V68-GK50-Ranked-T3-10-FinalPreview.exe` | Lost work; disk use; confusion about which `.exe` is current | List each dirty worktree, keep or discard each, then prune. Keep one `dist/` for releases |
| P1 | **Page weight:** `play.html` and `draft.html` each load **6 engine bundles at about 2.5 MB each** (v65, v66, v68, v69, current and draft), plus 26 roster scripts | Slow loading; unusable on mobile or the web | Load only the current engine; lazy-load historical engines when an old replay is opened. Build one roster bundle |
| P2 | **Documentation drift:** `HANDOFF_STATUS.md` on v68 ends at Claude's 2026-10-30 entry; the real status lives in the stacked README sections and in about 60 report files | New agents act on stale context | Keep one `STATUS.md` (current build, current branch, open owner decisions) and archive the per-version reports |
| P2 | **Provisional ratings in play:** goalkeeper overalls are formula-derived (for example Chilavert 90); 20 keepers aren't individually approved; Claude's `ratings-v1.2` proposal for the Road-to-100 players has unknown status | Unapproved numbers decide matches | Owner review list (§5) |

## 5. Owner decisions needed

1. **Primary mode: DECIDED by the owner, 2026-11-01. The random draft is the primary mode; memory recall is the secondary mode.** Follow-ups:
   - **`GAME_DESIGN_LOCK.md` needs an amendment** (Codex, on the integration base). Suggested header: *"Amended 2026-11-01 (owner): the 15-card random draft (`EXCLUSIVE_DRAFT_RULES.md`) is the primary mode and the default entry point. Memory-first recall remains a supported secondary mode, and all rules below still govern that mode."*
   - **Balance matters more now.** In a random draft players can't avoid defender-heavy or midfield-heavy cards, so the weakness of three-defender and all-midfield teams (§3) becomes luck of the deal rather than a bad choice. This raises the priority of decision 3.
   - **The daily challenge spec** (`CLAUDE_DAILY_CHALLENGE_SPEC.md`) should switch to seeded daily draft pools: everyone gets the same 15-card offers each day. This suits the random draft even better than recall did; Claude will revise the spec.
   - **Primary-mode balance tests** should measure trios as they come out of random drafts (with the IRON AI and with simple human heuristics), not only fixed compositions.
2. **Integration base.** Do you approve v68 as the base for a new `main`, with the 9 ratings commits merged in? Codex executes this; nothing should be committed by Claude.
3. **Balance target under regulation scoring.** Should DDD be made viable (my recommendation: yes, within a 35–60% band), and should possession become a real choice? If so, I re-run the R5/R6/R8–R11 research under `mode:'score'`.
4. **Goalkeepers.** They stay experimental until their ratings are reviewed. Is 3+1 meant to become the default format? That would change the "3 players per team" rule.
**Owner decisions, 2026-11-01:**
- **D2:** v68 becomes `main`, and the old branches and worktrees are removed. Backup taken first in `A:\CAGE_ARCHIVE_20261101`: an all-refs bundle (113 refs, verified) plus the uncommitted changes of all 26 dirty worktrees. Before deletion, the 9 ratings commits on `codex/t3-tactical-space` must be merged into v68, and the V6.4 motion and V6.3 goal-visual commits that `git cherry` doesn't find in v68 must be checked.
- **D3:** any composition is allowed, and each must have real pros and cons. Balance target: no composition is non-viable. Re-run the creation and midfield research under regulation scoring.
- **D4:** **3+1 is the format. Goalkeepers are mandatory.** The absolute rule "3 players per team" becomes **3 outfield players plus 1 goalkeeper per team**. The no-GK mode is kept only for historical replays. All balance work must now run in GK mode.
- **D5:** Claude to produce editorial goalkeeper ratings (see `proposals/goalkeeper-ratings-v1-proposal.json`).

5. **Ratings approvals still open:** goalkeeper overalls and tiers; the 37-player `ratings-v1.2` proposal.

## 6. Reproduction

- **Snapshot:** `git archive feature/v68-keepers-50 | tar -x -C <dir>`.
- **Gate:** `powershell -ExecutionPolicy Bypass -File tools/v66-experimental-gate.ps1`, run from the snapshot.
- **Balance probe:** `node probe68.cjs 300`. It loads `play.html`'s engine script list in a VM and uses `mode:'score'`. The probe sits in Claude's session scratchpad; it can be copied into `tools/` on request.

## 7. Outcome of the owner decisions (2026-11-01, executed by Claude)

- **`main` = d19a787 on GitHub.** It contains:
  - v68;
  - the ratings line (24 restored source, tool, test and doc files);
  - T3-11 fair Golden Goal kickoff;
  - T3-12 tactics with midfield chance creation;
  - V6.9 goalkeeper set-piece groundwork;
  - V6.4 player locomotion.

  Gate: 25 suites plus a reproducible T3-12 build. Known-stale checks:
  - `tests/v69-preflight.cjs` asserts the V6.8 engine;
  - four ratings tests assert old roster sizes (184/190 vs 194).
- **Removed:** 37 local branches, 31 GitHub branches, 47 worktrees (both clones), and 42 stale processes (local servers, agent runs from 30–31 October, old executables).
- **Backup:** `A:\CAGE_ARCHIVE_20261101`:
  - all-refs bundles of both clones (113 + LEVIATHAN refs);
  - the diffs and untracked files of every dirty worktree.

  Every file that existed only in `A:\THE CAGE` was carried into `main`. Its other uncommitted files were older than main's versions (checked by timestamp and content).
- **Left for the owner:**
  1. GitHub default branch is still `codex/t3-tactical-space`. Switch it to `main` (repository Settings → Branches), then delete that branch.
  2. Folders and files the permission system wouldn't let Claude delete:
     - `A:\THE CAGE LEVIATHAN`, `A:\THE CAGE LEGACY WIP BACKUP` (both fully contained in main);
     - `A:\THE CAGE V62 ARENA` (empty);
     - old executables in `A:\` and `A:\THE CAGE\dist` (v0.4 to V6.4);
     - the `CAGE_*_ARTIFACTS_*`, `CAGE_ARENA_V2_*`/`V3_*` screenshot, Chrome-profile and script items in `A:\`;
     - `A:\CAGE-TRANSFER` (its LAN server was stopped).
- **Launcher:** `A:\THE CAGE\PLAY THE CAGE.cmd` starts `dist\TheCage-T312-Tactical-Balance-Experimental.exe`. That's the newest packaged build, but it was built before the V6.4 locomotion and V6.9 merges; rebuild from main for a current `.exe`.
