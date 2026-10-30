# Codex balance audit

Live engine diagnostics; no ratings or parameters tuned. Ordinary rows use 1000 seeds; worst-case rows use at least 10,000. Times are simulated seconds. Mirrors are diagnostic only. Sampling uncertainty is roughly ±3 percentage points at 1,000 seeds near 50%.

| Matchup (A / B) | N | A win % | Kickoff win % | p50 | p95 | p99 | Max | Cap hits |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| balanced vs creators | 1000 | 92.6 | 49.3 | 116 | 387 | 519 | 842 | 0 |
| creators vs balanced | 1000 | 6.3 | 51.2 | 113 | 384 | 520 | 738 | 0 |
| balanced vs attackers | 1000 | 93 | 50.1 | 57 | 194 | 291 | 469 | 0 |
| attackers vs balanced | 1000 | 10.6 | 52.7 | 60 | 181 | 276 | 479 | 0 |
| balanced vs twoForwards | 1000 | 76.2 | 48.1 | 139 | 445 | 641 | 696 | 0 |
| twoForwards vs balanced | 1000 | 20.4 | 46.1 | 128 | 414 | 566 | 746 | 0 |
| creators vs attackers | 1000 | 48.8 | 50.1 | 87 | 332 | 483 | 759 | 0 |
| attackers vs creators | 1000 | 52.8 | 50.7 | 87 | 307 | 474 | 563 | 0 |
| twoForwards vs attackers | 1000 | 69.9 | 50.4 | 74 | 277 | 451 | 659 | 0 |
| attackers vs twoForwards | 1000 | 30.8 | 51.5 | 71 | 263 | 389 | 702 | 0 |
| defenders vs balanced | 1000 | 1.7 | 50.4 | 287 | 888 | 1181 | 1560 | 0 |
| balanced vs defenders | 1000 | 97.4 | 48.7 | 275 | 894 | 1186 | 1563 | 0 |
| tactics balanced / balanced | 1000 | 92.6 | 49.3 | 116 | 387 | 519 | 842 | 0 |
| tactics balanced / possession | 1000 | 94.3 | 48.8 | 105 | 371 | 545 | 867 | 0 |
| tactics balanced / press | 1000 | 91 | 48.3 | 114 | 362 | 485 | 707 | 0 |
| tactics balanced / counter | 1000 | 91.2 | 48.1 | 104 | 355 | 583 | 927 | 0 |
| tactics possession / balanced | 1000 | 88.3 | 48 | 145 | 467 | 641 | 910 | 0 |
| tactics possession / possession | 1000 | 94.1 | 47.6 | 131 | 487 | 793 | 1068 | 0 |
| tactics possession / press | 1000 | 88 | 48.7 | 156 | 480 | 646 | 1033 | 0 |
| tactics possession / counter | 1000 | 86.4 | 48.3 | 140 | 467 | 655 | 1064 | 0 |
| tactics press / balanced | 1000 | 93.5 | 48.4 | 92 | 318 | 488 | 708 | 0 |
| tactics press / possession | 1000 | 96 | 48.3 | 93 | 335 | 480 | 635 | 0 |
| tactics press / press | 1000 | 93.6 | 48.1 | 93 | 310 | 431 | 671 | 0 |
| tactics press / counter | 1000 | 92.6 | 48.1 | 88 | 333 | 579 | 941 | 0 |
| tactics counter / balanced | 1000 | 92.3 | 48.6 | 96 | 323 | 417 | 563 | 0 |
| tactics counter / possession | 1000 | 95.2 | 48.3 | 97 | 328 | 450 | 634 | 0 |
| tactics counter / press | 1000 | 91.7 | 47.8 | 93 | 284 | 383 | 528 | 0 |
| tactics counter / counter | 1000 | 90.1 | 49 | 91 | 309 | 425 | 569 | 0 |
| balanced mirror | 1000 | 48.8 | 47.3 | 146 | 485 | 772 | 1202 | 0 |
| defensive worst case | 10000 | 24.49 | 49.46 | 2365 | 5560 | 5912 | 5998 | 4268 |
| defender mirror | 10000 | 47.96 | 49 | 2962 | 5602 | 5923 | 5997 | 7137 |

Balanced vs creators has a provisional 55–65% target, never an enforced outcome. Kickoff-conditioned counts are in the JSON. This checks one actual final goal and six players throughout, not universal balance.
