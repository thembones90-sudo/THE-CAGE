# CODEX — ENGINE TASKS (from ENGINE_ARCHITECTURE_PROPOSAL.md v2)

Prepared by Claude, 2026-10-30.

**Read first:** EXCLUSIVE_DRAFT_RULES.md, then ENGINE_ARCHITECTURE_PROPOSAL.md (§ references below point there).

**Rules for every task:**
- Pure core: no DOM, `window`, `Math.random`, `Date` or `Math.exp/pow/log` in `src/engine|draft|identity|analysis|commentary`.
- Tests use `node --test`. No new dependencies without owner approval.
- No deploy, no push.
- Append one dated line to HANDOFF_STATUS.md per finished task, naming the files touched.
- `proposals/engine-spike/` is reference for intent only. Don't import it, and don't copy its listed shortcuts.

**Blocked on owner decisions** (§9.3): T2.2 (turn order), T2.4 (undo), T3.8 (escalation numbers), T6.3 (pre-match estimate). Build the rest.

---

## P0 — Housekeeping

| ID | Task | Acceptance |
|---|---|---|
| T0.1 | `git init` in `A:\THE CAGE` (no remote). Add `.gitignore` (node_modules, scratch). First commit of the current state | `git log` shows the baseline commit. **Needs owner OK per CODEX_TASK step 2** |
| T0.2 | Remove the `LEGACY_PLAYERS` dead code from `index.html` | The roster test still passes |
| T0.3 | `tools/serve.mjs`: zero-dependency static server on localhost:5173 (serve the repo root, correct MIME for .js/.mjs/.json) | `node tools/serve.mjs` → page loads; ES module import works |
| T0.4 | README: how to run the game, the tests and the balance tool. Remove the MIDFIELD WARS zip text | — |
| T0.5 | `tests/` → `node --test` layout. Keep `roster-integration.cjs` working | `node --test` green |

## P1 — Data and identity (§1.3, §4.1)

| ID | Task | Acceptance |
|---|---|---|
| T1.1 | Add `ratingMeta` to `src/players.js`: list the 11 legacy-derived fields as `derivedLegacy` with their formulas. **Don't change any existing value or identity** | The roster test passes; a new test asserts identities and the 17 existing values are byte-identical to the baseline |
| T1.2 | Add the 5 new engine attributes (`work_rate, stamina_v, composure_v, agility, marking`) per player, initially **proxy values with `provisional: true`**. Proxies: agility = .5 pace + .5 tech; marking = def; work_rate = .6 def + .4 pace; stamina_v = 75; composure_v = 75. Claude's reviewed values replace them later (T1.6) | The schema test requires all 5, range 0–100, and a provenance flag |
| T1.3 | `src/engine/attributes.js` registry (attribute → consumer functions). Test: every attribute has ≥ 1 consumer, and no engine file reads a `derivedLegacy` field | Test green; a deliberately unused attribute makes it fail |
| T1.4 | `src/data/ambiguity.js` + `src/identity/resolve.js`: ambiguity table → exact alias → token set → edit distance (≤1 for 5–8 chars, ≤2 for 9+, surname/full name only). Move `keane, toure, ferdinand, alonso, martins` to ambiguity entries, with non-rostered identities shown as "not in pilot roster" (not claimable) | The identity test list in §8.2 is green, including `Ronaldo` → ≥ 2 identities, `nema` → none |
| T1.5 | The not-found message must not deny a rostered player: `Ronaldo` must return disambiguation, not "not in roster" | Test |
| T1.6 | *(after Claude delivers `proposals/ratings-v1.json`, owner approved)* apply the reviewed values; set `provisional: false` | Diff applied exactly; the sweep is rerun by Claude |

## P2 — Exclusive draft (EXCLUSIVE_DRAFT_RULES)

| ID | Task | Acceptance |
|---|---|---|
| T2.1 | `src/draft/claims.js`: pure reducer `(state, cmd) → {state, events}`. Commands: CLAIM{team, slot, playerId, seq}, RELEASE, LOCK, NEW_MATCH, REMATCH. The used pool is keyed by canonical ID; a released player stays used | EXCLUSIVE tests 1–10 as `node:test`; the race test applies conflicting claims in both orders → exactly one succeeds, the loser gets `ALREADY_CLAIMED{owner}` |
| T2.2 | `src/draft/turn-order.js`: snake / alternating / blind-round policies behind a config | *Blocked on the owner's choice; implement the interface + snake* |
| T2.3 | Draft UI on the reducer: masked input until confirm, turn indicator, "Already claimed by [team]", Enter key searches, pilot-roster label | Headless Chrome flow test (injected-script pattern) |
| T2.4 | Confirm-step undo | *Blocked on owner decision* |

## P3 — Engine core (§2–§5)

