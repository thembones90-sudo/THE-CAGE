# THE CAGE — CLAUDE RESPONSE TO OWNER DECISIONS (30 OCT 2026)

From Claude to Codex and the owner. Scope: I reconciled CLAUDE_OWNER_DECISIONS.md against ENGINE_ARCHITECTURE_PROPOSAL.md (v2), CODEX_ENGINE_TASKS.md and the live build (`index.html`, `src/showdown.js`, `src/cage-engine.js`, `src/cage-commentary.js`, `tests/*`, `build-exe/`, `dist/`).
**I did not edit any source, test, build or deploy file.** Today, before writing this, `node tests/showdown-engine.cjs` and `node tests/roster-integration.cjs` both PASS.

Precedence: **owner decisions > this response > CODEX_ENGINE_TASKS.md > ENGINE_ARCHITECTURE_PROPOSAL.md**.

---

## 1. Superseded parts of my proposal

| Proposal item | Status now |
|---|---|
| §9.3(3) snake / blind-round draft | **Replaced.** Round-alternating first claimant (C starts rounds 1, 3, 5; O starts rounds 2, 4). Within a round, claims alternate C,O,C,O,C,O, or the reverse |
| §7.3 / T2.4 confirm-step undo | **Dropped.** No undo. A confirmed claim is exhausted for the whole showdown. Only "New showdown" clears the pool |
| §9.1 escalation (5:00 → 2v2, 8:00 → 1v1, 10:00 → cage runs), the +0.4/+0.8 escalation bonuses, the xG fallback | **Dropped.** 3v3 throughout. The first real goal wins. Nothing is forced by the clock |
| §9.1 optional best-of-3 | **Replaced** by best-of-5 only: first to 3 wins, new trios every round (18/24/30 distinct players) |
| §4.4 target table | Only Ballack/Maldini/R9 vs Okocha/Djalminha/Vidić at **55–65%** stays, as a *provisional calibration target*. The other rows become diagnostics, not gates. The rows for defensive trios relied on escalation "opening play", and that lever no longer exists (see §3) |
| §1.3 stamina consumer "2v2 withdrawal order" | Removed. Stamina's consumer is now fatigue decay in open-ended golden-goal play. That matters more now, not less |
| T6.3 pre-match card "win estimate hidden unless…" | **Never shown.** I also recommend leaving cover bars and the "key duel" off the card. They are an evaluation by another name. The card shows names, tactics and duties only |
| T3.8 `cageKO` escalation + xG fallback | Replaced by `cageKO` = pure golden goal plus a safety cap (see §3) |
| §11(6) headline product | Updated: exclusive alternating draft, best-of-5, 3v3 golden goal |

Unchanged: the event-log-as-truth architecture, the pure deterministic core, named-role events, commentary as a pure reader, the rating anchor rule, tactics as behaviour, and the file-ownership and collision rules. The 4 tactics (Balanced/Possession/High Press/Counterattack) already match the live UI. Lockdown and Street Flair stay deferred.

## 2. Live build vs. decisions: gaps found

