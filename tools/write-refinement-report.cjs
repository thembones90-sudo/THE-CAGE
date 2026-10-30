// Generate the reproducible human-readable V1.4 refinement summary.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const prior=read('docs/roster-audit-178-current.json'),historical=read('proposals/roster-178-refinement-v1.4.json');
const tactical=read('proposals/tactical-115-reviewed-v1.4.json');
const baseline=read('docs/provisional-115-baseline.json'),baselineMap=new Map(baseline.map(p=>[p.id,p]));
const players=new Map(prior.players.map(p=>[p.id,p]));
const counts={...prior.distribution.tier},badges={...prior.distribution.folklore};
for(const [id,change] of Object.entries(historical.changes)){
 const p=players.get(id);if(!p)throw Error('Unknown player '+id);
 if(change.careerTier){counts[p.careerTier]--;counts[change.careerTier]++;}
 for(const badge of change.removeFolklore||[])badges[badge]--;
}
const label=id=>players.get(id)?.name||id;
const patch=Object.entries(historical.changes);
const ratingsChanges=[];
for(const [id,review] of Object.entries(tactical.players)){
 const b=baselineMap.get(id);
 if(!b)throw Error('No baseline '+id);
 for(const [k,v] of Object.entries(review.refined)){const initial=b.attribute[k];if(initial!==v)ratingsChanges.push({id,attribute:k,before:initial,after:v,delta:v-initial});}
}
const allR=Object.entries(tactical.players).length;
if(allR!==115)throw Error('Missing tactical review');
const lines=[
'# THE CAGE — Roster refinement V1.4',
'',
'> **Owner corrections retained:** Sergio Busquets = LEGEND; Gareth Bale = LEGEND. Both remain unchanged from V1.3. Nothing in this document overrides a user-approved classification.',
'',
'## Results',
'',
'- **178 players** retained with unique IDs, natural positions, folklore decisions and exactly two traits.',
'- **40 previously approved dossiers** preserved with no changes to career tier, badges, traits, positions or 17 core attributes.',
'- **115 provisional five-attribute tactical profiles** reviewed: 65 players adjusted, 50 unchanged; all 63 non-provisional tactical profiles untouched.',
'- **7 editorial historical changes** across seven players, affecting three tiers and four STREET HERO badges. Subject to owner review.',
'- **Legacy v0.4 remains the default engine.** T3 and its decision-only trait layer remain opt-in.',
'',
'## Career tier distribution',
'',
'| Tier | Before | After |',
'|---|---:|---:|',
 ...['TITAN','LEGEND','ELITE','STALWART','ACE'].map(k=>`| **${k}** | ${prior.distribution.tier[k]||0} | ${counts[k]||0} |`),
 '',
'**Why TITAN count remains 30:** Rooney is provisionally promoted and Del Piero is provisionally moved to LEGEND. Busquets and Bale remain LEGEND following explicit owner correction.',
'',
'## Historical decisions (editorial, pending individual owner approval)',
'',
'| Player | Decision | Editorial rationale |',
'|---|---|---|',
];
for(const [id,change] of patch){
 const old=players.get(id);const parts=[];
 if(change.careerTier)parts.push(`${old.careerTier} → **${change.careerTier}**`);
 for(const badge of change.removeFolklore||[])parts.push(`remove ${badge}`);
 lines.push(`| ${label(id)} | ${parts.join('; ')} | ${change.reason||change.badgeReason||'Stricter badge distinction'} |`);
}
lines.push('',
'## Folklore selectivity',
'',
'| Badge | Before | After |',
'|---|---:|---:|',
...['STREET HERO','STREET VILLAIN','TALISMAN','UNDERDOG'].map(k=>`| ${k} | ${prior.distribution.folklore[k]||0} | ${badges[k]||0} |`),
'',
'**STREET HERO is still common**, because this is an intentionally curated roster of memorable players. The four removals target cases where style was insufficiently distinctive to justify a separate accolade. Do not erase genuinely approved folklore.',
'',
'## Tactical attribute recalibration',
'',
'| Field | Number of individual value changes | Average change when modified |',
'|---|---:|---:|');
for(const k of ['work_rate','stamina','composure','agility','marking']){
 const c=ratingsChanges.filter(v=>v.attribute===k),avg=c.length?c.reduce((a,v)=>a+v.delta,0)/c.length:0;
 lines.push(`| ${k} | ${c.length} | ${avg>=0?'+':''}${avg.toFixed(1)} |`);
}
lines.push('',
'### Notable revised profiles',
'',
'| Player | Attribute | Before | After |',
'|---|---|---:|---:|');
for(const [id,k] of [['alessandro-nesta','composure'],['fabio-cannavaro','composure'],['carles-puyol','composure'],['virgil-van-dijk','composure'],['sergio-busquets','composure'],['xavi-hernandez','composure'],['luka-modric','stamina'],['mohamed-salah','work_rate'],['samuel-etoo','work_rate'],['luis-suarez','work_rate']]){
 const b=baselineMap.get(id),r=tactical.players[id].refined;lines.push(`| ${label(id)} | ${k} | ${b.attribute[k]} | **${r[k]}** |`);
}
lines.push('',
'**Editorial meaning:** work_rate = active pressing/tracking; stamina = sustaining intensity; composure = decision-making under pressure; agility = balance and tight turning; marking = defensive anticipation. All are situational T3 supplements, not the main 17 prime stats.',
'',
'The 50 unchanged provisional profiles have been reviewed but **remain provisional**, not magically certified as exact or owner-approved. No final gameplay balancing is claimed without broader match calibration.',
'',
'## Verification',
'',
'- `node tests/roster-178-refinement-v14.cjs` checks 178 records, both owner tier corrections, all previous 40 approved classifications, all 63 non-provisional tactical profiles, 115 revised profiles, 17 preserved core ratings each and three trait-enabled deterministic simulations.',
'- `node tests/roster-178-categorization.cjs`, `node tests/roster-178-integration.cjs`, `node tests/engine-guards.cjs` and `node tests/ui-regression.cjs` run on an isolated, generated T3 engine.',
'- The active main workbench contains another agent\'s unfinished experimental engine. The refinement engine is built and tested in `A:\\CAGE-REFINEMENT-VERIFY` to avoid overwriting that work.',
'',
'## Review limitations',
'',
'- Career tiers/folklore are subjective historical classifications, not objective ranking data.',
'- Broad public honours are useful but do not substitute for user approval of close-tier decisions.',
'- Retained special traits are not reimagined in this refinement; only tactical attribute estimates and selected editorial classifications are changed.',
'',
'Generated from versioned V1.3 audit and the V1.4 source overlays.'
);
const target=path.join(root,'docs/ROSTER_REFINEMENT_V14.md');fs.writeFileSync(target,lines.join('\n')+'\n','utf8');
console.log('REFINEMENT_REPORT',target,'tierChanges',patch.length,'modifiedTacticalValues',ratingsChanges.length,'counts',JSON.stringify(counts),'badges',JSON.stringify(badges));
