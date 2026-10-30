# CLAUDE — INDEPENDENT FOOTBALL & GAME DESIGN REVIEW
Workspace: A:\THE CAGE
Read: GAME_DESIGN_LOCK.md, PROJECT_SPEC.md, CODEX_TASK.md.
Write findings to CLAUDE_REVIEW.md. Review rather than silently alter Codex's in-progress implementation.

## Mission
Protect the game's central premise: knowledge-first footballer recall and tactical 3v3 battles. Independently assess football plausibility, name matching, data validity, game balance and UI anti-spoiler behavior.

## Audit areas
1. Recall integrity: zero visible player catalogues or automatic suggestions before a deliberate name search; after search, only exact / relevant matching identities.
2. Identity: ambiguous Ronaldo, common surnames, aliases, accented variants, older footballers, differing transliterations. Never invent biographical records.
3. Football realism: peak-vs-peak premise, role fit, pace vs defending, creativity vs finishing, defending in no-GK small-sided football. No arbitrary guaranteed star victories.
4. Ratings: independently explain editorial estimates; flag obvious bias or unsourced proprietary ratings. Provide rationale for at least 20 example players.
5. Engine: flag simplistic winner-by-sum, biased goalscoring, unexplained outcomes, unrealistic event chains, non-deterministic replay, and missing uncertainty.
6. UI: keyboard accessibility, input feedback, selection confirmation, scoring clarity, mobile layouts.
7. Data: copyright-safe presentation, no unlicensed imagery, scalable roster versioning and provenance.

## Suggested tactical probes
- Ballack / Maldini / Ronaldo Nazário
- Zidane / Ronaldinho / Gravesen
- Okocha / Djalminha / Vidić
- Batistuta / Totti / Chiellini
- Recoba / Mihajlović / Nani
- Berbatov / Bolasie / Ferdinand
- Martins / Owen / Stam
- Thuram / Denílson / Del Piero
- Riquelme / Quaresma / Davids
- Baggio / Adriano / Zanetti
- D'Alessandro / Ibrahimović / Lúcio
- Ben Arfa / Rivaldo / Desailly

## Deliverables
- CLAUDE_REVIEW.md: severity-ranked defects, evidence, suggested fixes, repeatable reproduction steps.
- Optional DATA_REVIEW.md: identity aliases and rating method, clearly separating verified facts and opinion.
- A decisive GO / NO-GO recommendation for v0.2 gameplay.
Do not deploy, push or overwrite Codex changes without coordination.
