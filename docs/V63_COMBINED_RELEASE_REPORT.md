# THE CAGE V6.3 Combined Broadcast & Action Release

**Date:** 2026-10-31
**Integration branch:** `integration/v63-broadcast-action-release`
**Base:** `feature/v63-goal-broadcast` (e46e71f)
**Merged fixes:** `feature/v63-action-consistency` (712bd9c)

## What ships
- 194 formula-rated historical footballers and 15 cross-family tactical classes.
- V6.3 recorded-goal broadcast with original scorer and goal-side identity; never invents a goal.
- Consistent recorded action HUD: shot/miss, free-kick set-piece, contact, pass and carry. A wall pass is styled as a contact only if the authoritative segment contains a recorded challenge.
- Reduced-motion canvas guard and goal doors hidden entirely under reduced motion. Goal-side presentation metadata resets upon replay.
- 15-candidate random draft, five-round match, T3-6 authoritative tactical engine, Golden Goal, deterministic replays and preserved historical V5.6 Classic save player.
- Rebuilt 139-asset offline Windows bundle.

## Verification
- `tools/v63-combined-release-gate.ps1`: **24 automated test groups PASS** plus `tools/build-t3.cjs --check` (1,198,144 calibrated trios).
- `tests/v63-goal-browser.cjs`: record-backed goal reveal, score and scorer, seek safety, desktop/mobile/reduced motion, doors hidden with CSS.
- `tests/v63-action-consistency.cjs`: recorded contact classification, free-kick set-piece, reduced-motion canvas guard.
- `tests/viewer/run-all.cjs`: 120 simulated match telemetry/viewer contracts.
- Web package source/public parity and service worker revision verified.
- Single executable smoke test: **11/11 HTTP resources return 200**, covering draft, main game, historical Classic, T3 engine, goal presentation, action modules and offline cache.

## Windows artifact
- `dist/TheCage-V63-Goal-Action-Preview.exe` (110,254,080 bytes)
- SHA256: `3B1D20C8DF38EAA7C7ABACA88AB8030A62066EAEE34B4CBC541952CCD0CFFF9F`
- Local launch defaults to the draft route, usually `http://127.0.0.1:4184/draft.html`.
- Binary is unsigned. Injection reports a signature warning, but executable route checks pass.
- This candidate has not been merged into the original `A:\THE CAGE` workspace or deployed to production. It is intended for local review.

## Merge discipline
Source merge conflicts were confined to generated `sw.js` and `public/sw.js`; both were regenerated from combined assets, not selected from a stale branch. The two original feature branches and working trees were preserved. Independent post-merge Claude sign-off has not been performed.
