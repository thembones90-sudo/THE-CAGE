# THE CAGE V5.4.1 — Tactical Reckoning / Trait Integrity

**Date:** October 31, 2026
**Branch:** `feature/v54-qwen-tactical-balance`
**Candidate engine:** `cage-t3-5` with `t3-space-4` parameters.
**Default engine:** `cage-0.4.0` (unchanged).
**Status:** Tested, isolated development release candidate. Not merged into production. T3 remains opt-in and has NOT received unrestricted competitive balance approval.

## Delivered

### Tactical balance
A genuinely seeded 182-player T3 trial compared shot parameters `q=11 / reference=75` against `q=15 / reference=68`. Every successful knockout game ends at one actual recorded goal. No timeout goals, mercy wins, opponent nerfs or random re-rolls were added.

- First 10-matchup scenario matrix: **2,800 identical-seed games each version**, 37 old safety limits vs 4 new. Defender-only caps 13.21% -> 1.43%; new p95 4,032 simulated seconds vs old 5,176. Maximum non-defender win-rate shift 10.7 percentage points, still meaningful and not universal balance proof.
- Additional exact paired defender-only stress: **5,000 games per configuration**, old 764/5,000 safety limits (15.28%) vs new 71/5,000 (1.42%). Old p95 5,287 seconds, new p95 4,035 seconds. Kickoff winner 48.9% in both. **71 unsolved timeouts remain and are counted as failures.**
- Tactics produce meaningfully different decisions: 100 seed sets, four tactics, 400 real matches, all 100 seed sets yielded at least three distinct event histories; possession and pressing rates differ.
- The existing Classic engine simulation output is byte-identical to the clean V5.3 baseline on **150 complete deterministic match-result SHA256 hashes**.

### The 182-player / 15-class rule
- Exactly one primary and one secondary trait from **different families** for every 182-player record, as previously approved.
- The 110 same-family secondary assignments corrected in `src/roster-trait-family-v16.js`; the original primary classes and core ratings are preserved.
- Approved class label **Hunter** replaces the obsolete runtime alias Tracker, with 15 canonical classes.
- All 15 primary classes have observable decision/engagement effects.
- All **15 secondary classes** separately produce measurable half-strength effects when tested against the same player without its secondary; 8,992 meaningful state comparisons in the source QA run.
- Experimental trait mode is opt-in via `?engine=t3&traits=preview`, reflected in the exact saved simulation config and replay. In 75 fixed seeded trait scenarios, 73 produced an altered authentic recorded event history; every repeated scenario was deterministic.
- The 110 revised *individual* secondary choices remain football editorial proposals, rather than independently owner-reviewed personality judgments. The structural rule is enforced and tested. Engine secondary distribution is uneven; it is a future balance question.

### Optional counter indicators
- A visible **Counter indicators (optional, OFF by default)** switch is installed in the full-game draft.
- OFF hides every optional matchup hint. ON presents general per-class counterplay only on already-claimed players.
- Preference is included in the saved session, type-checked, restores on resume and resets to OFF for each new showdown.
- No scoring, simulation input, random seed, actual counter mechanic or player classification is modified by the switch.
- Dedicated real-Chrome ON/OFF/reset behavior passed.

### Classic compatibility and saved-match security
Claude found one P1 during independent review: the roster's 118 edited/renamed identities made legitimate V5.3 Classic replay fingerprints fail. **Fixed and independently re-audited.**

- Historic `trait-v15-classic-compat.json` snapshot captures all **182 exact V5.3 traits**. `CageRecords` now allows the *current* fingerprint or that one exact previous fingerprint **only for Classic v0.4**.
- The engine still re-simulates the whole match and demands byte-identical recorded event/result history before allowing it to count.
- Original real V5.3 **three-round, 2–1 Classic saved showdown** successfully restored in a V5.4.1 Chrome session without changing any result or re-rolling a seed.
- The 150 full-result Classic parity hashes remain identical.
- 31 malformed historic records/saves were rejected while genuine historical records remained playable.
- Old experimental `cage-t3-3` and `cage-t3-4` matches are **not silently replayed under v5 engine**, and are protected/exportable on attempted resume. Historic T3 replays would need retained exact old engines to play; this was not implemented.
- Future roster/trait updates must add a new versioned historic snapshot or explicitly accept fail-closed incompatibility. See `docs/CLASSIC_REPLAY_COMPAT_POLICY.md`.

