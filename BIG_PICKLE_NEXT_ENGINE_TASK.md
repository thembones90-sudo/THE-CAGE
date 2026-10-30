# BIG PICKLE — BUILD PLAYABLE THE CAGE NEXT-GEN TACTICAL ENGINE PREVIEW
Owner explicitly requested Claude + Big Pickle to MAKE the improved engine playable, not merely report.
You are Big Pickle via opencode/big-pickle. Workspace A:\THE CAGE.

Do not change production index.html, src/, existing tools/, approved ratings, existing tests or dist. Existing dirty worktree contains other agents' code. Only create/edit work/cage-next-big-pickle/ and optionally new files therein. No commits, pushes, exe builds or deployment.

Read: CLAUDE_T3_RECOVERY_PLAN.md, CLAUDE_ENGINE_REWARD_FINDINGS.md, CLAUDE_DAILY_CHALLENGE_SPEC.md, CODEX_DAILY_MIDFIELD_REVIEW_20261030.md, tools/claude-t3-research.cjs, src/showdown.js, src/identity/search.js, src/replay/records.js, index.html, proposals/t3-research/make_research.py.
Use pinned, approved 63-player research roster, NOT mixed 139-player ratings. Existing research engines under work/t3-research/ may be read (do not alter); build copies under YOUR isolated directory if necessary.

Deliver a complete, functional, browser-playable best-of-five showdown that can switch among:
A: unmodified research T3 (RF none),
B: recovered R1–R6 (flags D4,D5b,C2,C1,D1b,D3),
C: recovered + midfield R8–R11 (same plus B4t,M2,B2,B5).
For a fair head-to-head comparison, use same player teams, tactic choices and input seed with direct eventHash comparisons; do not introduce fake results or alter probabilistic rules. The player experience must preserve memory-first name claiming with no autocomplete, exclusive names, alternating draft and first-to-three, first actual goal wins, event-only commentary, replay integrity.

Reuse existing UI and showdown logic where safe via relative paths, but isolate localStorage keys for variants and preserve original user games. Clearly show the exact engine flags, roster 63, experimental failures and comparisons, status 'NOT ACCEPTANCE APPROVED'. No fake claims. Avoid connecting 139-player live version to 63-player research engine; verify matching BY_ID sets. Fix discovered interactions rather than only placing a screenshot. Include seed input or query param (same seed across variants), before-match selection and compare hashes. Do not use DOM-based pre-match strength/odds.
Deliver:
work/cage-next-big-pickle/index.html and associated JS/CSS as needed, plus README.md, tests.cjs for deterministic 63 roster and engine mode, no overlap, stable mode isolation; tests run Node, and attempt browser smoke if available.
Do not override any production code. If something is not feasible, implement the maximal functional subset and report accurately.

Claude works separately on Daily Challenge generator and validator. Do not touch Claude's files.
