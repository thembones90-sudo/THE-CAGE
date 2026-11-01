# T3-14 owner review pack (proposals only; nothing integrated)

**Author:** Claude, 2026-11-01. **Branch:** `feature/t3-13-telemetry`. **No ratings, traits, roster or saves were changed.**

## 1. DISCIPLINE and INDIVIDUALISM (decision D-2)

**File:** `proposals/personality-v1-proposal.json`: 194 players plus David Luiz. Each entry has a value, a confidence level (H/M/L) and a one-line rationale.

**Definitions (0–100):**
- **DISCIPLINE:** how strictly a player keeps their positional and tactical responsibilities.
- **INDIVIDUALISM:** preference for a personal action (shot, dribble) over a pass of similar value. It only changes choices between near-equal options.

**Independence from quality: passed.**

| Correlation with | Discipline | Individualism |
|---|---|---|
| Overall rating (all players) | 0.10 | −0.02 |
| Overall rating, within each role | −0.01 to 0.25 | −0.14 to −0.03 |

**Open issues for your review (stated plainly):**
1. **The two dimensions largely mirror each other:** −0.87 overall, −0.90 within defenders and within midfielders. In practice my values describe one underlying axis, "adventurous vs responsible". Part of that is real (Roberto Carlos really was both undisciplined and a long-range shooter), but it falls short of your requirement for two distinct tendencies.
2. **They follow position:** discipline correlates with defending at 0.78, individualism with finishing at 0.77.
3. **Discipline overlaps with work rate** for midfielders and forwards (0.58–0.66), but not for defenders (0.05).

**Proposed remedy:**
- **(a) Keep their mechanical uses apart,** so they can't double-count. Discipline drives only positional and commitment decisions (milestone 2); individualism drives only shot-or-dribble-vs-pass tie-breaks (milestone 4).
- **(b) Review where the two dimensions diverge, to anchor them.**
  - Disciplined *and* individualist: Del Piero, Drogba, Eto'o, Van Persie, Haaland, Van Nistelrooy, Vardy, Crespo, Zamorano, Shearer, Makaay, Shevchenko.
  - Undisciplined *and* unselfish: Gravesen, Berbatov, Lúcio, Ramos.
- **(c)** If you agree, I re-score the midfield and forward groups with independent passes per dimension, to bring the correlation down where history supports it.
- **Low-confidence entries** (Babangida, Nenê, Luque, Mboma, Marcelinho, Arango, Farfán, Adu, Macheda, Drenthe) need your check.

## 2. Goalkeeper class effects (decision D-3)

**Evidence:** `tests/balance/t3-13/gk-class-audit.json`.

| Finding | Value |
|---|---|
| Hidden bonuses | REFLEX MONSTER +1.5 shot-stopping composite (≈ +4.4 reflexes); GUARDIAN +1.2 (≈ +4.8 positioning); COMMANDER +0.7 (≈ +8.8 aerial); DISTRIBUTOR +5 distribution quality (≈ +3.5 points success); SWEEPER KEEPER +5 sweep ability (≈ +6 points sweep chance) |
| Effect on shot-stopping | Tiny in probability: at most −0.032 logit, under 1 point of goal chance |
| Effect on ranking | 38 of 50 keepers change shot-stopping rank because of the bonus; the largest move is 13 places (keeper attributes are tightly clustered) |
| Class supported by the keeper's own attributes | **35 of 50.** Not supported, for example: Goycochea (REFLEX MONSTER, reflexes below catalogue average), Vítor Baía (GUARDIAN, positioning below average), Toldo and Pfaff (REFLEX MONSTER, reflexes below average), Dida and Handanović (GUARDIAN, positioning below average) |
| Best vs worst keeper | Box-centre reference shot: Buffon 32.7% vs Higuita 40.0% goal chance |

**Proposed replacement** (for approval; then implemented with tests in a later milestone):
1. **Remove every hidden numeric class bonus.** Shot-stopping, distribution and sweeping come only from the seven visible attributes.
2. **Class becomes a style that changes decisions, not success odds** (doctrine S-09, S-10). Sweeper keepers choose to sweep more often and hold a higher position; distributors choose short build-up more often; commanders claim more crosses. Each is visible on the card as "Style: …, plays higher / builds short".
3. **The card shows the abilities that matter** (the seven attributes, plus the derived shot-stopping, distribution and sweeping values), which the card UI already supports.
4. **Re-derive the 15 unsupported classes** from attributes, or keep them as editorial labels with a "historical style" note. Owner choice.

## 3. Canonical doctrine (decision D-4)

**File:** `THE_CAGE_FOOTBALL_DOCTRINE.md`. It contains:
- C-01–04: core philosophy;
- **P-01–17: the 17 principles as numbered in the brief**;
- S-01–10: safeguards;
- K-01–08: success criteria;
- G-01–06: game rules.

Every item cites its source. No principles were invented to reach 23.

## 4. David Luiz (decision D-5)

**File:** `proposals/david-luiz-recruitment-proposal.json`. Not inserted into the roster.

| Item | Proposal |
|---|---|
| Identity | CB (secondary CDM), Brazil, peak 2014–2017, **ELITE** (owner-specified) |
| Core ratings | pace 79, tech 84, pass 85, finish 60, def 86, phys 86 (17-skill set in the file) |
| v1.1 attributes | work rate 88, stamina 85, composure 74, agility 82, marking 78 |
| Traits | **Libero** (primary) + **Architect** (secondary): different families, per V5.4.1 |
| Personality | discipline 30, individualism 55 |
| **Computed OVR** | **83** (existing formula; archetype "Traditional centre-back") |

**Flag:** an overall of 83 is low for ELITE; for comparison, Kolo Touré is 86. The formula's centre-back archetype values positioning and composure, his genuine weaknesses. I propose no override. You decide whether ELITE with 83 is acceptable (tier is career status, OVR is attributes), or whether the formula needs a ball-playing centre-back archetype, which would be a formula change affecting others.

## 5. Next milestone (blocked on §1)

**Milestone 2, individual attacking commitment, replaces the natural-defender threshold** with willingness built from:
- attacking capability;
- work rate;
- **DISCIPLINE**;
- the cover team-mates provide;
- match state.

It needs your verdict on §1 (values as proposed, the remedy, or a re-score). Until then I can build the mechanism behind a flag using existing attributes only, and measure it with the decision telemetry.
