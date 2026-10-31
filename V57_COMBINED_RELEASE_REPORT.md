# THE CAGE V5.7 Combined Preview

Date: 31 October 2026
Branch: release/v57-v56-integrated
Source: A:\THE CAGE V57 RELEASE
Status: Local integrated release candidate. Public deployment and merge to the original workspace have not been performed.

## What is included

- 194 unique footballers. All 17 prime skill attributes are validated, ratings are formula-derived with zero identity-level OVR overrides, and 13 owner-approved reference ratings were verified.
- 15 tactical trait classes, exactly one primary and one cross-family secondary per footballer. Legacy Tracker spelling normalized to approved Hunter.
- V5.6 Golden Goal presentation: real recorded goal, optional synthesized sound OFF by default, cinematic reveal, deterministic effects, reduced-motion support, verified replay safety, responsive viewer.
- V5.7 T3-6 engine default. Legacy v0.4 is only selected explicitly.
- 194-player random draft, 15 distinct available cards, ABABAB drafting, OFF-by-default counter indicators and actual T3 simulation.
- T3 calibration rebuilt for C(194,3) = 1,198,144 unique trios.
- Archived, immutable V5.6 Classic player with the original 182-player roster for old saved games, with a visible detection link on current T3 pages. The historic Classic key is not overwritten or upgraded.

## Local play

Run dist/TheCage-V57-Combined-Preview.exe (offline, unsigned) and use the browser address printed by the launcher (default port 4184).

- Main game: http://127.0.0.1:4184/
- Random Draft: http://127.0.0.1:4184/draft.html
- Historical V5.6 Classic saves: http://127.0.0.1:4184/classic-v56/play.html
- Current engine's explicit legacy mode (194-player data): http://127.0.0.1:4184/play.html?engine=legacy

Browser localStorage is scoped to a hostname and port. To recover historical Classic data, use the same browser and server origin that originally stored it. The archived player is bundled offline and does not rewrite the historical key.

## Verified release checks

- tests/v57-roster-194.cjs
- tests/v57-trait-families.cjs --strict
- tests/random-draft.cjs with browser startup error assertion
- tests/v57-cinematic-browser.cjs, normal and --reduced-motion
- tests/v56-golden-goal-pure.cjs
- tests/full-game-browser.cjs --t3, with and without --traits-preview
- tests/v57-old-version-recovery.cjs
- tests/v57-classic-save-notice.cjs
- tests/v57-archived-classic.cjs
- tests/v54-classic-parity.cjs (150 preserved hashes)
- tests/v54-classic-compat-fuzz.cjs (31 malformed variants)
- tests/v57-build-contract.cjs (139-file package including old Classic archive)
- node tools/build-t3.cjs --check (1,198,144 trios)

## Final Windows preview verification

- Automated release gate: 17/17 test groups PASS, plus `node tools/build-t3.cjs --check` PASS.
- Generated T3 calibration: 1,198,144 player trios.
- Static package: 139 files, including the original V5.6 Classic archive.
- EXE server smoke: 11/11 HTTP routes returned 200 with non-empty content, including main game, draft, preserved Classic player, new recruits, cinematic, sound, and service worker.
- `dist/TheCage-V57-Combined-Preview.exe`: 110,197,760 bytes, SHA256 `8398CB28C4C9FF6E02CA7F38474BFF558D338BB6975EB64012672C45472C23A3`.
- `dist/TheCage-V57-Combined-Preview.zip`: 42,414,844 bytes, SHA256 `5AEA844FFA8B4BEF29675F743654C9C17285E486260CDA813F01CB323E737990`.
- The executable is unsigned. Its Node SEA injection tool emits a signature warning because it alters an unsigned Node binary; final server functionality was independently smoke-tested.

## Release handling

All development is in a distinct Git worktree. The original A:\THE CAGE checkout was not reset, overwritten or merged. The V5.6 and standalone V5.7 branches are retained. Neither this build nor the executable is signed or deployed to a public host.

Independent sign-off remains unavailable: the connected Claude OpenCode API key expired (401), while Big Pickle's follow-up re-audit reached its free-usage quota. The earlier Big Pickle audit identified P1 issues; their corrective changes are covered by automated regression tests, not a new independent sign-off. Human accessibility, physical handset and speaker tests remain outside the automated coverage.
