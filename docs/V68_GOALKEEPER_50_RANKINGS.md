# THE CAGE V6.8 - Goalkeepers: 50-card ranked status and grades

**Historical tiers** denote career status; **OVR** is strictly calculated from seven peak goalkeeping attributes. Career tier does not add a hidden bonus. The whole 50-card table is ranked by tier, then OVR, then name.

## Owner-approved Chilavert decision

- **Jose Luis Chilavert: LEGEND / 90 OVR (provisional grade)**. LEGEND status and folklore are owner-approved; the seven revised numerical ratings are a proposed calibration and require separate owner sign-off.
- Special labels: **STREET HERO + STREET VILLAIN + TALISMAN**.
- Talisman club: **Velez Sarsfield**.
- Keeper class: **DISTRIBUTOR**.
- Reflexes 92, Positioning 90, Handling 87, One-on-One 91, Aerial Control 90, Distribution 95, Sweeping 79.
- The three labels have no flat mechanical stat boost. His career achievements and set-piece ability are not inferred from distribution alone.
- Historic GK30 snapshot preserves Chilavert as ELITE 85 for old match replays.

## Current tier distribution

- TITAN: **4**
- LEGEND: **17**
- ELITE: **26**
- STALWART: **3**
- ACE: **0**

## 50 ranked goalkeeper grades

| # | Goalkeeper | Career tier | OVR | GK class | Editorial status |
|--:|---|---|--:|---|---|
| 1 | Manuel Neuer | TITAN | 95 | SWEEPER KEEPER | Previous provisional card unchanged |
| 2 | Gianluigi Buffon | TITAN | 93 | GUARDIAN | Previous provisional card unchanged |
| 3 | Lev Yashin | TITAN | 93 | REFLEX MONSTER | Previous provisional card unchanged |
| 4 | Iker Casillas | TITAN | 92 | REFLEX MONSTER | Previous provisional card unchanged |
| 5 | Alisson Becker | LEGEND | 92 | SWEEPER KEEPER | Previous provisional card unchanged |
| 6 | Peter Schmeichel | LEGEND | 92 | COMMANDER | Previous provisional card unchanged |
| 7 | Edwin van der Sar | LEGEND | 91 | GUARDIAN | Previous provisional card unchanged |
| 8 | Oliver Kahn | LEGEND | 91 | COMMANDER | Previous provisional card unchanged |
| 9 | Petr Cech | LEGEND | 91 | GUARDIAN | Previous provisional card unchanged |
| 10 | Dino Zoff | LEGEND | 90 | GUARDIAN | Previous provisional card unchanged |
| 11 | Gilmar | LEGEND | 90 | GUARDIAN | New provisional grade |
| 12 | Gordon Banks | LEGEND | 90 | REFLEX MONSTER | Previous provisional card unchanged |
| 13 | Jose Luis Chilavert | LEGEND | 90 | DISTRIBUTOR | Owner approved tier + folklore |
| 14 | Michel Preudhomme | LEGEND | 90 | GUARDIAN | New provisional grade |
| 15 | Peter Shilton | LEGEND | 90 | GUARDIAN | New provisional grade |
| 16 | Ricardo Zamora | LEGEND | 90 | REFLEX MONSTER | New provisional grade |
| 17 | Rinat Dasayev | LEGEND | 90 | REFLEX MONSTER | New provisional grade |
| 18 | Thibaut Courtois | LEGEND | 90 | GUARDIAN | Previous provisional card unchanged |
| 19 | Frantisek Planicka | LEGEND | 89 | REFLEX MONSTER | New provisional grade |
| 20 | Sepp Maier | LEGEND | 89 | REFLEX MONSTER | Previous provisional card unchanged |
| 21 | Ubaldo Fillol | LEGEND | 89 | REFLEX MONSTER | New provisional grade |
| 22 | Emiliano Martinez | ELITE | 90 | COMMANDER | New provisional grade |
| 23 | Gianluigi Donnarumma | ELITE | 90 | REFLEX MONSTER | Previous provisional card unchanged |
| 24 | Jan Oblak | ELITE | 90 | GUARDIAN | Previous provisional card unchanged |
| 25 | Marc-Andre ter Stegen | ELITE | 90 | DISTRIBUTOR | Previous provisional card unchanged |
| 26 | Andoni Zubizarreta | ELITE | 89 | GUARDIAN | New provisional grade |
| 27 | Angelo Peruzzi | ELITE | 89 | GUARDIAN | New provisional grade |
| 28 | Claudio Taffarel | ELITE | 89 | GUARDIAN | New provisional grade |
| 29 | David Seaman | ELITE | 89 | GUARDIAN | New provisional grade |
| 30 | Dida | ELITE | 89 | GUARDIAN | Previous provisional card unchanged |
| 31 | Ederson Moraes | ELITE | 89 | DISTRIBUTOR | Previous provisional card unchanged |
| 32 | Gianluca Pagliuca | ELITE | 89 | REFLEX MONSTER | New provisional grade |
| 33 | Hugo Lloris | ELITE | 89 | REFLEX MONSTER | New provisional grade |
| 34 | Julio Cesar | ELITE | 89 | REFLEX MONSTER | Previous provisional card unchanged |
| 35 | Keylor Navas | ELITE | 89 | REFLEX MONSTER | Previous provisional card unchanged |
| 36 | Walter Zenga | ELITE | 89 | COMMANDER | New provisional grade |
| 37 | Francesco Toldo | ELITE | 88 | REFLEX MONSTER | Previous provisional card unchanged |
| 38 | Jean-Marie Pfaff | ELITE | 88 | REFLEX MONSTER | New provisional grade |
| 39 | Jens Lehmann | ELITE | 88 | SWEEPER KEEPER | New provisional grade |
| 40 | Pepe Reina | ELITE | 88 | DISTRIBUTOR | Previous provisional card unchanged |
| 41 | Samir Handanovic | ELITE | 88 | GUARDIAN | Previous provisional card unchanged |
| 42 | Santiago Canizares | ELITE | 88 | GUARDIAN | Previous provisional card unchanged |
| 43 | Victor Valdes | ELITE | 88 | DISTRIBUTOR | Previous provisional card unchanged |
| 44 | Yann Sommer | ELITE | 88 | REFLEX MONSTER | Previous provisional card unchanged |
| 45 | Fabien Barthez | ELITE | 87 | SWEEPER KEEPER | Previous provisional card unchanged |
| 46 | Vitor Baia | ELITE | 87 | GUARDIAN | New provisional grade |
| 47 | Rogerio Ceni | ELITE | 86 | DISTRIBUTOR | New provisional grade |
| 48 | Sergio Goycochea | STALWART | 85 | REFLEX MONSTER | New provisional grade |
| 49 | Jorge Campos | STALWART | 84 | SWEEPER KEEPER | Previous provisional card unchanged |
| 50 | Rene Higuita | STALWART | 82 | SWEEPER KEEPER | Previous provisional card unchanged |

