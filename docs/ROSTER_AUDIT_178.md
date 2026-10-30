# THE CAGE — 178-player roster audit

> Review snapshot only. Does not alter active player data, activate T3, or approve any new tier/trait assignments.

## Data-health summary

- **178 unique player IDs** with all 17 prime attributes and all five tactical attributes present.
- **178 natural positions** mapped; 12 position types.
- **138 missing career tiers**, all of which also lack an explicit folklore array. Absence of folklore is not the same as a reviewed NONE.
- **61 players lack BOTH traits**, although the rules require exactly one primary and one secondary.
- **115 players have provisional T3 supplemental attributes**; 63 are marked non-provisional.
- **Zero duplicate normalized names/aliases**, zero invalid rating numbers, and all existing talisman badges include explicit clubs.
- **No STREET VILLAIN labels** currently exist in the code even though candidates such as Roy Keane were discussed.
- **High-rating concentration:** 72 players have Technique 90+, 57 have Passing 90+, and 64 have Finishing 90+; these deserve a calibration review, not arbitrary immediate downgrades.
- **Default engine is legacy v0.4**, while T3 is loaded only via `?engine=t3`. Even T3 traits are currently opt-in, not default.
- **Legacy `tests/showdown-engine.cjs` is stale:** expects 63 original records but initial modules load 64; other current integration/UI/T3 tests pass.

## Current career-tier inventory

| Tier | Players saved |
|---|---:|
| ELITE | 13 |
| LEGEND | 19 |
| STALWART | 5 |
| TITAN | 3 |
| UNCLASSIFIED | 138 |

## Current folklore inventory

| Folklore | Saved recipients |
|---|---:|
| STREET HERO | 36 |
| TALISMAN | 9 |
| UNDERDOG | 8 |
| STREET VILLAIN | 0 |

## Proposed trait-pair repairs (NOT IMPLEMENTED)

Only these 61 players currently have no trait pair. Each suggestion is **provisional editorial work**.

| Player | Natural position | Suggested primary | Suggested secondary |
|---|---|---|---|
| Adriano | ST | Juggernaut | Executioner |
| Alessandro Del Piero | CF | Magician | Executioner |
| Álvaro Recoba | CF | Magician | Executioner |
| Andrés D'Alessandro | CAM | Magician | Surgeon |
| Antonio Cassano | CF | Magician | Surgeon |
| Bernardo Silva | CAM | Magician | Engine |
| Claude Makélélé | CDM | Anticipator | Wall |
| Daniele De Rossi | CDM | Destroyer | Architect |
| Denílson | LW | Magician | Phantom |
| Dimitar Berbatov | ST | Magician | Surgeon |
| Djalminha | CAM | Magician | Surgeon |
| Eden Hazard | LW | Magician | Surgeon |
| Edgar Davids | CDM | Destroyer | Engine |
| Francesco Totti | CF | Maestro | Executioner |
| Frank Lampard | CM | Executioner | Phantom |
| Gabriel Batistuta | ST | Executioner | Juggernaut |
| Gilberto Silva | CDM | Anticipator | Wall |
| Giorgio Chiellini | CB | Wall | Enforcer |
| Jaap Stam | CB | Wall | Enforcer |
| Javier Mascherano | CDM | Tracker | Destroyer |
| Javier Zanetti | RB | Engine | Anticipator |
| Jay-Jay Okocha | CAM | Magician | Surgeon |
| Juan Román Riquelme | CAM | Maestro | Surgeon |
| Kevin De Bruyne | CAM | Surgeon | Architect |
| Ledley King | CB | Anticipator | Wall |
| Lilian Thuram | RB | Wall | Tracker |
| Lúcio | CB | Libero | Enforcer |
| Marcel Desailly | CB | Wall | Anticipator |
| Michael Ballack | CM | Engine | Executioner |
| Michael Essien | CM | Engine | Destroyer |
| Michael Owen | ST | Phantom | Predator |
| Morten Gamst Pedersen | LM | Architect | Executioner |
| N'Golo Kanté | CM | Tracker | Engine |
| Nani | LW | Magician | Executioner |
| Nemanja Vidić | CB | Wall | Enforcer |
| Nenê | LM | Magician | Executioner |
| Obafemi Martins | ST | Phantom | Predator |
| Pablo Aimar | CAM | Magician | Surgeon |
| Paolo Maldini | LB | Anticipator | Wall |
| Patrick Vieira | CM | Enforcer | Engine |
| Ricardo Carvalho | CB | Anticipator | Wall |
| Ricardo Quaresma | RW | Magician | Surgeon |
| Rio Ferdinand | CB | Libero | Anticipator |
| Rivaldo | LW | Magician | Executioner |
| Robert Pirès | LM | Magician | Surgeon |
| Roberto Baggio | CF | Magician | Executioner |
| Rodri | CDM | Architect | Anticipator |
| Ronaldinho | LW | Magician | Maestro |
| Ronaldo Nazário | ST | Predator | Magician |
| Roy Keane | CDM | Enforcer | Destroyer |
| Ryan Giggs | LM | Magician | Engine |
| Siniša Mihajlović | LB | Executioner | Enforcer |
| Steed Malbranque | CM | Engine | Surgeon |
| Steven Gerrard | CM | Engine | Executioner |
| Thomas Gravesen | CDM | Enforcer | Destroyer |
| Tugay Kerimoğlu | CDM | Architect | Executioner |
| Xabi Alonso | CDM | Architect | Anticipator |
| Yannick Bolasie | LW | Magician | Phantom |
| Yaya Touré | CM | Juggernaut | Engine |
| Zinedine Zidane | CAM | Maestro | Magician |
| Zlatan Ibrahimović | ST | Juggernaut | Magician |

