# V5.5 T3 final audit (read-only)

**Verdict: I found no high-confidence P0 or P1 engine integrity risks.** I only read code and diffs. I did not run any tests or the build check. The only file I wrote was the plan-mode notes file.

## What checks out

- **Classic is untouched.** `src/engine/legacy-v04.js` does not appear in the diff. `tools/build-t3.cjs:28` still switches back to the legacy engine unless the URL has `?engine=t3`.
- **Versions and hashes.** `VERSION:'cage-t3-6'` (`tactical-match.js:73`) and `t3-space-5` (`params.js:7`) are both bumped. `reproduce()` requires an exact `paramsVersion` match, a roster fingerprint match and a byte-identical JSON result (`records.js:38`). So the new `policy.latePressEligible` field, which appears in `result.shapes`, cannot be confused with t3-5 output.
- **External saves.** The registry only contains `cage-0.4.0` and the current engine (`build-t3.cjs:27`). A cage-t3-5 replay therefore stops at "needs its original engine" rather than re-simulating under t3-6. That fails safely, not silently.
- **No fake goals.** The surge loop (`tactical-match.js:38-43`) only sets `team.lateSurge` and calls `S.commitment(team)`. It draws no random numbers and touches neither `score` nor `events`. Goals still come only from `shoot()` (`:33`), and `validResult` still requires exactly one goal as the last event (`records.js:10`).
- **"Without score" is guaranteed by design.** In knockout mode a match ends at the first goal, so reaching tΓëÑ1500 means it is still 0ΓÇô0. In timed mode `timedSeconds:1200` is below 1500, so the surge can never fire. This is implicit, though, not an explicit check.
- **Surge eligibility is narrow.** `latePressEligible` requires `tactic==='press' && natural===3` (`policy.js:3`). The change goes from 1 to 2 committed players via `commitForward+(lateSurge?1:0)` (`spatial.js:3`). It survives later recalculations because `turnover` and `restart` call the same `commitment()`. Rotation swaps keep the count the same (`spatial.js:8`).
- **Positional 4x3 grid.** `forwardTarget` only ranks teammates who are already ahead of the carrier (`tactical-match.js:51`). It uses the real `passingDefenders` on the grid (`intelligence.js:19`). The pass is still settled by the same interceptor duel (`:65-66`), and the evidence validator still checks positions, path and defenders (`evidence.js`).
- **Zonal engagement** now depends on `dpol.blockHeight` and `pressTrigger` everywhere except the box, where it is fixed at 1 (`intelligence.js:5-14`). It feeds the same `R()<engage` draw, so the number of random draws per step is unchanged.
- **Viewer label.** It shows `record.config.tactics` and `record.engineVersion`, escaped with `esc()` (`viewer.js:70-76`). It doesn't add anything the record doesn't contain.

## Medium/low-priority findings (none blocking)

1. **The surge is observable but not labelled.** No `tactical_change` event is emitted. The only trace is `calc.commitment` flipping on later events, plus changed positions. The viewer label is fixed at kickoff, so a viewer can't see the surge happen. It is not a hidden result adjustment, but it isn't obvious either. Consider adding an explicit logged event, which would need another version bump.
2. **Evidence validation doesn't check commitment counts.** `evidence.js` never checks commitment counts against `policy.commitForward` plus the surge. A t3-6 record that was edited this way would pass `validate()`, including inside `validateSave`. Only `reproduce()` would catch it.
3. **Old T3 saves skip hash checks on load.** For t3-5 records, `validate()` finds no engine, so the hash and evidence checks are skipped (`records.js:15`). Such a save still loads, but replaying it fails. This was already the case before V5.5.
4. **Locale-dependent tie-break.** `forwardTarget` breaks exact ties with `localeCompare` (`intelligence.js:27`). It's only reached when ranks are exactly equal, but a plain `<` comparison on ids would remove any dependence on the platform's sort rules.
5. **Test portability.** `tests/v55-paired-balance.cjs:4` hard-codes `A:/CAGE_V54_TACTICAL`. Also, `v55-old-version-recovery.cjs` writes `v55-older-t3-recovery.html` into the repo root, and that file is currently untracked.
6. **One finding is unverified.** I didn't run `node tools/build-t3.cjs --check`, so I haven't confirmed that `src/cage-engine.js` matches the source modules. A grep found the new markers in it six times.

## Five recommended acceptance tests

1. **Bundle and Classic stay frozen.** Run `node tools/build-t3.cjs --check`. Assert the legacy-v04 SHA256 is unchanged. Without `?engine=t3`, assert `CageEngine.VERSION==='cage-0.4.0'` and that existing Classic saves still replay byte-identical.
2. **Old saves fail safely.** Load a real t3-5 record and a t3-5 saved showdown under t3-6. `reproduce()` must throw the "original engine" error, the save must not be silently re-simulated, and the user's export path must stay intact.
3. **The surge can't happen in the wrong place.** Across at least 2,000 seeds, include non-eligible tactics and lineups and timed mode. Assert the committed count never changes for non-eligible teams. For eligible teams, assert it is 1 for every event with t<1500 and 2 for every event after the first step at tΓëÑ1500. Assert `draws`, the score and the single final goal all match.
4. **Determinism and tamper rejection.** Simulate a surge seed twice and compare `JSON.stringify` and `eventHash`. Then flip one `calc.commitment` flag in a copy. `validate()` behaviour should be documented, and `reproduce()` must throw an integrity mismatch.
5. **Receiver evidence on the grid.** For every `through_ball` in a sample, recompute the candidates from the recorded `positions` and assert that the logged `target` is the top candidate. Also assert that `calc.defenderIds` equals the defenders on the recorded pass path. This catches any invented runner or invented passing lane.
