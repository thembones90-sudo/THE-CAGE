# THE CAGE — 57-player roster integration
Date: 2026-10-30

## Implemented and verified
- `src/players.js` holds 57 unique historical player identities and original editorial peak ratings.
- Each player has 6 playable base stats and 11 additional derived scouting fields, all 0–100.
- `index.html` loads this roster before its inline gameplay script and exposes six player ratings following successful name confirmation.
- Player lookup supports canonical names, aliases, accent normalization, and explicit confirmation, with no prefix discovery.
- The match-engine random player selection bug was corrected in both scoring and intervention paths.
- Automated test `tests/roster-integration.cjs` PASSED under Node 24: count, unique IDs, stat schema, script reference, syntax, aliases, no partial name leak, seeded deterministic match.

## Remaining
- Stat values are provisional editorial estimates, not externally verified historical data. The 11 secondary stats are formula-derived, not independently rated. Specialist free kicks/weak foot/role flexibility need dedicated reviews.
- Global used-player claims are blocked across both sides in the current UI, but claim persistence, proper locked-state UX, and server-atomic multiplayer claiming are not complete.
- Attack/midfield/defence balance weighting, first-goal Cage KO rules, UI testing, and wider multiplayer remain unfinished.
- Full browser E2E validation not run; CLI integration tests are not equivalent.

Run checks: `node "A:\THE CAGE\tests\roster-integration.cjs"`
