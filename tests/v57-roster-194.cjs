const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=['index.html','draft.html'];
for(const f of files)assert(read(f).includes('src/recruitment-four-v1.js'),f+' missing four recruits');
const html=read('play.html'),scripts=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]),c={window:{location:{search:''}}};vm.createContext(c);
for(const f of scripts){if(f==='src/identity/search.js')break;vm.runInContext(read(f),c,{filename:f});}
for(const f of ['src/engine/legacy-v04.js','src/cage-engine.js'])vm.runInContext(read(f),c,{filename:f});
const ps=c.window.THE_CAGE_PLAYERS,E=c.window.CageEngine,api=c.window.CageOverall;
assert.equal(ps.length,194);assert.equal(new Set(ps.map(p=>p.id)).size,194);assert(E.VERSION.startsWith('cage-t3-'),'T3 should be default');assert.equal(c.window.CAGE_TACTICAL_CALIBRATION.trios,1198144);
const targets={'freddy-adu':['ACE',75],'federico-macheda':['ACE',76],'royston-drenthe':['ACE',79],'thomas-gravesen':['ACE',81],'leighton-baines':['ELITE',87],'andriy-shevchenko':['LEGEND',94],'paolo-di-canio':['ELITE',87],'gianluca-zambrotta':['LEGEND',90],'antonio-valencia':['ELITE',87],'claudio-marchisio':['ELITE',88],'mauro-camoranesi':['ELITE',88],'alex-de-souza':['ELITE',86],'juan-carlos-valeron':['ELITE',87]};
const byId=new Map(ps.map(p=>[p.id,p]));
for(const [id,[tier,ovr]] of Object.entries(targets)){const p=byId.get(id);assert(p,id+' missing');assert.equal(p.careerTier,tier,id+' tier');assert.equal(p.overall,ovr,id+' OVR');assert.equal(api.raw(p),ovr,id+' formula');}
const keys=['pace','tech','pass','finish','def','phys','first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];
const traitCatalog=new Set(['Wall','Enforcer','Anticipator','Hunter','Libero','Maestro','Architect','Destroyer','Engine','Surgeon','Predator','Magician','Executioner','Phantom','Juggernaut']);
for(const p of ps){for(const k of keys)assert(Number.isInteger(p.r[k])&&p.r[k]>=0&&p.r[k]<=100,p.id+' '+k);assert.equal(api.raw(p),p.overall,p.id+' OVR drift');for(const trait of [p.traits.primary,p.traits.secondary])assert(traitCatalog.has(trait),p.id+' invalid trait '+trait);}
const king=byId.get('ledley-king');assert(king.folklore.includes('STREET HERO')&&king.folklore.includes('TALISMAN'));assert(king.talismanClubs.includes('Tottenham Hotspur'));
const di=byId.get('paolo-di-canio');assert(['STREET HERO','STREET VILLAIN','TALISMAN'].every(x=>di.folklore.includes(x)));
assert.equal(Object.keys(api.REVIEW_OVERRIDES).length,0);
assert.equal(c.window.CageTraits.CATALOG.includes('Hunter'),true);
console.log('PASS V57 STRICT 194 roster, 17 skills, 13 owner targets, 15 valid traits, calibrated T3, folklore, zero OVR overrides');
