# THE CAGE: 184 Player Overall Ratings

> **OVR V1.1 · provisional position-aware editorial indicator with explicitly documented calibration.** Not a FIFA/EA FC rating, objective historical ranking, career tier, or match engine input.

## Method

- **Position-aware:** weighted combination of core and relevant extended prime ratings, rounded to nearest integer.
- **No tier inflation:** TITAN, LEGEND, ELITE, folklore, traits, and provisional tactical attributes contribute zero to OVR.
- **Position profiles:** CM supports a ball-winning profile; fullbacks support a playmaking profile. The higher relevant value applies without changing player position.
- **Bounds:** integer 1–99. The uncalibrated value uses prime ratings. Editorial exceptions are explicitly recorded and subject to individual review.
- **Match impact:** none. OVR is for card display only; simulations use the existing engine and player inputs.
- **Raw ratings remain untouched.** OVR is recomputed from the current rated player.

## Provisional manual calibration

- **Alex de Souza:** uncalibrated CAM score **95**; displayed OVR **89** pending owner review. His underlying 17 attributes, career tier and folklore remain unchanged.
- **Reason:** the CAM weights heavily double-count correlated technique, passing, vision and first-touch attributes, leading to an implausibly high cross-position OVR.
- **Limitation:** the broader positional OVR model remains an editorial draft. Other surprising ratings, especially midfield specialists, still need holistic review. No other overall value was changed in V1.1.
- **Source of explicit calibration:** `CageOverall.CALIBRATIONS` in `src/overall.js`.

## Distribution

| OVR band | Players |
|---|---:|
| 90–99 | 76 |
| 85–89 | 81 |
| 80–84 | 21 |
| 75–79 | 6 |
| 1–74 | 0 |

## Full roster

