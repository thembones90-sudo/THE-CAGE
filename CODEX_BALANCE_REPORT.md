# Codex balance audit

Live engine diagnostics; no ratings or parameters tuned. Ordinary rows use 1000 seeds; worst-case rows use at least 10,000. Times are simulated seconds. Mirrors are diagnostic only. Sampling uncertainty is roughly ±3 percentage points at 1,000 seeds near 50%.

| Matchup (A / B) | N | A win % | Kickoff win % | p50 | p95 | p99 | Max | Cap hits |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| balanced vs creators | 1000 | 91.4 | 50.5 | 128 | 437 | 570 | 942 | 0 |
| creators vs balanced | 1000 | 7.8 | 51.1 | 125 | 418 | 704 | 899 | 0 |
| balanced vs attackers | 1000 | 91.6 | 49.5 | 63 | 225 | 362 | 546 | 0 |
| attackers vs balanced | 1000 | 10.5 | 51.8 | 64 | 216 | 325 | 544 | 0 |
| balanced vs twoForwards | 1000 | 74.9 | 48.6 | 157 | 478 | 651 | 1071 | 0 |
| twoForwards vs balanced | 1000 | 21.1 | 47 | 150 | 496 | 657 | 1215 | 0 |
| creators vs attackers | 1000 | 47.6 | 52.5 | 96 | 340 | 554 | 817 | 0 |
| attackers vs creators | 1000 | 52.1 | 50.6 | 99 | 355 | 506 | 752 | 0 |
| twoForwards vs attackers | 1000 | 72.5 | 49 | 81 | 312 | 480 | 668 | 0 |
| attackers vs twoForwards | 1000 | 29.5 | 51.8 | 79 | 296 | 475 | 1244 | 0 |
| defenders vs balanced | 1000 | 7.7 | 49.8 | 317 | 1038 | 1450 | 2235 | 0 |
| balanced vs defenders | 1000 | 91.7 | 49.4 | 314 | 1070 | 1488 | 2125 | 0 |
| tactics balanced / balanced | 1000 | 91.4 | 50.5 | 128 | 437 | 570 | 942 | 0 |
| tactics balanced / possession | 1000 | 94.2 | 48.1 | 126 | 435 | 631 | 855 | 0 |
| tactics balanced / press | 1000 | 92.1 | 49.4 | 123 | 389 | 516 | 760 | 0 |
| tactics balanced / counter | 1000 | 90.5 | 50.2 | 121 | 416 | 595 | 876 | 0 |
| tactics possession / balanced | 1000 | 89.1 | 48 | 173 | 567 | 783 | 1174 | 0 |
| tactics possession / possession | 1000 | 92.9 | 47.4 | 162 | 567 | 798 | 1368 | 0 |
| tactics possession / press | 1000 | 89.5 | 48.2 | 173 | 513 | 715 | 1198 | 0 |
| tactics possession / counter | 1000 | 87.1 | 49.2 | 164 | 573 | 780 | 1080 | 0 |
| tactics press / balanced | 1000 | 94.2 | 49.5 | 103 | 352 | 563 | 1006 | 0 |
| tactics press / possession | 1000 | 96.2 | 47.9 | 108 | 395 | 603 | 884 | 0 |
| tactics press / press | 1000 | 92.6 | 47.3 | 106 | 375 | 516 | 813 | 0 |
| tactics press / counter | 1000 | 91.2 | 49.1 | 99 | 393 | 519 | 763 | 0 |
| tactics counter / balanced | 1000 | 92.7 | 48.8 | 106 | 354 | 541 | 687 | 0 |
| tactics counter / possession | 1000 | 94.5 | 49.2 | 111 | 367 | 508 | 689 | 0 |
| tactics counter / press | 1000 | 92.3 | 48.6 | 107 | 330 | 450 | 798 | 0 |
| tactics counter / counter | 1000 | 90.2 | 49.3 | 100 | 330 | 474 | 686 | 0 |
| balanced mirror | 1000 | 47.3 | 46.2 | 170 | 561 | 728 | 1122 | 0 |
| defensive worst case | 10000 | 52.13 | 49.99 | 1446 | 4682 | 5623 | 5999 | 501 |
| defender mirror | 10000 | 49.65 | 50.11 | 1595 | 4973 | 5756 | 5997 | 689 |

Balanced vs creators has a provisional 55–65% target, never an enforced outcome. Kickoff-conditioned counts are in the JSON. This checks one actual final goal and six players throughout, not universal balance.
