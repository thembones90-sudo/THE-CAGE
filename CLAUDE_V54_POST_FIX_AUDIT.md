**V5.4 final release audit (read-only, nothing edited, git untouched)**

**Verdict:** The earlier P1 is fixed. I found no other P0 or P1. The release can go ahead, subject to the risks listed at the end.

**What I checked myself**

1. **The frozen trait list matches V5.3.** I loaded the full roster at the V5.3 commit (c049502), at HEAD (26ec3f4) and in the current working copy. The list of old traits now in `src/replay/records.js` has all 182 players and matches both V5.3 and HEAD with 0 differences. The working copy has 118 changed players, which is the expected count.

2. **Old Classic fingerprints rebuild exactly.** For all 182 players, the Classic fingerprint data from V5.3 is byte-identical to the working copy once the old traits are swapped in. So the fix doesn't depend on only the 3 records in the test.

3. **The test save is real.** I loaded the V5.3 code straight from git and ran it against `tests/v54-classic-v53-3round.json`. V5.3 accepts the save (score 2-1) and replays all 3 rounds.

4. **The extra check doesn't weaken tamper protection.**
   - It only applies to `cage-0.4.0` records, and accepts exactly two fingerprint values: the current one or the frozen V5.3 one.
   - An unknown player ID causes a rejection.
   - After the fingerprint check, the match is still fully re-simulated and must match the saved result.

5. **Traits don't change Classic results.** The Classic engine (`legacy-v04.js`) never reads traits, and trait mode is only accepted for `cage-t3` records. Traits only feed the fingerprint.

6. **Other checks:**
   - `src` and `public/src` copies are identical for `records.js` and `roster-trait-family-v16.js`.
   - Without `?engine=t3`, the game runs Classic `cage-0.4.0`. T3 needs `?engine=t3`, and trait mode also needs `?traits=preview`.
   - In the current roster, no player has two traits from the same family, every trait is a recognised class, and the old name "Tracker" is gone.
   - Counter indicators are off by default, are display-only and are type-checked when a save loads.

7. **Tests I ran.** These three write no files, and all passed:
   - `v54-classic-compat`: the old save is accepted and tampered records are rejected.
   - `v54-classic-parity`: all 150 full result hashes match V5.3.
   - `v54-secondary-contribution`: all 15 classes show an effect.

   Git status was the same 61 entries before and after.

**What I did not check**
- I did not run the browser tests (`classic-compat-browser`, `counter-mode-browser`, `old-version-recovery`). They create HTML files and Chrome profiles in the repo, which would break the read-only rule.
- I did not run the balance gates, inspect or launch the Windows executable, or repeat the HTTP smoke test. Those results are your team's claims, not mine.

**Remaining risks (none are P0/P1)**
1. The fix only covers V5.3 traits. Any future trait or roster edit will break Classic fingerprints the same way, unless another frozen snapshot is added or Classic fingerprints stop including traits. Worth writing down as a release rule.
2. Old T3 replays (`cage-t3-3` and `cage-t3-4`) won't replay, because only `cage-0.4.0` and `cage-t3-5` are registered. They fail safely with a message offering export, and T3 was experimental, so this is acceptable. It should go in the release notes.
3. The secondary traits are lopsided: Engine is used 64 times, Libero 5 and Predator once as a secondary. That's a balance and editorial question, not a correctness one.
4. Root `index.html` still uses the old `showdown.js`, while `public/index.html` uses `showdown-v5.js`. This was already the case at HEAD. Make sure the deploy uses `public/`.
5. The repo root is cluttered with dozens of `chrome-*` profile folders, test HTML pages, `RUN_*.ps1` scripts and audit notes. Check they are kept out of the executable and the deploy, and don't commit them.
6. The fingerprint is an unkeyed hash. It catches accidental changes, not deliberate forgery, which is the same as before. The re-simulation check is what actually protects match results.