## Rating boundaries

No artificial career-tier multiplier is used. The goalkeeper OVR is computed as rounded weighted average: **24% Reflexes + 20% Positioning + 14% Handling + 16% One-on-One + 9% Aerial Control + 9% Distribution + 8% Sweeping**. Some ELITE cards legitimately overlap lower LEGEND cards. Rank is a display ordering, not a tactical boost.

## Implementation and archival policy

- The original 30-card `gk30-v66-provisional-20261031` roster is frozen as `src/goalkeepers-gk30.js`.
- New `gk50-v68-owner-chilavert-20261031` roster is exposed by the current `CageGoalkeepers` API.
- Replays select an immutable keeper catalog by their saved goalkeeper ratings version; T3-7/8/9 without an explicit marker resolve to GK30.
- New T3-10 replay records stamp the GK50 version.
- The active goalkeeper draft still offers five private choices with ten seconds and exhausts selected goalkeepers over best-of-five.
- Outfield 194-player ratings and roster remain unchanged.

## Future editorial decisions

The 20 new historical keepers are ranked provisionally, not user-approved individually. Review Banks, Zoff, Maier, Shilton, Zamora, Gilmar, Fillol, Chilavert set-piece identity, and whether Hugo Lloris and Oblak warrant elevation based on career distinction. No further existing tier changes were made.
