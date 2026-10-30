# CODEX — IMPLEMENTATION ASSIGNMENT
Workspace: A:\THE CAGE
Read first: GAME_DESIGN_LOCK.md, PROJECT_SPEC.md. Claude reviews, Codex integrates.

## Mission
Create a local playable v0.2 of THE CAGE. Highest priority is free-text **memory recall**. Do not build a roster browsing UI. The user should win through remembered footballers and strategic trio construction, not by picking from suggested cards.

## First steps
1. Inspect workspace and report exact files present. If index.html/old prototype absent, do not claim to modify it. Scaffold a clean offline browser app in the canonical folder.
2. Safely initialize version control if none exists; do not overwrite unrelated files. Do not deploy or push without owner approval.
3. Implement player identity data with carefully verified examples and documented fictional/editorial abilities.
4. Build three empty search slots for each team. On explicit Search only: strict verified alias resolution; near-name disambiguation limited to narrow matches, no suggestions before submission.
5. Implement confirmation / slot removal / duplicate validation / team lock.
6. Implement deterministic seeded 3v3 simulation, small-goal no-GK rules, honest match log, and tactic selection. Never choose winner then invent explanatory events.
7. Add tests for search, aliases, ambiguity, duplicates, unknown players, deterministic engine, integrity of match logs, and no browse/search spoiler UI.
8. Run tests and browser smoke test; record exact commands and results.
9. Write CODEX_REPORT.md with files changed, tests passed/failed, known limits and next iteration priorities.

## Critical acceptance scenarios
- Search 'Djalminha' -> verified player.
- Search 'R9' -> Ronaldo Nazário, NEVER Cristiano.
- Search 'Sinisa Mihajlovic' -> Siniša Mihajlović.
- 'Ronaldo' alone -> identity resolution; no automatic wrong person.
- Zero text -> validation error.
- Unknown player -> not found, no fabricated ratings.
- Repeated same person in own slots -> blocked.
- Brand-new page -> no preloaded roster, no discoverable suggested players.
- Submit, lock, simulate, replay: all functioning.
- Same seed + same teams/tactics -> same event log and winner.
- Match goals assigned only to participants.
- Player names in database are not necessarily the only possible final roster, but unsupported ones must remain unverified until sourced; never invent.

## Coordination
Do not change master design constraints without approval. Claude can flag changes via CLAUDE_REVIEW.md. Keep evidence-based changes and avoid unnecessary refactoring. Keep all project files on A:.
