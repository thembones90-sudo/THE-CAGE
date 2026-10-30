# CLAUDE REVIEW — THE CAGE v0.2 (30 Oct 2026)

Reviewed: `index.html` (single-file build), `tests/smoke.js`, `CODEX_REPORT.md` against GAME_DESIGN_LOCK, PROJECT_SPEC, CODEX_TASK, CLAUDE_TASK, JOINT_BRIEF.
Acknowledged: the project name is THE CAGE (MIDFIELD WARS is retired), and the headline mode is first-goal-wins KO. **The KO mode does not exist yet.**
No Codex files were changed. Every repro below was run against an unmodified copy of `index.html`. I used node 24 for the pure functions and headless Chrome for the DOM.

## Verdict: **NO-GO** for v0.2 gameplay

The game cannot finish a match. Even after you click Simulate, no score, log or report ever appears. The anti-spoiler draft basics are sound: slots start blank, nothing appears before you search, and unknown names return an honest error. Fix S1–S3 and the game becomes playable. Fix S4–S8 before the owner playtests.

---

## Blockers (S = severity, 1 highest)

### S1 — `match()` throws on ~72% of simulations
`index.html:19`: `PLAYERS.find(p=>p.id===ps[Math.floor(R()*3)])` calls `R()` **inside the find predicate**. That draws a new random index for every candidate in PLAYERS. Often no candidate matches, `.name` is read on `undefined`, and the match crashes. When it doesn't crash, scorer choice depends on the order of the PLAYERS array.
- Repro: `match(['okocha','djalminha','vidic'],['riquelme','quaresma','davids'],'balanced','balanced',42)` gives `TypeError: Cannot read properties of undefined (reading 'name')`.
- Measured: 71.9% and 73.5% crash rates over 10,000 seeds for two different team pairs.
- Fix: draw the index once, as in `const i=Math.floor(R()*3); const p=byId[ps[i]];`, in both the goal branch and the intervention branch.

### S2 — The match panel never renders (name collision)
`function match` overwrites the implicit global for `<div id="match">`. So `match.classList.remove('hidden')` (line 23) throws `Cannot read properties of undefined (reading 'remove')`.
- Repro (headless Chrome, with S1 patched): fill and lock both trios, click Simulate 20 times. All 20 throw, and `#match` stays hidden.

### S3 — The Replay button can never be enabled
In `render(replay=false)`, the parameter `replay` shadows the `#replay` element. `replay.disabled=false` sets a property on a boolean, which does nothing.
- Fix for S2 and S3: stop relying on implicit `window[id]` globals (`global`, `play`, `sa`, `log`, `meta`, `strengths`, `ta`, `tb`, `lockA`, …). Use `document.getElementById` or `const $=id=>…` throughout.

### S4 — "Ronaldo" silently resolves to R9
`search('Ronaldo')` returns only Ronaldo Nazário, because the 4+ character prefix rule matches the alias `ronaldo nazario` and Cristiano isn't in the database. This breaks the critical acceptance scenario and the JOINT_BRIEF rule ("must not silently select either"). The user still has to click Confirm, but they are shown only one identity.
- Fix: add a verified Cristiano Ronaldo record. Also add an explicit ambiguity table, e.g. `ronaldo → [ronaldo-nazario, cristiano-ronaldo]`, that always returns every candidate, even if only one is in the pilot roster ("Other footballers share this name; not yet in pilot roster").

### S5 — The prefix rule leaks the roster to probing
Any query of 4+ characters that prefixes any alias resolves: `nema` gives Vidić, `juan` gives Riquelme, `ricardo` gives Quaresma, `edgar` gives Davids. That is discovery by partial recall, not tight spell-correction. It also misses true typos: `Djalminah`, `Mihajlovich`, `Okocha Jay Jay`, `Román Riquelme`, `Il Fenomeno` and `Ronaldo Luís Nazário de Lima` all return Not found.
- Fix: replace the prefix rule with (a) exact match on a normalized alias, (b) token-set equality so word order doesn't matter, and (c) edit distance ≤1 for 5–8 characters, ≤2 for 9+ characters, run against the **full name or surname only**. Never match first names alone.