## Full 178-player classification and ratings index

Rating shorthand: PAC / TEC / PAS / FIN / DEF / PHY. **UNREVIEWED** means absent metadata, not a low tier.

| Player | Country | Pos. | Career tier | Folklore | Traits | PAC/TEC/PAS/FIN/DEF/PHY | Tactical 5 |
|---|---|---|---|---|---|---|---|
| Adel Taarabt | Morocco | CAM | **UNREVIEWED** | UNREVIEWED | Magician / Surgeon | 83/97/86/78/32/72 | Provisional |
| Adriano | Brazil | ST | **UNREVIEWED** | UNREVIEWED | **MISSING** | 91/86/70/96/25/98 | Baseline |
| Aiden McGeady | Republic of Ireland | RW | STALWART | STREET HERO | Magician / Phantom | 87/89/75/67/35/62 | Provisional |
| Alan Shearer | England | ST | TITAN | STREET HERO, TALISMAN | Executioner / Juggernaut | 80/86/77/99/42/96 | Provisional |
| Alberto Luque | Spain | LW | STALWART | STREET HERO, UNDERDOG | Phantom / Executioner | 89/85/77/87/34/75 | Provisional |
| Alen Bokšić | Croatia | ST | LEGEND | STREET HERO | Juggernaut / Phantom | 92/87/77/90/29/91 | Provisional |
| Alessandro Del Piero | Italy | CF | **UNREVIEWED** | UNREVIEWED | **MISSING** | 80/95/90/96/32/68 | Baseline |
| Alessandro Nesta | Italy | CB | **UNREVIEWED** | UNREVIEWED | Wall / Anticipator | 77/83/79/40/99/88 | Provisional |
| Alex de Souza | Brazil | CAM | ELITE | STREET HERO, TALISMAN | Maestro / Surgeon | 67/96/97/92/32/70 | Provisional |
| Álvaro Recoba | Uruguay | CF | **UNREVIEWED** | UNREVIEWED | **MISSING** | 78/94/91/89/27/62 | Baseline |
| Andrea Barzagli | Italy | CB | **UNREVIEWED** | UNREVIEWED | Wall / Anticipator | 70/73/77/32/97/90 | Provisional |
| Andrea Pirlo | Italy | CM | **UNREVIEWED** | UNREVIEWED | Architect / Maestro | 56/94/99/79/65/64 | Provisional |
| Andrés D'Alessandro | Argentina | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 76/94/92/76/40/58 | Baseline |
| Andrés Iniesta | Spain | CM | **UNREVIEWED** | UNREVIEWED | Maestro / Phantom | 79/99/96/78/55/65 | Provisional |
| Andrew Robertson | Scotland | LB | **UNREVIEWED** | UNREVIEWED | Engine / Tracker | 89/78/88/45/89/76 | Provisional |
| Andrey Arshavin | Russia | LW | ELITE | STREET HERO | Magician / Executioner | 88/93/87/89/30/64 | Provisional |
| Antonio Cassano | Italy | CF | **UNREVIEWED** | UNREVIEWED | **MISSING** | 74/95/91/85/26/69 | Baseline |
| Ariel Ortega | Argentina | CAM | LEGEND | STREET HERO, TALISMAN | Magician / Surgeon | 87/98/91/82/30/61 | Provisional |
| Ashley Cole | England | LB | **UNREVIEWED** | UNREVIEWED | Tracker / Anticipator | 90/81/78/42/95/78 | Provisional |
| Bastian Schweinsteiger | Germany | CM | **UNREVIEWED** | UNREVIEWED | Engine / Architect | 74/85/89/81/85/88 | Provisional |
| Bernardo Silva | Portugal | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 81/94/91/78/64/66 | Baseline |
| Branislav Ivanović | Serbia | RB | **UNREVIEWED** | UNREVIEWED | Enforcer / Wall | 68/71/72/66/92/95 | Provisional |
| Bruno Fernandes | Portugal | CAM | **UNREVIEWED** | UNREVIEWED | Surgeon / Executioner | 78/85/92/89/57/72 | Provisional |
| Cafu | Brazil | RB | **UNREVIEWED** | UNREVIEWED | Engine / Tracker | 92/85/85/61/90/82 | Provisional |
| Carles Puyol | Spain | CB | **UNREVIEWED** | UNREVIEWED | Enforcer / Wall | 75/69/71/38/97/95 | Provisional |
| Cesc Fàbregas | Spain | CM | **UNREVIEWED** | UNREVIEWED | Surgeon / Architect | 70/89/96/82/58/68 | Provisional |
| Christian Eriksen | Denmark | CAM | **UNREVIEWED** | UNREVIEWED | Architect / Surgeon | 70/87/95/82/51/63 | Provisional |
| Clarence Seedorf | Netherlands | CM | **UNREVIEWED** | UNREVIEWED | Engine / Juggernaut | 78/90/88/86/75/92 | Provisional |
| Claude Makélélé | France | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 76/77/82/42/96/81 | Baseline |
| Cristiano Ronaldo | Portugal | LW | **UNREVIEWED** | UNREVIEWED | Executioner / Predator | 95/95/85/99/35/93 | Provisional |
| Daniele De Rossi | Italy | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 73/78/87/70/89/90 | Baseline |
| Darko Pančev | Yugoslavia / North Macedonia | ST | LEGEND | STREET HERO | Predator / Executioner | 76/79/66/99/25/78 | Provisional |
| David Beckham | England | RM | **UNREVIEWED** | UNREVIEWED | Architect / Surgeon | 75/85/98/84/62/78 | Provisional |
| David Silva | Spain | CAM | **UNREVIEWED** | UNREVIEWED | Surgeon / Maestro | 76/98/97/83/43/57 | Provisional |
| Davor Šuker | Croatia | ST | LEGEND | STREET HERO | Executioner / Predator | 81/90/79/98/29/74 | Provisional |
| Declan Rice | England | CDM | **UNREVIEWED** | UNREVIEWED | Destroyer / Engine | 78/82/86/75/93/91 | Provisional |
| Dejan Savićević | Yugoslavia / Montenegro | CAM | LEGEND | STREET HERO, TALISMAN | Magician / Surgeon | 87/99/92/88/31/69 | Provisional |
| Dejan Stanković | Serbia | CM | LEGEND | STREET HERO | Engine / Executioner | 78/87/87/82/78/84 | Provisional |
| Denílson | Brazil | LW | **UNREVIEWED** | UNREVIEWED | **MISSING** | 88/97/76/65/29/59 | Baseline |
| Dennis Bergkamp | Netherlands | CF | TITAN | STREET HERO | Magician / Surgeon | 76/99/96/94/33/70 | Provisional |
| Didier Drogba | Ivory Coast | ST | **UNREVIEWED** | UNREVIEWED | Juggernaut / Executioner | 82/81/75/97/39/99 | Provisional |
| Diego Tristán | Spain | ST | ELITE | STREET HERO | Executioner / Magician | 78/89/77/95/29/78 | Provisional |
| Dimitar Berbatov | Bulgaria | ST | **UNREVIEWED** | UNREVIEWED | **MISSING** | 61/95/85/92/32/78 | Baseline |
| Djalminha | Brazil | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 72/95/91/80/30/52 | Baseline |
| Djibril Cissé | France | ST | ELITE | STREET HERO, UNDERDOG | Phantom / Executioner | 97/80/66/91/29/81 | Provisional |
| Dragan Stojković | Yugoslavia / Serbia | CAM | LEGEND | STREET HERO, TALISMAN | Magician / Maestro | 84/98/96/88/39/69 | Provisional |
| Eden Hazard | Belgium | LW | **UNREVIEWED** | UNREVIEWED | **MISSING** | 88/98/88/87/33/69 | Baseline |
| Edgar Davids | Netherlands | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 84/78/80/55/82/88 | Baseline |
| Erling Haaland | Norway | ST | **UNREVIEWED** | UNREVIEWED | Predator / Juggernaut | 93/78/65/99/30/97 | Provisional |
| Fabio Cannavaro | Italy | CB | **UNREVIEWED** | UNREVIEWED | Anticipator / Tracker | 82/77/77/39/98/87 | Provisional |
| Fernandinho | Brazil | CDM | **UNREVIEWED** | UNREVIEWED | Destroyer / Anticipator | 77/77/84/63/93/84 | Provisional |
| Fernando Torres | Spain | ST | **UNREVIEWED** | UNREVIEWED | Predator / Executioner | 96/87/75/95/30/80 | Provisional |
| Filippo Inzaghi | Italy | ST | LEGEND | STREET HERO | Predator / Phantom | 82/70/65/98/25/71 | Provisional |
| Francesco Totti | Italy | CF | **UNREVIEWED** | UNREVIEWED | **MISSING** | 68/94/96/94/34/79 | Baseline |
| Frank Lampard | England | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 69/83/88/93/69/78 | Baseline |
| Franz Beckenbauer | Germany | CB | **UNREVIEWED** | UNREVIEWED | Libero / Architect | 79/91/94/70/96/84 | Provisional |
| Gabriel Batistuta | Argentina | ST | **UNREVIEWED** | UNREVIEWED | **MISSING** | 79/79/68/98/26/94 | Baseline |
| Gareth Bale | Wales | RW | **UNREVIEWED** | UNREVIEWED | Predator / Executioner | 99/92/81/93/53/90 | Provisional |
| Gary Neville | England | RB | **UNREVIEWED** | UNREVIEWED | Anticipator / Engine | 69/74/82/42/90/77 | Provisional |
| Gennaro Gattuso | Italy | CDM | **UNREVIEWED** | UNREVIEWED | Destroyer / Enforcer | 75/75/77/56/95/96 | Provisional |
| Gianfranco Zola | Italy | CF | LEGEND | STREET HERO, TALISMAN | Magician / Surgeon | 78/98/94/90/28/58 | Provisional |
| Gilberto Silva | Brazil | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 67/72/78/49/91/87 | Baseline |
| Giorgio Chiellini | Italy | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 67/66/70/34/97/94 | Baseline |
| Harry Kane | England | ST | **UNREVIEWED** | UNREVIEWED | Executioner / Surgeon | 68/85/94/99/39/87 | Provisional |
| Hatem Ben Arfa | France | RW | **UNREVIEWED** | UNREVIEWED | Magician / Phantom | 88/97/76/79/31/70 | Baseline |
| Hernán Crespo | Argentina | ST | **UNREVIEWED** | UNREVIEWED | Predator / Executioner | 82/85/76/96/34/83 | Provisional |
| Hidetoshi Nakata | Japan | CAM | LEGEND | STREET HERO | Surgeon / Engine | 83/88/92/81/53/76 | Provisional |
| Hulk | Brazil | RW | ELITE | STREET HERO | Juggernaut / Executioner | 90/87/80/91/39/98 | Provisional |
| İlkay Gündoğan | Germany | CM | **UNREVIEWED** | UNREVIEWED | Engine / Phantom | 73/89/91/88/71/75 | Provisional |
| Iván Zamorano | Chile | ST | **UNREVIEWED** | UNREVIEWED | Juggernaut / Predator | 80/75/65/94/40/95 | Provisional |
| Jaap Stam | Netherlands | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 76/58/61/25/94/93 | Baseline |
| Jamie Carragher | England | CB | **UNREVIEWED** | UNREVIEWED | Wall / Anticipator | 63/68/73/37/94/87 | Provisional |
| Jamie Vardy | England | ST | **UNREVIEWED** | UNREVIEWED | Predator / Executioner | 95/78/66/93/45/80 | Provisional |
| Javier Mascherano | Argentina | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 73/72/81/45/93/83 | Baseline |
| Javier Zanetti | Argentina | RB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 82/84/85/62/94/85 | Baseline |
| Jay-Jay Okocha | Nigeria | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 88/95/86/78/35/58 | Baseline |
| John Terry | England | CB | **UNREVIEWED** | UNREVIEWED | Wall / Enforcer | 59/70/72/47/97/94 | Provisional |
| Josip Iličić | Slovenia | CAM | ELITE | STREET HERO | Magician / Executioner | 75/96/91/92/32/71 | Provisional |
| Juan Román Riquelme | Argentina | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 42/93/97/79/28/50 | Baseline |
| Kaká | Brazil | CAM | **UNREVIEWED** | UNREVIEWED | Predator / Surgeon | 92/95/89/91/42/78 | Provisional |
| Karim Benzema | France | CF | **UNREVIEWED** | UNREVIEWED | Maestro / Surgeon | 82/93/91/96/39/82 | Provisional |
| Kevin De Bruyne | Belgium | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 78/89/98/91/53/75 | Baseline |
| Kolo Touré | Ivory Coast | CB | **UNREVIEWED** | UNREVIEWED | Tracker / Enforcer | 83/72/72/42/91/88 | Provisional |
| Kyle Walker | England | RB | **UNREVIEWED** | UNREVIEWED | Tracker / Wall | 98/78/80/45/93/89 | Provisional |
| Kylian Mbappé | France | ST | **UNREVIEWED** | UNREVIEWED | Predator / Phantom | 99/94/83/96/30/77 | Provisional |
| Ledley King | England | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 79/72/73/32/93/86 | Baseline |
| Lilian Thuram | France | RB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 86/76/76/39/97/90 | Baseline |
| Lionel Messi | Argentina | RW | **UNREVIEWED** | UNREVIEWED | Phantom / Surgeon | 88/100/98/99/33/72 | Provisional |
| Lúcio | Brazil | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 82/73/75/43/94/96 | Baseline |
| Luis Suárez | Uruguay | ST | **UNREVIEWED** | UNREVIEWED | Executioner / Predator | 80/91/86/98/43/86 | Provisional |
| Luka Modrić | Croatia | CM | **UNREVIEWED** | UNREVIEWED | Maestro / Engine | 80/95/97/79/72/70 | Provisional |
| Marcel Desailly | France | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 79/75/77/38/97/96 | Baseline |
| Marcelo Salas | Chile | ST | **UNREVIEWED** | UNREVIEWED | Executioner / Magician | 84/90/78/95/30/80 | Provisional |
| Mario Balotelli | Italy | ST | **UNREVIEWED** | UNREVIEWED | Executioner / Juggernaut | 79/87/75/91/30/92 | Provisional |
| Mark Viduka | Australia | ST | ELITE | STREET HERO | Juggernaut / Magician | 69/88/81/93/29/94 | Provisional |
| Marouane Fellaini | Belgium | CM | **UNREVIEWED** | UNREVIEWED | Juggernaut / Engine | 55/75/72/77/79/97 | Provisional |
| Matt Le Tissier | England | CAM | **UNREVIEWED** | UNREVIEWED | Executioner / Magician | 62/96/90/96/28/72 | Provisional |
| Mesut Özil | Germany | CAM | **UNREVIEWED** | UNREVIEWED | Surgeon / Phantom | 78/94/97/78/31/58 | Provisional |
| Michael Ballack | Germany | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 73/82/87/91/77/93 | Baseline |
| Michael Carrick | England | CDM | **UNREVIEWED** | UNREVIEWED | Architect / Anticipator | 61/81/94/67/81/76 | Provisional |
| Michael Essien | Ghana | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 87/78/81/78/91/94 | Baseline |
| Michael Owen | England | ST | **UNREVIEWED** | UNREVIEWED | **MISSING** | 97/78/66/94/28/65 | Baseline |
| Milan Baroš | Czech Republic | ST | ELITE | STREET HERO, UNDERDOG | Phantom / Predator | 91/84/70/87/30/77 | Provisional |
| Miodrag Belodedici | Romania | CB | LEGEND | None | Libero / Anticipator | 77/86/83/35/97/80 | Provisional |
| Mohamed Salah | Egypt | RW | **UNREVIEWED** | UNREVIEWED | Phantom / Executioner | 94/94/86/96/39/73 | Provisional |
| Morten Gamst Pedersen | Norway | LM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 75/80/84/76/56/72 | Baseline |
| Mousa Dembélé | Belgium | CM | **UNREVIEWED** | UNREVIEWED | Magician / Juggernaut | 79/95/86/66/79/94 | Provisional |
| N'Golo Kanté | France | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 87/80/80/51/98/79 | Baseline |
| Nani | Portugal | LW | **UNREVIEWED** | UNREVIEWED | **MISSING** | 90/92/80/84/36/68 | Baseline |
| Nemanja Vidić | Serbia | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 57/56/64/34/96/94 | Baseline |
| Nenê | Brazil | LM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 76/90/86/84/27/58 | Baseline |
| Neymar Jr. | Brazil | LW | **UNREVIEWED** | UNREVIEWED | Magician / Surgeon | 91/99/94/91/31/64 | Provisional |
| Nwankwo Kanu | Nigeria | CF | LEGEND | STREET HERO, UNDERDOG | Magician / Predator | 75/94/85/91/34/80 | Provisional |
| Obafemi Martins | Nigeria | ST | **UNREVIEWED** | UNREVIEWED | **MISSING** | 99/77/62/87/24/79 | Baseline |
| Pablo Aimar | Argentina | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 85/96/91/77/37/56 | Baseline |
| Paolo Maldini | Italy | LB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 79/79/80/45/99/84 | Baseline |
| Papiss Cissé | Senegal | ST | STALWART | STREET HERO | Predator / Executioner | 82/73/61/94/31/77 | Provisional |
| Park Ji-sung | South Korea | LM | LEGEND | STREET HERO, UNDERDOG | Engine / Tracker | 84/81/82/74/82/76 | Provisional |
| Patrice Evra | France | LB | **UNREVIEWED** | UNREVIEWED | Tracker / Engine | 88/83/83/52/90/78 | Provisional |
| Patrick Mboma | Cameroon | ST | ELITE | STREET HERO, UNDERDOG | Juggernaut / Executioner | 87/85/72/94/31/93 | Provisional |
| Patrick Vieira | France | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 82/82/84/78/92/96 | Baseline |
| Paul Pogba | France | CM | **UNREVIEWED** | UNREVIEWED | Juggernaut / Architect | 80/93/92/84/66/93 | Provisional |
| Paul Scholes | England | CM | **UNREVIEWED** | UNREVIEWED | Architect / Maestro | 66/90/96/84/66/65 | Baseline |
| Peter Crouch | England | ST | STALWART | STREET HERO | Juggernaut / Predator | 62/78/76/86/42/90 | Provisional |
| Philipp Lahm | Germany | RB | **UNREVIEWED** | UNREVIEWED | Anticipator / Maestro | 82/89/90/48/95/72 | Provisional |
| Pierre van Hooijdonk | Netherlands | ST | ELITE | STREET HERO | Executioner / Juggernaut | 71/84/76/94/32/92 | Provisional |
| Predrag Mijatović | Yugoslavia / Montenegro | CF | LEGEND | STREET HERO | Magician / Executioner | 88/95/86/94/28/74 | Provisional |
| Ricardo Carvalho | Portugal | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 73/68/76/30/94/80 | Baseline |
| Ricardo Quaresma | Portugal | RW | **UNREVIEWED** | UNREVIEWED | **MISSING** | 86/92/78/76/24/55 | Baseline |
| Rio Ferdinand | England | CB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 81/79/80/37/96/87 | Baseline |
| Rivaldo | Brazil | LW | **UNREVIEWED** | UNREVIEWED | **MISSING** | 83/96/91/97/38/79 | Baseline |
| Riyad Mahrez | Algeria | RW | **UNREVIEWED** | UNREVIEWED | Magician / Phantom | 83/96/86/85/39/65 | Provisional |
| Robert Lewandowski | Poland | ST | **UNREVIEWED** | UNREVIEWED | Executioner / Juggernaut | 78/87/80/98/36/92 | Provisional |
| Robert Pirès | France | LM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 80/92/90/85/41/63 | Baseline |
| Robert Prosinečki | Yugoslavia / Croatia | CAM | LEGEND | STREET HERO | Magician / Maestro | 75/97/94/81/42/68 | Provisional |
| Roberto Baggio | Italy | CF | **UNREVIEWED** | UNREVIEWED | **MISSING** | 82/96/92/94/29/61 | Baseline |
| Roberto Carlos | Brazil | LB | **UNREVIEWED** | UNREVIEWED | Tracker / Executioner | 95/87/82/81/88/87 | Provisional |
| Robin van Persie | Netherlands | ST | LEGEND | STREET HERO | Executioner / Magician | 79/94/85/97/32/73 | Provisional |
| Rodri | Spain | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 69/86/94/79/91/88 | Baseline |
| Ronaldinho | Brazil | LW | **UNREVIEWED** | UNREVIEWED | **MISSING** | 85/99/95/91/29/76 | Baseline |
| Ronaldo Nazário | Brazil | ST | **UNREVIEWED** | UNREVIEWED | **MISSING** | 98/98/78/99/20/88 | Baseline |
| Roy Keane | Ireland | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 75/78/84/67/92/91 | Baseline |
| Rúben Dias | Portugal | CB | **UNREVIEWED** | UNREVIEWED | Wall / Anticipator | 70/75/80/44/96/94 | Provisional |
| Ruud Gullit | Netherlands | CAM | TITAN | STREET HERO, TALISMAN | Juggernaut / Maestro | 90/95/91/92/76/96 | Provisional |
| Ruud van Nistelrooy | Netherlands | ST | **UNREVIEWED** | UNREVIEWED | Executioner / Predator | 74/83/68/99/29/80 | Provisional |
| Ryan Giggs | Wales | LM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 93/91/89/81/43/66 | Baseline |
| Sadio Mané | Senegal | LW | **UNREVIEWED** | UNREVIEWED | Predator / Engine | 94/91/81/91/48/77 | Provisional |
| Safet Sušić | Yugoslavia / Bosnia and Herzegovina | CAM | LEGEND | STREET HERO, TALISMAN | Magician / Surgeon | 80/98/97/85/30/65 | Provisional |
| Sami Hyypiä | Finland | CB | ELITE | UNDERDOG | Wall / Anticipator | 64/73/76/42/95/92 | Provisional |
| Samuel Eto'o | Cameroon | ST | **UNREVIEWED** | UNREVIEWED | Predator / Tracker | 97/86/76/96/47/80 | Provisional |
| Santi Cazorla | Spain | CM | **UNREVIEWED** | UNREVIEWED | Magician / Architect | 77/96/95/78/44/56 | Provisional |
| Savo Milošević | Yugoslavia / Serbia | ST | ELITE | None | Predator / Juggernaut | 75/78/69/93/33/88 | Provisional |
| Sergio Agüero | Argentina | ST | **UNREVIEWED** | UNREVIEWED | Predator / Executioner | 90/94/81/99/29/77 | Provisional |
| Sergio Busquets | Spain | CDM | **UNREVIEWED** | UNREVIEWED | Anticipator / Maestro | 54/85/92/55/93/78 | Provisional |
| Sergio Ramos | Spain | CB | **UNREVIEWED** | UNREVIEWED | Enforcer / Executioner | 82/78/77/70/96/91 | Provisional |
| Shunsuke Nakamura | Japan | CAM | LEGEND | STREET HERO, TALISMAN | Architect / Executioner | 73/96/96/83/40/62 | Provisional |
| Siniša Mihajlović | Serbia | LB | **UNREVIEWED** | UNREVIEWED | **MISSING** | 59/70/88/54/78/76 | Baseline |
| Sol Campbell | England | CB | **UNREVIEWED** | UNREVIEWED | Wall / Enforcer | 76/70/71/40/97/96 | Provisional |
| Son Heung-min | South Korea | LW | **UNREVIEWED** | UNREVIEWED | Phantom / Executioner | 93/88/81/96/37/73 | Provisional |
| Steed Malbranque | France | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 76/86/85/73/53/61 | Baseline |
| Steven Gerrard | England | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 82/86/90/91/80/91 | Baseline |
| Thierry Henry | France | LW | **UNREVIEWED** | UNREVIEWED | Predator / Executioner | 97/95/88/97/35/82 | Provisional |
| Thomas Gravesen | Denmark | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 66/66/74/56/82/92 | Baseline |
| Tijjani Babangida | Nigeria | RW | STALWART | STREET HERO, UNDERDOG | Magician / Phantom | 99/84/74/79/35/66 | Provisional |
| Toni Kroos | Germany | CM | **UNREVIEWED** | UNREVIEWED | Architect / Maestro | 65/91/99/81/67/73 | Provisional |
| Trent Alexander-Arnold | England | RB | **UNREVIEWED** | UNREVIEWED | Architect / Libero | 76/88/98/63/70/69 | Provisional |
| Tugay Kerimoğlu | Turkey | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 52/86/91/72/65/65 | Baseline |
| Vincent Kompany | Belgium | CB | **UNREVIEWED** | UNREVIEWED | Enforcer / Wall | 73/75/78/55/95/94 | Provisional |
| Virgil van Dijk | Netherlands | CB | **UNREVIEWED** | UNREVIEWED | Wall / Architect | 80/76/86/49/97/95 | Provisional |
| Vladimir Jugović | Yugoslavia / Serbia | CM | ELITE | None | Engine / Architect | 78/84/88/78/86/84 | Provisional |
| Wayne Rooney | England | CF | **UNREVIEWED** | UNREVIEWED | Predator / Engine | 85/89/89/95/65/91 | Provisional |
| Xabi Alonso | Spain | CDM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 59/83/96/76/78/77 | Baseline |
| Xavi Hernández | Spain | CM | **UNREVIEWED** | UNREVIEWED | Maestro / Architect | 70/96/99/73/65/65 | Provisional |
| Yannick Bolasie | DR Congo | LW | **UNREVIEWED** | UNREVIEWED | **MISSING** | 92/91/71/70/42/81 | Baseline |
| Yaya Touré | Ivory Coast | CM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 83/88/89/89/76/96 | Baseline |
| Youri Djorkaeff | France | CAM | LEGEND | STREET HERO | Surgeon / Executioner | 79/93/90/92/39/72 | Provisional |
| Zinedine Zidane | France | CAM | **UNREVIEWED** | UNREVIEWED | **MISSING** | 74/99/98/88/51/84 | Baseline |
| Zlatan Ibrahimović | Sweden | ST | **UNREVIEWED** | UNREVIEWED | **MISSING** | 78/93/84/97/30/97 | Baseline |

