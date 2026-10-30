# THE CAGE: isolated playable R1–R6 tactical preview (owner requested continuing development)
Date 2026-10-30. Research builds are not yet in browser. Produce a clearly labelled, genuinely interactive two-player browser comparison against the pinned 63-player research T3, with R1–R6 switchable via URL or button, without touching live files.

SCOPE / READ:
A:\THE CAGE\index.html, src/showdown.js, src/identity/search.js, src/replay/records.js, src/cage-commentary.js, src/players.js, proposals/t3-research/engine-t3-research.src.js, make_research.py, CLAUDE_T3_RECOVERY_PLAN.md, tools/serve.mjs.
R1–R6 research equivalent flags use D4 urgency, D5b second ball, C2 press rest=0, C1 beaten press, D1b cover-aware discipline, D3 regainer counter. Confirm from documentation, don't guess aliases.

WORK ONLY IN A:\THE CAGE\work\t3-r1-r6-preview\ (new standalone preview files). Do not modify src/, index.html, tools/, tests/, projects' root config, research sources, ratings, commits or exe. The entire live game stays on v0.4 default; no deployment.

SPEC:
- Make browser page at work/t3-r1-r6-preview/index.html, preferably reuse established game UI and actual showdown flow by loading shared CSS/JS from relative ../../src/ path if possible, with a preview-specific copy of showdown.js where needed. This MUST be playable best of five with memory recall, not merely an informational screen.
- Keep roster strictly at the 63-player pinned study, because R1–R6 flags and base research engine were validated on 63; do not deceptively claim 139. Make it impossible to select players lacking matching engine ratings, and print current count.
- Provide explicit prominent preview warnings: Research preview; R1–R6 vs bare T3; baseline is 63 players, while stable default game is v0.4 / full 139 source; experimental result not acceptance-approved.
- Avoid any saves or replay cross-contamination with stable and regular T3, via preview-local namespace or disabled persistence, and validate recorded replay integrity. Don't overwrite stable localStorage.
- Comparison mode must allow both T3 and R1–R6 research flags in a fair deterministic method: same seed+trios+tactics yield directly comparable event results. A toggle that changes engine between matches without restaging is acceptable if correctly labelled. For immediate playing, default to R1–R6.
- No forced goals, xG replacements, underdog floors, hidden stat boosts, extra RNG. Reuse current research bundle as is with flags, do not invent new mechanics.
- Test via Node VM 63 matching BY_ID and deterministic both flags, ideally browser smoke test if available. Produce README.md with exact file or local-served URL, tests, caveats and version. 
- Do NOT change production. Implement and verify independently. Return actual verified paths and test results.
