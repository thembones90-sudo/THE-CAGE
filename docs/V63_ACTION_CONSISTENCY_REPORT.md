# THE CAGE V6.3 Action Consistency

Base: V6.2 arena-action commit 4ca984e
Branch: feature/v63-action-consistency
Scope: presentation-only improvements. Do not modify game rules, rosters, T3 engine, seeds, outcome telemetry, or saved matches.

## Fixes
1. A single pure recorded-event classifier owns all HUD action styling: shots, setpieces, contact, passes and carries. The FREE KICK HUD is a set piece and cannot pre-announce a shot.
2. Races use recorded contact defenders for ring indicators; wall passes draw contact styling only where the authoritative timeline records contact. Uncontested wall passes remain passes, not fabricated challenges.
3. Canvas action glows share an explicit reduced-motion guard that is exercised in Node regression. The V6.2 mobile CSS check remains in place.
4. No new player positions, shots, goals or match outcomes are generated. Decorative marks read the sampled timeline.

## Gates
- tests/v63-action-consistency.cjs: 13 event mappings, recorded-contact gate, reduced-motion canvas guard
- tests/v62-capture.cjs: desktop, 390px mobile, reduced-motion UI checks
- tests/viewer-v4/replay.test.cjs: record integrity
- tests/viewer/run-all.cjs: 120 sampled matches
- tests/v60-package-parity.cjs: source/public/service worker byte integrity
- tools/v63-action-release-gate.ps1: 23 automated suites and T3 reproducibility

Separate from the in-progress feature/v63-goal-broadcast branch and its different worktree. Integrate via reviewed cherry-pick/merge after the goal-broadcast edits are complete. The two branches both edit viewer.js and should not be blindly copied over each other.
