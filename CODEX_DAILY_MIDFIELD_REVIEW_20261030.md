# THE CAGE — Daily + Midfield Independent Review / Conditional Handoff
Date: 2026-10-30
Review: ChatGPT + Codex (CLI run in read-only mode; no Codex edits)
Scope: CLAUDE_DAILY_CHALLENGE_SPEC.md, CLAUDE_ENGINE_REWARD_FINDINGS.md, CLAUDE_T3_RECOVERY_PLAN.md, current source and Codex independent review.

## Decision
- APPROVED FOR DESIGN / ISOLATED PROTOTYPING: solo memory-first Daily Challenge with five deterministic, varied rival trios, visible opponent before each claim, fixed per-round seeds, best of five first to three, player no-reuse, locally generated deterministic content and plain-text spoiler-free result card.
- NOT APPROVED FOR RELEASE OR PRODUCTION UI INTEGRATION: engine and roster acceptance requirements have not passed; generator feasibility and statistical validation are incomplete. localStorage one-attempt is an explicitly disclosed honour system, not anti-cheat.
- ENGINE ORDER CONDITIONAL APPROVAL: R1 urgency, R2 second-ball, R3 press/rest decoupling, R4 bypassed-press transition, R5 cover-aware discipline, R6 regainer counter. Then R8 passing-spread, R9 vision-led receiver, R10 space receipt, R11 checked carry, one separately versioned and measured mechanism per accepted step. NEVER ship R1+R2 without R3+R4.
- HOLD R7 free man; measured finisher bias and DDD penalty. Do not rebalance by changing ratings or using role/composition win bonuses.
- Trait engine remains experimental; existing 139 roster contains 78 traited and 61 untraited. No automatic assignment or live trait-mode activation from this review.

## Evidence and limitations
- Claude player value analysis uses 30,000 random match samples on the pinned 63-player approved baseline; it has not established 139-player fairness.
- R1-R6 Stack 2: DDD 35.1%, E6 66.9%, 4 passed acceptance gates; many others still fail.
- R8-R11 after Stack 2: MMM 44.9% -> 47.3%; own-MID -8% -> -4%; DDD 35.1% -> 33.4%; large-gap upset 29.3% -> 26.8% (still above 25% target). Three-defender press identity is lost; now counter is best. Finisher premium drops but is not eliminated. Therefore not a released game balance.
- Ratings beyond the 63 original approved players are provisional. Keep explicit versions and provenance. Freeze a roster before claiming engine acceptance; run 63 and 139 studies separately.
- Codex CLI review correctly flagged daily generation feasibility and validation complexity, but reported the wrong trio count. The correct C(139,3) is 437,989 (verified existing T3 build). 10% * 4 tactics = about 175,196 candidate evaluations per round before replicated seeds; 365 * 5 rounds could require roughly 320 million evaluations before replication. Validation must be bounded, reproducible, sampled and cached, running OFFLINE only.

## Daily requirements to resolve before production
1. Define no-reuse globally: rival 15 IDs are permanently unavailable on that date; player claims are unique across encountered rounds, even when match ends early. Match ends immediately on third win; display only played rounds in the result card. Display future rival trios as locked/revealed only according to the agreed counter-pick flow.
2. Keep dateUTC and candidate roster/engine version in the content seed and persisted ID; the example date-only ID in the spec contradicts the stated version-pinning policy. Store full versioned content snapshot and replay record, and either keep old engine/roster bundles or explicitly label old games unreplayable. Never silently replay on a new engine.
3. Themes (nation, decade, club) may only use metadata that exists; check enough unique candidates to produce five disjoint rival trios and each template/percentile band; deterministic fallback to unthemed day with explicit validation telemetry.
4. Explicit candidate sampling and confidence interval for best-versus-median, tactic spread and degenerate rounds. A deterministic one-shot result is not an estimated win probability; research compares multiple prescribed seeds and reports uncertainty. Do not show probabilities or grades to players before lock.
5. Validate at least 365 generated dates for identity uniqueness, quality bands, template distinction, seeds and cross-platform replay. Rejection/regeneration salt must be bounded, reproducible and have measured failure counts. No random retries until success.
6. Honour-system storage failures, local timezone vs dateUTC rollover, interrupted sessions and practice mode must be tested. Never represent localStorage as secure one-attempt enforcement.
7. Independent UX regression: memory-first claim only after typed search, no list/autocomplete, exclusive global claims, saved showdown unchanged, first goal wins, event-only commentary, first-to-three.

## Codex action sequence (future, after any explicit owner authorization of implementation)
- Freeze approved roster boundary / ratings and existing dirty-worktree snapshot first. Do not overwrite unrelated changes or treat provisional ratings as approved.
- Build and test R1-R6 in order, with per-step regression and full balance report; R3/R4 must be included before releasing R1/R2; keep trait preview OFF.
- On accepted 139-player baseline, test R8-R11 individually and stop a step if MID fails to improve, finisher premium fails to shrink, DDD drops below 33%, press identity worsens, or previously passed gates regress. Do not tune ratings to force a pass.
- Develop daily generator/validator first as an isolated pure module with deterministic fixture outputs; only integrate UI after successful engine + roster + fairness gates and explicit owner release decision.
- Do not commit, push, publish or rebuild exe from this review alone.

Status: DOCUMENTED FOR CODEX AND CLAUDE REVIEW. No production gameplay, daily UI, ratings or compiled binaries modified by this review.
