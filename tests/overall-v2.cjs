// THE CAGE OVR V2.0: no hidden identity bonuses, independently reproducible prime stats.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const roster=JSON.parse(read('docs/roster-audit-184-current.json')).players;
const before=JSON.stringify(roster.map(p=>[p.id,p.r,p.careerTier,p.folklore,p.traits,p.position,p.secondaryPositions]));
const context={window:{THE_CAGE_PLAYERS:roster}};vm.createContext(context);vm.runInContext(read('src/overall.js'),context,{filename:'src/overall.js'});
const api=context.window.CageOverall;
assert.equal(api.VERSION,'overall-v2.0-provisional');assert.equal(api.loadedPlayers,184);
assert.equal(Object.values(api.PROFILES).reduce((s,list)=>s+list.length,0),25);
assert.equal(Object.keys(api.PROFILES).length,12);
assert.deepEqual(Object.keys(api.REVIEW_OVERRIDES),['alex-de-souza'],'only visible, provisional override');
assert.equal(JSON.stringify(roster.map(p=>[p.id,p.r,p.careerTier,p.folklore,p.traits,p.position,p.secondaryPositions])),before,'OVR must not change roster attributes');
const ids=new Set();
for(const p of roster){
 assert(!ids.has(p.id),p.id+' duplicate');ids.add(p.id);
 assert(Number.isInteger(p.overall)&&p.overall>=1&&p.overall<=99,p.id+' invalid OVR');
 assert.equal(api.compute(p),p.overall,p.id+' compute mismatch');
 const report=api.evaluate(p);
 assert(api.PROFILES[p.position].some(x=>x.name===report.archetype),p.id+' invalid archetype');
 assert(report.score>=0&&report.score<=100,p.id+' bad raw score');
 assert.equal(api.raw(p),Math.round(report.score),p.id+' raw mismatch');
 assert(Object.values(report.domains).every(x=>Number.isFinite(x)&&x>=0&&x<=100),p.id+' domain out of bounds');
 const clone={...p,attributes:{work_rate:1,stamina:1,composure:1,agility:1,marking:1}};
 assert.equal(api.compute(clone),p.overall,p.id+' OVR illegally depends on tactical supplements');
 const noMeta={...p,careerTier:'ACE',folklore:[],traits:{primary:'Wall',secondary:'Phantom'}};
 assert.equal(api.compute(noMeta),p.overall,p.id+' OVR illegally depends on metadata');
 if(p.id!=='alex-de-souza')assert.equal(api.compute(p),api.raw(p),p.id+' hidden editorial override');
}
assert.equal(ids.size,184);
const named=Object.fromEntries(roster.map(p=>[p.id,p]));
for(const [id,min,max] of [
 ['lionel-messi',94,98],['ronaldo-nazario',94,98],['zinedine-zidane',94,98],
 ['andrea-pirlo',88,94],['andres-iniesta',90,96],['xavi-hernandez',89,95],
 ['luka-modric',89,95],['juan-roman-riquelme',85,92],['ngolo-kante',84,93],
 ['sergio-busquets',84,93],['nemanja-vidic',84,93],['roy-makaay',87,94],
 ['juan-carlos-valeron',89,96]
 ]){const v=named[id].overall;assert(v>=min&&v<=max,id+' failed reference range: '+v);}
const alex=named['alex-de-souza'];
assert.equal(alex.careerTier,'ELITE');assert.equal(api.raw(alex),94);assert.equal(alex.overall,89);
assert.equal(api.REVIEW_OVERRIDES['alex-de-souza'].status,'provisional-pending-owner-approval');
console.log('OVR_V2_PASS: 184 players, 12 positions, 25 archetypes, 8 skill domains, 14 unduplicated inputs, 0 gameplay/tier bonuses, only Alex transparent provisional 89.');
