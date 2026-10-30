# THE CAGE — v0.4

Canonical project: `A:\THE CAGE`. The current playable source is `index.html`; earlier prototypes remain as references.

Run `Start-TheCage.cmd`, then play at `http://127.0.0.1:4173/`. Use this same browser/address to continue an automatically saved showdown. Confirmed players stay exhausted for the whole showdown; claims alternate; the first claimant alternates each round. No undo.

Completed rounds have Replay and Export replay controls. Load a JSON replay file in Showdown history to verify/replay it without changing wins or claims. Interrupted matches resume with their original seed. This is local browser persistence, not account sync.

See `SPRINT_V04_REPORT.md` for implementation, exact checks and unresolved balance findings; `ROSTER_EXPANSION_V04.md` for identity sources and editorial methodology. The defensive safety-cap and provisional matchup-balance gates still need work.

Primary development path: `node tools/serve.mjs`. EXE snapshots do not pick up later source edits; the v0.4 package is `dist/TheCage-v0.4.exe` and also defaults to port 4173.
