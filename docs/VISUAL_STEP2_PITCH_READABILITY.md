# Visual step 2 — pitch readability, 2026-11-01

Implemented the second visual priority. Draft-card layout remains step 3.

- Cyan circles and pink rounded squares distinguish teams by shape as well as colour. Team-prefixed numbers A1–A3 and B1–B3 remain readable on small markers.
- Possession uses a static gold-and-white double ring around the sampled owner. It does not claim possession during an unowned ball flight.
- A smaller white football replaces the oversized gold relic. When an owned ball coincides with the player's centre, a small display-only foot offset preserves number visibility. No recorded ball/player coordinate is modified; the viewer notes disclose this styling.
- Both goalkeepers have dark shield markers, team-colour outlines, GK lettering and named labels. Canvas accessibility text includes their full names.
- All eight nameplates use collision-aware placement, extra candidate rows, bounded fallback slots and connector lines for displaced labels. A compact legend explains the marker types.
- The kickoff/event banner is a small corner badge rather than a large title over player names.

Source changes: `src/viewer-v4/renderer.js`, `label-layout.js`, `viewer.js`, `viewer-v4.css`. Public copies and the service-worker fingerprint were regenerated. The historical ball expectation in `tests/viewer-v4/replay.test.cjs` now checks the current white-football renderer. New `tests/visual-readability.cjs` covers crowded layouts and rendering identity/immutability.

Verification:

- `tests/visual-readability.cjs`: eight coincident nameplates at bounds widths 260, 420 and 960, zero nameplate overlap; all eight labels and six team-number marks drawn at two canvas widths, normal and reduced motion; frozen input unchanged.
- `tests/viewer-v51/labels.test.cjs`: 351 sampled frames, zero label/label overlap in that fixture versus naive overlap area 217,951.3. This is measured fixture coverage, not a guarantee for every possible frame.
- `tests/viewer-v4/replay.test.cjs`: all ten event/score/replay/geometry integration checks pass.
- Full viewer suite: static, timeline, clock and 120-match contract checks pass, covering 10,821 events.
- Solo browser checks pass at all three difficulties, including clear full-time pitch, current team names, immutable replay and no duplicate win.
- Locomotion guard: 1,506 deterministic poses pass. Source/public package parity passes.
- Real Chrome review on desktop and at 390px: visible team shapes, all eight nameplates, named goalkeeper shields, visible owned-ball ring, small football and compact kickoff badge; no horizontal overflow in the reviewed phone layout. An earlier preview origin retained the old canvas renderer in its offline cache, so the final review used a fresh origin with genuine matches generated through the existing draft/replay acceptance fixture, then opened the normal app route. Screenshots are in the chat outputs.
- `dist/TheCage.exe` rebuilt through `build-exe/build-main.ps1`. Its actual responses for the renderer, nameplate solver, viewer and stylesheet matched the tested public files byte-for-byte. Previous executable retained as `dist/TheCage-before-visual-step2.exe`.

The engine, ratings, player positions, match scoring and replay rules were not changed. No push or deployment. Current preview: `http://localhost:51926/draft.html`. Restart `PLAY THE CAGE` to use the rebuilt Windows app.
