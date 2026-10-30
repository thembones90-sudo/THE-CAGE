# THE CAGE — HANDOFF STATUS
Canonical project directory: A:\THE CAGE
Primary invariant: user recalls names; explicit search only verifies identity.

Assignment prepared for Codex: CODEX_TASK.md
Assignment prepared for Claude: CLAUDE_TASK.md
Master requirements: PROJECT_SPEC.md and GAME_DESIGN_LOCK.md

At handoff preparation, only README.md and GAME_DESIGN_LOCK.md were originally on A:. Earlier prototype ZIP exists in chat workspace, not confirmed on Windows A:. Implementation is not yet complete and neither Codex nor Claude has been started from this handoff.

Execution sequence:
1. Codex reads docs and scaffolds/builds playable v0.2.
2. Claude independently audits implementation and football mechanics.
3. Codex fixes verified issues.
4. Owner tests 3v3 gameplay and approves further development.

No new repository remote or deployment authorized.

UPDATE 2026-10-30: Owner locked exclusive first-valid-entry player claiming and three-phase attack/midfield/defence balance. See EXCLUSIVE_DRAFT_RULES.md, which overrides any earlier duplicate-player policy.

2026-10-30 Claude: wrote CLAUDE_OWNER_DECISION_RESPONSE.md (owner decisions reconciled; Codex Phase I order). No source/test/build files touched.

2026-10-30 Codex: local Git baseline b7d3b96. Owner requested save/resume, reproducible replay, balance audit, pitch duties/movement, tactic help, roster growth and recaps. Touched index/showdown entry points, src/showdown.js, src/identity/search.js, src/replay/records.js, src/roster-expansion.js, cage-ui.css, cage-engine.js, cage-commentary.js, tests, tools/serve.mjs, Start-TheCage.cmd and exe asset manifests. Engine API retains simulate(config) shape; results now deeply frozen and completed pass events include `to` zone. Version cage-0.4.0, params golden-goal-1, roster editorial-v0.4-63. See SPRINT_V04_REPORT.md. Baseline and post-fix sweeps retained under CODEX_* reports to avoid overwriting Claude-owned balance files. Remaining balance/termination gates fail and are explicitly documented; no winner fallback, rating changes, remote or deployment.

2026-10-30 Codex: sprint committed locally as 1c4a3d6 on codex/saved-showdowns. Feature/browser checks pass; executable rebuilt as dist/TheCage-v0.4.exe. Live-source app stays on localhost:4173. README updated to replace obsolete prototype-transfer instructions.

2026-10-30 Codex: owner reported blind lookup. Updated src/identity/search.js and src/showdown.js to complete submitted surnames/meaningful token prefixes into up to four matching full identities. Preserved explicit confirmation, stale-query invalidation, claim exclusivity and no suggestions before Enter/Search. Updated tests/records.cjs, README.md and ROSTER_EXPANSION_V04.md. Pure integrity and five-round UI tests pass; live Chrome verified mart and micha submissions without claiming or changing the saved draft. Packaged as dist/TheCage-v0.4.1.exe.
2026-10-30 Claude: wrote TACTICAL_INTELLIGENCE_PROPOSAL.md and CODEX_TACTICAL_TASKS.md (equal-quality composition audit, elasticity regression, ablations on scratch engine copies). Added erratum to ENGINE_ARCHITECTURE_PROPOSAL.md §1.2. No source/test/build files touched.
2026-10-30 Claude: added proposals/ratings-v1.json + RATINGS_V1_REVIEW.md (5 new attributes, draft for owner approval), tools/claude-tactical-balance.cjs (balance harness), tests/balance/ baselines, proposals/tactical-spike/ (reference engine + RESULTS.md). No src/ or production files touched.
2026-10-30 Claude: owner decisions applied. ratings-v1.1 (12 editorial corrections, RATINGS_V1_VERIFICATION.md); balance tool E11 now quality gradient (no underdog floor); CODEX_TACTICAL_TASKS.md status block authorizes T3 + T4.2-4.4 + T4.1 plumbing, holds T4.1 formula and T5 recalibration, defines acceptance gate. No src/ files touched.
2026-10-30 Claude: RESEARCH_ABC_REPORT.md (problems A/B/C: root causes, measured evidence, switchable mechanisms, side effects, tests). New Claude-owned tools/claude-anatomy.cjs; proposals/tactical-spike/engine-research.src.js (updated since baseline 17884ca: adds B4) + build-research.cjs. NOTE for Codex: baseline 17884ca committed five generated files under proposals/tactical-spike/variants/ (stale, regenerable via build-research.cjs). Claude restored them to match the commit; please remove them and add proposals/tactical-spike/variants/ to .gitignore in your next commit. CODEX_TACTICAL_TASKS.md: research update (no new Codex work; T4.5/T4.6 to be specified after T3/T4 gate). For Codex's baseline commit: all Claude files listed in git status are ready to include. No src/ files touched.
`n2026-10-30 Codex: T0-T3 candidate cage-t3-3 / t3-space-3 implemented on codex/t3-tactical-space after coordinated baseline 17884ca (tag tactical-baseline). Default browser still uses archived v0.4; ?engine=t3 has isolated preview saves. Deterministic/roster/replay/UI/persistence/mechanics checks pass. Unmodified full Claude harness attempted 112600 simulations: 394 caps; E1/E2/E4/E5/E6/E9/E11 fail; E10/E12 pass. No acceptance/promotion or experimental T4. See CODEX_T3_IMPLEMENTATION_REPORT.md and CODEX_T3_MECHANICS_SPEC.md. Approved ratings and concurrent research preserved. Generated research variants untracked only, retained locally and ignored at Claude request. No push/deployment or new EXE.
