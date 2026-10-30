# THE CAGE V5.4 — Tactical Balance Release Candidate
Date: 31 October 2026
Branch: feature/v54-qwen-tactical-balance
Parent: V5.3 c049502, clean 182-player source. Production unchanged.
Status: Validated ISOLATED development candidate. NOT approved as default T3.

## Delivered
- New opt-in tactical engine cage-t3-4, parameters t3-space-4: shot quality q=15 (was 11) and shotReference=68 (was 75). No fabricated goals, forced winners, rerolled seeds or changes to Classic v0.4.
- Stable Classic engine remains default. Experimental T3 requires ?engine=t3. The 15-class special-trait preview requires ?engine=t3&traits=preview.
- All 182 players have one distinct primary and one secondary approved class. The defensive class Tracker is the official approved replacement for the older Hunter name; no editorial assignments changed.
- Special-trait decisions are deterministic, situational and opt-in; no arbitrary rating boosts. Mode is stored and validated so reloads do not silently mix gameplay modes.
- Old T3-3 pending match saves are preserved/exportable and cannot be replayed under T3-4 or rerolled.
- Actual four-tactic differentiation verified using generated decision histories.
- Content-hashed offline static PWA, 47 files ~2.46 MB. Unsigned local Windows SEA executable ~95 MB built and Chrome-smoke-tested; EXE is ignored by Git.

## Two matched balance comparisons
10 matchups × 140 exact seeds × both sides = 2,800 matches per version:
- Defender-only old: 37/280 safety-limit errors = 13.21%; V5.4: 4/280 = 1.43%.
- Defender-only completed p95: 5,176 seconds old vs 4,032 seconds V5.4.
- All other nine matchups: 0 safety-limit errors in both versions.
- Biggest non-defender team win-percentage shift: 10.7 percentage points, which requires further competitive validation.

500 matched seeds × two sides = 1,000 defender-only matches per engine version:
- Old: 152/1,000 safety limits (15.2%).
- New: 16/1,000 safety limits (1.6%), an 89.5% relative reduction.
- Completed median: 1,919 vs 1,034 simulated seconds.
- Completed p95: 5,261 vs 4,092 simulated seconds.
- New kickoff-team winning percentage: 48.4% of completed games.
- Every completed KO game contains a single actual recorded goal.

## Passing verification
- Engine reproducible generation and guards: PASS; source-built 988,260 calibrated trios; archive Classic engine unchanged.
- Tactical balance gates: PASS, 2,800 matching seeds per engine version.
- Defender paired stress: PASS, 2,000 authentic simulations across both versions.
- 15 classes: PASS, 182 current players, valid primary and secondary assignments, 75 reproducible sample matches and 70 changed event histories when traits enabled.
- Four tactic modes: PASS, 400 authentic seeded matches; correct goal counts, engagement, tempo and receiver-action differences.
- Frozen replay records, malformed scores, old T3 versions and trait-mode mismatch protection: PASS.
- Classic, opt-in T3 and opt-in T3 + traits: all PASS complete five-round browser showdowns with 30 unique player drafts, original scored outcomes, five non-scoring replays, reset.
- Normal-speed real match and recovery with invalid old T3 save: PASS.
- Trait mode persists through save reload even after the query flag is removed; two-round real match test: PASS.
- 120-match 2D timeline contract: PASS, 9,820 events, 734,879 sampled frames, zero positional failures.
- 30 separate presentation movement matches: PASS, max ~338 px/s.
- Canonical 182 roster regression and V5.2 kinetic test: PASS.
- Chrome desktop and 500px mobile screenshots included.

## Qwen analysis
Qwen3-Coder:30b reviewed engine source, parameter comparison and final risk report. Original answers saved in QWEN_V54_ENGINE_AUDIT.md, QWEN_V54_PARAM_REVIEW.md and QWEN_V54_FINAL_REVIEW.md. Suggestions for artificial timeout transition, changing seeds or unneeded overflow fixes were rejected. Qwen's initial Hunter-name mismatch was outdated: Tracker is the user-approved final name. The final Qwen review's defender-overpowered inference was not supported by the cited safety-limit counts. Evaluation rests on actual reproducible simulations. A separate local Claude read-only audit was requested, but no substantive finished report returned; no Claude approval is claimed.

## Local usage on SKYNET
Static server at A:\CAGE_V54_TACTICAL, localhost port 51864:
- /play.html — Classic v0.4
- /play.html?engine=t3 — experimental T3-4
- /play.html?engine=t3&traits=preview — experimental 15 classes

Unsigned local Windows executable:
A:\CAGE_V54_TACTICAL\dist\TheCage-V54-Tactical-Preview.exe
Default loopback server port 4184. Browser DOM smoke displayed 182-player game, ready draft, enabled trait-preview badge, and verified the embedded new T3 engine.

## Explicit release boundaries
This milestone is finished as a release CANDIDATE, not approved default production engine. Residual defender-only safety-cap errors remain 1.6% in the matched sample; some matchup win rates shifted by 10.7 percentage points. Further broad league simulations and design acceptance required before default promotion. Physical smartphone QA and signing credentials unavailable. The user's active dirty main worktree was not changed. No background execution beyond the current session is promised.
