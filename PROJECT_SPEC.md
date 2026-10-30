# THE CAGE — MASTER SPECIFICATION
Status: Design baseline for prototype v0.2
Canonical path: A:\THE CAGE
Priority: Memory-first 3v3 football drafting. GAME_DESIGN_LOCK.md overrides conflicting older materials.

## Product promise
Two competitors independently recall real footballers and build three-player teams without browsing a database. Their choices are verified by explicit name search. They then compete in a transparent, repeatable football simulation. Football knowledge and team composition matter.

## Core flow
1. Start new match; show three blank name fields per team.
2. Enter name FROM MEMORY. No roster gallery, player packs, hint chips, automatic autocomplete, random-player buttons or browse filters.
3. Search on Enter or explicit button. Normalize case, spacing, accents and punctuation; support researched aliases and tight typo tolerance.
4. If a name is ambiguous, display ONLY matching identities with minimal distinguishing details (full name, nationality, career years). Do not reveal other possible picks.
5. Explicitly confirm one real footballer. Reveal scouting stats only after confirmation.
6. Reject duplicate footballers within one team. Opponents may use the same player unless a future mode says otherwise.
7. Lock trio. Choose a simple tactic (balanced, press, possession, counter); hidden opponent lineups optional later.
8. Simulate 20-minute 3v3; show minute-by-minute events, score, and concise explanation connecting outcomes to skills, roles and tactics.
9. Replay with same seed yields identical outcome. Change seed generates a new plausible match.
10. Rematch lets users retain or revise selections.

## Match assumptions
Small-sided pitch, no goalkeepers, small goals, legal physical play, no offside, two 10-minute halves. Goals must be generated from actual possession / opportunity events, not chosen winner-first. No guaranteed winners. Show seed, team ratings and event explanations. Separate facts from model judgments.

## Roster and rights
Curate a small verified fixture dataset first, then grow with properly licensed or permitted factual datasets. Footballer names and factual biographical information may be stored. Do not scrape copyrighted player headshots or proprietary game ratings. Use generic avatars until image licensing is solved. Each identity has unique id, canonical name, aliases, nationality, positions, birth year, era, source references. Attributes are editorial estimates, versioned and explained, never presented as official.

## Attribute schema (0-100, fictional editorial estimates)
first_touch, dribbling, passing, vision, finishing, shooting, pace, stamina, physical, tackling, positioning, composure.
Optional: preferred_foot, positions, peak_period. Ratings have default evidence/source notes and revision metadata.
Chemistry depends on complementary roles and style interactions, not fabricated claims of personal friendships.

## Architecture proposal
Offline-first browser game. Data isolated from engine, engine isolated from rendering. No backend required in v0.2. Explicit module boundaries:
- src/data/players.* — verified initial fixture database and aliases
- src/search/* — normalization, matching, disambiguation
- src/sim/* — seeded PRNG, team strengths, event engine, rules
- src/ui/* — recall entry, confirmation, team builder, match playback
- tests/* — deterministic edge and fairness checks.
Codex may adapt structure to existing code once actual prototype source is present.

## Minimum UI
Dark sports aesthetic; desktop-first responsive. Prominent blank input fields. Accessible labels, focus states and keyboard navigation. Clear verification feedback and no automatic suggestions. Football pitch and match report. No fake disabled buttons or unimplemented interactions masquerading as complete.

## Acceptance criteria
- Name entry initially blank; no spoilers.
- Known aliases work: R9 -> Ronaldo Nazário; Sinisa / Siniša Mihajlović; Jay-Jay Okocha; Jaap Stam; Djalminha.
- Nonexistent names never resolve to made-up players.
- Intentional ambiguous names show strict identity disambiguation after search only.
- Same player cannot fill multiple slots within a team.
- Seeded simulation replay reproducible.
- 100+ repeated matches produce varied winners for competitively rated teams, not hardcoded prestige wins.
- Match output has plausible score and events; no scorer absent from team.
- Validation, tests and concise reproducible run instructions supplied.

## Current handoff state
Only README.md and GAME_DESIGN_LOCK.md were confirmed on A: at preparation time. Earlier chat prototype ZIP was NOT yet copied to A:. Do not pretend it exists; either transfer it explicitly or scaffold v0.2 in this folder.
