// Generate reproducible 67-player owner-approved prime-rating overlay.
// Raw changed values and approved targets remain visible in the reviewed JSON.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),file=f=>path.join(root,f);
const data=JSON.parse(fs.readFileSync(file('proposals/ELITE_OVR_67_APPROVED.json'),'utf8'));
if(data.status!=='OWNER-ACCEPTED'||data.players.length!==67||data.version!=='elite-ovr-approved-v2.1')throw Error('Not approved');
const source=[
'// GENERATED from proposals/ELITE_OVR_67_APPROVED.json. Owner-approved prime skill regrading, not OVR overrides.',
"(()=>{'use strict';",
'const records='+JSON.stringify(data.players.map(p=>({id:p.id,name:p.name,target:p.approvedOVR,previous:p.previous,position:p.position,changes:Object.fromEntries(Object.entries(p.changes).filter(([key])=>!['passing','finishing','physical'].includes(key)).map(([key,arr])=>[key,arr]))})))+';',
'const players=window.THE_CAGE_PLAYERS;',
"if(!Array.isArray(players)||players.length!==184)throw Error('ELITE OVR V2.1 expects 184 players');",
'const byId=new Map(players.map(p=>[p.id,p]));',
"if(byId.size!==184||byId.get('jay-jay-okocha')?.careerTier!=='LEGEND')throw Error('Roster/Okocha classification unexpectedly changed');",
"const aliases={pass:'passing',finish:'finishing',phys:'physical'};",
'for(const row of records){',
"const p=byId.get(row.id);if(!p||p.careerTier!=='ELITE'||p.name!==row.name||!p.r)throw Error('Unexpected ELITE source '+row.id);",
"if(row.id==='sinisa-mihajlovic'){if(p.position&&p.position!=='LB')throw Error('Unexpected Mihajlovic position');p.position='CB';p.secondaryPositions=['LB','CDM'];}",
'for(const [key,expected] of Object.entries(row.changes)){',
"if(!Array.isArray(expected)||expected.length!==2||p.r[key]!==expected[0]||!Number.isInteger(expected[1])||expected[1]<0||expected[1]>100)throw Error('Unverified ELITE attribute '+row.id+' '+key);",
'p.r[key]=expected[1];if(aliases[key])p.r[aliases[key]]=expected[1];',
'}',
'p.ratingReviewStatus="owner-approved-elite-ovr-v2.1";',
'}',
'const targets=Object.freeze(Object.fromEntries(records.map(p=>[p.id,p.target])));',
"window.CAGE_ELITE_OVR_APPROVED=Object.freeze({version:'elite-ovr-approved-v2.1',targets,playerCount:records.length});",
'})();'
].join('\n')+'\n';
fs.writeFileSync(file('src/elite-ovr-approved-v21.js'),source,'utf8');
console.log('Generated attribute overlay for '+data.players.length+' approved ELITE players');
