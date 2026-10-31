# THE CAGE V6.6: THE LAST LINE, EXPERIMENTAL CHECKPOINT

Date: 2026-10-31
Working branch: feature/v66-last-line
Isolated source: A:\THE CAGE V66 KEEPERS
Base: feature/v65-war-room at 2035750

**STATUS: EXPERIMENTAL DEVELOPMENT PREVIEW. NOT FULLY RELEASE-CALIBRATED OR OWNER-APPROVED.**
Original V6.5 and original A:\THE CAGE working trees were not overwritten.

## Implemented
- 30 provisional historic goalkeeper cards, seven GK-specific ratings (reflexes, positioning, handling, oneOnOne, aerialControl, distribution, sweeping), OVR weighted formula and five keeper classes. Existing 194 outfield roster and 15 outfield classes remain untouched.
- 3 outfield + 1 GK vs 3 outfield + 1 GK, optionally chosen at draft intro; **OFF by default**.
- Outfield private 15-card ABABAB and 20-second picks unchanged. After six outfield picks, two sequential hidden local GK offers, each five non-repeating candidates and 10-second pick deadline; no GK rerolls. Cross-round exhaustion forbids reusing a GK.
- Solo CPU chooses from its own five GK candidates with the selected difficulty, no privileged match-engine access.
- T3-7 records genuine gk_save / gk_parry / wide / goal outcomes without a second goalkeeper roll suppressing goals, applies bounded keeper-specific logit offset relative to neutral reference keeper, tracks GK statistics and logs keeper IDs and shot zone.
- Current full regulation scoreline remains authoritative; Golden Goal still only if tied after regulation.
- New GK replay schema 2 with event-hash, recorded keeper IDs and keeper stats validation. Archived original cage-t3-6 engine remains installed, with 45 exact old-match hashes verified. Older regular draft saved state remains at separate key.
- Goalkeeper state stores original five GK offers and an **absolute** 10-second deadline, survives refresh. Restart cleans the current GK save and all outstanding GK timers. Cross-history keeper reuse is rejected.
- First-pass rendered GK markers for both goal lines, recorded event-driven dive/lateral reaction and save/parry ring, no animated invented event. Reduced motion supported. The established six outfield markers remain six.

## Audits and tests
- Original independent Claude Sonnet design audit: APPROVE WITH CHANGES, at A:\THE CAGE V65 WAR ROOM\docs\CLAUDE_V66_GOALKEEPER_AUDIT.md.
- Independent Claude read-only V6.6 implementation audit highlighted keeper-restart, saved-state validation, replay validation and zone issues. Those defects were corrected, with added browser and tamper tests. CLAUDE'S REPORT WAS NOT A POST-FIX SIGN-OFF.
- Current experimental gate: `tools/v66-experimental-gate.ps1`; GK roster, shot resolution, five rounds, full browser + solo, 10 GK exhaustion, recovery/discard, old V6.5/Classic records, War Room, CPU, viewer and package parity. Reproducibility gate: `tools/build-t3.cjs --check`, 1,198,144 calibrated outfield trios.
- Playback measured with `tests/v66-view-timing.cjs`: 25 GK match timelines, **45.0 seconds at Dynamic speed**; dramatic mode naturally longer. Claude's initial timing concern arose from raw viewer timeline seconds, not the existing variable-rate playback clock.
- Experimental calibration: `docs/V66_GK_BALANCE_PRELIM.json`, four conditions times 250 identical seed simulations (1,000 matches):
  - No goalkeeper 7.73 goals/match, 13.6% Golden Goal overtime
  - Buffon + Neuer 6.27 goals/match, 15.2% overtime
  - Buffon + Higuita 6.66 goals/match, 13.2% overtime
  - Higuita + Campos 6.94 goals/match, 13.6% overtime
  - No simulation crashes in sample; this is not statistical proof of full balance.

## Outstanding blocks for production V6.6
1. **P0:** Rare no-goal overtime currently reaches the underlying T3 safety throw. Needs a deterministic, event-recorded, rule-consistent finite safety resolution and stress testing across defensive trios.
2. **P1:** Goalkeeper attributes Distribution and Sweeping currently affect only card rating and potential future style, not full game tactics. Proper goal-kick distribution and through-ball anticipation must be implemented with documented deterministic engine events, and then recalibrated.
3. **P1:** Goal rate shifts and goal-kick/rebound flow require a much larger, diverse paired-seed balance investigation. 6.27-6.94 goals/match with keepers remains high.
4. **P1:** All GK tiers and seven individual attributes are provisional and require owner historical review. Current distribution 4 TITAN, 9 LEGEND, 15 ELITE, 2 STALWART, 0 ACE; 28/30 top tiers may be too generous.
5. **P1:** Strict GK offer privacy cannot be enforced in a local browser. Hotseat and solo UI conceal inactive pools, but JS/global roster/localStorage are inspectable with developer tools. Only a trusted server with commit/reveal could provide true adversarial secrecy. Local play is an honour system.
6. **P2:** GK visuals remain first pass: marker and zone-driven save/parry ring, not full animated keeper positioning, catches, distribution or rebounds.
7. **P2:** GK author-facing card polish, more comments about saves and explicit old-save management remain. Physical device, audio, screen-reader and independent post-fix final auditing not complete.

## Agent availability / provenance
Big Pickle (OpenCode free quota) and local Qwen 30B (GPU memory allocation failure) were unable to execute. Cloud Qwen retry also failed due expired API key. **Both agent sessions were stopped; neither contributed any implementation in this checkpoint.** Development was completed directly, with Claude as a read-only independent reviewer. Do not cite Big Pickle/Qwen as completed audits.

## Verified development build (post-audit fixes)

- **Experimental gate:** 18/18 selected suites PASS plus reproducible T3-7 build with 1,198,144 calibrated trios.
- **Dedicated GK browser gates:** six outfield + two GK, solo private UI, five-round/no-repeat, ten-second refresh recovery, discarding showdown (no resurrection), archived engine match hashes.
- **Viewer timing:** 25 samples all 45.0 seconds estimated real time with Dynamic playback; dramatic mode about 64 seconds. The raw source timeline is NOT actual watch time.
- **Offline static manifest:** 145 assets with generated V6.6 content-addressed service worker cache.
- **EXE smoke test:** 14/14 local HTTP resources PASS.
- **Windows experimental EXE:** `dist/TheCage-V66-Last-Line-Experimental.exe`, 112,822,272 bytes.
- **Executable SHA256:** `282E8C8BA29E18FE9DA80BE3CD2826D375D99FF6D98597A3A184FFEAF7CACEAE`.
- Binary is unsigned, and Node SEA injection prints a signature warning. Embedded site was independently tested after injection.
- Restart cleanup, replay GK-mode validation, extra shot-zone evidence, stringent GK draft stage restore, cross-history GK exhaustion validation and non-destructive active-mode save selector were corrected after Claude's independent read-only audit. No post-fix independent Claude re-signoff has occurred.

## Release handling
Experimental GK mode is opt-in and unapproved; ordinary 194-player V6.5 match rules stay available. The experimental Windows EXE is unsigned and should only be used locally. Git pushes, if performed, target feature/v66-last-line only. No production merge/deployment.
