// Generate audited, owner-approved tier-only corrections. Do not edit other roster layers.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const decisions=JSON.parse(fs.readFileSync(path.join(root,'proposals/owner-tier-revisions-10-v17.json'),'utf8'));
if(decisions.players.length!==10||decisions.lockedLegend!=='jay-jay-okocha')throw Error('Owner decisions malformed');
if(new Set(decisions.players.map(p=>p.id)).size!==10||decisions.players.some(p=>p.id==='jay-jay-okocha'||p.from!=='LEGEND'||p.to!=='ELITE'))throw Error('Invalid owner tier corrections');
const list=decisions.players.map(p=>p.id);
const output=[
'// GENERATED from proposals/owner-tier-revisions-10-v17.json by tools/build-owner-tier-overlay.cjs.',
'// These owner tier corrections intentionally supersede historical editorial and approved decisions.',
"(()=>{'use strict';",
'const ids=Object.freeze('+JSON.stringify(list)+');',
'const roster=window.THE_CAGE_PLAYERS;',
"if(!Array.isArray(roster)||roster.length!==184)throw Error('Owner-tier overlay requires roster of 184');",
'const byId=new Map(roster.map(p=>[p.id,p]));',
"if(byId.size!==184||byId.get('jay-jay-okocha')?.careerTier!=='LEGEND')throw Error('Okocha owner-locked LEGEND status was changed');",
"for(const id of ids){const p=byId.get(id);if(!p||p.careerTier!=='LEGEND')throw Error('Expected prior LEGEND tier for '+id);p.careerTier='ELITE';p.classificationStatus='owner-confirmed-v1.7';p.tierDecision={from:'LEGEND',to:'ELITE',version:'owner-tier-decisions-v1.7'};}",
"const count=tier=>roster.filter(p=>p.careerTier===tier).length;",
"if(count('TITAN')!==30||count('LEGEND')!==69||count('ELITE')!==67||count('STALWART')!==18)throw Error('Unexpected post-decision tier distribution');",
"window.CAGE_OWNER_TIER_DECISIONS=Object.freeze({version:'owner-tier-decisions-v1.7',movedIds:ids,lockedLegend:'jay-jay-okocha'});",
"window.CAGE_ROSTER_VERSION=String(window.CAGE_ROSTER_VERSION||'editorial-184')+'+owner-tiers-v1.7';",
'})();'
].join('\n')+'\n';
fs.writeFileSync(path.join(root,'src/owner-tier-decisions-v17.js'),output);
console.log('GENERATED 10 owner-confirmed ELITE revisions; Okocha protected as LEGEND');
