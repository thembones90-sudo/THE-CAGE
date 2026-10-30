# CLAUDE — BUILD THE CAGE DAILY CHALLENGE PROTOTYPE + R1–R11 ENGINE QUALITY REVIEW
Owner expressly requested Claude + Big Pickle to MAKE THE CAGE's upgraded tactical experience. You are Claude CLI.
Project: A:\THE CAGE. DO NOT alter production src/, index.html, tools/, ratings, core tests, existing research files, exe, commits or existing uncommitted changes by other agents.
Write only in work/cage-next-claude/, create directory if needed. Big Pickle is separately implementing a playable 63-player T3/R1–R6/R8–R11 comparison page.

Read source docs CLAUDE_DAILY_CHALLENGE_SPEC.md, CLAUDE_ENGINE_REWARD_FINDINGS.md, CLAUDE_T3_RECOVERY_PLAN.md, CODEX_DAILY_MIDFIELD_REVIEW_20261030.md, tools/claude-t3-research.cjs, src/identity/search.js and original pinned roster.

Deliver real runnable JS, not just a spec:
1. A pure, deterministic, local daily challenge generator (5 rival trios, disjoint 15 player IDs, different tactical compositions, escalating quality, tactics, fixed UTC date+engine+roster seeds); pinned 63-player approved research roster for MVP. No use of incomplete club/decade/theme metadata. If constraints unsatisfiable, deterministic fallback or explicit validation error.
2. One-attempt practice/honor-system state machine separated from showdown storage, first to three, no reuse across five rounds, rival 15 globally unavailable, result card with times but no player names, version-snapshot/replay caution.
3. Offline tests and bounded 365-day preflight with actual results; no exhaustive 437,989-combination claim. Explicit caveat statistical fairness needs broader tests and player ratings.
4. Audit B4t, M2, B2, B5 alongside D4, D5b, C2, C1, D1b, D3 for R1–R11 engine validity and known risks (DDD >=33, hardmen press identity). Report what can/cannot be certified from 63 player data.
5. Provide a clean integration contract for Big Pickle's engine preview, with interfaces and runnable example. If possible make stand-alone simple daily UI in your directory that uses only shared engine files, not production.
Do not change production. Tests must run; clearly distinguish implementation from release readiness. Do not promise future background work.
