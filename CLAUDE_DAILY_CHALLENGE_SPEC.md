# THE CAGE: Daily Challenge specification

**Status:** proposal for owner approval. Codex implements; Claude did not touch any production file.
**Author:** Claude, 2026-10-30.
**Depends on:** an engine that passes T3 acceptance (see `CLAUDE_T3_RECOVERY_PLAN.md`, and §6 below). Don't launch the daily on an engine where picks barely matter.

## 1. What it is

Once a day, everyone gets the same five rival trios with the same tactics and the same match seeds. You play a best-of-five against them alone, recalling your players from memory as usual. You get one attempt per day, and at the end a result card you can paste anywhere without spoiling it.

Why this should work:
- A fixed daily puzzle gives a reason to come back tomorrow.
- A shared puzzle gives a reason to compare results.
- Deterministic seeds make it fair: two people who pick the same trio and tactic get the same match.

## 2. Rules (all absolute rules are kept)

| Rule | How the daily keeps it |
|---|---|
| 3 per team, all six stay on the pitch | Unchanged. |
| Memory-first claiming, no browsing or autocomplete | Unchanged. Same recall input and identity resolver as the showdown. |
| No reuse across the best-of-five; first to 3 wins | Unchanged. The rival's 15 players are also unavailable to you, so you can't simply copy them. |
| First actual goal wins; no forced goals or xG decisions | Unchanged engine termination. |
| Commentary reads events only | Unchanged. |
| Deterministic seeds | Round seed = `hash32('cage-daily:' + dateUTC + ':' + round)`. |
| No pre-match win probability | Nothing shows odds or a difficulty number for a round. The rival's player cards show exactly what claimed cards show today. |

**Flow of one round:**
1. The rival trio and its tactic are revealed in full.
2. You recall and claim three players.
3. You choose a tactic and lock.
4. The match plays with that round's seed.

Showing the rival first is deliberate. Counter-picking, and choosing a tactic against a known opponent, is where knowledge becomes reward.

Because the rival trios are fixed, the main strategic tension is managing your memory across five rounds. You face a known escalation, and you have to decide whether to spend your best defenders now or save them for round 5.

## 3. Daily content generation (deterministic, no server)

`dailyContent(dateUTC, engineVersion, rosterVersion)` runs in the browser and returns:

```
{ id: 'daily-2026-11-02', number: <days since launch>, theme, rounds: [ { trio:[id,id,id], tactic, seed } ×5 ] }
```

**Generator:**
1. Seed sfc32 from `hash32('cage-daily-content:' + dateUTC)`.
2. **Theme (optional, about 1 day in 4):** a filter on the rival pool only, e.g. one nation, one decade or one club. Themes never restrict the player's own pool.
3. **Escalation:** five rival trios drawn without overlap, with mean player quality rising by round. The default bands are percentiles of trio quality on the current roster: R1 35–50, R2 45–60, R3 55–70, R4 65–80, R5 75–92.
4. **Identity:** each trio comes from a different composition template (artists, hardmen, midfield, MBR, mixed), so the five rounds pose five different problems.
5. **Tactic:** each trio gets the tactic that fits its identity (hardmen press or counter; midfield possession; artists balanced or counter). The fit is decided by an offline table, not by simulating the day.

**Validation (offline, in Codex's test suite, never shown to players):**
- For the next 365 dates, generate each day.
- Check each rival round against a reference set of strong but fair answers: the top 10% of trios still available from the remaining pool, all four tactics.
- A day is rejected and regenerated, deterministically with salt `:r1`, `:r2` and so on, if any of these hold:
  - the best answer to a round wins under 45% (the round is a wall);
  - the median answer to round 5 wins over 70% (no climax);
  - a single trio is the best answer to three or more rounds (one solution).

This is quality control on content, like playtesting a level. It's not a win probability, and nothing from it reaches the screen.

## 4. One attempt, streaks and practice

- **One attempt per day,** recorded in localStorage under `the-cage.daily.v1`: `{ id, result, picks, tactics, replayRecords }`. With no server this is honour-system only. Clearing storage lets you replay, which is acceptable.
- **Streaks:** consecutive days played, plus consecutive days won. A broken streak shows nothing punitive.
- **Practice:** after the daily attempt is finished, the same day unlocks in practice mode, so players can test other picks. Practice results never touch the card or the streaks.
- **Past dailies:** playable as practice from a calendar, generated locally because generation is deterministic.

## 5. Result card (spoiler-free, plain text)

```
THE CAGE · Daily #17 · 3–2
R1 ⚽ 1:42   R2 ✖   R3 ⚽ 0:58   R4 ✖   R5 ⚽ 3:11
Streak 6 · 15 recalled
```

- It has no player names, so it doesn't spoil anyone's answers.
- It records the minute of each goal, which shows how the round was won.
- There's a "Copy result" button using `navigator.clipboard`, with a selectable text fallback.
- There's no share URL in v1 because no deployment is authorized. Once there's a host, the card can carry the URL.

**Replays:** each round's existing verified replay record is stored, so "Replay round 3" works from the card screen.

## 6. Engine requirements before launch

A daily is only rewarding if picks and tactics decide outcomes more than chance does. The launch gate is the engine acceptance gate, plus these daily-specific checks run by the validation suite:

| Check | Target |
|---|---|
| Best available answer vs median answer, same rival round | ≥ +15 points of win rate |
| Best tactic vs worst tactic for a fixed answer trio, averaged over rounds | ≥ 8 points (tactics matter) |
| Rounds where every answer lands within 40–60% | ≤ 10% (no coin-flip rounds) |
| Median match duration | 60–240 s; p99 < 15 min |
| Safety caps | 0 per 10k |

**Engine version pinning:** `id` includes the engine and roster versions. If the engine changes, old dailies replay on the old version or are marked "re-simulated on cage-x".

## 7. Integration points (for Codex)

| Change | Where |
|---|---|
| New solo mode entry ("Daily" next to "Showdown") | `index.html` |
| `src/daily.js` (new): content generator, solo round flow reusing claim, lock and play from `src/showdown.js` | new file; refactor showdown's slot and claim code into a shared helper rather than copying it |
| Rival side: pre-claimed, locked trio; the claim UI disabled for side B | showdown flow |
| `hash32`, using the existing sfc32 seeding | shared with the engine's RNG helpers |
| Daily storage key `the-cage.daily.v1`, separate from showdown saves | `src/replay` / records |
| `tools/validate-daily.cjs` (new): the 365-day validation in §3 and the checks in §6 | tools |

## 8. Tests

1. **Determinism:** same date gives identical content and seeds across two browsers or Node runs, verified by a hash of the content.
2. **Fairness:** same date, picks and tactics give an identical event hash.
3. **No overlap:** the rival's 15 players are unique, and none are claimable by the player.
4. **Rules:** first to 3; no reuse; the series ends when the result is decided.
5. **No probability leaks:** grep the rendered DOM for any percentage or "chance" string before the match.
6. **Validation:** the 365-day run passes; reject-and-regenerate rate is below 10%.
7. **Storage:** works with localStorage blocked (warns that attempt and streak won't be saved).

## 9. Later, not in v1

- **Rarity ("4% recalled Tugay today")** needs a server to aggregate picks, so it waits on a backend.
- **Friend challenge:** `#seed=` links for a custom showdown (needs a host).
- **Themed weeks:** a decade or nation theme for all five rival trios.