| # | Finding (live code) | Decision | Severity |
|---|---|---|---|
| G1 | `showdown.js`: either side may claim at any time. There is no turn state, and the off-turn side can also *search/verify* | 1 | **Blocker** |
| G2 | Surname aliases are still single-target: `keane`→Roy, `toure`→Yaya, `ferdinand`→Rio, `alonso`→Xabi, `martins`→Obafemi. `ronaldo` is a hard-coded special case. **With no undo, a wrong alias now permanently burns a player.** The ambiguity table (T1.4) becomes an integrity task, not a P1 nicety | 1, 2 | **Blocker** |
| G3 | `cage-engine.js` still carries a dead `escalate:[300,480,600]` param, and `cage-commentary.js` still has a `decider_xg` case ("goes to the chances ledger"). Neither can fire today, but both contradict the rules and could come back. Delete both | 3 | High |
| G4 | The engine **throws** at 6,000 s without a goal. The UI then shows "Simulation failed" and the round can't progress without a full reset. Nobody has measured how often this happens (all-defender mirrors are the risk) | 3 | High, measure first |
| G5 | `seed = Date.now()` is neither recorded nor shown, so a disputed round can't be reproduced. Store `{round, seed, engineVersion, ids, tactics, winner}` per round in the snapshot now. It's cheap, and it is the base for later replays | 4, later replays | Medium |
| G6 | `index.html` and `showdown.html` are byte-identical copies. The tests read `showdown.html`; the exe bundles `index.html`. They will drift. Keep `index.html` canonical and have the tests read it (or generate the copy) | — | Medium |
| G7 | Playback length = `min(65, sim duration)` × pace factor. Normal comes out at ≈ 42 s for most matches, which is within the 30–45 s target. It reads the finished result and never feeds back ✔. Before narration, freeze the event array (`Object.freeze`) so the log is immutable by construction | Commentary lock | Low |
| G8 | `build-exe/` + `dist/TheCage.exe` (Node SEA, 11:16 today) exist, but HANDOFF_STATUS doesn't log them. The exe is a **snapshot**: it doesn't pick up later edits, and its asset list has to be kept in sync by hand | 8 | Coordination |
| G9 | The E2E fixture only proves the first-to-3 path. There is no 2–2 → round 5 path and no "no round 6" assertion | 4 | High (test gap) |

Compliant already: shared exhausted pool across rounds; reset clears it; no autocomplete/browse; four tactics; no win-probability display; round transitions keep the pool; 3v3 throughout; commentary generated after simulation.

## 3. The design consequence that needs attention: golden goal without escalation

My spike measured defensive trios reaching the old 10:00 decider in ~38% of matches. Escalation was the lever that opened those games. With escalation gone, the open questions are **long matches and termination**, not who wins. The response must stay inside the owner's rules: no forced goal, no artificial chances. Here it is, in this order:

1. **Measure first** (Claude, C2): the distribution of simulated match length (p50/p95/p99/max) and the rate of hitting the safety cap. Run it over seeded sweeps, including the worst cases: Maldini/Chiellini/Thuram vs Gravesen/Stam/Vidić, plus defensive mirrors.
2. **Legitimate football levers only**, if p99 is too long. Fatigue accumulates and degrades duels and decisions (stamina, work_rate). An out-of-position press costs a recovery run. Agility vs marking separates the escape from the read. Transitions after turnovers favour the side that wins the ball high. All of these are real mechanics with attribute consumers (decision 6), not clock rules.
3. **Safety cap policy.** Keep a cap as a *bug detector*, not a game rule. Gate: **0 cap hits across 10,000 seeds of the worst-case set**. If the gate is ever hit in play, show "match void, replay round with new seed" and log it. **Never award a winner.** Owner confirmation is needed only if the gate can't be met.

Balance (decision 5): first prove phase coverage with seeded sweeps on the **live engine as baseline**: attack/midfield/defence coverage vs win rate, the tactic 4×4 matrix, and press/marking/movement effects. Only then propose param or rating changes, with evidence. No star nerf until those sweeps show structure, not fame, explains the gap.

## 4. Agreed work order (Codex recommendation adopted)

**Integrity → measured balance → event-driven mini-pitch → roster expansion → saved history/replays.**

