const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),get=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const data=get('proposals/world-cult-heroes-21-DRAFT.json');
const roster=get('docs/roster-audit-184-current.json'),pending=get('proposals/bundesliga-recruits-10-DRAFT.json');
assert.equal(roster.total,184);assert.equal(data.rosterBase,184);assert.equal(data.candidates.length,21);
const used=new Set(roster.players.map(p=>p.id)),pendingIds=new Set(pending.playerProfiles.map(p=>p.id)),ids=new Set();
for(const c of data.candidates){
 assert(!used.has(c.id),'already in roster '+c.id);
 assert(!pendingIds.has(c.id),'already in pending Bundesliga recruits '+c.id);
 assert(!ids.has(c.id),'duplicate shortlist ID '+c.id);ids.add(c.id);
 assert(['TITAN','LEGEND','ELITE','STALWART','ACE'].includes(c.tier),c.id+' bad tier');
 assert(c.folklore.every(x=>['STREET HERO','STREET VILLAIN','TALISMAN','UNDERDOG'].includes(x)),c.id+' bad folklore');
 assert(c.rationale.length>20,c.id+' missing rationale');
}
const rows=['# THE CAGE: Global Cult-Hero Scouting Wave','',
'> **UNAPPROVED SHORTLIST ONLY.** 21 worldwide candidates. None is in the 184-player roster or in the ten earlier pending Bundesliga dossiers.',
'',
'This list consciously distinguishes historic career stature from STREET HERO status. Being a great scorer or beloved veteran does not automatically earn every folklore badge.',
'',
'| Candidate | Scene | Position | Tier proposal | Folklore proposal | Why recruit |',
'|---|---|---|---|---|---|',
...data.candidates.map(c=>'| '+c.name+' | '+c.scene+' | '+c.position+' | '+c.tier+' | '+(c.folklore.join(' + ')||'None')+' | '+c.rationale+' |'),
'',
'## Highest-priority dossiers to prepare',
'',
'1. **Tony Yeboah**: perhaps the clearest missing old-school thunderbolt specialist; Leeds cult legacy and spectacular volleys.',
'2. **Joaquín Sánchez**: exceptional Real Betis identification and outrageous winger longevity.',
'3. **Ali Karimi**: a critically underrepresented Asian icon and authentic dribbling genius.',
'4. **Sofiane Boufal**: a technical chaos merchant with a verified goal-of-the-season solo run.',
'5. **Guti**: inventive and technically daring passing to distinguish from our existing conductors.',
'6. **Michu**: an unusual one-season breakout monster at Swansea; memorable without overstating career tier.',
'7. **Lee Trundle**: the purest showboating wildcard; precisely the kind of player a highlights-only game should not overlook.',
'',
'## Notes',
'',
'- The game still runs the legacy v0.4 engine by default; this document does not change that.',
'- The original ten Bundesliga dossiers are **not** included in these 21 candidates.',
'- A few folklore proposals (especially TALISMAN for Di Natale and Joaquín) deserve individual approval.',
'- All tiers here are provisional: ACE does not mean a poor footballer, and TITAN cannot be inferred from a spectacular goal.',
'- Source links are collected in the companion JSON. The final dossiers should verify each career and decisive match individually.',
'',
'**Status: DRAFT, never imported.**'];
const out=path.join(root,'proposals/WORLD_CULT_HERO_SCOUTING_DRAFT.md');
fs.writeFileSync(out,rows.join('\n')+'\n');
console.log('PASS: 21 proposed cult players, no duplicate across 184 roster and 10 pending Bundesliga dossiers; '+out);
