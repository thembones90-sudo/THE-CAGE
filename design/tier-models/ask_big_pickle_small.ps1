$ErrorActionPreference='Stop'
$prompt=@'
You are Big Pickle, Qwen3-Coder 30B, art-direction coding partner on THE CAGE.
The five existing reusable SVG base cards are in A:\THE CAGE\design\tier-models\ (ace.svg, stalwart.svg, elite.svg, legend.svg, titan.svg), each viewBox 0 0 300 450. They each have SVG groups [data-part="frame"], [data-part="shirt"], and an info text group. JS src/tier-card-models.js overlays a flag behind shirt.
TASK: Make the five base cards radically more visually beautiful and collectible, not just color swaps. NO player-specific art, no ratings or gameplay, no underlying frame/shirt geometry changes. Work solely with decorative SVG groups, and ensure name and nationality remain readable.
Produce a runnable Python 3 script, NO MARKDOWN, that loads each SVG with pathlib, inserts a distinct tier-specific visually striking group BEFORE [data-part="shirt"] using string replace, and adds visual decoration distinct to each tier:
ACE vintage sticker with ornamental printed guilloche/halftone
STALWART copper industrial stamped gear rails and bolt structures
ELITE fragmented precise silver-foil shards, cool-light facets
LEGEND prestigious gold medallion engraved radial rays and laurel engraving
TITAN dark iridescent relic with spectral tracery/prismatic facets.
IMPORTANT: Preserve all existing shapes, all text, and shirt; ADD only decorations; no decorations at y=285..335 (player name and country) or y=345..407 (traits). Limit decor to artwork window perimeter, y<82 or y>411. Avoid heavy black fill covering flag. Add idempotency guard data-part="pickle-art". Python script should print updated tiers. Must not edit files except the five SVGs. Return only executable Python code.
'@
$payload=@{model='qwen3.5:9b';prompt=$prompt;stream=$false;keep_alive='2m';options=@{num_ctx=8192;num_predict=3200;temperature=0.25}}|ConvertTo-Json -Depth 5
$r=Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec 900
Set-Content 'A:\THE CAGE\design\tier-models\BIG_PICKLE_SCRIPT_DRAFT.txt' $r.response -Encoding UTF8
'BIG_PICKLE_SCRIPT_READY';$r.response.Substring(0,[Math]::Min(300,$r.response.Length))

