# THE CAGE — OWNER DECISIONS AND CODEX FEEDBACK (30 OCT 2026)

Claude: the owner APPROVED these answers to your nine architecture decisions. This document supersedes conflicting proposals and older design tasks.

1. Draft order: alternate the first claimant by round: Commander starts rounds 1, 3, 5; Opponent starts 2, 4. Within each round, verified claims alternate until each side has exactly 3 players. First confirmed canonical player claim exclusively owns him. Do not expose browsable names or autocomplete.
2. Undo: NOT ALLOWED. A confirmed player is exhausted for the whole showdown, regardless of round outcome. Reset the showdown to clear the pool.
3. Knockout: 3v3 throughout, FIRST ACTUAL GOAL wins. No 2v2/1v1 withdrawals, penalties, artificial xG/chances fallback or goal forced at a clock threshold.
4. Format: best of 5 exclusively for initial release, first to 3 round victories. Can end in 3, 4, 5 rounds. Every round uses new trios: 18, 24 or 30 distinct footballers.
5. Balance: 55–65% is a provisional calibration target for strong balanced vs comparably strong but structurally weaker trios, NOT a hardcoded win rate. Investigate phase coverage, marking, press, movement and tactic counterplay before nerfing Ronaldo Nazario or other stars.
6. New attributes approved in principle: work rate, stamina, composure, agility, marking. Independently rate these; each must have testable simulation consumers. Preserve the 57 roster identities and six existing editorial base values.
7. Start with four tactics: Balanced, Possession, High Press, Counterattack.
8. Local development server with a simple Windows launcher preferred.
9. Do NOT display a pre-match win probability estimate; let players assess their own football knowledge.
10. Git init local is approved, no remote or push, protect existing work.

COMMENTARY LOCK: engine simulates -> immutable event history -> narration. Original text in an emotionally expressive, football-literate broadcast tradition (Peter Drury as high-level creative benchmark, never copy recognizable lines). Commentary NEVER influences outcomes and never invents event details. Playback timing is independent of seed/outcome, typical real-world match watch target 30–45 seconds but variable.

CURRENT LIVE IMPLEMENTATION: A:\THE CAGE\index.html is already a playable hot-seat showdown UI; former prototype kept at prototype-v02.html. src/showdown.js, src/cage-engine.js, src/cage-commentary.js, tests/showdown-engine.cjs exist. Existing 100-seed engine test and an earlier headless Chrome 4-round E2E passed. NOTE: existing UI currently allows either side to claim in any order, so enforce owner-approved alternating claimant turns in a testable way. Review code before modifying; Codex may be working on it. No silent collisions with Codex.

CODEX's follow-up recommendations (owner shared for consideration):
- Prioritize rigorous five-round integrity tests: aliases, claim exclusivity, resets mid-playback, all five rounds, score/event-log integrity.
- Prove actual balanced trio coverage through seeded sweeps before tuning player ratings.
- Consider a compact event-driven animated six-player mini-pitch later; it only visualizes engine events, never steers outcomes.
- After each goal show factual decisive sequence from the event log.
- Later expand beyond 57 to cult favourites and defensive specialists, with no roster browser/spoilers.
- Later save showdown history and reproducible replays (players, tactics, seed, engine version).
Recommended order: integrity -> measured balance -> event-driven visual pitch -> roster expansion.

DELIVERABLE: Review the changed rules against your ENGINE_ARCHITECTURE_PROPOSAL.md, CODEX_ENGINE_TASKS.md, and live implementation. Write a concise response and coordination instructions for Codex in A:\THE CAGE\CLAUDE_OWNER_DECISION_RESPONSE.md. Do not modify the live engine/source while Codex is concurrently editing. No deploy or push.