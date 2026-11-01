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


---

# Second review round (owner decisions R-1 to R-5, 2026-11-01)

## R-1: personality re-scored independently, v2

**File:** `proposals/personality-v2-proposal.json` (195 players). Each player now has a **separate note per dimension**. Pass 1 scored discipline with no reference to attacking tendencies; pass 2 scored individualism with no reference to positional discipline. v1 is kept for comparison.

| Correlation | v1 | **v2** |
|---|---|---|
| Discipline vs individualism, all players | −0.87 | **−0.76** |
| Within forwards | −0.58 | **−0.34** |
| Within defenders / within midfielders | −0.90 / −0.90 | **−0.78 / −0.78** |
| Discipline vs overall rating | 0.10 | 0.10 |
| Individualism vs overall rating | −0.02 | −0.01 |

**Notable separations in v2:**
- Lampard: disciplined 72, shot-first 72.
- Beckenbauer and Lúcio: defenders who carried the ball themselves (individualism 55 and 62).
- Riquelme and Özil: undisciplined 42 and 48, but cooperative 45 and 18.
- Eto'o: disciplined 86, scorer 62.
- Inzaghi: role-faithful 70, greedy 90.

**Why the defender and midfielder correlation stays high:** part of it comes from the definitions themselves. A defender who takes personal attacking actions must leave his position to do it, so positional indiscipline and attacking individualism co-occur in the same players (Roberto Carlos, Lúcio, Ramos, David Luiz). **I did not adjust values to hit a lower correlation** (that would be tuning to a statistic). If you want more separation, the option is a definition change: individualism measured **only once a player is already in an attacking situation**. Defenders would then be scored on what they do when they arrive in the box, not on how often they go there.

- **Low confidence (10):** Nenê, Babangida, Luque, Mboma, Marcelinho, Arango, Farfán, Adu, Macheda, Drenthe.
- **Not wired into gameplay.**

## R-2: goalkeeper redesign, implemented and verified (cage-t3-13)

See commit `929c165` and `tests/t3-13-gk-style.cjs`.

**Execution:**
- **No class execution bonus** in shot-stopping, sweeping, distribution or claiming; the test checks every keeper under all five classes.
- **Success follows attributes:** sweep success is 0.327 for high-sweeping keepers vs 0.158 for low.

**Decision rates in 600 real matches, measured vs style:**

| Class | Sweep | Rush one-on-one | Claim |
|---|---|---|---|
| Sweeper | 0.91 / 0.90 | 0.83 / 0.80 | 0.41 / 0.45 |
| Commander | 0.54 / 0.55 | 0.52 / 0.60 | 0.68 / 0.65 |
| Guardian | 0.35 / 0.35 | 0.49 / 0.45 | 0.35 / 0.35 |
| Distributor | 0.54 / 0.55 | 0.44 / 0.55 | 0.35 / 0.35 |
| Reflex monster | 0.34 / 0.35 | 0.27 / 0.30 | 0.26 / 0.25 |

**Match effect** (400 identical matches): goals 9.23 → 9.15; sweeps 14.3 → 6.5 per match; claims 2.7 per match (new).

**Historical engines** use the untouched original rules; all historical keeper replay tests pass.

**For Codex:** add `gk_claim` to the viewer's keeper-event list (`viewer-v4/viewer.js`) and a commentary line, so claims animate.

## R-4: David Luiz, revised provisional profile

**Compared with all 24 roster centre-backs** (details in `proposals/david-luiz-recruitment-proposal.json` → `revision`):
- **Base composure 68 → 56.** His v1.1 composure (74) places him with Chiellini, Mihajlović, Stam and Lúcio, whose base values are 42–62.
- **Defending and tackling 86 → 89.** The draft was the lowest of 24 centre-backs, but his documented flaw is positioning, not duelling.
- **Positioning 76 → 78**, level with Stam.

**Overall 84** (was 83). The formula is unchanged and the archetype stays "Traditional centre-back". Still provisional.
