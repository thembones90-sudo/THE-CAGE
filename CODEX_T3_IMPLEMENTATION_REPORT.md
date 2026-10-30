# T3 implementation and verification — 2026-10-30

**Disposition: implemented as a gated candidate; acceptance NOT achieved. Do not advance to experimental T4 or promote this engine.**

Candidate: `cage-t3-3`, parameters `t3-space-3`, roster `editorial-v0.4-63+ratings-v1.1`. Preview: http://127.0.0.1:4173/?engine=t3. Ordinary browser play still selects archived v0.4 and its original save key. Preview saves use a separate key. No executable was rebuilt, no deployment or push was performed.

## Baseline and prerequisites

- Inspected the real project and working tree before implementation. Coordinated baseline commit `17884ca` on the existing history includes approved ratings v1.1 and Claude's tactical research. Recoverable tag: `tactical-baseline`. Implementation branch: `codex/t3-tactical-space`.
- Archived original engine byte-for-byte as `src/engine/legacy-v04.js`. SHA256: `55f96d4f182ca7bef4f6d142095cc7f83104df88a7c448aba4ae9794180baebb`.
- Missing T0–T2 prerequisites were implemented: guarded deterministic candidate, precomputed sigmoid lookup, frozen results, independent attribute consumers, capability formulas, roster calibration, display-only identity/cohesion, engine registry and old replay compatibility.
- All 63 players receive the five approved attributes verbatim from ratings v1.1. No neutral fallback or edited base rating. Original player source files and approved JSON are unchanged.
- Calibration enumerates all 39,711 unique trios. Normalised phase profiles determine versatility; six raw capability dimensions drive policy. Identity/cohesion does not enter simulation. No dossier/grade-validity UI is claimed complete.
- Claude's concurrent research source, task updates and ABC report were preserved. Regenerable `proposals/tactical-spike/variants/` files were removed from Git tracking only, retained on disk, and ignored as requested in the shared handoff.

## Mechanics delivered

Full formulas, consumers and RNG ledger are in `CODEX_T3_MECHANICS_SPEC.md`.

1. **T3.1 policy:** blockHeight, restDefence, commitForward, tempo, riskAppetite, pressTrigger, directness, rotation and compactness derive from actual capabilities/attributes and the selected interim tactic. No career-role/archetype input or team-composition winner modifier. The bounded tempo and rotation definitions are implementation choices where the spike did not supply complete formulas; they require review.
2. **T3.2 space:** all six players have real 4-by-3 world cells. Movement consumes agility-based credit. Nearest available defenders engage; nearby helpers close; a third defender follows an advanced runner. Committed attackers create a forward run and lateral outlet; held players offer recovery cover. Proximity and availability constrain subsequent duels and passing lanes. Versatile players can exchange commitment/cover duties.
3. **T3.3 resolution:** dribbles, wall combinations, passes, interceptions/challenges and blocks consume real support/help. Contested duels start from k=22, .12/.88 clamps, support .45 and help .75. Shooting has separate small-goal bounds. A distant strong defender cannot intercept simply because he is the nominal anchor. Nearby defensive ability still matters.
4. **T3.4 evidence:** overload, help_defence, rest_defence_exposed, counter_press and direct_outlet are attached to calculated conditions, with all six positions, participant IDs, support/help counts, availability and calculation inputs. Independent evidence validation rejects false tags and omitted nearby participants. Hashes cover evidence; result objects are frozen before commentary.

Immediate regain pressure is limited to existing action context. No T4 multi-action press window, urgency, displacement, scramble-shot, free-man/cut-back or speculative midfield-receiving payoff was imported. Safety caps void a match; they never award a winner.

The preview diagram follows recorded world cells. A live check exposed overlapping shared-cell labels and a legacy zone override; the renderer now preserves recorded cells and separates labels visually, explicitly labelled as such. Display offsets do not alter simulation.

## Regression results

All commands below ran against the final candidate unless stated otherwise. Statistical FAIL is preserved as a failure, not counted as a passing test.

