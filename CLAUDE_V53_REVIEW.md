I've reviewed all three files without editing any source. The full plan is saved at `A:\ClaudeCode\config\plans\read-only-second-review-of-lively-hummingbird.md`. I couldn't find an ExitPlanMode tool to hand it off for approval, so here it is in full.

## (a) Check the saved match before restoring state or allowing another simulation
- **Problem:** `resume()` at `src/showdown-v5.js:116` overwrites round, wins, history, pending and claims, and turns saving on (`canSave=true`), all before it calls `R.reproduce(pending)`. If that check fails, the state is left half-restored and saving is on. `play()` at line 112 doesn't check `pending`, so the player can re-roll the match with a new seed and overwrite the save.
- **Fix:**
  - Start `resume()` with `const s=R.validateSave(candidate); if(s.pending)R.reproduce(s.pending);` and only change state after that passes.
  - If it throws, keep `bootChoice=true` and `canSave=false`, and offer the export from (b).
  - Add `||pending` to `play()`'s early return and to `$('play').disabled` (line 39).

## (b) Export an unusable legacy save without deleting it
- **Problem:** After a failed load at boot (line 119), "Start fresh" calls `reset()`, which turns saving on. The next `refresh()` then saves over `KEY` and the old data is gone.
- **Fix:**
  - At boot, keep the raw string in `rawSave`.
  - Add an "Export saved data" button to the resume box. It downloads `rawSave` exactly as stored, as a Blob like `download()` at line 65 does.
  - In `reset()`, if the save was invalid, copy it to `KEY+'.legacy-backup'` (only if that key is empty, inside try/catch) before anything writes to `KEY`. Never call `removeItem`.
  - Use the same path when the saved match fails its replay check because of an engine, params or roster-fingerprint mismatch.

## (c) Correct the pre-round showdown score
- **Problem:** `showViewer` (line 22) passes the current `wins`. Replaying an earlier round, or restoring a completed round, shows a score that already includes that round and any later ones.
- **Fix:**
  - Add `scoreBefore(r)`, which tallies only `history` rounds before `r.round`, and pass that to the viewer.
  - Imported replays that aren't in `history` get `showdown:null`, so the viewer shows "NOT IN FILE".

## (d) No duplicate win from seek or replay
- **Current guards already hold:**
  - The clock's `endFired` flag (`src/viewer/clock.js:29`) only fires in live mode.
  - `endOnce` runs only once.
  - `finish()` checks `roundFinished` and `history.some(round)`.
  - Replay mode never calls `finish()`.
- **Hardening:** in `finish()`, also return when `!isReplay && record!==pending`, and require `history.length===round-1` before adding the round.

## New test phases in `tests/full-game-recovery.cjs`
1. **Tampered saved match:** change `eventHash` or `rosterFingerprint` in storage and click Continue. Expect an error, 0ΓÇô0, empty history, the stored save byte-for-byte unchanged, and Play disabled.
2. **No re-roll:** clicking Play while a saved match exists keeps the original seed.
3. **Legacy save:** with `{schema:0}` stored, the export button shows and its Blob text matches the raw save. After "Start fresh", `.legacy-backup` holds the raw save.
4. **Pre-round score:** after two rounds, replaying round 1 shows `0ΓÇô0`. Restoring completed round 2 shows the score after round 1 only.
5. **Seek:** during live play, seek to the end twice, then switch to instant: exactly one win. Seeking to the end of a history replay three times leaves wins unchanged.

## Regressions to re-run
- `node tests/full-game-recovery.cjs` (the existing `V5_SAVE_RECOVERY_PASS` flow must still pass).
- `tests/full-game-browser.cjs` and the `tests/viewer*` suites.
- Imported-replay verification (line 117).
- Keep the save schema at 1 so existing valid saves still load.
