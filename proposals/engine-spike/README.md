# Engine spike (REFERENCE ONLY, NOT PRODUCTION CODE)

Author: Claude, 2026-10-30. Throwaway prototype used to test ENGINE_ARCHITECTURE_PROPOSAL.md against the real 57-player roster.
It reads `../../src/players.js` read-only and changes nothing else.

Known spike shortcuts that production code must NOT copy:
- `Math.exp` in logistic (production: lookup table, proposal §B5)
- event roles stored as actor/opp (production: named roles, proposal §5.2; the spike needed a ROLE_SWAP patch)
- composites built from proxy fields (no work_rate/agility/real stamina/real composure exist yet)
- constants untuned; the measured results are diagnostic, not targets

Run (Node 24, no install):
    node sweep.js 1 det          # determinism check
    PP='{"k":22,"clampLo":0.12,"clampHi":0.88,"foul":0.01}' node sweep.js 2000 main
    PP='{"k":22,"clampLo":0.12,"clampHi":0.88,"foul":0.01}' node sweep.js 1500 tactics
    node demo.js 22              # sample commentary, BMR vs OJV