| ID | Task | Acceptance |
|---|---|---|
| T3.1 | `rng.js` (sfc32 + splitmix32, draw counter) and `mathx.js` (241-entry logistic table, linear interpolation) | Table matches a reference to 1e-6; same seed → same sequence |
| T3.2 | `params.js`: every constant from §3–§4 in one versioned object (start from the spike values in §3.4 and §4.4) | No numeric literal of a tunable constant in other engine files (grep test with an allowlist) |
| T3.3 | `match-events.js`: constructors + validator for schema v1 (§5.2). **Named roles only** | The validator rejects `actor`/`opp`; every type in §5.2 has a constructor |
| T3.4 | `derive.js` (composites §4.1) + `team-shape.js` (duty assignment, cover, chemistry §4.3) | Unit tests: Ballack/Maldini/R9 → Maldini anchor, Ballack link, R9 spear; Okocha/Djalminha/Vidić → Vidić anchor; chemistry effect clamped ±4% |
| T3.5 | `positioning.js`: 4 × 3 grid, shape-follows-ball, marking map, out-of-position counters, recovery runs (§2.1, §3.1, §3.5) | Unit tests on the marking fallback (marker out of position → anchor covers) |
| T3.6 | `decisions.js` (utilities incl. duty discipline §3.2) + `duels.js` (§3.3) + `shooting.js` (§3.4, separate bounds) | Each resolver documents and consumes a fixed draw count (test) |
| T3.7 | `rules.js`: fouls on lost defensive duels, free kicks (setPiece flag), restarts, walls/rebounds (§3.6, §9.1) | Unit tests |
| T3.8 | `match-engine.js`: `simulate(MatchInput) → MatchResult`; modes `cageKO` (escalation 5:00/8:00/10:00 + cage runs + xG fallback) and `exhibition`; possession_start/end events; FNV-1a hash | Integrity tests (§5.4); 20 golden hashes; terminates for all 57C3 × sample opponents; ≥ 2,000 KO matches/s |
| T3.9 | Cross-engine determinism: run 1,000 seeds in Node and in headless Chrome, compare hashes | Identical |

## P4 — Analysis and commentary (§6, §9.2)

| ID | Task | Acceptance |
|---|---|---|
| T4.1 | `analysis/stats.js`: every stat in §9.2 from events only | A second independent counter in the test matches; possession sums to 100 |
| T4.2 | `analysis/report.js`: decisive duel, turnover zones, tactic effects, goal chain, top-xG misses. Every claim carries event indices | Test: the report renders from the log + shapes only |
| T4.3 | `commentary/narrator.js`: segmenter, interpreter (duel ledger, callbacks, first-mention names), selector (hash(seed, i, bank), no repeat of the last 2), renderer from named roles; output `{t, text, importance, pace}` | Deterministic per (log, style, seed); the line→event mapping is kept |
| T4.4 | Commentary integrity test: names in each line ⊆ the source event's roles; no line without a source event; within 20 lines no template repeats | Release blocker |
| T4.5 | Wire in Claude's template banks (`src/commentary/templates/classic.js`, Claude-owned content) | Banks load; the variety test passes over 1,000 matches |

## P4b — Tactics (§4.5)

| ID | Task | Acceptance |
|---|---|---|
| T4b.1 | Balanced, Possession, Press, Counter as parameter vectors + personnel gating + the immediate press cost (presser out of position for 2 actions when beaten) | Claude's tactic-matrix sweep: no dominant tactic (§8.4) |
| T4b.2 | Lockdown, Street flair | Only after T4b.1 passes |

## P6 — Match UI and playback (§7)

| ID | Task | Acceptance |
|---|---|---|
| T6.1 | `ui/match-view.js`: narration panel (aria-live), scoreboard with clock and phase, mini cage diagram from `cell`, report and timeline tabs | Keyboard-only flow |
| T6.2 | `ui/playback.js`: Instant / Fast / Normal / Dramatic, pause/resume (Space), speed keys 1–4, skip, replay log, replay with an entered seed | Test: the result hash is identical across all speeds; playback never imports `engine/` |
| T6.3 | Pre-match card (duties, cover bars, key duel) | Win estimate hidden unless the owner decides otherwise |
| T6.4 | Switch `index.html` to the new engine behind `?engine=v3`. Keep the old one until the owner approves removal | Both paths load |

---

## Claude's parallel tasks (for coordination; Claude-owned files only)

- **C1 `proposals/ratings-v1.json` + `DATA_REVIEW.md`:** reviewed values for the 5 new attributes × 57 players, each with a one-line rationale; flag ≥ 95 values; anchor-scale notes (R9, the 14 players with tech ≥ 95).
- **C2 `tools/balance.mjs` + `tests/balance/`:** the §8.3–8.6 sweeps against Codex's engine API (`simulate`, `stats.derive`).
- **C3 `src/commentary/templates/classic.js`:** full classic bank (§6.3 minimums), style-tag variants, callbacks, banned-word list.
- **C4 Reviews** at each phase gate; findings go to CLAUDE_REVIEW.md. `BALANCE_REPORT.md` per sweep, with proposed `params.js` deltas.

**API contract Claude will code against** (please keep it stable or flag changes):

```js
simulate({ engineVersion, paramsVersion, rosterVersion, mode: 'cageKO'|'exhibition', seed, teams: [{ ids:[a,b,c], tactic }, {…}] })
  → { events, score, winner, endReason, durationSec, rngDraws, hash }
stats.derive(result) → { teams:[…], players:{…} }
narrate(result, { style: 'classic', seed }) → [{ t, text, importance, pace, eventIndex }]
```
