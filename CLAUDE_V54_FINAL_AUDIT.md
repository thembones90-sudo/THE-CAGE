I found one release-blocking problem: saved replays in the default classic mode now get rejected when they include any of 118 players, even though classic gameplay didn't change. Otherwise the branch held up. I didn't change any files; the audit is also saved in the plan file. Evidence below is either a command I ran or a code reference.

## What I ran (all pass)
- `v54-trait-families`: 182 players, 110 corrected, 15 canonical traits, no Tracker left, all 182 split across two families. Primary counts: defence 40, midfield 46, attack 96.
- `v54-trait-integrity`: all 15 classes have an effect; traits changed 73 of 75 matches.
- `records`, `engine-guards`, `v54-tactic-causality` and `v54-balance-gates` (defender safety caps fell from 37 to 4; the largest win-rate shift for non-defender line-ups was 10.7%).
- `node tools/build-t3.cjs --check`: the generated `src/cage-engine.js` matches the modular source and the calibration. The `public/` copies are byte-identical.
- All 7 tracked HTML pages and `sw.js` load `roster-trait-family-v16.js` before the engine.
- **Not run:** the Chrome tests (`v54-old-version-recovery`, `v54-sticky-traits-browser`, `full-game-*`) need a local server. I have no evidence for them either way.

## P1: classic (v0.4, the default) replays are wrongly refused
- When `src/replay/records.js` fingerprints a classic record, `replayRoster()` copies the player object and removes the rating fields, but keeps `traits`.
- I confirmed the classic engine's copy of Paolo Maldini now has his new traits. The classic engine never reads traits (0 matches for `traits` in `src/engine/legacy-v04.js`).
- `CAGE_TRAIT_REFINEMENT.updated` is 118. Any saved or exported classic replay with one of those players now fails the fingerprint check, and `reproduce()` throws "needs its original engine".
- `showdown-v5.js` replays every past round when restoring a save, so the whole saved showdown fails to load.
- **Fix direction:** also drop `traits` from the fingerprint for `cage-0.4.0`. Check this against classic records that are already saved first: if they were fingerprinted with traits included, you'll need a versioned fingerprint rule instead.

## P2: lower severity
1. **T3 replays break with traits off too.** This diff changes no simulation logic: it renames Tracker to Hunter, swaps secondaries and bumps the version to `cage-t3-5`, and `PARAMS_VERSION` stays `t3-space-4`. Still, every `cage-t3-4` replay is refused: the registry only knows `cage-0.4.0` and the current version, and the fingerprint now includes traits. Failing safe is fine for an experimental mode, but say so in the release notes.
2. **The balance change is in the earlier commit.** It's in 26ec3f4 (`src/tactics/params.js`: `shot.q` 11ΓåÆ15 and `shotReference` 75ΓåÆ68), not in this diff. Lowering `shotReference` makes shots easier for everyone, so "only elasticity changed" isn't quite accurate. "No forced goals" does hold.
3. **The edited secondaries aren't tested on their own.** The class-effect check only uses each class's primary players. The 110 new secondaries (at half weight) are only covered by the overall 73-of-75 figure.
4. **Defensive classes are subtle.** Wall, Enforcer, Anticipator, Hunter and Destroyer only change how likely a player is to engage; they do nothing in `weights()` (`src/tactics/traits.js:41`). Hunter behaves exactly like Tracker did. That fits the rules, but Hunter as a secondary (e.g. Davids, Modri─ç) will barely show in play.
5. **The packaged exe is out of date.** `build-exe/launcher-complete.js` and `sea-complete.*` (untracked) don't include the new roster file. Rebuild before shipping the exe.
6. **Every page must load the new roster file.** If a page leaves it out, `capabilities.grades` throws because the roster version no longer matches the calibration. All current pages include it.

## Checked, no defect found
- **Two-family rule:** enforced when the roster loads (wrong families, a missing correction or wrong counts throw) and checked again in the test against `proposals/trait-family-v16-reviewed.json`.
- **Ratings:** core ratings are unchanged and the calibration averages are identical.
- **Goal and timing integrity:** each match has exactly one goal, as the last event, and the score, winner and match length all agree with it. Trait mode gives identical results on repeat runs (75 of 75).
- **Classic default:** the game uses v0.4 unless `?engine=t3` is set, and classic results are unchanged.

## Verdict
**Conditional no-go** for a release that keeps classic as the default, until the P1 issue is fixed or explicitly accepted. **Go as an isolated experimental T3 preview** once P2.1 and P2.2 are in the release notes. The trait editorial stays provisional, not owner-approved.

## Acceptance tests to add (not yet written)
1. **Classic replay survives:** make a `cage-0.4.0` record on the v1.5 roster (Maldini, Scholes, Vidi─ç), load it on v1.6, and assert `reproduce()` succeeds with an unchanged fingerprint.
2. **Classic save restores:** a three-round v1.5-era saved showdown loads in the browser on v1.6 without the "needs its original engine" error.
3. **T3 with traits off is unchanged:** over 100 seeds, `cage-t3-5` with traits off gives the same `eventHash` as `cage-t3-4`.
4. **Secondaries have an effect:** for each class held as a secondary, half-weight weights or engagement differ from the baseline in at least one situation.
5. **Exe matches the web build:** after rebuilding the exe, its script list matches `play.html` (including the new roster file), and `CAGE_ROSTER_VERSION` equals `calibration.rosterVersion`.
