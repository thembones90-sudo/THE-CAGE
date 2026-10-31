# Juan Carlos Valerón: Corrected Recruitment Ratings

**Editorial reassessment v2.1 · 31 October 2026**

Previous rating: **94 OVR** (V2) and inflated **98 passing / 99 vision / 98 first touch / 97 composure**.

Revised rating: **87 OVR**, calculated directly by the existing V2 formula. No personal OVR override and no alteration to the formula.

## Revised prime ratings

| Attribute | Before | Revised |
|---|---:|---:|
| Pace | 67 | 64 |
| Technique | 97 | 90 |
| Passing | 98 | 90 |
| Finishing | 72 | 70 |
| Defence | 35 | 35 |
| Physical | 59 | 58 |
| First touch | 98 | 92 |
| Dribbling | 92 | 87 |
| Vision | 99 | 92 |
| Shooting | 73 | 72 |
| Stamina | 76 | 75 |
| Tackling | 35 | 35 |
| Positioning | 85 | 80 |
| Composure (prime card) | 97 | 87 |
| Composure (separate T3 attribute) | 97 | 88 |

The prime-card fields **passing**, **finishing**, and **physical** duplicate the six broad values and remain internally consistent. The five T3 attributes stay as originally specified except composure, now 88.

## Comparison on the current V2 scale

| Player | OVR |
|---|---:|
| Andrés Iniesta | 92 |
| Xavi Hernández | 91 |
| Luka Modrić | 91 |
| Andrea Pirlo | 90 |
| Paul Scholes | 89 |
| Juan Román Riquelme | 88 |
| **Juan Carlos Valerón** | **87** |

## Editorial rationale

A deeply respected technical creator at Deportivo La Coruña, with a fantastic feel for the final pass. However, his historical influence and sustained top-end performance were not comparable to the era's most accomplished elite midfielders, and his earlier numerical profile incorrectly placed almost all his creative skills in the 97–99 range.

**Owner-confirmed career tier: ELITE**, corrected from LEGEND. His wonderful Deportivo peak and cult playmaker status do not put him on equal historical footing with the sustained exceptional careers reserved for THE CAGE LEGEND or TITAN. His folklore badges are retained. We also retain the **Magician / Surgeon** traits. The rating correction is for prime *ability*, not a claim that his career or style lacked distinction.

He represented Spain 46 times, playing at the 2000 and 2004 Euros and 2002 World Cup. Serious knee problems affected a significant part of his career. These facts help explain why an extraordinarily gifted playmaker did not match the longevity or worldwide dominance of several peers. Source references: [RFEF profile](https://rfef.es/es/que-es-juan-carlos-valeron), [ESPN retrospective](https://africa.espn.com/football/story/_/id/37342231/the-greatness-deportivo-juan-carlos-valeron).

## Implementation safeguards

- Source dossier: `proposals/deportivo-legends-2-approved.json`.
- Generated roster: `src/roster-184.js`.
- Updated audit: `docs/roster-audit-184-current.json`.
- V2 master rating register: `docs/OVERALL_RATINGS_184.md`.
- Dedicated regression: `node tests/valeron-reassessment.cjs`.
- Total remains **184 footballers**.
- Owner confirmed **ELITE** rather than LEGEND; historic tier distribution must reflect this and no gameplay bonuses change.
- Roy Makaay, the prior 182 players and all unrelated agent work remain untouched.
- Underlying ratings do influence gameplay. The OVR formula itself remains display-only.
