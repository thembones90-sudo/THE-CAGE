const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const data=read('proposals/bundesliga-recruits-10-DRAFT.json'),existing=read('docs/roster-audit-178-refined.json');
const catalog=new Set(['Wall','Enforcer','Anticipator','Tracker','Libero','Maestro','Architect','Destroyer','Engine','Surgeon','Predator','Magician','Executioner','Phantom','Juggernaut']);
const badges=['STREET HERO','STREET VILLAIN','TALISMAN','UNDERDOG'],tiers=['ACE','STALWART','ELITE','LEGEND','TITAN'];
const existingIds=new Set(existing.players.map(p=>p.id)),ids=new Set();
assert.equal(data.status,'DRAFT_OWNER_REVIEW_NOT_ACTIVE');
assert.equal(existing.total,178);
assert.equal(data.playerProfiles.length,10);
for(const p of data.playerProfiles){
 assert(!existingIds.has(p.id),'Already in playable roster: '+p.id);
 assert(!ids.has(p.id),'Duplicate candidate: '+p.id);ids.add(p.id);
 assert(tiers.includes(p.tier),p.id+' tier');
 assert(['M','F','D'].includes(p.role));
 assert.equal(p.core.length,6);assert.equal(p.detail.length,11);assert.equal(p.extra.length,5);
 for(const n of [...p.core,...p.detail,...p.extra])assert(Number.isInteger(n)&&n>=0&&n<=100,p.id+' invalid rating '+n);
 assert(p.core[2]===p.detail[2]&&p.core[3]===p.detail[4]&&p.core[5]===p.detail[7],p.id+' core/detail mismatch');
 assert(p.traits.length===2&&p.traits[0]!==p.traits[1]&&p.traits.every(n=>catalog.has(n)),p.id+' invalid traits');
 assert(p.folklore.every(n=>badges.includes(n))&&new Set(p.folklore).size===p.folklore.length,p.id+' invalid folklore');
 assert(p.folklore.includes('TALISMAN')===!!p.talismanClubs,p.id+' talisman mismatch');
 assert(p.career&&p.whyTier&&p.whyFolklore&&p.playstyle&&p.strength&&p.counter,p.id+' missing narrative');
 assert(p.sourceUrls.length>=1,p.id+' no source');
 for(const link of p.sourceUrls)assert(link.startsWith('https://'),p.id+' bad source');
}
const summary={total:data.playerProfiles.length,existingRoster:existing.total,rosterModifications:0,tiers:Object.fromEntries(tiers.map(t=>[t,data.playerProfiles.filter(p=>p.tier===t).length])),folklore:Object.fromEntries(badges.map(t=>[t,data.playerProfiles.filter(p=>p.folklore.includes(t)).length]))};
console.log('PASS: TEN DRAFT Bundesliga dossiers, 22 stats each, 15-trait catalogue compatibility, no duplicate against 178 players, no playable roster additions.');
console.log(JSON.stringify(summary));
function coreTable(p){return '| PACE | TECH | PASS | FINISH | DEF | PHYS |\n|---:|---:|---:|---:|---:|---:|\n| '+p.core.join(' | ')+' |'}
function detailTable(p){
 const labels=['First touch','Dribbling','Passing','Vision','Finishing','Shooting','Stamina','Physical','Tackling','Positioning','Composure'];
 let lines=['| Extended attribute | Rating | Extended attribute | Rating |','|---|---:|---|---:|'];
 for(let i=0;i<6;i++)lines.push('| '+labels[i]+' | '+p.detail[i]+' | '+(labels[i+6]||'')+' | '+(p.detail[i+6]??'')+' |');
 return lines.join('\n');
}
function tacticalTable(p){return '| Work rate | Stamina | Composure | Agility | Marking |\n|---:|---:|---:|---:|---:|\n| '+p.extra.join(' | ')+' |'}
const lines=[
 '# THE CAGE: Bundesliga Recruitment Dossiers, Wave 1',
 '',
 '> REVIEW ONLY. NOT IMPORTED INTO THE GAME. 178 playable players remain unchanged. These ten candidates are proposed as players #179–188 only if the owner explicitly approves implementation.',
 '',
 '## Candidate index',
 '',
 '| Candidate | Proposed career tier | Folklore | Trait pair |',
 '|---|---|---|---|',
 ...data.playerProfiles.map(p=>'| '+p.name+' | '+p.tier+' | '+(p.folklore.join(' + ')||'None')+' | '+p.traits.join(' / ')+' |'),
 '',
 'These are original prime-career editorial judgments on THE CAGE scale. The same 6 core, 11 extended and 5 provisional tactical attributes apply as in the existing 178-player roster. Career tier does not directly modify gameplay.',
 '',
];
for(const tier of ['TITAN','LEGEND','ELITE']){
 lines.push('## '+tier+' CANDIDATES','');
 for(const p of data.playerProfiles.filter(p=>p.tier===tier)){
  lines.push('### '+p.name+' · '+p.nickname,'',
 '**Nationality:** '+p.country+' · **Role:** '+p.role+' · **Position:** '+p.position+(p.secondaryPositions.length?' / '+p.secondaryPositions.join(' / '):'')+' · **Prime:** '+p.prime,'',
 '**Career tier:** '+p.tier+' · **Folklore:** '+(p.folklore.join(' + ')||'NONE')+(p.talismanClubs?' ('+p.talismanClubs.join(', ')+')':''),
 '',
 '**Primary trait:** '+p.traits[0]+' · **Secondary trait:** '+p.traits[1],
 '',
 '**Career record:** '+p.career,'',
 '**Tier rationale:** '+p.whyTier,'',
 '**Folklore rationale:** '+p.whyFolklore,'',
 '**Six core ratings:**','',coreTable(p),'',
 '**Eleven extended ratings:**','',detailTable(p),'',
 '**Five provisional tactical attributes:**','',tacticalTable(p),'',
 '**Tactical identity:** '+p.playstyle,'',
 '**Strengths:** '+p.strength,'',
 '**Counterplay:** '+p.counter,'',
 '**Historical references:** '+p.sourceUrls.map((url,i)=>'[Source '+(i+1)+']('+url+')').join(' · '),'',
 );
 }
}
lines.push('## Approval and integration safeguards','',
 '- All ten dossiers are DRAFT and are not yet individually user-approved.',
 '- No actual roster, natural-position mappings, T3 engine or game UI was modified by this dossier preparation.',
 '- The club TALISMAN affiliations are explicit and selective. UNDERDOG applies to active participants in the 2008/09 Wolfsburg title.',
 '- Earlier user tier corrections and existing player records remain untouched.',
 '- Future implementation requires separate explicit approval, roster integration, duplicate checks and deterministic T3 tests.',
 '',
 'Structured data: proposals/bundesliga-recruits-10-DRAFT.json. Validation: node tests/bundesliga-10-proposals.cjs.'
);
const mdFile=path.join(root,'proposals/BUNDESLIGA_RECRUITMENT_DOSSIERS_DRAFT.md');
fs.writeFileSync(mdFile,lines.join('\n')+'\n','utf8');
console.log('WROTE '+mdFile+' '+lines.length+' lines');