### Codex: Phase I (integrity). Start here
0. **T0.1 git init is approved** (local, no remote, no push). Do it *before any further edits*: `.gitignore` (`node_modules/`, `dist/`, `build-exe/sea-prep.blob`, scratch), then a baseline commit of the current tree exactly as-is. Log it in HANDOFF_STATUS.
1. **Pure draft reducer** `src/draft/claims.js` (T2.1 + T2.2, unblocked), used by `showdown.js`.
   - The state machine is `{round, turn, used, claimed, wins, history}`.
   - `firstClaimant(round) = round % 2 === 1 ? 'A' : 'B'`. The turn advances **only on a confirmed claim**. A failed lookup, ambiguity or already-claimed result keeps the turn.
   - Off-turn search and confirm are rejected by the reducer, not just disabled in the UI.
   - After 3+3 claims the trios auto-lock (the Lock buttons become optional).
   - A stale confirm button (opened before the opponent's claim, or before reset) must be rejected.
2. **Ambiguity resolver** (T1.4/T1.5) before more playtesting:
   - Multi-identity surnames → disambiguation showing only identities matching the typed text.
   - Non-rostered namesakes → "not in pilot roster", not claimable.
   - The confirm button keeps the full name + country. Without undo, that is the last safeguard.
3. **Remove** the escalation param and `decider_xg` (G3). Record the seed and engine version per round (G5). Unify the HTML (G6). Freeze the events before narration (G7).
4. **Integrity tests** (`node --test`):
   - turn order for all 5 rounds, including a 2–2 → round 5 win;
   - no round 6;
   - 18/24/30 distinct ids;
   - claim exclusivity, with conflicting claims applied in both orders;
   - every alias in the ambiguity table;
   - reset mid-playback (the interval is cleared, there is no late `endRound`, and the pool is empty);
   - score = goal events in the log; the winner is the team of the single goal event, which is the last event;
   - commentary names ⊆ roles of the source event (T4.4, release blocker).
5. **Launcher (decision 8):** `tools/serve.mjs` (zero-dep, localhost) + `Start-TheCage.cmd` (runs node, opens the browser) is the **primary dev path**, because it serves live files. Keep `TheCage.exe` as an optional snapshot distributable. Rebuild it only at owner request, and keep the `launcher.js` ASSETS list in sync with `sea-config.json`.

### Claude (Claude-owned files only, no live-source edits)
- **C2 `tools/balance.mjs` + `tests/balance/`** against the live `CageEngine.simulate`: match-length/cap-hit report (§3), phase-coverage sweep, tactic 4×4, attribute-influence check. Output to `BALANCE_REPORT.md`, with proposed deltas only.
- **C1 `proposals/ratings-v1.json` + `DATA_REVIEW.md`:**
  - independent ratings for work_rate, stamina, composure, agility and marking for all 57 players, with a rationale per value;
  - the 6 base values (and all 17 stored fields) stay byte-identical;
  - each attribute names its simulation consumer and a test that fails if the consumer is removed.
- **C3 commentary banks:** original lines in an expressive, football-literate broadcast register (Drury as a *benchmark of ambition*, no recognisable lines). Every template slot comes from event roles. There is no template for anything the log can't prove.
- **C4:** a review gate after Codex Phase I, with findings in CLAUDE_REVIEW.md.

### Later (no work now)
- Event-driven six-player mini-pitch: it renders `cell`/zone from events only and imports nothing from the engine.
- A post-goal "decisive sequence": the possession chain from the log, with event indices.
- Roster growth (cult favourites, defensive specialists) through the rating pipeline, still with no browser and no spoilers.
- Saved history and reproducible replays `{ids, tactics, seed, engineVersion, paramsVersion, rosterVersion}`.

## 5. Coordination rules (no silent collisions)

- **File ownership:**
  - Codex owns `index.html`, `src/*.js` (live engine, showdown, commentary mechanics), `src/draft|identity|engine/**`, `tests/` (except `tests/balance/`), `tools/serve.mjs`, the launcher and `build-exe/`.
  - Claude owns `tools/balance.mjs`, `tests/balance/**`, `proposals/ratings-*.json`, `DATA_REVIEW.md`, `BALANCE_REPORT.md`, commentary template content, and CLAUDE_* docs.
- Before editing a file, check its mtime against your last read. After each task, append one dated line to HANDOFF_STATUS.md naming the files touched (and the commit hash once git exists).
- Changes to the API Claude codes against (`simulate({teams, tactics, seed, mode}) → {events, score, winner, duration, draws, shapes}`) get flagged in HANDOFF_STATUS **before** merging.
- The modular v3 engine (`src/engine/**`) is still the target. It's built beside the live engine and switched on behind `?engine=v3` only after the integrity and balance gates. The live engine is the baseline until the owner approves the swap.
- No deploy, no push, no remote.

## 6. Owner questions remaining (only these)
1. If the 0-cap-hit gate (§3) can't be met with football levers alone, is "void and replay with new seed" acceptable?
2. Should the six base ratings stay visible after a claim (as now)? They are not a win estimate, but they do inform assessment. Claude's default: keep.
