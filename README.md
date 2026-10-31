# THE CAGE V6.6: THE LAST LINE (EXPERIMENTAL)

This branch is an EARLY DEVELOPMENT PREVIEW of goalkeeper drafting and T3-7. It is not a final calibrated release and goalkeeper career tiers/ratings are provisional.

- Keep the classic six outfield picks ABABAB and 194 outfield players.
- Tick **Experimental 3+1 goalkeeper mode** on the 15-card random draft intro.
- After the sixth outfield pick, choose one goalkeeper from five private candidates per side. The goalkeeper choice lasts 10 seconds with no reroll. Each goalkeeper may only play once per showdown.
- The new GK engine logs authentic saves and parries and preserves full regulation + Golden Goal ONLY if tied.
- Solo IRON AI chooses from its own five-card pool.
- Historical T3-6/Classic match records and ordinary non-GK draft remain available.

The V6.6 pilot EXE is at `dist/TheCage-V66-Last-Line-Experimental.exe`.
Current limitations: manual audit still required for goalkeeper tiers, possession/press calibration, GK distribution/sweeping gameplay, and a safe overtime failure fallback. Do not deploy publicly.

---

# THE CAGE V6.5 War Room + Regulation Scoring

V6.5 uses full regulation goals: outscore the opponent at full time to win. If the score is tied, Golden Goal sudden-death overtime determines the victor. The 194-player T3-6 engine supports historical first-goal replays separately.

The 15-player random draft includes THE WAR ROOM for two-card, 17-stat comparisons without spending picks, and IRON AI 2.0 for fair, improved offline solo play.

Run `dist/TheCage-V65-WarRoom-Regulation-Preview.exe`. Default route: `/draft.html`; solo mode selection is on the intro screen. Historic V5.6 Classic replay: `/classic-v56/play.html`.

See `docs/V65_WAR_ROOM_RELEASE_REPORT.md` and the V6.5 balance/CPU benchmarking JSON files for the full research and tests.

---

# THE CAGE V6.4 IRON INTELLIGENCE

V6.4 adds fair offline solo drafting against IRON AI in three difficulties (Casual, Competitive and Ruthless), while preserving two-player hotseat and the existing 194-player T3-6 engine. The CPU receives only its fifteen candidates and revealed opponent choices. It cannot read future pools, modify cards or rig match outcomes.

Run `dist/TheCage-V64-Iron-Intelligence-Preview.exe`, which opens the 15-candidate draft at `/draft.html`. Select **Solo vs IRON AI** before the coin toss. The CPU drafts three cards and locks a tactical plan. Historic saved hotseat games continue under the same key.

See `docs/V64_IRON_RELEASE_REPORT.md` and `docs/V64_BALANCE_AUDIT.json` for acceptance checks and the initial competitive balance research.

---

# THE CAGE V6.3 Goal & Action Preview

V6.3 combines the recorded-goal broadcast with V6.2's 194-player T3 game, cinematic, 15-card random draft and accessibility refinements. The goal presentation and action styles read recorded events only. Reduced motion hides decorative goal doors.

Run `dist/TheCage-V63-Goal-Action-Preview.exe` locally. Main game: `/play.html`; draft: `/draft.html`; preserved historical Classic: `/classic-v56/play.html`.

For verification and branch details, read `docs/V63_COMBINED_RELEASE_REPORT.md`.

---

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
