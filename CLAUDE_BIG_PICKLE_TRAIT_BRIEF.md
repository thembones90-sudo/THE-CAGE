# THE CAGE · Owner-authorized 15-Trait Engine Phase 1
Date: 2026-10-30
Owner explicitly directs building the actual trait engine using Claude and REAL Big Pickle via OpenCode Zen model opencode/big-pickle.
Project: A:\THE CAGE. Current 139 unique roster; 78 have primary+secondary trait metadata; 61 older players still lack stored pairings. Do not fabricate approved pairings for missing 61.
15 traits by family: Defence: Wall, Enforcer, Anticipator, Tracker, Libero. Midfield: Maestro, Architect, Destroyer, Engine, Surgeon. Attack: Predator, Magician, Executioner, Phantom, Juggernaut.
Rules: one primary and one distinct secondary per player; cross-family allowed; influence behavior and decisions, not ratings, outcome probabilities, automatic goals or hidden bonuses. Tracker pursuit path, not pace boost. Maestro tempo, not forced shots. Each trait meaningful in context and can be countered.
Existing match engine T3 deterministic src/engine/tactical-match.js, bundled via tools/build-t3.cjs into src/cage-engine.js. DO NOT edit generated engine directly. Research CLAUDE_T3_RECOVERY_PLAN.md describes six unimplemented T3 fixes and still-unresolved balance. Trait engine must be experimental and opt-in, separately testable with no perturbation to baseline when off.
Existing project includes uncommitted work by other agents; do not revert, stage or commit it.
CLAUDE ASSIGNMENT: Study engine and draft rigorous implementable spec under proposals/traits/CLAUDE_TRAIT_SPEC.md, including all 15 distinct action/position/target/counterplay behaviors, deterministic hook points; no additional RNG when off; primary vs secondary action weight (only affects choice weights, not success odds), criteria for activation and telemetry; acceptance tests for baseline identity OFF and counterplay/equity ON; scope and pitfalls.
Do NOT modify production files or existing ratings. Write ONLY this new proposal/spec file. Include technical handoff to Big Pickle to implement prototype in isolated files first.
Big Pickle assignment follows separately.
