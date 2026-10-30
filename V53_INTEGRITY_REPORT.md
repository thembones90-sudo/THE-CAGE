# THE CAGE V5.3 — Match Integrity and Roster Consolidation

Date: October 31, 2026
Branch: feature/v53-integrity-consolidation
Based on clean committed 182-player HEAD 4cf45c5.
Status: TESTED DEVELOPMENT FEATURE, NOT MERGED OR DEPLOYED. T3 tactical balance is NOT APPROVED.

## Delivered

- Combined clean 182-player roster, editorial refinement and T3 calibration with the V5.2 2D viewer and five-round playable game. Main production game remains separate.
- The default Classic 0.4 engine is explicitly labeled as lacking full off-ball telemetry. Experimental T3 is available through ?engine=t3, not automatically promoted.
- Safe pending-match restore: reproduce every stored completed and pending match before updating live state or enabling saving. An incompatible or tampered save stays untouched, cannot be rerolled, offers JSON export and is backed up before an explicitly requested fresh start.
- Historical showdown score uses wins from rounds BEFORE the displayed match, not the current tournament total. Imported standalone replays don't fabricate a tournament score.
- A synchronous authoritative final-frame render prevents the round result and the 2D scoreboard disagreeing after instant or externally completed playback.
- Deterministic presentation-speed budgeting caps marker travel without altering recorded events, goals, player cells, winner or simulation clock. Goal-contact and pass-arrival positional invariants remain satisfied.
- Normal seek to the exact end finalizes the recorded match once when resumed.
- Offline web cache generated from canonical HTML dependencies and fingerprinted with a content hash. Standalone viewer variants and testing harness now load the 182-player roster.

## Verified tests on SKYNET

- 182-player recruitment and 178 historical integration: PASS.
- Existing gameplay UI regression: PASS.
- Viewer timeline, clock and static module tests: PASS.
- Viewer contract: 120 actual T3 simulations, 11,942 logged events, 885,736 frame samples, zero C1/C3 violations, longest build well under the 20 ms gate.
- V5.2 kinetic: 11 passing checks.
- Presentation peak on reference fixture: 336.95 px/s (previously 2088.7 px/s).
- Additional 30 real T3 matches: 4,045 event segments, maximum 338.05 px/s, no overspeed.
- Legacy and T3 five-round full showdowns: BOTH PASS, including 30 exclusive claims and non-scoring replays.
- Valid interrupted-match recovery: PASS.
- Invalid saved match recovery: PASS in both engine modes, byte-identical saved data preserved, no reroll, export and backup.
- Real unmodified-engine normal-speed match, pause, seek, real recorded hash, visible final scoreboard and one win only: PASS in both modes.
- Desktop Chrome and mobile-width Chrome: rendered screenshots stored under design/previews.

## Agent contributions and review decisions

Claude independently confirmed the unsafe partial restore path, missing pending guard and historical score label bug. Its targeted audit is preserved in CLAUDE_V53_REVIEW.md.

Qwen3-Coder 30B reviewed failed-save recovery. Qwen recommended automatically choosing a new random seed to replace an incompatible pending match. That proposal was REJECTED as unsafe: it would change a match already decided by the engine. The original review is retained in QWEN_V53_AUDIT.md. The implementation follows Claude's safe preserve-and-export approach.

## Local play

Stable game: http://127.0.0.1:51863/play.html
Experimental T3: http://127.0.0.1:51863/play.html?engine=t3
Standalone viewer: http://127.0.0.1:51863/viewer-v53.html

If the local server is no longer running, start Python http.server at 51863 from A:\CAGE_V53_INTEGRITY.

## Limits and next gate

- Experimental T3 tactics/balance not approved, especially defender-heavy stalemates.
- Older saved matches with different roster fingerprints may be incompatible; they are protected, not silently migrated.
- Physical smartphone touch QA, production merge, public deploy, Windows EXE rebuild and signing remain pending.
- 4x3 tactical cells are authoritative; exact player footwork remains inferred visual presentation.
- Active root A:\THE CAGE has unrelated uncommitted files; none have been overwritten.

Recommended next: evaluate T3 balance and a deliberately versioned replay compatibility policy before Golden Goal cinematic polish and release integration.
