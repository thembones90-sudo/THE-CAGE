// Generate a readable snapshot of all players and unresolved editorial work.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const a=JSON.parse(fs.readFileSync(path.join(root,'docs/roster-audit-178.json'),'utf8'));
const proposal=JSON.parse(fs.readFileSync(path.join(root,'proposals/trait-pairs-missing-61.json'),'utf8')).traits;
const errors=a.errors.filter(e=>e.kind!=='trait-pair-invalid');
const title=p=>p.name.replace(/\|/g,'\\|');
const score=p=>[p.r.pace,p.r.tech,p.r.pass,p.r.finish,p.r.def,p.r.phys].join('/');
const lines=[
'# THE CAGE — 178-player roster audit',
'',
'> Review snapshot only. Does not alter active player data, activate T3, or approve any new tier/trait assignments.',
'',
'## Data-health summary',
'',
'- **178 unique player IDs** with all 17 prime attributes and all five tactical attributes present.',
'- **178 natural positions** mapped; 12 position types.',
'- **138 missing career tiers**, all of which also lack an explicit folklore array. Absence of folklore is not the same as a reviewed NONE.',
'- **61 players lack BOTH traits**, although the rules require exactly one primary and one secondary.',
'- **115 players have provisional T3 supplemental attributes**; 63 are marked non-provisional.',
'- **Zero duplicate normalized names/aliases**, zero invalid rating numbers, and all existing talisman badges include explicit clubs.',
'- **No STREET VILLAIN labels** currently exist in the code even though candidates such as Roy Keane were discussed.',
'- **High-rating concentration:** 72 players have Technique 90+, 57 have Passing 90+, and 64 have Finishing 90+; these deserve a calibration review, not arbitrary immediate downgrades.',
'- **Default engine is legacy v0.4**, while T3 is loaded only via `?engine=t3`. Even T3 traits are currently opt-in, not default.',
'- **Legacy `tests/showdown-engine.cjs` is stale:** expects 63 original records but initial modules load 64; other current integration/UI/T3 tests pass.',
'',
'## Current career-tier inventory',
'',
'| Tier | Players saved |',
'|---|---:|',
...Object.entries(a.distribution.tier).map(([t,n])=>`| ${t} | ${n} |`),
'',
'## Current folklore inventory',
'',
'| Folklore | Saved recipients |',
'|---|---:|',
...Object.entries(a.distribution.folklore).map(([t,n])=>`| ${t} | ${n} |`),
'| STREET VILLAIN | 0 |',
'',
'## Proposed trait-pair repairs (NOT IMPLEMENTED)',
'',
'Only these 61 players currently have no trait pair. Each suggestion is **provisional editorial work**.',
'',
'| Player | Natural position | Suggested primary | Suggested secondary |',
'|---|---|---|---|'
];
for(const p of a.players.filter(p=>!p.traits).sort((x,y)=>x.name.localeCompare(y.name))){
 const t=proposal[p.id];lines.push(`| ${title(p)} | ${p.position} | ${t?.primary||'MISSING PROPOSAL'} | ${t?.secondary||'MISSING PROPOSAL'} |`);
}
lines.push('','## Full 178-player classification and ratings index','','Rating shorthand: PAC / TEC / PAS / FIN / DEF / PHY. **UNREVIEWED** means absent metadata, not a low tier.','','| Player | Country | Pos. | Career tier | Folklore | Traits | PAC/TEC/PAS/FIN/DEF/PHY | Tactical 5 |','|---|---|---|---|---|---|---|---|');
for(const p of [...a.players].sort((x,y)=>x.name.localeCompare(y.name))){
 const tr=p.traits?p.traits.primary+' / '+p.traits.secondary:'**MISSING**';
 const folklore=p.folklore?(p.folklore.length?p.folklore.join(', '):'None'):'UNREVIEWED';
 lines.push(`| ${title(p)} | ${p.country} | ${p.position} | ${p.careerTier||'**UNREVIEWED**'} | ${folklore} | ${tr} | ${score(p)} | ${p.provisionalTactical?'Provisional':'Baseline'} |`);
}
lines.push('','## Historical classifications requiring reconciliation','','These were previously discussed, but are absent from current career-tier metadata. They are **not** being silently granted here.','','| Player | Discussed classification |',
'|---|---|',
'| Cristiano Ronaldo | TITAN; STREET HERO + STREET VILLAIN |',
'| Ronaldo Nazário | TITAN; STREET HERO + UNDERDOG |',
'| Paolo Maldini | TITAN; TALISMAN (AC Milan) |',
'| Roy Keane | LEGEND; STREET VILLAIN |',
'| Jay-Jay Okocha | LEGEND; STREET HERO + UNDERDOG; Magician / Surgeon |',
'| Nani | STALWART; STREET HERO |',
'| Jamie Vardy | ELITE; STREET HERO + UNDERDOG |',
'',
'**Not yet in current roster:** Diego Maradona, Eric Cantona and Raúl. Any prior classification discussion does not make them playable.',
'',
'## Recommended resolution order',
'',
'1. Review and approve the 61 missing trait pairs, then load them in a separate, tested metadata-only module.',
'2. Restore existing owner-approved folklore and career tiers; review remaining unclassified players in role-based batches.',
'3. Calibrate 115 provisional tactical profiles and investigate global high ratings (mean Technique 85.9, Passing 83.5).',
'4. Decide whether T3 and its trait-decision layer should be enabled by default; do this deliberately after match testing.',
'5. Repair the stale legacy test; run deterministic match, UI, and roster regression checks.',
'',
'Generated from the live 178-player browser roster and `tools/audit-roster.cjs`. No proposed entries in this report are active player data.'
);
const file=path.join(root,'docs/ROSTER_AUDIT_178.md');fs.writeFileSync(file,lines.join('\n')+'\n','utf8');
console.log('WROTE '+file);console.log('Players '+a.players.length+', missing trait proposals '+Object.keys(proposal).length+', unclassified '+a.unclassified.length+', hard errors excluding absent traits '+errors.length);
