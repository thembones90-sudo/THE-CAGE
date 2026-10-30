# THE CAGE v0.4 — saved showdowns, replays and audit

Implemented against the existing project. Local Git baseline: `b7d3b96`. No deployment or remote.

## Play

Run `Start-TheCage.cmd` or `node tools/serve.mjs`. Open `http://127.0.0.1:4173/` in the same browser to retain saves. This fixed origin replaces the random-port workflow for development. Old executable ports have separate browser storage. Saves stay on this browser/device; clearing site data clears them. Completed rounds can be exported as JSON replay records.

## Features

- Autosaves confirmed picks, unfinished typed names, alternating turn state, used pool, tactics, round score, complete history and interrupted match records.
- Offers Continue showdown on reopening. An interrupted match restarts its presentation with the original seed/result and awards at most one round victory.
- Records round, seed, squads, tactics, engine/parameters/roster versions, roster fingerprint, actual event history and result. Replay re-simulates and compares the full event result before showing it; mismatched versions or corrupt records are rejected explicitly.
- Replay/export/import never adds claims or victories. History and recorded scorer/assist/decisive-possession chains survive reload.
- Follows owner-approved alternating claims (Commander starts odd rounds, Opponent even rounds), no undo, no duplicate/recycled identities, first to three and no sixth round.
- Adds four tactic explanations and assigned anchor/creator/attacker names after a trio is claimed. No pre-match win prediction or recommendation list.
- Pitch initializes duties from the engine's assignment. Completed passes move possession to the receiver; interceptions use real turnover events; shots head toward goal. All six players remain visible. This is a zone diagram with interpolation, not physical tracking; non-actor player movement is not simulated.
- Expands from 57 to 63 players with identity references and editorial rating rationale. The original 57 records remain unchanged. See ROSTER_EXPANSION_V04.md. Common ambiguous surnames require full identity; unknown text does not imply the footballer is fictitious. Tight corrections happen only after explicit submission.
- Engine validates squads/tactics/seeds, deeply freezes results and includes successful pass destinations for presentation. Removed the obsolete xG-decider commentary case and escalation parameter.

## Measured findings and fix

Preserved baseline: CODEX_BALANCE_BASELINE.md and tests/codex-balance-baseline.json. Updated sweep: CODEX_BALANCE_REPORT.md and tests/codex-balance-results.json. Tactic isolation: CODEX_TACTIC_REPORT.md and tests/codex-tactic-results.json.

- 49,000 baseline trials: 11,405 safety-cap hits. A defender's near-goal shot utility could become negative and fall to a .03 choice weight, causing excessive passing in the box.
- Changed close-range shot-choice scaling from `/18` to `/50` with a .45 base floor. This affects action selection, not goal rolls; it never forces a goal or a winner, and no player rating changed.
- Same 49,000 trials after the fix: 1,190 cap hits. All ordinary archetype/tactic rows had zero caps; worst-case defensive row had 501/10,000, defender mirror 689/10,000. The zero-cap gate is NOT met.
- Reference balanced trio won 91.4% vs the two-creators/stopper trio, versus 92.6% before. The provisional 55–65% target is NOT met. Do not describe the engine as fully calibrated.
- Separate 16,000-trial identical-squad tactic matrix: possession won 35.0% against press and 34.9% against counter. These composition-specific diagnostics suggest possession needs attention; they do not establish a universal tactic ranking.
- Starting-side mirror diagnostics show no decisive bias at this sample size; confidence/sampling limits are stated in the reports. Mirror squads exist only in tests, not the exclusive live draft.
- A safety-cap exception now leaves a void round with no winner, preserves claims and permits a new-seed retry. The seed is displayed in the error for reproduction. The test verifies this path. Automatic retry loops and forced goals were not added. A current diagnostic failure is seed 1, balanced tactics, Maldini/Chiellini/Thuram mirrored on both sides (test-only mirror; exclusive live drafts prohibit it).

## Verification

- `node tests/records.cjs`: deterministic frozen records; rejected corrupt scores, event actors, negative time, incompatible versions and saved-state inconsistencies; aliases/ambiguity/corrections; original 57 records unchanged; 63 bounded records.
- `node tests/showdown-engine.cjs`: 100 deterministic engine/commentary seeds and canonical HTML module integration.
- `node tests/roster-integration.cjs`: preserved prototype baseline.
- `node tests/ui-regression.cjs`: alternating turns, stale search, claim exhaustion, timed spoiler-free playback, six players, actual five-round 3–2 fixture, reproducible replay without double scoring, recaps, void retry, reset.
- `node tests/persistence-browser.cjs`: actual browser-storage draft reload, interrupted match with identical seed, single victory, replay/export/import, completed-history reload, even-round first claimant, exhausted-pool preservation and reset with no late timer victory.
- Live Chrome at localhost:4173: saved typed draft restored through Continue; claimed new identities alternately, reloaded/resumed a pending match, saw one final victory and factual recap, then replayed with score unchanged.
- Packaged `dist/TheCage-v0.4.exe` rebuilt with all new modules/styles and checked on isolated port 4174. Normal launcher/default port remains 4173. Earlier executables remain available as snapshots.

## Remaining work

Further football calibration is needed for defensive stalling, reference-matchup dominance and possession. Preserve these measured failures for Claude's independent review. No additional rating attributes were invented or silently substituted. Cross-device sync and online multiplayer are outside this sprint.
