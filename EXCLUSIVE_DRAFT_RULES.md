# THE CAGE — EXCLUSIVE DRAFT & BALANCE RULES (OWNER LOCK, 2026-10-30)

THIS OVERRIDES ALL CONFLICTING INSTRUCTIONS. In particular, older specification language permitting both teams to select the same footballer is CANCELLED.

## Winning premise
Players compete on FOOTBALL MEMORY plus SMART TRIO CONSTRUCTION. The strongest trio is not necessarily the three greatest attackers. A balanced attack, midfield and defence should be the decisive structural factor, while attributes, cohesion and tactical counters still matter. A defender who can build play or an attacker who can press can cover multiple functions; do not force strict position labels if the combination genuinely covers all three phases.

## Global exclusive ownership
- During a match draft, exactly one shared draft pool exists for BOTH opponents.
- Once one competitor validly searches, confirms, and ENTERS a real player into an available team slot, that player is permanently claimed by that competitor for the current match/draft. Opponent cannot use that player. Neither side can recycle a previously claimed player in another slot or re-use him later in the same draft.
- The winner of a contested name is determined by the server-authoritative ordered successful CLAIM transaction, NOT who starts typing first and NOT whose autocomplete renders first.
- Preserve owner semantics: 'Who remembers and enters the name first owns him.' Do not auto-claim merely from typing text. Claim on successful verified insertion into a slot.
- Two near-simultaneous claims for the same canonical player ID must be resolved atomically and deterministically: exactly one winner, other immediately sees 'Already claimed by [team]'.
- Canonical aliases map to ONE identity: 'R9', 'Ronaldo Nazário', spelling variants cannot dodge exclusivity. Case, accents, formatting do not permit duplicates.
- The draft has no visible roster, suggestions, or browsing. Free-text deliberate search identifies players. Reveal a claim conflict only for a name user has independently attempted.
- On confirmed entry, claim is locked and cannot be dropped/swapped to free the player for the opponent during this match. If edits are allowed before final lock, released slots still leave that footballer in the used pool. New match resets claims unless a separate tournament mode explicitly adopts a persistent no-reuse pool.
- Claim ownership persists through match result and replay within the same match. A new standalone match starts a new pool; tournament-wide no-recycle remains a mode decision rather than an assumed cross-session rule.

## Draft fairness
Both players have access to same searchable identity database but NEVER see a browseable player list. UI has 3 empty slots/team. In real-time multiplayer, require authoritative server claim ordering, persistence/reconnect and fairness. Local hotseat prototype uses one authoritative shared state and alternating input or clear turn/claim controls; no pretending to be simultaneous multiplayer without a server.
No opponent blocking by speculative typing, half-completed search, invalid player or abandoned disambiguation.

## Team scoring
Evaluate capabilities in three PHASES: attack (chance creation, dribble, finishing), midfield (progression, control, pressing, ball recovery), defence (positioning, tackling, one-v-one, counter prevention). Strong synergy when three players cover all phases, with flexible two-way players recognized. Penalize serious gaps, e.g. three pure strikers missing build-up and protection. Do not impose hard guarantee if weaker trio includes one from each role. Provide clear per-phase bars and understandable explanation. For illustrative comparison, Martins/Owen/Stam is lethal on counters but lacks central creation/control, while Ballack/Maldini/R9 covers each phase.

## Acceptance tests for Codex
1. Player A claims R9, Player B tries Ronaldo Nazário -> rejected as claimed.
2. Player B claims Siniša Mihajlović, Player A tries Sinisa Mihajlovic -> rejected.
3. Both attempt the same player at almost the same time -> exactly one succeeds.
4. An invalid query does not claim anything.
5. A verified user must actually insert into a slot before ownership begins.
6. Remove/replace entry does not free its used player for reuse in this match.
7. Two users cannot claim same canonical player using aliases or race conditions.
8. Team balance scores distinguish complete attack/midfield/defence from 3 flashy attackers without an unfair absolute win.
9. New match resets pool, rematch/replay of existing draft retains it.
10. No browsable player selection UI or automatic player discovery.

## Assignments
CODEX: implement shared claim registry keyed by canonical player ID; transaction-safe atomic claim for any multiplayer work, clean hotseat state for local prototype, strong validation and tests, and phase-balanced team scoring. Do not overwrite unrelated work. Read this document before coding.
CLAUDE: independently audit edge cases, ownership fairness, race conditions, abusive claims, tactical phase balance and simulations. Review Codex implementation; report unaddressed design decisions.
