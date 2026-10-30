const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const rec=JSON.parse(fs.readFileSync(path.join(root,'proposals/deportivo-legends-2-approved.json'),'utf8'));
if(rec.baseRoster!==182||rec.updatedRoster!==184||rec.players.length!==2)throw Error('Invalid recruitment source');
const safe=x=>JSON.stringify(x).replace(/[^\x00-\x7f]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
const lines=[
"// THE CAGE: Valeron and Makaay recruitment with agreed full stats (prime values editorial).",
"(()=>{'use strict';",
"const players=window.THE_CAGE_PLAYERS;",
"if(players.length!==182)throw Error('Baseline must contain 182 players');",
"const rows="+safe(rec.players)+";",
"const core=['pace','tech','pass','finish','def','phys'];",
"const detail=['first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];",
"const tactical=['work_rate','stamina','composure','agility','marking'];",
"const supplement={};",
"for(const v of rows){",
"if(players.some(p=>p.id===v.id||p.name===v.name))throw Error('Duplicate Deportivo recruit '+v.id);",
"if(v.core.length!==6||v.detail.length!==11||v.extra.length!==5)throw Error('Invalid stats '+v.id);",
"if(v.core[2]!==v.detail[2]||v.core[3]!==v.detail[4]||v.core[5]!==v.detail[7])throw Error('Inconsistent attributes '+v.id);",
"const r=Object.fromEntries([...core.map((k,i)=>[k,v.core[i]]),...detail.map((k,i)=>[k,v.detail[i]])]);",
"const player={id:v.id,name:v.name,country:v.country,role:v.role,aliases:v.aliases,peak:v.peak,careerTier:v.tier,folklore:[...v.folklore],traits:{primary:v.traits[0],secondary:v.traits[1]},ratingType:'editorial-recruit-v1.6',ratingNote:v.note,classificationStatus:'approved-recruitment-v1.6',r};",
"if(v.talismanClubs)player.talismanClubs=[...v.talismanClubs];",
"players.push(player);",
"supplement[v.id]={...Object.fromEntries(tactical.map((k,i)=>[k,v.extra[i]])),rationale:'Provisional editorial tactical estimates for Deportivo recruit. Core ratings owner agreed.'};",
"}",
"window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},supplement);",
"if(players.length!==184)throw Error('Expected 184 after recruitment');",
"window.CAGE_ROSTER_VERSION='editorial-v1.6-184';",
"})();"
];
fs.writeFileSync(path.join(root,'src/roster-184.js'),lines.join('\n')+'\n');
console.log('Generated Valeron and Makaay, 184 player total');