# THE CAGE NEW RANDOM DRAFT IMPLEMENTATION — OWNER LOCK 2026-10-31

Implement a COMPLETE PLAYABLE random-pool draft mode integrated with the existing game engine, without touching unrelated dirty files (src/cage-engine.js, src/cage-commentary.js, src/tactics/calibration.json, viewer work). Do NOT alter existing index.html/showdown legacy mode; add draft.html and src/random-draft.js and tests/random-draft.cjs, optional CSS. This new mode supersedes EXCLUSIVE_DRAFT_RULES.md for this particular draft mode; old memory-recall mode stays separate.

REQUIRED:
1. Initial fair 50/50 coin toss determines Player A or B who drafts FIRST. Order thereafter fixed ABABAB relative to winner (if B wins B A B A B A), exactly 3 distinct picks per side.
2. On EACH pick, current side privately gets 15 DISTINCT UNBIASED randomly chosen roster players (pure uniformly sampled player IDs, no tier weighting, no guaranteed composition, no guaranteed legends). Exclude ALL globally claimed player IDs (no mirror). Players must have exactly one chance to pick any candidate from pool.
3. 20-second visible countdown per pick, random uniform auto-pick among current pool when expires. Clock must restart each *new* pick, not on reroll. Timer robust to tab lag using Date.now/performance timestamps.
4. Each player gets exactly ONE reroll total across their three picks, regenerates all 15 cards, consumes no more than remaining time. A single reroll must NEVER repeat current displayed candidates if enough roster size exists (exclude old 15 for reroll draw), does not claim any old cards. Disable reroll after consumption. 
5. Opponent sees only committed picks, NEVER other side's selection pool. This is local hotseat prototype: implement explicit privacy/handoff screen between turns ("pass device") so previous pick/pool isn't shown automatically to the next player. Do not pretend this is remote multiplayer/server-authoritative; document multiplayer limitations.
6. No forced positions. Scouts can inspect name, nationality, position, career tier, full available ratings, archetype/class, special traits, strengths and weaknesses if supported by roster; do not invent values. No counter advice by default. Optional counter hints mode in pre-draft settings (OFF default) only if actual grounded counter data exists; don't fabricate matchups. Else clearly state hints are not supported yet, and no bogus classifications.
7. Visible persistent confirmed picks on each side. No guarantees of star distribution.
8. Draft complete: both 3-player squads feed into EXISTING window.CageEngine.simulate, with selectable tactics, show match winner and simple match stats. Load correct roster scripts matching index.html, plus cage-engine.js and dependencies, ensure engines work.
9. Separate pure draft logic module testable in Node, tests cover coin toss fairness by deterministic injection, ABABAB, uniqueness, unbiased 15, reroll once per side, timeout auto selection, full 6 picks, integration with engine if possible. Run node tests and syntax checks.
10. Continue to preserve pre-existing dirty files. Commit ONLY new files you own if appropriate; don't modify other work in progress.
Use Readme link to draft mode only if safe; otherwise leave direct file path. Report actual test outputs honestly.

You have authority to implement and test. Do not ask questions. Work through completion.