## Historical classifications requiring reconciliation

These were previously discussed, but are absent from current career-tier metadata. They are **not** being silently granted here.

| Player | Discussed classification |
|---|---|
| Cristiano Ronaldo | TITAN; STREET HERO + STREET VILLAIN |
| Ronaldo Nazário | TITAN; STREET HERO + UNDERDOG |
| Paolo Maldini | TITAN; TALISMAN (AC Milan) |
| Roy Keane | LEGEND; STREET VILLAIN |
| Jay-Jay Okocha | LEGEND; STREET HERO + UNDERDOG; Magician / Surgeon |
| Nani | STALWART; STREET HERO |
| Jamie Vardy | ELITE; STREET HERO + UNDERDOG |

**Not yet in current roster:** Diego Maradona, Eric Cantona and Raúl. Any prior classification discussion does not make them playable.

## Recommended resolution order

1. Review and approve the 61 missing trait pairs, then load them in a separate, tested metadata-only module.
2. Restore existing owner-approved folklore and career tiers; review remaining unclassified players in role-based batches.
3. Calibrate 115 provisional tactical profiles and investigate global high ratings (mean Technique 85.9, Passing 83.5).
4. Decide whether T3 and its trait-decision layer should be enabled by default; do this deliberately after match testing.
5. Repair the stale legacy test; run deterministic match, UI, and roster regression checks.

Generated from the live 178-player browser roster and `tools/audit-roster.cjs`. No proposed entries in this report are active player data.
