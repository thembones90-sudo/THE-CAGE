# Goal-line alignment fix — 1 November 2026

The renderer used the turf bed (x=110–1090, y=70–580) as its playing rectangle. Both arena SVGs paint the actual boundary at x=133–1067, y=90–560. Nets were anchored at x=109/1091, placing their front faces outside the painted goal lines.

Corrected the viewer's shared WORLD rectangle to the actual painted boundary. Goal mouths now coincide exactly with x=133 and x=1067. Rectangular nets extend 52 world units behind those lines. Ball trajectories, player/keeper mapping, goal effects and wall-pass cues use the same boundary. Removed an independently drawn fallback goal outline to prevent duplicate geometry when arena art is unavailable.

Added regression checks against the actual painted rectangle in both arena.svg and arena-golden.svg, rather than merely comparing renderer constants with one another. Verified desktop/mobile scale agreement, net attachment stability and deterministic reduced-motion behaviour. Normalized recorded positions, match events, results and simulation rules remain unchanged.

Passed: goal-net-design.cjs; visual-readability.cjs; all 10 viewer-v4 replay integration checks; solo browser regression at casual/competitive/ruthless; source/public package parity. Visually inspected a real seeded replay on desktop and at actual 390px phone width with no page overflow.

Rebuilt dist/TheCage.exe, preserving dist/TheCage-before-goal-alignment.exe. Confirmed the actual executable served byte-identical corrected fx.js and renderer.js on temporary port 51934, then stopped only that temporary instance.

Visual check: http://127.0.0.1:51933/work/goal-alignment-preview.html
