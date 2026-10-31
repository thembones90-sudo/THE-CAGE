# THE CAGE V5.5 — OPERATION IRON DISCIPLINE

Date: October 31, 2026
Branch: feature/v55-iron-discipline
Base: V5.4.1, commit 8354df8
Experimental engine: cage-t3-6 / t3-space-5
Default engine: unchanged Classic cage-0.4.0
Status: verified isolated development candidate. NOT merged/deployed. T3 stays opt-in.

## Completed engineering

1. Deterministic, policy-sensitive football decisions are now implemented in src/tactics/intelligence.js. Defensive engagement depends on the actual recorded attacking zone and defensive team's pressing policy. Forward receivers are chosen from teammates actually ahead of the carrier, using real grid positions, passing defenders, pace and available lanes. No extra runs, phantom receivers, invented goals or guaranteed passes.

2. An all-defender Press team now begins in the legitimate defensive shape, with only one committed attacker. If a genuine scoreless knockout remains alive after 1,500 simulated seconds, it may commit another footballer forward. This is a real tactical shape change, visible in event calc.commitment and not a script-generated goal. Timed games end before the surge; other team types are unaffected. Tactical engagement and all true pass/shot outcomes remain settled by the same deterministic rules.

3. The viewer now shows the exact starting tactics and engine version from the recorded match. A gold LATE HIGH-PRESS SURGE indicator appears only when the sampled recorded commitments prove the surge is active. Rewinding hides it; the record is never edited. Chrome desktop and mobile-width previews are saved in design/previews.

4. Original 182-player ratings, cross-family primary/secondary traits, and 15 classes remain unchanged. Classic is still the default. A new version is required for changed T3 behavior. Older T3-v5 replays are protected/exportable and cannot silently rerun under T3-v6. V5.3 Classic three-round saves remain compatible. 150 complete Classic match-result SHA256 hashes remain identical.

## Statistical acceptance results

A 24-condition mirrored-seed scenario matrix compared 3,360 actual V5.4.1 games against 3,360 V5.5 games with the identical lineups and seeds:
- Safety-limit failures: 14 / 3,360 BEFORE, 8 / 3,360 AFTER.
- Defender-only Possession versus Press win rate: 3.6% BEFORE, 15.8% AFTER.
- Defender-only Press versus Counter: 69.3% BEFORE, 52.1% AFTER.
- Maximum winner-rate shift for non-defender-only lineups: 7.2 percentage points.
- All completed KO games ended in one genuinely simulated recorded goal. No synthetic winner.

A separately archived four-matchup paired stress used 450 mirrored seed pairs per matchup, or 3,600 genuine V5.5 games:
- Defender-only Possession versus Press: 7.49% to 13.25% winner rate; safety caps 6 to 2 out of 900.
- Defender-only Press versus Counter: 71.57% to 61.68%; caps 3 to 5 out of 900.
- Balanced Press versus Balanced: 65.0% to 63.89%, zero caps both versions.
- Attacking Possession versus Press: 36.33% to 37.11%, zero caps both versions.
- 3,593 V5.5 games completed, 7 reached the safety limit. No forced outcomes.
- The portable regression test re-simulated every current-engine fixture without depending on any SKYNET-specific path; all 3,600 results were identical to archived candidate results.

Late press escalation thresholds 600, 900, 1200, 1500, 1800 and 2100 seconds were separately assessed across 400 mirrored seeds each orientation. 1,500 seconds was chosen as the measured compromise between fair counterplay and keeping defender-only safety limits under control. Failed experimental alternatives are archived locally, not in the release build.

## Final test evidence

- 120 actual T3 tactical match/viewer contract simulations: 10,382 logged events and ZERO C1/C3 positional violations.
- Complete 5-round browser showdowns PASSED for Classic, T3 and T3 with optional 15-class traits, including 30 exclusive claims, 5 genuine goals, 5 harmless replays and safe reset.
- Historical Classic 3-round save restore PASS; older T3 save fail-closed+export PASS; invalid saves and 31 malformed records refused.
- V55 tactical HUD and real long-match surge browser tests PASS, including rewinding before the surge.
- Late surge stress guards: 472 completed real scenarios, 8 safety caps, 49 actual later shape commitments, no non-eligible surges, no timed surges, 420 goal records.
- All 15 secondary traits retain measurable effects; 182-player roster and editorial classification tests PASS.
- 150 old Classic full match hashes unchanged.
- Engine rebuild, deterministic code syntax, web package, and standalone Windows EXE smoke checks PASS.
- Qwen3-Coder 30B's final focused review supported a separate experimental release. Its earlier suggestions to invent goals and change possession bookkeeping were rejected as not grounded in the source.
- Claude completed an independent READ-ONLY source audit, finding no high-confidence P0/P1 engine integrity issue. Three smaller concerns were fixed: locale-dependent ID ordering, visible tactical surge annotation and portable paired tests.

## Windows and offline web artifacts

- 48-file content-addressed offline web package. Approximately 2.48 MB. Not publicly deployed.
- Windows EXE: A:\CAGE_V55_IRON_DISCIPLINE\dist\TheCage-V55-IronDiscipline-Preview.exe
  Size: 95,147,008 bytes. UNSIGNED.
- Windows ZIP: A:\CAGE_V55_IRON_DISCIPLINE\dist\TheCage-V55-IronDiscipline-Preview.zip
  Size: 34,718,451 bytes.
- EXE SHA256: 7C05400C79FD386B6C9634DE798E4658A508719C481A4AE994B2D7788898D22D
- Built on SKYNET and smoke-tested via eight real loopback HTTP resources, including live T3-v6 assets, viewer, roster and historic Classic replay support.
- Windows EXE/ZIP stay local to SKYNET, not published to GitHub Release downloads. Source, tests, audits and previews are in the isolated Git branch.

## Play on SKYNET

From A:\CAGE_V55_IRON_DISCIPLINE run: python -m http.server 51865 --bind 127.0.0.1
- Stable default: http://127.0.0.1:51865/play.html
- Experimental T3: http://127.0.0.1:51865/play.html?engine=t3
- Experimental T3 and all 15 special traits: http://127.0.0.1:51865/play.html?engine=t3&traits=preview

## Remaining approval gates

T3 is still experimental and not universally balanced: a minority of long defender matchups reach the simulated 100-minute safety limit. The original engine records 4×3 cells, not skeletal footwork. In-browser mobile-width tests do not replace physical touchscreen validation. Windows signing, public hosting, a production merge and owner approval of the final tactic/secondary-class balance are NOT completed.

The active A:\THE CAGE worktree contains unrelated changes. It was not overwritten, reset or merged.

Release verdict: engineering, audit, reproducibility and packaging gates complete for the isolated V5.5 experimental candidate. It does not replace Classic automatically.