### Full-game, viewer and packaging QA
- Browser full **five-round / 30 unique draft picks / five real simulation outcomes** passed separately for Classic, T3 and T3+15-class mode. Replaying rounds never awards a second victory.
- Safe interrupted recovery, invalid previous T3 save rejection, normal-speed real match pause/seek, exact full-time visible scoreboard, 182-player recruitment and UI regression all passed.
- **120 real T3 match viewer tests**, 9,820 recorded events, 734,879 sampled points, zero positional C1/C3 violations.
- Web package has **48 bundled static assets**, content-addressed service-worker cache, including `roster-trait-family-v16.js`, generated T3 engine and optional UI.
- Windows **unsigned** single-executable build produced and inspected, with HTTP 200 smoke test for the bundled landing page, playable HTML, new roster, T3-v5, Classic compat, CSS and service worker.
  - Local EXE: `A:\CAGE_V54_TACTICAL\dist\TheCage-V541-TraitIntegrity-Preview.exe`
  - Local ZIP: `A:\CAGE_V54_TACTICAL\dist\TheCage-V541-TraitIntegrity-Preview.zip`
  - EXE length: 95,141,376 bytes, ZIP 34,716,697 bytes.
  - EXE SHA256: `434DD028DB4C7C91D74454CBDDAC45928E54729685F0DABC0CC84D2793663323`
  - These binaries are **local on SKYNET**, not GitHub downloads or signed installers.

## Qwen and Claude audit accountability
- Qwen3-Coder 30B audited structural engine risks, finishing-curve parameter candidates, class assignments and post-fix integrity. Its attempted initial 110 cross-family mappings largely failed the explicit hard constraint; they were **not incorporated**. A separate set of 110 manual editorial replacements was structurally tested. Qwen later found no severe plausibility issue in its inspected excerpt.
- Qwen's final *NO-GO* cited a `save_validator.c` module which **does not exist in this JavaScript project**. That particular alleged high-confidence bug was not supported by the source; we added direct malformed-record tests anyway.
- Claude performed read-only independent code review, found the genuine Classic replay compatibility P1, and after correction re-audited the exact old traits, old 182-player fingerprints, 3-round fixture, and half-strength secondary effects. Claude's final verdict: previous P1 resolved, **no additional P0/P1**, GO for isolated candidate only, with remaining risks documented.

## Play on SKYNET

Serve the checked-out worktree if the local test server is not already running:

```powershell
cd "A:\CAGE_V54_TACTICAL"
python -m http.server 51864 --bind 127.0.0.1
```

- Classic (default): `http://127.0.0.1:51864/play.html`
- Experimental T3: `http://127.0.0.1:51864/play.html?engine=t3`
- Experimental T3 and classes: `http://127.0.0.1:51864/play.html?engine=t3&traits=preview`
- Windows EXE defaults to localhost port `4184`, serving the full offline playable game.

## Explicit remaining non-blocking / approval risks

1. T3 still has measured safety-limit failures in extreme all-defender lineups, at about 1.4% in the large test cohort, and matchup win rates still move by up to 10.7 percentage points with the finishing change. **T3 must stay optional pending competitive owner approval.**
2. Original V5.3 Classic saved matches on the 182 roster are supported. Arbitrary much older Classic snapshots and older T3 simulations are not guaranteed and must fail closed with export rather than forged event histories.
3. 110 individual trait secondaries are provisional player-editorial decisions, even though the cross-family structural rule is verified. Different-class family coverage is uneven.
4. Windows signing, native mobile touch QA and a production merge/deployment remain uncompleted. The EXE is unsigned and was tested by local HTTP smoke.
5. Main `A:\THE CAGE` has separate uncommitted owner work. Nothing in that worktree was modified or discarded.

**Candidate status:** Technical implementation, tests, offline package and source branch are finished. Production/default T3 promotion is withheld intentionally until remaining competitive and owner-facing gates are approved.
