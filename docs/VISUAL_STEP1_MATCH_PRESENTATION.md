# Visual step 1 — match presentation, 2026-11-01

Implemented the first visual priority: a clear match screen and full-time result. Player/ball rendering and draft-card redesign remain the next visual steps.

- Recorded-goal celebrations expire after their short cue, at the next recorded kickoff, or at full time. The old permanent goal plaque stays hidden. Seeking/replaying retains recorded-goal safeguards.
- The primary draft match has one result panel below the unobstructed pitch, with a large final score, team names, current showdown score, round state and replay/next-round actions.
- Old setup/result controls, draft clock and duplicate squad panels are hidden while viewing a match. New Showdown remains available.
- IRON AI is named consistently in the viewer, commentary and result panel. The full-time viewer showdown tally is updated from the host's already-awarded wins; the viewer does not award results.
- Removed the misleading first-goal-as-winning-goal recap from the draft presentation.
- On small screens, the playback toolbar uses normal document flow so it does not cover the pitch. Live browser review at 390px: no horizontal overflow, responsive result card, clear pitch and static toolbar.

Changed source: `draft.html`, `src/random-draft.js`, `src/viewer-v4/viewer.js`, `src/viewer-v4/viewer-v4.css`. Updated browser fixtures: `tests/fixtures/v57-cinematic-browser.js`, `tests/fixtures/v64-solo-draft.js`. Generated public counterparts and the content-addressed service-worker cache were rebuilt. Engine, ratings and match rules are unchanged.

Verification passed:

- Solo browser test at all three difficulties: mandatory 3+1, CPU privacy, correct names, unobstructed full-time pitch, one result panel, correct full-time showdown tally, authenticated replay and no duplicate win.
- Cinematic browser test with normal and reduced motion: genuine goal cue, bounded expiry, clearance at resumed play/full time, seeking, optional sound, immutable record and replay without another win.
- Full viewer suite: static/timeline/clock and 120-match contract checks, 10,821 events.
- Five-round goalkeeper showdown and goalkeeper restore tests.
- Five-round solo showdown, 30 exhausted outfield players, saved mode/trophy restoration.
- Locomotion regression, 25-match viewing-timing check and source/public package parity.
- Live Chrome: a solo 3+1 match ended 3–8, recorded showdown 0–1; replay kept those results. Desktop and 390px screenshots saved in the chat outputs. No captured console errors.

Some initial test attempts used an incorrect copied-server root or missing base URL, and one cold-load browser fixture produced no controller; those attempts are not counted as passes. Re-running on the verified source preview origin completed the listed checks successfully.

Windows build: `dist/TheCage.exe`, rebuilt through `build-exe/build-main.ps1`. Actual executable responses for the four changed runtime assets matched tested `public/` files byte-for-byte after the final build. Previous executable preserved as `dist/TheCage-before-visual-step1.exe`. `PLAY THE CAGE.cmd` already targets `TheCage.exe`. Restart the app to load the new executable. No push or deployment.
