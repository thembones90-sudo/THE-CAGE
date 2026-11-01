# Goalkeeper ratings v1: Claude proposal (owner decision D5, 2026-11-01)

**Data:** `proposals/goalkeeper-ratings-v1-proposal.json`, covering all 50 keepers of v68 (`src/goalkeepers.js`). Each keeper has 7 attributes, an overall from the **unchanged** OVR formula, and a one-line rationale.
**Status:** PROPOSAL, awaiting approval. Nothing in `src/` has changed. Career tiers and keeper classes are unchanged, apart from one class suggestion.

## Method

- Same principles as ratings v1.1: editorial peak-career judgments on the project scale (50 limited, 70 capable, 85 specialist, 95 exceptional), each keeper set against peers with similar reputations. No simulations consulted.
- **Weaknesses are rated as weaknesses.** Examples:
  - Casillas, aerial 76;
  - Oblak, distribution 70;
  - Donnarumma, distribution 66;
  - Higuita, positioning 72 and handling 70;
  - Campos, aerial 62;
  - Barthez, handling 78.
- **Strengths are specific.** Examples:
  - Schmeichel: one-on-one 96 (star jump), distribution 88 (counter-launching throws);
  - van der Sar: distribution 92;
  - Čech: positioning 96 and aerial 94.
- **Lower confidence** for the pre-1950s keepers (Zamora, Plánička, Gilmar); flagged in their rationale.
- Specialist skills that aren't goalkeeping attributes (Chilavert's and Ceni's free kicks, Goycochea's penalty saving) are **not** folded into the seven ratings.

## Overall changes worth your attention

| Keeper | Provisional → proposal | Why |
|---|---|---|
| Buffon | 93 → 91 | Elite shot-stopping and positioning (95/97), but the OVR formula counts distribution and sweeping (17%), where he was ordinary |
| Casillas | 92 → 89 | Reflexes and one-on-one 97, offset by a genuine weakness on crosses and a tendency to parry |
| Donnarumma | 90 → 86 | Poor with his feet (66) |
| Čech, Zoff | 91 → 89, 90 → 88 | Positional masters whose sweeping and distribution were limited |
| **Chilavert** | 90 → 88 | His LEGEND tier and folklore are owner-approved and **unchanged**. His 90 was a provisional formula figure. As a goalkeeper he rates very good rather than elite; his free kicks aren't a goalkeeping attribute |
| Higuita, Campos | 82 → 80, 84 → 81 | The extreme sweeper profile, with real liabilities |
| Neuer | 95 → 94 | Still the highest |

**Tier and overall disagree in places:** Casillas (TITAN) has 89 while Alisson (LEGEND) has 92. That's intended: tier is career status, overall is peak attributes, and there's no hidden tier bonus (per the v68 rules).

**Class suggestion:** Lev Yashin REFLEX MONSTER → **COMMANDER**. He was the pioneer who commanded his whole area and came for crosses.

## An honest note on spread, and what it means for the engine

The proposal widens the attribute spread only modestly (for example, distribution's spread goes from 6.9 to 8.2, positioning's from 3.8 to 4.6). On shot-stopping these 50 really are clustered: they're among the best ever, so reflexes stay at 84–97.

In the engine, keeper quality shifts the shot's goal logit by `(88 − composite) × 0.021`, capped at ±0.35:
- Under this proposal the shift ranges from −0.16 to +0.21 (it was −0.17 to +0.14).
- That's roughly ±3–4 points of goal probability per shot between the best and worst keeper.

**If goalkeepers should matter more now that they're mandatory (D4), the place to change is that engine slope or the reference value, not the ratings.** Inflating the spread to force an effect would break the rating scale; the same principle applied to outfield ratings ("don't tune players to achieve results"). This should be measured under regulation scoring with the new values before deciding.

**Another engine note for you:** keeper classes carry mechanical bonuses that aren't visible as stats. REFLEX MONSTER adds 1.5 to the shot-stopping composite, GUARDIAN 1.2, COMMANDER 0.7. DISTRIBUTOR adds 5 to distribution quality and SWEEPER KEEPER 5 to sweeping. Decide whether classes should be labels only, or whether their effect should be shown on the card.

## Integration (Codex, after approval)

1. Version the ratings (for example `gk-ratings-v1`). Freeze the v68 values for old replays, as the GK30 snapshot is frozen today.
2. Load the proposal values into `src/goalkeepers.js`. The OVR formula stays as it is.
3. Re-run the v66 to v68 keeper tests, plus a paired-seed benchmark under regulation scoring comparing goals per match and the keeper effect size, old values against new.
