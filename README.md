# THE CAGE V5.7 Combined Preview

This worktree contains the integrated 194-player T3 game and the V5.6 Golden Goal cinematic. Start the offline Windows preview at `dist/TheCage-V57-Combined-Preview.exe` or serve this directory locally.

- Main game: `/play.html` (T3-6 default)
- Random Draft: `/draft.html`
- Historical V5.6 Classic saves: `/classic-v56/play.html` (182-player archived engine)
- Explicit current-roster legacy mode: `/play.html?engine=legacy`

Read `V57_COMBINED_RELEASE_REPORT.md` for the verification log, preservation of old saves, and distribution notes.

---

## Historical project documentation (v0.4 and earlier)

# THE CAGE — v0.4

Canonical project: `A:\THE CAGE`. The current playable source is `index.html`; earlier prototypes remain as references.

Run `Start-TheCage.cmd`, then play at `http://127.0.0.1:4173/`. Use this same browser/address to continue an automatically saved showdown. Confirmed players stay exhausted for the whole showdown; claims alternate; the first claimant alternates each round. No undo.

Completed rounds have Replay and Export replay controls. Load a JSON replay file in Showdown history to verify/replay it without changing wins or claims. Interrupted matches resume with their original seed. This is local browser persistence, not account sync.

See `SPRINT_V04_REPORT.md` for implementation, exact checks and unresolved balance findings; `ROSTER_EXPANSION_V04.md` for identity sources and editorial methodology. The defensive safety-cap and provisional matchup-balance gates still need work.

Primary development path: `node tools/serve.mjs`. EXE snapshots do not pick up later source edits; the current lookup-fix package is `dist/TheCage-v0.4.1.exe` and also defaults to port 4173.

Name lookup: type a remembered surname, exact nickname or at least four letters, then press Enter/Search to see matching full identities. Confirm the intended player to claim him. No suggestions appear before submission.

T3 tactical preview: `http://127.0.0.1:4173/?engine=t3`. It is gated for evaluation, with a separate preview save. The default game retains the archived v0.4 engine until the tactical acceptance gates pass. Rebuild the generated candidate after module changes with `node tools/build-t3.cjs`; verify with `--check`. See `CODEX_T3_IMPLEMENTATION_REPORT.md` for measured findings and readiness.