| Command/check | Result |
|---|---|
| `node tools/build-t3.cjs --check` | PASS; reproducible bundle/calibration and archived source hash |
| `node tests/engine-guards.cjs` | PASS; no career-role/legacy-derived reads, identity bonus, nondeterministic source or held T4 formulas in candidate |
| `node tests/records.cjs` | PASS; frozen/reproducible records, corrupt saves/results rejected, identity ambiguity/stale checks, original 57 rating records preserved, 63 valid identities |
| `node tests/roster-integration.cjs` | PASS; original roster/search/script integration/determinism |
| `node tests/showdown-engine.cjs` | PASS; 100 seeded matches and deterministic commentary; canonical scripts |
| `node tests/tactical/mechanics.cjs` | PASS; all 63 exact approved attribute sets, 39,711 calibration, policy/identity fixtures, support/help resolver changes, forward run, unavailable defenders, five-attribute sensitivity, no role/legacy reads, identity independence, false-tag rejection, released v0.4 replay reproduction |
| Same mechanics test: 1,000 seeded contrasting-trio games | PASS; deterministic, no caps, one actual final winning goal, all six present, valid actors/evidence, all five tactical tags observed |
| `node tests/ui-regression.cjs` and `--t3` | Both PASS; alternating exclusive claims, stale lookup, exhaustion/no recycling, cap/void retry, timed playback, six players, five-round 3–2, no sixth round, replay cannot add wins, recap/reset. Final T3 also checks all marker cells against recorded positions and six distinct label positions |
| `node tests/persistence-browser.cjs` and `--t3` | Both PASS; draft reload, original pending seed, single awarded victory, history, replay/export/import, next-round starter, reset cancels old timers, preview/default save isolation |
| Live Chrome source preview | PASS; six exclusive claims, Complete Unit vs Assault, seed 3960605992, cage-t3-3, Ronaldo goal with recorded Maldini assist, 1–0, all six diagram elements, no console errors |
| Full Claude balance harness, original and candidate | Both completed 112,600 attempted simulations; both exit 1 for failed statistical gates. See below |

Browser persistence fixtures now await the asynchronous import handler and allow enough virtual time for playback/reload/reset checks. This fixes the test race rather than weakening import validation. Assertions still require successful export/import and unchanged history.

Golden fixtures in `tests/tactical/golden-t3-space-3.json`: seed 42, balanced/counter, Complete vs Assault `b20c7f87`; Complete vs Fortress `1d48b7ce`; Complete vs Creators `90fae2d1`; Assault vs Fortress `7fe2cd39`. Earlier space-2 fixture/results remain archived.

## Full before/after balance

Unmodified `tools/claude-tactical-balance.cjs`, full mode, original and candidate. Source outputs: `CODEX_T3_BASELINE_BALANCE.json/.txt` and `CODEX_T3_FULL_BALANCE.json/.txt`. Candidate run: 425 seconds, 112,600 attempted simulations, 394 total safety-cap hits; original: 209 total caps.

The harness stratifies by historical D/M/F labels for analysis only. The candidate never consumes these labels. E1 uses 400 mirrored trials per unordered composition pairing, 18,000 total; comparison teams are matched on original six-stat mean within 1.5 points. The five added attributes are not matched. This is the harness's operational definition of comparable quality, not proof of equal football strength. Caps are excluded from reported win shares; their counts must be read alongside rates. No target was forced.

| E1 composition | Original win share | T3 win share |
|---|---:|---:|
| DMF | 62.8% | 59.3% |
| FFF | 24.9% | 50.5% |
| DDD | 39.5% | 19.2% |
| DDM | 60.7% | 44.7% |
| DDF | 68.6% | 62.2% |
| MMF | 42.5% | 51.3% |
| DFF | 64.5% | 63.1% |
| DMM | 57.5% | 49.8% |
| MMM | 41.3% | 46.4% |
| MFF | 37.7% | 53.5% |