### S6 — The alias `djalma` maps to Djalminha
Djalma Santos and Djalma Feitosa Dias (Djalminha's father) are different people. The alias invents an identity link. Remove it.

### S7 — The draft flow is incomplete against the lock document
- Pressing Enter does nothing (verified). The spec requires "Search on Enter". Wrap each slot in a `<form>`, or handle `keydown`.
- A confirmed slot can't be changed or removed (the input is disabled for good). GAME_DESIGN_LOCK §5 says "the user may change their choice". Add a "Change" button.
- Attributes are never shown after confirmation (spec flow step 5). Only country and a one-letter role are shown.
- Disambiguation lacks career years and birth year (spec step 4). The schema has neither field.
- Locking doesn't freeze the slots. The search buttons stay live after lock.

### S8 — The pilot roster isn't labelled, and most acceptance probes can't run
There are 9 players. The UI says "There is no roster to browse" but never says only a small pilot set exists, so most honest recall attempts get "Not found". Of the 12 probe trios in CLAUDE_TASK, only **Okocha/Djalminha/Vidić** and **Riquelme/Quaresma/Davids** can be built. Missing: Ballack, Maldini, Zidane, Ronaldinho, Gravesen, Batistuta, Totti, Chiellini, Recoba, Nani, Berbatov, Bolasie, Ferdinand, Martins, Owen, Thuram, Denílson, Del Piero, Baggio, Adriano, Zanetti, D'Alessandro, Ibrahimović, Lúcio, Ben Arfa, Rivaldo, Desailly, and Cristiano Ronaldo (needed for S4).
- Fix: show a persistent label, e.g. "Pilot roster v0.2 — N verified players; others show as *not yet verified*". Change the Not-found wording so a real player isn't implied to be fake: "Not in the pilot roster yet; no identity or ratings were invented."

---

## Engine and balance (measured with S1 patched, 3,000–5,000 seeds per cell)

| Finding | Evidence | Fix |
|---|---|---|
| **E1 Scorer is uniform at 1/3 each.** Vidić scores as often as R9. | Team R9/Vidić/Stam: R9 883 goals, Vidić 914, Stam 872. | Weight scorer by `finish`·`shooting`, with a role prior (F > M > D). |
| **E2 Chemistry is computed but unused.** It is shown in the report but has no effect on the result. | `chem` never appears in `prob`. | Apply it as a small multiplier (±5%), or drop it from the UI. "No fake features" rule. |
| **E3 Tactics have a dominant strategy.** Possession is the best response to every tactic, and press is strictly worst. There is no counterplay. | Mirror team W% (row vs column): possession 32/35/29/36, press 26/30/23/30. | Make the modifiers interact. Press beats possession (forces turnovers, needs stamina), possession beats counter, counter beats press (space behind). Add the brief's lockdown and street flair tactics only once the matrix is non-transitive. |
| **E4 About 35–37% of matches are draws, with no resolution.** | OkoDjaVid vs RiqQuaDav: W30.7 / D37.4 / L32.0. | This is exactly what first-goal-wins KO solves. Make KO the default mode (JOINT_BRIEF), and keep 20 minutes as exhibition with golden goal. |
| **E5 Scoring is far too low for 3v3 with no keepers and small goals.** | Mean 1.40–1.59 goals per 20 minutes. Futsal-like formats average several times that. | Model possessions (~3–4 per minute). Each possession becomes a chance with probability f(control, press), then a goal with probability f(finisher vs nearest defender). |
| **E6 Event log is thin and partly unexplained.** "Stopped by a timely defensive intervention" names no defender. Goal text says "a team possession" for every goal. No tactical reasons are given, and nothing models walls, rebounds or fouls. | `index.html:19` | Generate events from the possession chain: carrier, action, defender, outcome, and the rating comparison that decided it. |
| **E7 Defence relies on one player.** `best('def')` carries 55% of the weight, so one elite defender almost equals three. | 3 attackers vs 3 defenders: 36.7 / 34.7 / 28.5. That's roughly even, which is fine, but it comes from the formula shape, not from a role model. | Acceptable for now. Revisit when S8 widens the roster. |
| **E8 Seeds can't be replayed from the UI.** The seed is shown, but the only option is "Replay with new seed". `seed>>>0` truncates `Date.now()`, so seeds 1 and 2³² give identical matches. | Determinism itself is OK: the same seed gives the same result. | Add a seed input and a "Replay same seed" button. Display `seed>>>0`. Replace the LCG with mulberry32 or sfc32. The LCG's low bits are weak. |

## Ratings and data

- The schema doesn't match the spec. It has 6 attributes (`pace, tech, pass, finish, def, phys`) instead of the 12 specified, and no `birth_year`, `era`, `peak_period`, `positions`, `sources`, rating notes or version.
- Rating sanity for the 9 entries (editorial opinion, peak-vs-peak). Most are plausible. Two to note:
  - **Mihajlović** is flagged `D`, but his defining trait was the dead-ball left foot (`pass 88` is right). There is no `shooting` or set-piece attribute, so the engine can't express his main threat. Wall rebounds and free kicks in the cage would make this matter.
  - **Jaap Stam** `pace 76` is defensible at his Man United peak.
  - **Riquelme** `pace 42` is harsh but in character.
  - **Ronaldo Nazário** `phys 78`: arguably higher at his 1996–98 peak.
- None of the ratings carries a written rationale yet. CLAUDE_TASK asks for rationales on 20 players. I'm deferring that to `DATA_REVIEW.md` once the 12-attribute schema is approved, so ratings aren't written twice.
- Copyright-safe: no images, logos or Nike/Scorpion assets. The neutral dark theme is fine, but it isn't yet the "steel cage / industrial" identity the brief asks for.

## Process and repo

- `src/` is empty. All code is inline in `index.html`. That's acceptable for v0.2, and CODEX_REPORT says so.
- `tests/smoke.js` can't be run. It needs a manual DevTools paste and only checks search. There are no engine, duplicate, log-integrity or no-spoiler tests. CODEX_TASK step 8 ("run tests, record exact commands and results") isn't met.
- No git repository has been initialised (CODEX_TASK step 2), and CODEX_REPORT doesn't mention this.
- `README.md` is stale. It still tells readers to extract `MIDFIELD_WARS_PROTOTYPE.zip`.
- CODEX_REPORT says simulate and replay are implemented. They have never run successfully end to end (S1–S3). The report should be corrected.

## Recommended order for Codex

1. S1, S2 and S3, then add a headless test that clicks through the whole flow. A node script that loads the pure functions plus one Chrome `--dump-dom` check is enough with no dependencies.
2. S4, S5 and S6 (search correctness), with tests for every query listed in S5.
3. S7 and S8 (draft UX, roster label, Not-found wording).
4. E1–E5 together, as one possession-based engine with KO mode as the default. Then re-run the tactic matrix and confirm no tactic dominates.
5. Expand the roster to cover the 12 probe trios, using the full schema and source notes.

Repro harness (scratch, not in repo): run the pure functions by extracting the inline `<script>` and calling `(0,eval)(code)`. Run the UI flow by injecting a script into a copy of the page and running `chrome --headless=new --dump-dom`.
