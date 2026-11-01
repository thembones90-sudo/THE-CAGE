# THE CAGE — Random Draft V1 implementation (2026-10-31)

Playable local hotseat route: `draft.html`. Existing `index.html` memory-recall game is intentionally preserved.

## Owner-locked rules implemented
- Fair secure random coin toss picks first side (A or B), then fixed alternating A/B/A/B/A/B relative to toss winner.
- Six turns; three selections per team; each turn draws 15 distinct uniformly randomly sampled unclaimed players, without weighting or tier guarantees.
- Exclusive global claims; opponent never sees candidates during the local handoff screen, only committed picks.
- Each active pool lasts 20 seconds; expired picks automatically choose a uniformly random card from current pool; clock starts on reveal (not handoff) and does not reset on reroll.
- Each side can reroll once per three-pick draft; re-roll excludes the previous 15 candidates when enough candidates remain.
- Card exposes country, role, tier, ratings, traits and available metadata; no forced formations.
- Optional opponent trait counterplay guidance sourced from the project's existing CageTraits.COUNTERPLAY; OFF by default.
- Three-player teams connect to the T3 cage-t3-3 match engine, with tactics and match result. The T3 build is isolated as `src/cage-engine-draft.js`, copied from the committed working source to avoid overwriting unrelated uncommitted engine files.
- No remote/network multiplayer or truly private server-side pools: this is a local hotseat prototype. Browser developer tools can inspect local state.

## Testing
`node tests/random-draft.cjs`
Headless Chrome end-to-end checks: roster load, expected T3 version, default OFF setting, first-side coin result, all six turns, unique 15 per pick, global no mirrors, both sides' rerolls, no pool overlap for reroll, opponent trait hints when enabled, 3v3 T3 simulation, and simulated timer expiration auto-pick.

## Known workspace issues unrelated to new mode
Pre-existing uncommitted `src/cage-engine.js` and `src/cage-commentary.js` edits cause old tests to throw duplicate lexical declarations. They were deliberately not modified. Legacy mode may be affected until independently resolved.
The supplied test is an integration smoke/regression, not a production-grade remote multiplayer security test.
