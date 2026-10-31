# THE CAGE V5.6 Golden Goal: read-only audit

**Verdict: OK to ship on the isolated, versioned presentation branch. Not ready to become the production default.** I found no P0. There is one P1, a build-tool trap that is not active yet. I only read code: nothing was edited, built or committed, and I did not re-run the tests.

**Engine left alone (checked).** `git diff --stat` touches only viewer files and HTML script tags. `src/viewer/clock.js`, `src/replay/records.js` and the engine files are unchanged. The goal overlay never calls `simulate` and never writes to the match record.

## P1 (checked, not yet triggered)
- **`tools/sync-v53-game.py:9-11`** still has a hard-coded list of viewer scripts that leaves out `goal-experience.js` and `goal-audio.js`. If anyone runs it, it rewrites `play.html` without them. Then `viewer.js:60` throws "Golden Goal presentation dependencies missing" and no match viewer can open. The packaging script makes this likely: its failure message at `tools/package-v5-web.py:11` tells you to run that sync tool. Add both files to the list before merging.

## P2
- **Mobile overlay text is too small to read (checked).** On screens up to 650px wide, `viewer-v4.css:104,106,109,111` set some text to 5ΓÇô6px. That includes the WINNER // team name, the only place the overlay names the winning team.
- **Sound setting resets every round (checked).** `src/showdown-v5.js:16-27` closes the viewer and opens a new one each round, so `Audio.create()` (`viewer.js:86`) starts at Off again. This fails safe and the old audio is properly closed, but players have to switch sound back on every round.
- **Overlay may be read out twice by screen readers (my guess, not tested).** `viewer.js:94-95` fills the hidden status region and then shows it. The goal line in the commentary ticker (`viewer.js:56,120`) and the host's status line are also announced at about the same time. Some screen readers will read the goal twice; others may skip the overlay.

## P3 (checked unless noted)
- **Round number goes into the HTML without escaping:** `goal-experience.js:34` and `viewer.js:108`. It is safe today because every way a record gets in validates `round` as a whole number from 1 to 5 (`records.js` `validate`/`validateSave`, `showdown-v5.js:153,179`). Wrapping it in `escapeText` would protect against future changes.
- **Some seeks don't clear the overlay:** keyboard seeking (`viewer.js:169`) and `ctl.seek` (`:176`) leave the overlay state in place, unlike the slider (`:167`). Seeking back hides it correctly. Seeking forward again within 2.6s brings it back without a new goal event. Harmless.
- **The browser test's "seek hides overlay" step proves less than it says:** it runs after the 3.1s wait (`fixtures/v56-cinematic-browser.js:41-43`), when the timer has already hidden the overlay, so it never seeks while the overlay is showing.
- **Faint rings stay on the final frame:** the gold burst lasts 2.1s of match time (`fx.js:80,96`), but the match ends 1.6s after the goal (`timeline.js:14`). The last frame keeps a very faint copy (about 2ΓÇô5% opacity). The burst also sits mostly under the ~0.8ΓÇô0.9 opacity overlay.
- **Test housekeeping:** `tests/v56-cinematic-browser.cjs:5,9` writes an HTML file and Chrome profile folders into the repo root and uses a Windows-only Chrome path.
- **Version label mismatch:** the working-tree `sw.js` says V5.6 / `the-cage-full-v56-ΓÇª`, but `package-v5-web.py:31-32` would write V5.5 / `v55`. The cache key is a content hash, so caching still works; only the label is off.

## Checked and OK
- **Uses the real goal and score:** `goalData` (`goal-experience.js:7-15`) refuses any cue that doesn't match the recorded goal event or the timeline. The score shown comes from the timeline (`viewer.js:94`). "GOLDEN GOAL" appears only for knockout matches with exactly one goal (`timeline.js:147`).
- **No script injection through names:** team, scorer and assist names are escaped in both the overlay (`goal-experience.js:23-26`) and the goal card (`viewer.js:106-108`), and the unit tests try hostile names.
- **Audio:** nothing is created until the Sound button is clicked (`goal-audio.js:23-27`, `viewer.js:158`). It starts Off, plays only five generated tones, uses no files or network, and is closed when the viewer closes (`:41`, `viewer.js:178`).
- **Timing:**
  - A wall-clock timer hides the overlay (`viewer.js:97-102`), so it still clears if animation frames stall in a background tab.
  - The timer is cleared on restart, replay start, backward slider seeks and when the viewer closes.
  - Each frame waits at most 0.1s, so lag can't jump the animation forward.
- **No duplicate goals or wins:** a goal only fires when playback crosses the goal moment (`clock.js:27`). Replays don't fire `end` (`clock.js:28`), and the tests confirm a replay doesn't award a second win.
- **Reduced motion:** the overlay animations, the flash, the net wobble and the gold particles are all turned off (`viewer-v4.css` reduced-motion block, `fx.js:64,92`).
- **Overlay vs. controls:** the overlay has `pointer-events:none`, so the tap-to-pause area and the controls still work.
- **Packaging:** `play.html` and all 14 pages that load `viewer.js` include both new scripts in the right order. `package-v5-web.py` takes its file list from `play.html`, so both new files get shipped and cached.

**Before making this the production default:** fix the P1 and the mobile font sizes, and test with a screen reader.
