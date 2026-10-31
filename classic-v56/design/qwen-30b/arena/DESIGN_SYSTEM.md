# THE CAGE / ARENA V2 DESIGN SYSTEM
Status: isolated visual prototype, pending owner approval.

## Identity
Mythic street football inside an original reinforced gunmetal enclosure. Not a literal ship and no reproduced branded tournament assets. Blackout turf is closer to charred technical artificial ground than saturated stadium grass.

## Shape contract
Canvas/SVG viewBox 1200x650. Live inner field x=[110,1090], y=[70,580] (980x510), landscape both goals. Center=(600,325), circle radius=84. Field line rect x=[133,1067], y=[90,560]. Compact end-area markings are stylistic, not goalkeeper mechanics. Goal entry planes x about 109/1091, goal mouth y=[242,408], net outside pitch.
Normalized mapping: px=110+980u; py=70+510v. Inverse: u=(px-110)/980, v=(py-70)/510. T3 4x3 cell center uses u=(col+0.5)/4, v=(row+0.5)/3; validate team reference frame against authoritative engine events.

## Color
Obsidian #080d10; darkest steel #0a1418; gunmetal #303c43; bright steel #82949a; blackout turf #132520; turf flash #223830; line #ccd9d2; relic gold #d5a83e; highlight #f5df9a; teams cyan #43c2e2 and crimson #d84f58.
Iron Pit uses cool white spill and slate steel. Golden Arena uses warm pools, brass edging, identical black turf and collision geometry.

## Strict layer order
1. foundation: ribs, vent panels, grating, chevrons, perimeter.
2. surface: near-black turf, texture, battle scuffs, static light; clip to live ground.
3. markings: halfway, center ring, compact goal zones, bold white paint.
4. cage-frame: raised gunmetal ribs, bolts, rebound boundaries.
5. chain-net-left/right: static net backplates, addressable chain-links-left/right.
6. goal-left/right: triple-ribbed iron mouths, collision plane reference.
7. lights: sealed floodlight strips, subtle corner pools.
8. environment-labels and variant-spill: signage and chosen material glints.
9. Dynamic renderer overlays: six player markers, gold ball, names and effects (never baked).

## Manufacturing detail
- relic-ball.svg: 200x200 gold sphere with black engraved geometric plates, polished metal rim.
- iron-maw-detail.svg: 650x380 close-up of thick, oblong interlocking metal chain links (not nylon mesh).
- Both goals compact and symmetrical, netting outside play.

## Performance & accessibility
Local scalable vector assets. Cache detailed static turf once at target DPR for Canvas integration; never regenerate scuffs per frame. Render only dynamic elements each frame. Respect reduced-motion (demo starts paused), touch 40px+ and contrast.
At narrow widths the arena scales as one 1200:650 box, both goals visible.

## Integration gate
Requires visual sign-off, authoritative replay timeline integration, performance and mobile QA. Never replace index.html, tactical engine or EXE because this artwork exists. Dummy 0:0 scoreboard in demo is not game data.
