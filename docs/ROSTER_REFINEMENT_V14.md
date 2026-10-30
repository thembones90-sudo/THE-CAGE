# THE CAGE — Roster refinement V1.4

> **Owner corrections retained:** Sergio Busquets = LEGEND; Gareth Bale = LEGEND. Both remain unchanged from V1.3. Nothing in this document overrides a user-approved classification.

## Results

- **178 players** retained with unique IDs, natural positions, folklore decisions and exactly two traits.
- **40 previously approved dossiers** preserved with no changes to career tier, badges, traits, positions or 17 core attributes.
- **115 provisional five-attribute tactical profiles** reviewed: 65 players adjusted, 50 unchanged; all 63 non-provisional tactical profiles untouched.
- **7 editorial historical changes** across seven players, affecting three tiers and four STREET HERO badges. Subject to owner review.
- **Legacy v0.4 remains the default engine.** T3 and its decision-only trait layer remain opt-in.

## Career tier distribution

| Tier | Before | After |
|---|---:|---:|
| **TITAN** | 30 | 30 |
| **LEGEND** | 78 | 78 |
| **ELITE** | 52 | 52 |
| **STALWART** | 17 | 18 |
| **ACE** | 1 | 0 |

**Why TITAN count remains 30:** Rooney is provisionally promoted and Del Piero is provisionally moved to LEGEND. Busquets and Bale remain LEGEND following explicit owner correction.

## Historical decisions (editorial, pending individual owner approval)

| Player | Decision | Editorial rationale |
|---|---|---|
| Wayne Rooney | LEGEND → **TITAN** | Manchester United record scoring, five league titles and sustained elite all-round impact |
| Alessandro Del Piero | TITAN → **LEGEND** | An iconic Juventus talisman and World Cup winner but on the stringent TITAN/LEGEND boundary |
| Yannick Bolasie | ACE → **STALWART** | Sustained top-flight career; ACE undervalues his established Premier League stature |
| Yaya Touré | remove STREET HERO | Physical and technical dominance are already fully represented by ratings and traits; no singular street-legend identity required. |
| Michael Owen | remove STREET HERO | High-level scoring brilliance and Ballon d'Or recognition alone do not automatically qualify for STREET HERO. |
| Sergio Ramos | remove STREET HERO | His confrontational persona is represented by STREET VILLAIN; not enough separate street-skill identity. |
| Trent Alexander-Arnold | remove STREET HERO | World-class passing delivery does not on its own make a street-cult footballer. |

## Folklore selectivity

| Badge | Before | After |
|---|---:|---:|
| STREET HERO | 97 | 93 |
| STREET VILLAIN | 9 | 9 |
| TALISMAN | 33 | 33 |
| UNDERDOG | 16 | 16 |

**STREET HERO is still common**, because this is an intentionally curated roster of memorable players. The four removals target cases where style was insufficiently distinctive to justify a separate accolade. Do not erase genuinely approved folklore.

## Tactical attribute recalibration

| Field | Number of individual value changes | Average change when modified |
|---|---:|---:|
| work_rate | 17 | +11.5 |
| stamina | 25 | +7.7 |
| composure | 52 | +7.0 |
| agility | 0 | +0.0 |
| marking | 8 | +0.6 |

### Notable revised profiles

| Player | Attribute | Before | After |
|---|---|---:|---:|
| Alessandro Nesta | composure | 62 | **94** |
| Fabio Cannavaro | composure | 58 | **92** |
| Carles Puyol | composure | 54 | **87** |
| Virgil van Dijk | composure | 63 | **92** |
| Sergio Busquets | composure | 70 | **96** |
| Xavi Hernández | composure | 85 | **97** |
| Luka Modrić | stamina | 75 | **93** |
| Mohamed Salah | work_rate | 62 | **89** |
| Samuel Eto'o | work_rate | 68 | **91** |
| Luis Suárez | work_rate | 63 | **89** |

**Editorial meaning:** work_rate = active pressing/tracking; stamina = sustaining intensity; composure = decision-making under pressure; agility = balance and tight turning; marking = defensive anticipation. All are situational T3 supplements, not the main 17 prime stats.

The 50 unchanged provisional profiles have been reviewed but **remain provisional**, not magically certified as exact or owner-approved. No final gameplay balancing is claimed without broader match calibration.

## Verification

- `node tests/roster-178-refinement-v14.cjs` checks 178 records, both owner tier corrections, all previous 40 approved classifications, all 63 non-provisional tactical profiles, 115 revised profiles, 17 preserved core ratings each and three trait-enabled deterministic simulations.
- `node tests/roster-178-categorization.cjs`, `node tests/roster-178-integration.cjs`, `node tests/engine-guards.cjs` and `node tests/ui-regression.cjs` run on an isolated, generated T3 engine.
- The active main workbench contains another agent's unfinished experimental engine. The refinement engine is built and tested in `A:\CAGE-REFINEMENT-VERIFY` to avoid overwriting that work.

## Review limitations

- Career tiers/folklore are subjective historical classifications, not objective ranking data.
- Broad public honours are useful but do not substitute for user approval of close-tier decisions.
- Retained special traits are not reimagined in this refinement; only tactical attribute estimates and selected editorial classifications are changed.

Generated from versioned V1.3 audit and the V1.4 source overlays.
