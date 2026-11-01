# Goal/net visual refinement — 2026-11-01

Owner correction: removed the tapered basket shape, metallic rails and mounting brackets. Goals now use straight rectangular geometry, shallow 52-unit net depth, square mesh and slim white posts. Mesh density is reduced on smaller canvases. Both goals use mirrored geometry, with the same recorded scoring planes as before. The updated geometry test explicitly rejects tapered sides.

Only the interior ropes deform on an authoritative recorded goal cue. Attachments/posts stay fixed; before the goal and after the brief damped ripple, the mesh is at rest. Reduced-motion mode uses a static net. The exact visual contact height remains inferred, as before. Goal scoring planes, pitch coordinates, players, rules, result hashes and replay data are unchanged.

Implementation:

- `src/viewer-v4/fx.js`: pure `netMesh` geometry and revised `paintNet` styling, using existing event-driven net response.
- `src/viewer-v4/renderer.js`: paints goals even without an effects list, passes display scale and team accents.
- `design/qwen-30b/arena/arena.svg` and `arena-golden.svg`: removed old baked-in goal/chain groups to prevent double frames. The live canvas now draws the complete goals over the base arena artwork; the rest of the arena is unchanged.
- `tests/goal-net-design.cjs`: mirrored geometry, fixed scoring planes and attachment points, correct-side reaction only, deterministic seeking, settled/reduced-motion geometry, simpler small-screen weave, record integrity.
- Updated existing replay test for the renderer's added display options. Regenerated public counterparts and the content-addressed offline cache.

Checks passed: new goal-net test; ten existing goal/event/replay integration checks; crowded-player readability checks; full viewer suite (120 matches, 10,821 events); solo browser/replay checks at all three difficulties; source/public parity. Both SVGs parse as valid XML. Real Chrome review on desktop and at 390px found no horizontal overflow and no captured console errors on the normal app route.

`dist/TheCage.exe` rebuilt. Actual executable responses for FX, renderer and both arena SVGs match the tested public files byte-for-byte. Previous executable preserved as `dist/TheCage-before-goal-net.exe`. Restart `PLAY THE CAGE` to load it. Fresh visual review: `http://127.0.0.1:51927/draft.html`.

Screenshots saved to the chat outputs: `cage-goal-net-desktop.png`, `cage-goal-net-mobile.png`. No engine/rating changes, push or deployment.
