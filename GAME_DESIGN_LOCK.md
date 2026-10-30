# THE CAGE — CORE GAME DESIGN (LOCKED)

## Foundational mechanic: memory-first player search

THE CAGE is NOT a card browsing, pack opening, roster selection, or autocomplete discovery game.

The player must REMEMBER real footballers and enter their names manually to assemble a three-person side. This is the heart of the game, inspired by the spontaneous back-and-forth choices of Djalminha, Okocha, Vidić, Berbatov, Bolasie, Ferdinand, D'Alessandro, and others.

## Draft flow
1. Display THREE EMPTY NAME ENTRY SLOTS, no visible library, rankings, recommendations, or player cards.
2. The user independently recalls and types a footballer's name.
3. Explicit search/submit resolves the input against the player database, allowing common aliases, accents and spelling variants (e.g. R9, Ronaldo Nazário; Sinisa / Siniša Mihajlović; Jaap Stam).
4. Results are restricted to exact or near name matches for identity disambiguation. Do NOT reveal unrelated footballers or provide suggestion lists that spoil recall.
5. Once the user confirms a match, show the verified identity and attributes. The user may change their choice by typing a new name.
6. Repeat until all three slots contain distinct valid footballers, then lock the side and simulate.

## Fairness and anti-spoiler rules
- Never prepopulate slots.
- No random player generator or catalogue on the primary drafting screen.
- No browsing by nationality, league, club, position, rating, era, or hidden player IDs during the draft.
- No fuzzy search suggestions BEFORE deliberate submission; after submission, only tight spell-correction and identity disambiguation.
- Unknown names yield honest unknown/unverified responses, never fabricated identities or attributes.
- No hidden recommendation system.
- Match calculations should value chemistry, tactical fit, defensive balance, skill, and form/peak-era considerations instead of fame alone.
- Do not claim factual player ratings are official or objective: ratings require a documented editorial method.

## Codex responsibilities
Implement the free-text recall UI, exact/alias matching, verified identity confirmation, deduplication, keyboard accessibility, name normalization, and tests. Preserve this mechanic when replacing the prototype's original draft UI.

## Claude responsibilities
Review gameplay, football identity edge cases, alias support, balancing, and whether any search interface reveals unwanted player suggestions. Validate that a knowledgeable player gets rewarded for recall rather than browsing.

## Acceptance tests
- Empty three slots at first load.
- Searching "Djalminha" resolves a specific footballer.
- Searching "R9" resolves Ronaldo Nazário, not Cristiano Ronaldo.
- Accents and spelling variations handled.
- Query for an unrecognized name does not invent a player.
- No player lists, autocomplete hints, or recommended names before deliberate search.
- The same player cannot fill multiple slots.
- A side with thoughtful tactical fit can compete with three elite attackers.

This document supersedes any conflicting selection/catalogue UI in v0.1.
