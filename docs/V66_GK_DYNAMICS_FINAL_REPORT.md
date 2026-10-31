# THE CAGE V6.6 - Goalkeeper Dynamics T3-8 Experimental Checkpoint

**2026-10-31 | feature/v66-gk-dynamics | development preview only**
Base: feature/v66-last-line / f0acb82. Not a production build.

## Implemented
- Goalkeeper **Distribution** influences real field position, long/short release selection, interception probability and possession. Long kicks have higher failure risk; intercepting outfield opponent is selected by nearest position, not hardcoded anchor.
- Goalkeeper **Sweeping** can clear completed through-balls, including counterattack outlets, before a shot is possible. The rules log the goalkeeper ID, location, actual attempt probability and sampled roll, regardless of outcome.
- Goalkeeper **Save/Parry/Wide** classifications log their additional random draw (`catRoll`) and both thresholds. This roll happens only after a shot already failed to score and cannot retroactively cancel a goal. Replay validation independently recomputes classifications.
- **Recorded Golden Goal Pressure:** if a keeper match is tied long into overtime, attackers press forward more aggressively and defenders engage less as fatigue creates space. No free goals are handed out. Regulation scores always decide matches if not tied.
- A rare hard safety limit can still be reached in principle. The local browser now automatically retries up to four times with new random seeds, storing the actual final seed and retry count in replay metadata. The result remains deterministic and auditable.
- **Historical engine preservation:** `src/cage-engine-v66.js` freezes original T3-7 keeper rules, alongside `src/cage-engine-v65.js` T3-6 and v0.4 Classic. Both old GK and non-GK replays are supported. Seven historical T3-7 event hashes are pinned to the original f0acb82 checkpoint.
- Keeper events animate in the existing six-outfield-marker pitch viewer without turning the extra GK into an outfield player. Commentary identifies sweeps, saves, parries and releases.
- Old 194-player outfield roster, optional hints OFF, private 15-candidate ABABAB draft, 10-second five-keeper phase, no-repeat best-of-five all remain.

## Verification
- `tools/v66-experimental-gate.ps1` contains 20 regression suites (including new deterministic keeper events and 180 defensive overtime trials).
- Earlier analysis `docs/V66_GK_DYNAMICS_PAIRED.json` used 180 paired seeds for each of three goalkeeper pairings and two roster archetypes: **old T3-7 failed 14/540 all-defender matches and the new overtime pressure finished 540/540**. Although strong evidence, it is not a mathematical guarantee.
- `tests/v66-golden-pressure.cjs` pins seven old defender-stall seeds and verifies all 180 defensive seeds finish, with recorded pressure transitions.
- Dynamic 2D viewer remains approximately 45 seconds real time in the sampled GK timelines.
- Historical old-match hash tests and a deliberately simulated overtime timeout -> replay-recorded seed retry in the browser are included.
- `docs/V66_GOALKEEPER_RATINGS_REVIEW.md` lists all 30 provisional cards, OVRs, roles and tier-overlap flags. **No keeper ratings or career tiers were changed without owner approval.**

## Final calibrated paired-seed sample
- Source: `docs/V66_GK_DYNAMICS_PAIRED_FINAL.json` (12 conditions, 180 seeds each, 2,160 simulations including historical controls).
- **All-defender safety:** old T3-7 failed 14/540 matched games; T3-8 failed 0/540 in the same tested conditions.
- **Elite pair, mixed outfield teams:** 6.08 goals/match in T3-7 vs 5.92 in T3-8; normal match scores remain primary and Golden Goal follows only a regulation tie.
- **Recorded elite GK distribution:** 2347/3003 successful releases (78.2%). Original T3-7 did not have keeper distribution events.
- The last refinement logs save/parry classification draws, adds long-kick risk, covers through-ball counter outlets, chooses the nearest interceptor and allows a bounded replay-recorded safety-seed retry. These were tested after Claude's read-only audit and are not externally independently signed off.

## Scope limits
- The overtime pressure tactic is provisional and subject to owner gameplay approval.
- T3-8 sample balance is provisional; the no-keeper historical engine remains untouched. Avoid misleading claims that a 0/540 crash result makes safety mathematically guaranteed.
- Hotseat keeper pool concealment is an honour system. Full secrecy cannot be guaranteed in a local browser storing state client-side.
- Visual keeper movement is a simplified, event-grounded marker treatment, not a 3D keeper animation.
- The historical goalkeeper cards were curated, not statistically sourced. Four TITAN, nine LEGEND, fifteen ELITE, two STALWART, zero ACE. Seven ELITE cards have OVRs overlapping lower LEGEND cards. Owner calibration remains necessary.
- The final independent Claude read-only audit found **no confirmed P0** before the last evidence/retry refinements. Its concerns about the old distribution rate were from a pre-tuning diagnostic. There has not been a second post-refinement independent sign-off.

## Run and build
- `powershell -ExecutionPolicy Bypass -File tools/v66-experimental-gate.ps1` validates the complete development integration.
- `powershell -ExecutionPolicy Bypass -File build-exe/build-v66-dynamics.ps1` creates an unsigned local Node SEA EXE.
- Use the experimental keeper toggle in the random-draft intro. It is **OFF by default**, preserving the ordinary game.

## Packaged build verification
- Windows EXE: `dist\TheCage-V66-GK-Dynamics-T3-8-Experimental.exe` (file name includes T3-8).
- SHA-256: `3435C5CCCA9B6DD89FE08FE4FA284BE201E9DCC40BC0EA5C7286A5C77DB2A46D`
- Final built executable served 14/14 checked resources successfully on localhost.
- Windows binary is unsigned and the SEA injection tool prints a signature warning. Runtime HTTP smoke passed after injection.
