const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const rec=JSON.parse(fs.readFileSync(path.join(root,'proposals/world-street-heroes-4.json'),'utf8'));
if(rec.players.length!==4)throw Error('Invalid recruitment source');
const safe=x=>JSON.stringify(x).replace(/[^\x00-\x7f]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
const js=[
"// THE CAGE: approved four-player recruitment. Editorial stats remain provisional.",
"(()=>{'use strict';",
"const players=window.THE_CAGE_PLAYERS;",
"if(players.length!==178)throw Error('Baseline must contain 178 players');",
"const rows="+safe(rec.players)+";",
"const core=['pace','tech','pass','finish','def','phys'];",
"const detail=['first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];",
"const tactical=['work_rate','stamina','composure','agility','marking'];",
"const supplement={};",
"for(const v of rows){",
"if(players.some(p=>p.id===v.id||p.name===v.name))throw Error('Duplicate world recruit '+v.id);",
"if(v.core.length!==6||v.detail.length!==11||v.extra.length!==5)throw Error('Invalid stats '+v.id);",
"if(v.core[2]!==v.detail[2]||v.core[3]!==v.detail[4]||v.core[5]!==v.detail[7])throw Error('Inconsistent attributes '+v.id);",
"const r=Object.fromEntries([...core.map((k,i)=>[k,v.core[i]]),...detail.map((k,i)=>[k,v.detail[i]])]);",
"players.push({id:v.id,name:v.name,country:v.country,role:v.role,aliases:v.aliases,peak:v.peak,careerTier:v.tier,folklore:v.folklore,traits:{primary:v.traits[0],secondary:v.traits[1]},ratingType:'editorial-provisional-v1.5',ratingNote:v.note,classificationStatus:'approved-recruitment-provisional-ratings',r});",
"supplement[v.id]={...Object.fromEntries(tactical.map((k,i)=>[k,v.extra[i]])),rationale:'Provisional editorial tactical estimates. Ratings remain subject to owner review.'};",
"}",
"window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},supplement);",
"if(players.length!==182)throw Error('Expected 182 after recruitment');",
"window.CAGE_ROSTER_VERSION='editorial-v1.5-182';",
"})();"
].join('\n')+'\n';
fs.writeFileSync(path.join(root,'src/roster-182.js'),js);
console.log('Generated 4 player profiles, 182 player total');