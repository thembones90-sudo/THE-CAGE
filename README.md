# THE CAGE

Canonical local project directory: `A:\THE CAGE`

## Prototype transfer

The v0.1 playable prototype is available as `MIDFIELD_WARS_PROTOTYPE.zip` in the ChatGPT conversation. Extract the archive here so this directory contains:

- `index.html`: playable 3v3 football game prototype
- `CODEX_CLAUDE_HANDOFF.md`: shared development specification for Codex and Claude

Both agents should use this directory as the source of truth after extraction. The folder was created remotely, but the two prototype source files must still be copied here. Do not claim the prototype was installed until both files are present.
# Current playable version: v0.4

Run `Start-TheCage.cmd`, then play at `http://127.0.0.1:4173/`. Use this same browser/address to continue an automatically saved showdown. Confirmed players stay exhausted for the whole showdown; claims alternate; the first claimant alternates each round. No undo.

Completed rounds have Replay and Export replay controls. Load a JSON replay file in Showdown history to verify/replay it without changing wins or claims. Interrupted matches resume with their original seed. This is local browser persistence, not account sync.

See `SPRINT_V04_REPORT.md` for implementation, exact checks and unresolved balance findings; `ROSTER_EXPANSION_V04.md` for identity sources and editorial methodology. The defensive safety-cap and provisional matchup-balance gates still need work.

Primary development path: `node tools/serve.mjs`. EXE snapshots do not pick up later source edits; the v0.4 package is `dist/TheCage-v0.4.exe` and also defaults to port 4173.

