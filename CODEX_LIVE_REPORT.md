# THE CAGE — Codex live review report

## UI fixes following live-site playtest

The later hands-on browser test found defects missed by the original checks below: final statistics spoiled the result during playback, search confirmation stayed valid after input edits, and live controls/banner did not reflect the match state. These have now been fixed.

- Reports appear only after playback ends. Commentary and pitch playback use simulation timestamps; only a real goal event receives goal highlighting.
- Editing clears search confirmation; claiming rechecks the submitted text and shared used pool. Unavailable names are blocked at search as well as confirmation. Confirmed fields retain canonical names.
- Tactics freeze when a trio locks; playback pace freezes while playing. The arena displays a live 0–0 state and updates at the actual goal.
- Draft entries use compact rows and confirmed player tiles. During matches, draft details collapse and the match section receives focus by scrolling. The showdown header remains sticky.
- Added a six-player zone diagram. Player/ball movement follows recorded event zones, with all six identities retained. This is an event diagram, not continuous physical tracking; no engine outcomes or ratings changed.

Verification: `node tests/roster-integration.cjs` and `node tests/showdown-engine.cjs` passed. `node tests/ui-regression.cjs` passed headless Chrome tests covering stale confirmation, canonical names, blocked claims, spoiler-free timed playback, six pitch players, five rounds ending 3–2, 30 exhausted claims, blocked sixth round, and reset. The five-round UI fixture selects real seeded engine results for a specified winner sequence; it does not establish balance calibration.

Rebuilt `dist/TheCage-updated.exe` with the new stylesheet included. Opened its local server at `http://127.0.0.1:64908/`, verified searches, claims, locks, live report withholding, diagram rendering and reset; no captured browser warnings/errors. At 390px viewport the draft uses a single column with no horizontal overflow. Left the updated game open with blank slots. The original executable and previously running server remain unchanged. Source backups are in `backups/ui-playtest/`.

Date: 2026-10-30
Workspace: `A:\THE CAGE`

## Result

The current implementation passed the requested review checks. I did not overwrite the existing playable build or make unrelated changes.

## Checks run

1. `node tests/roster-integration.cjs`
   - PASS: 57 unique player records, 17 stats each, script integration, search, and deterministic match.
2. `node tests/showdown-engine.cjs`
   - PASS: 100 seeded simulations, deterministic commentary, 57-player roster, showdown syntax and script references.
3. `node --check src/cage-engine.js`, `src/cage-commentary.js`, `src/showdown.js`
   - PASS.
4. Headless Chrome with virtual time against `showdown-e2e.html`
   - PASS: `E2E_PASS`.
   - First-to-three completed in three rounds, with 18 unique claims retained in the exhausted used pool.
   - Both trios locked, each round finished, and no playback-transition failure occurred.

## Audited invariants

- Player claims are stored in a shared `used` map and rejected for the entire showdown.
- The UI requires explicit search and explicit claim confirmation; there is no roster gallery or autocomplete.
- `Ronaldo` is rejected as ambiguous; `R9` and full canonical aliases resolve through the verified roster.
- Golden-goal simulation ends on a real goal event; the engine has a safety limit rather than an xG-based winner fallback.
- Commentary is generated after simulation from event data and does not select the winner or alter the result.
- Playback duration is derived from the simulation duration and pace mode; it does not affect engine execution.
- Round transitions preserve the used pool and reset only the current round’s claimed slots.

## Remaining limitations

- The existing browser fixture demonstrates first-to-three, not an exhaustive five-round tie path. Engine and state logic support a maximum of five rounds, but a dedicated scripted 2–2 UI fixture would improve coverage.
- Balance is editorial and not calibrated against a large matchup matrix.
- The current roster is a verified fixture set, not a complete football database.
- No multiplayer, persistence, deployment, or licensing work was performed.

## Recommendation

Keep the current build as the reviewed baseline. The next highest-value test is a forced 2–2 showdown followed by a fifth-round win, plus a browser assertion that a sixth round cannot be opened.
