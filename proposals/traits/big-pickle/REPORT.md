# Big Pickle Trait Prototype Report

## Scope

Isolated behavior-only prototype of the 15 traits in `proposals/traits/big-pickle/`. No production files were edited. The prototype reads production sources and patches copies in memory for testing.

## Deliverables

- `trait-hooks.js`: pure reusable trait decision module.
- `engine-harness.cjs`: in-memory production-bundle adapter/patcher.
- `tests.cjs`: node test suite.
- `REPORT.md`: this report.

## Reproduce

From `A:\THE CAGE`:

```powershell
node proposals\traits\big-pickle\tests.cjs
```

Expected tail:

```text
28 tests passed
{"pass":true,...,"count":28}
```

## Test Results

All 28 tests pass. Exact test names:

1. catalog and runtime distribution match the spec (15 traits, 78 traited, 61 untraited)
2. Wall: H2b slot-1 lane hold and H4 containment; x=3 unchanged
3. Enforcer: H2b marks highest-ATT non-carrier and H4 raises engagement
4. Anticipator: H2b sits on the ball-to-runner path
5. Tracker: H2b pursuit point and H4 chase engagement
6. Libero: H2b sweeper cell and H5 step-out carry
7. Maestro: H5 tempo and H6a open-receiver weighting
8. Architect: H5 progressive passing and H6a forward weighting
9. Destroyer: H2a slot swap, H4 counter-press, H5 release
10. Engine: H1 support run, H3 commitment safety, H2b recovery, H5 carry
11. Surgeon: H5 through ball and H6b fewest-path-defender runner
12. Predator: H1 box lane and H5 box shooting
13. Magician: H5 take-on and double-defender invite
14. Executioner: H5 edge shooting only at x=2
15. Phantom: H1 gap lane and H5 release/retain
16. Juggernaut: H1 centre target, H5 hold-up, H6b outlet target
17. strength and exclude: primary 1.0, secondary 0.5, excluded 0
18. secondary duty cycle is exactly half over 100 ticks
19. utility multiplier product clamps to [0.6, 1.6]
20. invalid trait pairs throw; untraited players are literal T3 values
21. hooks do not mutate player positions, commitment or the input utility object
22. no RNG, wall-clock, role or legacy rating reads in the trait module
23. engine patch adds no R() call sites
24. baseline OFF: production and patched engine are byte-identical
25. determinism ON: same input twice is identical; no state leaks
26. ON changes decisions for traited holders, without touching recorded duel/shot odds
27. ON outcome audit: every recorded duel/shot p is logistic(calc.logit), no trait inputs
28. exclude: all 15 on an enabled engine is inert and matches T3

## Baseline Evidence

`baseline OFF` compares production T3 with the patched engine across:

- 3 team pairs;
- 60 seeds per pair;
- 3 off forms: `undefined`, `false`, `{enabled:false}`.

That is 540 comparisons. It asserts identical `eventHash`, `draws`, score, duration, and full JSON.

## Trait-On Evidence

- Three trait-on probes activate traits and at least two change `eventHash`.
- Repeated trait-on simulation is identical with no state leakage.
- Outcome audit checks every recorded event with `p` and `calc.logit` across six seeds.
- The trait module contains no `Math.random`, wall-clock read, `R()` call, role read, or outcome-function reference.
- The tactical patch adds no `R()` call sites.

## Runtime Distribution

139 players: 78 traited, 61 untraited. Primary/secondary counts:

| Trait | Primary | Secondary |
|---|---:|---:|
| Wall | 7 | 4 |
| Enforcer | 4 | 4 |
| Anticipator | 4 | 7 |
| Tracker | 5 | 4 |
| Libero | 1 | 1 |
| Maestro | 4 | 6 |
| Architect | 7 | 7 |
| Destroyer | 3 | 0 |
| Engine | 5 | 7 |
| Surgeon | 4 | 8 |
| Predator | 12 | 4 |
| Magician | 6 | 3 |
| Executioner | 9 | 12 |
| Phantom | 3 | 6 |
| Juggernaut | 4 | 5 |

The 61 missing trait pairs remain untraited. No pairs were invented.

## Integration Notes

The harness patches these production sources only in memory:

- `src/tactics/traits.js` -> `trait-hooks.js`;
- `src/tactics/spatial.js` -> H1/H2/H3 call sites;
- `src/engine/tactical-match.js` -> trait init, turnover, engagement, utilities, runner/receiver, result summary.

It also removes the current production extra Libero commitment line so baseline-off matches T3.

A production integration would need reviewed engine edits equivalent to `patchSpatial` and `patchTactical`, plus a UI/config switch for `traits: {enabled:true}`.

## Limitations

- This is an isolated prototype, not production integration.
- Trait parameters are the spec's initial values, not balance-tuned.
- Tests use 3-player teams and synthetic contexts; they are not a full 139-player season audit.
- Outcome audit samples six seeds, not an exhaustive proof over all states.
- Known overlap areas remain reported rather than resolved: Libero/Engine stepping out, Engine forward runs with regainer counter, Destroyer release, Wall/Phantom gap behavior.
- The existing production trait layer is replaced in memory by this prototype for testing.
- No visual, save/load, UI, or deployment changes were made.