| Gate/measurement | Original | T3 | Verdict |
|---|---:|---:|---|
| E1 composition range; largest matchup cell | 24.9–68.6%; 86.0% | 19.2–63.1%; 90.0% | FAIL; defensive specialisation now too weak |
| E2 strongest opposing DEF coefficient | −.6472 | −.1112 | Best-defender dominance clause improves and passes |
| E2 own best ATT / own mean ATT | +.1004 / +.1244 | +.1375 / +.2559 | Collective attack contributes; regression coefficients are associations, not causal ablations |
| E2 opposing mean DEF coefficient | −.1204 | −.1612 | Collective defensive contribution exceeds strongest-defender coefficient |
| E2 own mean MID coefficient | +.0108 | −.1237 | Overall E2 FAIL; midfield value unresolved, held T4 payoff not added |
| E4 attack/defence event JSD | .023 | .110 | Passes differentiation threshold .10 |
| E4 FFF/DDD dribble ratio | 1.01 | 2.37 | Passes 2x threshold |
| E4 MMM/DDF pass ratio | 1.14 | .77 | FAIL; overall E4 remains failed |
| E10 interceptions / free-kick goal share | 29.9% / 16.7% | 18.4% / 5.1% | PASS T3 ranges |
| E10 shots per match / anchor goal share | 8.6 / 2.7% | 5.2 / 10.1% | PASS T3 ranges |
| E5 tactic-best counts | balanced 0, possession 0, press 6, counter 4 | balanced 0, possession 1, press 5, counter 4 | FAIL; balanced never best; all ten have >=5pt tactic swings |
| E6 top vs bottom within composition | 71.0% | 62.9% | Regression; below 65–80% gate |
| E9 random safety caps | 0 / 20,000 | 2 / 20,000 | FAIL |
| E9 defensive caps per 10,000 | 475.0 | 792.5 | Regression; 317 caps in 4,000 defensive trials, target <=1/10k |
| E9 median / p99 simulated seconds | 148 / 1321 | 112 / 1156 | Median passes; p99 fails <900 |
| E11 equal-quality win rate | 50.2% | 50.0% | PASS |
| E11 >=8-point-gap underdog rate | 19.8% | 32.0% | Regression; fails <=25%, no underdog floor |
| E12 source guard | FAIL, one legacy-derived read | PASS | Candidate clean |

E11 quality gradient remains monotonic. This does not excuse its failed large-gap ceiling. E3/E7/E8 remain pending in Claude's harness: it does not automatically consume the new modules/tags. Module fixture tests and tag validation pass, but they do not substitute for route-of-victory, grade-validity and cohesion-independence statistical acceptance studies.

## Required trios and concrete evidence

Separate showcase: `node tools/codex-t3-showcase.cjs`, 1,000 mirrored trials per named pairing per engine, all balanced tactics, 6,000 games total, zero caps. This has different seeds/method from E11; do not mix their percentages.

| Opponent to Complete Unit | Original opponent win share | T3 opponent win share | Complete Unit base quality advantage |
|---|---:|---:|---:|
| Ronaldinho / Rivaldo / Del Piero | 7.6% | 30.2% | +1.67 |
| Vidic / Stam / Gravesen | 9.7% | 3.6% | +11.44 |
| Okocha / Djalminha / Vidic | 8.6% | 15.5% | +10.50 |

