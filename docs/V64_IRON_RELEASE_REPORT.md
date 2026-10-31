# THE CAGE V6.4: IRON INTELLIGENCE

Date: 31 October 2026
Source branch: `feature/v64-iron-intelligence`
Base: V6.3 combined release `c3dec28`
Release type: Offline local solo play / Windows preview

## Gameplay changes

- Select **Hotseat** (existing default) or **Solo vs IRON AI** on the random draft intro.
- Solo difficulty: **Casual** (random eligible pick, random tactic), **Competitive** (OVR, position/attribute fit and role completion with modest noise), **Ruthless** (stronger shortlist and visible-opponent composition awareness, deterministic tie-breaks).
- The CPU sees exactly the same private 15-player candidate pool offered on its turn. It may use only its one normal reroll, cannot extend the 20-second deadline and never accesses future candidate draws.
- Six ABABAB picks, random coin-toss first side, no duplicate or exhausted players, all three CPU picks automated without showing its candidate pool to the human.
- CPU picks its own permitted T3 tactical style after the three-card squad is locked. It does not read match events or run match simulations to rig outcomes.
- All existing historical ratings, 15 traits, 194 roster entries, Golden Goal cinematics, 2D viewer, replays and T3-6 simulation remain unchanged.
- Saved games use the existing schema-1 key and add optional `mode` and `difficulty` fields. Old saves lacking them load as human hotseat. Solo games preserve CPU settings, progress and champion after reload.

## Quality gates

- `tests/v64-cpu-unit.cjs`: three AI difficulties, 15 unique candidates, reroll-limited, no match-engine dependencies, no mutation.
- `tests/v64-cpu-browser.cjs`: complete 6-card drafts for Casual, Competitive and Ruthless, concealed CPU pools, valid CPU tactic, persistent mode.
- `tests/v64-cpu-five.cjs`: full best-of-five solo showdown, 30 exhausted players where all five rounds play; champion and saved-mode recovery verified.
- `tests/v64-legacy-hotseat.cjs`: old schema-1 save without AI fields restored as human hotseat.
- `tests/v64-package-contract.cjs`: CPU module bundled in offline web/EXE resources and loaded before draft.
- Full inherited V6.3 suite: **29/29 automated test groups PASS**, and T3 generator reproducibility check PASS.
- T3 calibration remains **1,198,144** trios.

## Independent empirical gameplay baseline

`docs/V64_BALANCE_AUDIT.json` contains **2,000 paired-seed simulated matches** across five composition scenarios and five controlled tactic configurations.

Composition results (200 matches each):
- Prime creators vs elite all-round trio: first squad 60.5% wins
- Three defenders vs conventional balance: defenders 18% wins
- Three forwards vs balanced high-end: forwards 43.5% wins
- Three midfielders vs conventional balance: midfielders 42.5% wins
- Press vs possession (two different trios): pressing side 70.5% wins

Controlled tactics, same two trios with 100 paired seeds reversed (200 matches per configuration):
- Balanced/Balanced: team A 53%
- Press/Possession: team A 72.5%
- Press/Balanced: team A 65%
- Balanced/Possession: team A 65%
- Possession/Press: team A 50.5%

All measured matches completed without a safety cap. These results suggest investigating press versus possession on a much larger and more diverse matchup set; they are not enough to change gameplay probabilities. NO balance parameters were changed in V6.4.

## Windows release verification

- `dist/TheCage-V64-Iron-Intelligence-Preview.exe`: 110,262,272 bytes.
- SHA256: `A2F107F16A7B733EEB3F1CF50768E7BCB21EC64C4FA6BA6B1EC662C212357DE3`.
- Standalone offline server serves **11/11** verified HTTP assets, including `/draft.html`, `/src/cpu-draft.js`, `/src/cage-engine-draft.js`, `/classic-v56/play.html`, and `/sw.js`.
- Generated offline web bundle contains 140 assets, 194 footballers and the unchanged calibrated T3-6 engine.

## Distribution

- V6.4 Windows preview is unsigned and local-only.
- The existing original workspace `A:\THE CAGE` and prior V6.3 worktrees are not overwritten.
- Remote GitHub push is to the feature branch only; do not merge into production until review.
