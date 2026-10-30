# Ratings v1 — editorial verification pass

**Author:** Claude · **Date:** 2026-10-30
**Scope:** the five new attributes (work rate, stamina, composure, agility, marking) for all 63 players. The owner approved them as the v1 working baseline on 2026-10-30, subject to this pass.

**Rule applied:** corrections are made on football reasoning only. **No match simulation was run to choose any value.** Existing ratings (the 6 base stats and 11 legacy fields) are untouched.

**Result:** 12 corrections → `proposals/ratings-v1.json` is now version **ratings-v1.1**. Each change is recorded with its v1 value in the file's `changelog`, so it can be reverted entry by entry.

## Owner condition 1 — composure must not substitute for creativity

**Test:** correlation of composure with creativity (mean of tech and pass), overall and within roster role.

| | v1 draft | v1.1 |
|---|---|---|
| All players | 0.43 | 0.39 |
| Within defenders | 0.48 | 0.56 |
| **Within midfielders** | **0.76** | **0.65** |
| Within forwards | 0.51 | 0.51 |

**Finding:** the draft under-rated *composed non-creators*. Makélélé, Gilberto, Keane, Mascherano, Kanté, Vieira, De Rossi, Essien and Davids were all marked down to roughly creator-minus-ten, because "calm on the ball" had leaked into "creative on the ball". Their composure was raised (table below).

**Why the remaining 0.65 is accepted, not forced lower:**
- Elite playmakers in this roster (Zidane, Riquelme, Xabi Alonso, Scholes) really are among the calmest players under pressure.
- Lowering their composure, or inflating others', to reach a target correlation would be manufacturing data.
- In the engine, composure is a **separate input** with its own consumers: the pressure penalty on every action, press escape, finishing under pressure, and pass execution weight 0.15. It never stands in for passing or technique.
- The low end of composure is driven by decision-making, not lack of skill: Bolasie 56, Martins 62, Quaresma 64 are all highly technical or athletic.

## Owner condition 2 — marking must not simply duplicate tackling

**Test:** correlation of marking (new) with def (existing tackling/duels).

| | Value |
|---|---|
| All players | 0.96 |
| **Within defenders** | **0.31** |
| Within midfielders | 0.93 (mean absolute gap 8.0 points) |
| Players with def ≥ 75 | 0.67 |
| Independent spread after regressing on def | 7.1 points (first draft 2.6, re-rated) |

**Interpretation:**
- The high overall figure is structural: attackers are low on both, defenders high on both.
- Where the distinction matters, among defenders, marking is genuinely independent (0.31). Readers rate above their tackling and duel-winners below:

| Players who read better than they tackle | Players who tackle better than they read |
|---|---|
| Xabi Alonso +12, Tugay +13, Rodri +4, Carvalho +3, King +4 | Lúcio −16, Yaya −14, Gerrard −12, Davids −12, Essien −11, Vieira −10, Stam −9 |

- Among midfielders, ranking stays similar, because a midfielder who tackles well usually also reads play. The 8-point average gap still separates the pressing ball-winners from the positional screens.

**Engine separation (the decisive safeguard):**
- **marking** feeds interception, shot blocks, help defence and zonal cover.
- **def** feeds tackles in dribble duels and duel strength.
- The attribute-sensitivity test (to be added to the balance tool) must show each of them has its own measurable effect; otherwise one is merged.

Three players have identical marking and def: Maldini 99/99 (benchmark at both), Ronaldo Nazário 20/20 and Owen 28/28. These are coincidences at the extremes, kept.

## Corrections (v1 → v1.1)

| Player | Attribute | v1 | v1.1 | Reason |
|---|---|---|---|---|
| Claude Makélélé | composure | 83 | 88 | Famously unhurried in possession under pressure |
| Gilberto Silva | composure | 83 | 87 | Calm, simple, error-free distribution |
| Roy Keane | composure | 77 | 84 | Rarely lost the ball under pressure; temperament is discipline, not on-ball composure |
| Javier Mascherano | composure | 77 | 82 | Composed enough to play centre-back for an elite possession side |
| N'Golo Kanté | composure | 80 | 85 | Calm, low-risk ball retention after recoveries |
| Patrick Vieira | composure | 80 | 84 | Carried the ball through pressure with authority |
| Daniele De Rossi | composure | 74 | 80 | Assured in a deep role; rashness is in tackling, not decisions |
| Michael Essien | composure | 77 | 80 | Secure in possession |
| Edgar Davids | composure | 71 | 75 | Press-resistant carrier |
| Lúcio | composure | 65 | 70 | Rash positioning is already in marking; composed when carrying forward |
| Ronaldo Nazário | stamina | 72 | 80 | The peak window (1996–98) preceded the knee injuries; 72 reflected his later career |
| Zlatan Ibrahimović | agility | 78 | 82 | Exceptional body control and balance for his size |

## Reviewed and kept (contested, documented)

| Player / value | Kept | Reasoning |
|---|---|---|
| Yaya Touré work rate 70 | kept | Off-ball pressing at his City peak was a recognised weakness; the most debatable value in the set |
| Paul Scholes work rate 72 | kept | Covered a lot of ground, but pressing/tracking intensity was moderate and he was a poor tackler |
| Ledley King stamina 70 | kept | Chronic knee condition limited sustained output; his reading (marking 97) carries his value |
| Riquelme work rate 35 / stamina 60 | kept | Deliberate: the enganche who dictated and did not press |
| Thomas Gravesen composure 59 | kept | Combative and erratic in decision-making |
| Kanté work rate 99 | kept | Roster benchmark for the attribute |
| Composure stretch (draft spread too narrow) | kept | Without it, composure would vary too little to affect play (sd 6.3 → 9.3) |

## Still to do

- **Attribute-sensitivity check** in `tools/claude-tactical-balance.cjs`: +10 on one attribute for one player, across many contexts. Each of the five must move results measurably, otherwise it's wired in or removed. This runs once Codex's T3 engine reads the new attributes.
- **`setPiece` flag candidates** noted in rationales (Mihajlović, Pedersen; also Recoba and Del Piero by reputation). Not applied; needs an owner decision on whether to add the flag.