These named teams are NOT matched-quality fixtures. No minimum win share is asserted for them. Complete Unit has restDefence=1 and commitForward=2; Assault 0/3; Fortress 2/1. Fortress offers many more direct outlets (4,787 vs Assault's 285 across their respective 1,000-game showcase pairings); Creators records 944. These are event counts with different possession/duration denominators, not a causal effectiveness comparison. Assault creates 1,875 overload-tagged events and 1,004 shots in its pairing; positioning matters, but Fortress still lacks reliable scoring/termination.

`CODEX_T3_SHOWCASE.json` includes complete reproducible configs and evidence examples:

- Seed 12345, t13 pass: Maldini/Ronaldo support versus Del Piero with Rivaldo help; help_defence.
- Seed 12345, t20 dribble: Rivaldo with Ronaldinho/Del Piero support; overload and help_defence can both be true.
- Seed 12345, t46 turnover: rest_defence_exposed with actual committed players caught high.
- Seed 1013916571, t104 through-ball: Ronaldinho to Rivaldo, available direct_outlet.
- Seed 774566179, t37 press: Maldini pressures Ronaldinho immediately after the regain; counter_press.

## Defects found during implementation and limitations

- Initial geometry moved support abreast without a true forward runner. Fixed in space-3; explicit movement test added. Failed space-2 full run is preserved (773 caps) rather than overwritten. Space-3 improves caps versus space-2 but remains worse than original.
- Hash throughput was dominated by repeated VM global property lookups. Caching built-ins preserved event hashes and improved a fixed 200-game space-2 benchmark from 88.5 to 569.2 matches/second. Both logs retained. This is not a space-3 general throughput claim and does NOT meet the proposal's 2,000/s aspiration. Final full harness throughput is about 265 attempted simulations/s including analysis/long cap cases.
- Golden-goal tails and defensive stalls are release blockers. The six-player model is discrete, not continuous physical football. Tag validity proves condition consistency, not tactical realism or good balance.
- Existing released v0.4 replays remain reproducible. Intermediate unreleased T3-2 replays are not registered in T3-3; preview is explicitly experimental. Default saves were kept separate.
- Display-only identities/calibration exist, but no new dossier or tactical tag commentary feature is claimed delivered. All five tags are available to future consumers.
- No approved ratings were nerfed; no composition win correction, forced finish, withdrawn player, manipulated commentary, experimental T4 formula or tactic recalibration was used.

## Exact implementation file inventory

Created source/build/test files:

`src/engine/legacy-v04.js`, `src/engine/attributes.js`, `src/engine/tactical-match.js`, `src/tactics/params.js`, `src/tactics/capabilities.js`, `src/tactics/calibration.json`, `src/tactics/identity.js`, `src/tactics/policy.js`, `src/tactics/spatial.js`, `src/tactics/evidence.js`, `tools/build-t3.cjs`, `tools/codex-t3-showcase.cjs`, `tests/engine-guards.cjs`, `tests/tactical/mechanics.cjs`, `tests/tactical/golden-t3-space-2.json`, `tests/tactical/golden-t3-space-3.json`.

Modified implementation/integration files:

`src/cage-engine.js` (generated), `src/replay/records.js`, `src/showdown.js`, `index.html`, `showdown.html`, `tools/serve.mjs`, `build-exe/launcher.js`, `build-exe/sea-config.json`, `tests/records.cjs`, `tests/ui-regression.cjs`, `tests/persistence-browser.cjs`, `.gitignore`, `README.md`, `HANDOFF_STATUS.md` (append preserving Claude notes).

New reports/evidence:

`CODEX_T3_IMPLEMENTATION_REPORT.md`, `CODEX_T3_MECHANICS_SPEC.md`, `CODEX_T3_BASELINE_BALANCE.json/.txt`, `CODEX_T3_FIRST_QUICK.json/.txt`, `CODEX_T3_SPACE2_BALANCE.json/.txt`, `CODEX_T3_SPACE2_SHOWCASE.json/.txt`, `CODEX_T3_FULL_BALANCE.json/.txt`, `CODEX_T3_SHOWCASE.json/.txt`, `CODEX_T3_MECHANICS.json`, `CODEX_T3_MECHANICS_V2.json`, `CODEX_T3_MECHANICS_FINAL.json`, `CODEX_T3_PERFORMANCE.json`, `CODEX_T3_PERFORMANCE_OPTIMIZED.json`.

Research source/task changes outside this inventory belong to Claude and were not overwritten. The five generated variants removed from tracking remain recoverable in baseline and on disk.

## Commit record and next-phase recommendation

Baseline `17884ca`, tag `tactical-baseline`; implementation commit to be recorded below after final staging verification. No push.

**T4 recommendation: HOLD.** T3 demonstrates real support/position/action effects, but aggregate acceptance fails and important regressions remain. Keep default engine preserved. Next review should isolate defensive outlet/finishing and stall causes, assess quality sensitivity with controlled attributes, and agree any changed formulas before implementation. Re-run the unchanged full harness after each approved mechanics correction. Do not tune ratings, add blanket composition bonuses or import research A/B/C payoff mechanisms merely to pass a win-rate table.