| OVR | Player | Position | Career tier |
|---:|---|---|---|
| **97** | Lionel Messi | RW | TITAN |
| **97** | Ronaldo Nazário | ST | TITAN |
| **97** | Zinedine Zidane | CAM | TITAN |
| **95** | Cristiano Ronaldo | LW | TITAN |
| **95** | David Silva | CAM | LEGEND |
| **95** | Dragan Stojković | CAM | LEGEND |
| **95** | Safet Sušić | CAM | LEGEND |
| **94** | Dejan Savićević | CAM | LEGEND |
| **94** | Dennis Bergkamp | CF | TITAN |
| **94** | Juan Carlos Valerón | CAM | LEGEND |
| **94** | Kylian Mbappé | ST | LEGEND |
| **94** | Neymar Jr. | LW | TITAN |
| **94** | Ronaldinho | LW | TITAN |
| **94** | Thierry Henry | LW | TITAN |
| **93** | Kevin De Bruyne | CAM | LEGEND |
| **93** | Mesut Özil | CAM | LEGEND |
| **93** | Mohamed Salah | RW | LEGEND |
| **93** | Rivaldo | LW | TITAN |
| **93** | Robert Prosinečki | CAM | LEGEND |
| **93** | Ruud Gullit | CAM | TITAN |
| **93** | Sergio Agüero | ST | LEGEND |
| **93** | Shunsuke Nakamura | CAM | LEGEND |
| **93** | Virgil van Dijk | CB | LEGEND |
| **92** | Adriano | ST | ELITE |
| **92** | Alan Shearer | ST | TITAN |
| **92** | Alessandro Del Piero | CF | LEGEND |
| **92** | Alessandro Nesta | CB | LEGEND |
| **92** | Ariel Ortega | CAM | LEGEND |
| **92** | Erling Haaland | ST | LEGEND |
| **92** | Francesco Totti | CF | LEGEND |
| **92** | Gianfranco Zola | CF | LEGEND |
| **92** | Josip Iličić | CAM | ELITE |
| **92** | Juan Arango | CAM | ELITE |
| **92** | Karim Benzema | CF | TITAN |
| **92** | Marcel Desailly | CB | LEGEND |
| **92** | Marcelinho | CAM | ELITE |
| **92** | Matt Le Tissier | CAM | ELITE |
| **92** | Predrag Mijatović | CF | LEGEND |
| **92** | Roberto Baggio | CF | TITAN |
| **92** | Samuel Eto'o | ST | TITAN |
| **92** | Zlatan Ibrahimović | ST | TITAN |
| **91** | Eden Hazard | LW | LEGEND |
| **91** | Fabio Cannavaro | CB | TITAN |
| **91** | Fernando Torres | ST | LEGEND |
| **91** | Franz Beckenbauer | CB | TITAN |
| **91** | Gareth Bale | RW | LEGEND |
| **91** | Juan Román Riquelme | CAM | LEGEND |
| **91** | Kaká | CAM | LEGEND |
| **91** | Kyle Walker | RB | ELITE |
| **91** | Luis Suárez | ST | TITAN |
| **91** | Pablo Aimar | CAM | ELITE |
| **91** | Rodri | CDM | LEGEND |
| **91** | Roy Makaay | ST | LEGEND |
| **91** | Sergio Ramos | CB | TITAN |
| **91** | Youri Djorkaeff | CAM | LEGEND |
| **90** | Andrea Barzagli | CB | ELITE |
| **90** | Andrés D'Alessandro | CAM | ELITE |
| **90** | Bernardo Silva | CAM | ELITE |
| **90** | Carles Puyol | CB | LEGEND |
| **90** | Davor Šuker | ST | LEGEND |
| **90** | Didier Drogba | ST | LEGEND |
| **90** | Djalminha | CAM | ELITE |
| **90** | Hidetoshi Nakata | CAM | LEGEND |
| **90** | Lilian Thuram | RB | LEGEND |
| **90** | Lúcio | CB | LEGEND |
| **90** | Miodrag Belodedici | CB | LEGEND |
| **90** | N'Golo Kanté | CM | LEGEND |
| **90** | Paolo Maldini | LB | TITAN |
| **90** | Patrick Mboma | ST | ELITE |
| **90** | Rio Ferdinand | CB | LEGEND |
| **90** | Robert Lewandowski | ST | TITAN |
| **90** | Rúben Dias | CB | ELITE |
| **90** | Sergio Busquets | CDM | LEGEND |
| **90** | Sol Campbell | CB | LEGEND |
| **90** | Vincent Kompany | CB | LEGEND |
| **90** | Wayne Rooney | CF | TITAN |
| **89** | Adel Taarabt | CAM | STALWART |
| **89** | Aílton | ST | ELITE |
| **89** | Alen Bokšić | ST | LEGEND |
| **89** | Alex de Souza | CAM | ELITE |
| **89** | Álvaro Recoba | CF | ELITE |
| **89** | Andrey Arshavin | LW | ELITE |
| **89** | Antonio Cassano | CF | ELITE |
| **89** | Ashley Cole | LB | LEGEND |
| **89** | Christian Eriksen | CAM | ELITE |
| **89** | Declan Rice | CDM | ELITE |
| **89** | Djibril Cissé | ST | ELITE |
| **89** | Gabriel Batistuta | ST | LEGEND |
| **89** | Giorgio Chiellini | CB | LEGEND |
| **89** | Hernán Crespo | ST | LEGEND |
| **89** | Javier Zanetti | RB | LEGEND |
| **89** | Jay-Jay Okocha | CAM | LEGEND |
| **89** | Marcelo Salas | ST | ELITE |
| **89** | Nwankwo Kanu | CF | LEGEND |
| **89** | Patrick Vieira | CM | LEGEND |
| **89** | Philipp Lahm | RB | TITAN |
| **89** | Riyad Mahrez | RW | ELITE |
| **89** | Robin van Persie | ST | LEGEND |
| **89** | Sadio Mané | LW | LEGEND |
| **89** | Sami Hyypiä | CB | ELITE |
| **89** | Son Heung-min | LW | LEGEND |
| **88** | Bruno Fernandes | CAM | ELITE |
| **88** | Cafu | RB | TITAN |
| **88** | Darko Pančev | ST | LEGEND |
| **88** | Diego Tristán | ST | ELITE |
| **88** | Harry Kane | ST | LEGEND |
| **88** | Hulk | RW | ELITE |
| **88** | Jamie Vardy | ST | ELITE |
| **88** | John Terry | CB | LEGEND |
| **88** | Luka Modrić | CM | TITAN |
| **88** | Michael Essien | CM | ELITE |
| **88** | Michael Owen | ST | LEGEND |
| **88** | Paul Pogba | CM | ELITE |
| **88** | Roberto Carlos | LB | TITAN |
| **88** | Yaya Touré | CM | LEGEND |
| **87** | Claude Makélélé | CDM | LEGEND |
| **87** | Fernandinho | CDM | ELITE |
| **87** | Hatem Ben Arfa | RW | STALWART |
| **87** | Iván Zamorano | ST | ELITE |
| **87** | Jaap Stam | CB | LEGEND |
| **87** | Jefferson Farfán | RW | ELITE |
| **87** | Kolo Touré | CB | ELITE |
| **87** | Ledley King | CB | ELITE |
| **87** | Mario Balotelli | ST | STALWART |
| **87** | Mark Viduka | ST | ELITE |
| **87** | Nani | LW | STALWART |
| **87** | Patrice Evra | LB | ELITE |
| **87** | Pierre van Hooijdonk | ST | ELITE |
| **87** | Roy Keane | CDM | LEGEND |
| **87** | Ruud van Nistelrooy | ST | LEGEND |
| **87** | Steven Gerrard | CM | LEGEND |
| **86** | Andrés Iniesta | CM | TITAN |
| **86** | Andrew Robertson | LB | ELITE |
| **86** | Clarence Seedorf | CM | LEGEND |
| **86** | Daniele De Rossi | CDM | LEGEND |
| **86** | Dejan Stanković | CM | LEGEND |
| **86** | Filippo Inzaghi | ST | LEGEND |
| **86** | Gennaro Gattuso | CDM | LEGEND |
| **86** | Jamie Carragher | CB | ELITE |
| **86** | Mousa Dembélé | CM | ELITE |
| **86** | Nemanja Vidić | CB | LEGEND |
| **86** | Obafemi Martins | ST | STALWART |
| **86** | Ricardo Carvalho | CB | ELITE |
| **86** | Ryan Giggs | LM | LEGEND |
| **86** | Toni Kroos | CM | TITAN |
| **86** | Vladimir Jugović | CM | ELITE |
| **86** | Xavi Hernández | CM | TITAN |
| **85** | Alberto Luque | LW | STALWART |
| **85** | Bastian Schweinsteiger | CM | LEGEND |
| **85** | Branislav Ivanović | RB | ELITE |
| **85** | David Beckham | RM | LEGEND |
| **85** | İlkay Gündoğan | CM | LEGEND |
| **85** | Javier Mascherano | CDM | ELITE |
| **85** | Milan Baroš | ST | ELITE |
| **85** | Papiss Cissé | ST | STALWART |
| **85** | Savo Milošević | ST | ELITE |
| **85** | Trent Alexander-Arnold | RB | ELITE |
| **84** | Andrea Pirlo | CM | TITAN |
| **84** | Dimitar Berbatov | ST | ELITE |
| **84** | Michael Ballack | CM | LEGEND |
| **84** | Michael Carrick | CDM | ELITE |
| **84** | Paul Scholes | CM | LEGEND |
| **84** | Ricardo Quaresma | RW | ELITE |
| **84** | Robert Pirès | LM | ELITE |
| **84** | Xabi Alonso | CDM | LEGEND |
| **83** | Cesc Fàbregas | CM | LEGEND |
| **83** | Denílson | LW | STALWART |
| **83** | Gary Neville | RB | ELITE |
| **83** | Gilberto Silva | CDM | ELITE |
| **83** | Tijjani Babangida | RW | STALWART |
| **82** | Frank Lampard | CM | LEGEND |
| **82** | Park Ji-sung | LM | LEGEND |
| **82** | Santi Cazorla | CM | ELITE |
| **82** | Yannick Bolasie | LW | STALWART |
| **81** | Edgar Davids | CDM | LEGEND |
| **81** | Nenê | LM | STALWART |
| **80** | Aiden McGeady | RW | STALWART |
| **80** | Peter Crouch | ST | STALWART |
| **78** | Marouane Fellaini | CM | STALWART |
| **78** | Morten Gamst Pedersen | LM | STALWART |
| **77** | Steed Malbranque | CM | STALWART |
| **77** | Thomas Gravesen | CDM | STALWART |
| **76** | Siniša Mihajlović | LB | ELITE |
| **76** | Tugay Kerimoğlu | CDM | STALWART |

## Verification

- Run node tests/overall-184.cjs to check all 184 ratings and invariants.
- Run node tests/overall-alex-calibration.cjs to prove Alex 95 → 89 while other 183 remain identical.
- Run node tests/overall-match-invariance.cjs to verify T3 results are identical with and without OVR.
- Run node tests/ui-regression.cjs to check claimed-tile OVR in headless Chrome.
- Run node tests/random-draft.cjs to check all card badges and squad ratings.

**Source:** src/overall.js. Main card UI: src/showdown.js. Draft card UI: src/random-draft.js.
