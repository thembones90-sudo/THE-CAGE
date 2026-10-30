// THE CAGE: approved Robin van Persie folklore on an existing player.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
const scripts=[...html.matchAll(new RegExp('<script src="(src/[^"]+)"></script>','g'))].map(m=>m[1]);
for(const file of scripts){if(file==='src/cage-commentary.js')break;vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});}
const ps=ctx.window.THE_CAGE_PLAYERS,p=ps.find(x=>x.id==='robin-van-persie');
assert.equal(ps.length,184,'metadata update must preserve roster size');
assert.equal(ps.filter(x=>x.id==='robin-van-persie').length,1,'no duplicate');
assert(p,'Robin van Persie must exist');
assert.equal(p.name,'Robin van Persie');
assert.equal(p.position,'ST');
assert.equal(p.role,'F');
assert.equal(p.careerTier,'LEGEND');
assert.deepEqual(Array.from(p.folklore),['STREET HERO']);
assert.equal(p.traits.primary,'Executioner');
assert.equal(p.traits.secondary,'Magician');
assert.deepEqual([p.r.pace,p.r.tech,p.r.pass,p.r.finish,p.r.def,p.r.phys],[79,94,85,97,32,73]);
assert.equal(Object.keys(p.r).length,17);
assert.deepEqual([p.attributes.work_rate,p.attributes.stamina,p.attributes.composure,p.attributes.agility,p.attributes.marking],[68,82,94,86,35]);
for(const q of ['Robin van Persie','Van Persie','rvp'])assert(ctx.window.CageIdentity.resolve(q).matches?.some(x=>x.id===p.id),'search failed: '+q);
assert.equal(ctx.window.CageTraits.traits(p.id)[0][0],'Executioner');
const E=ctx.window.CageEngine;
assert(E.VERSION.startsWith('cage-t3'),'T3 expected');
const input={teams:[['robin-van-persie','mark-viduka','peter-crouch'],['andrey-arshavin','paolo-maldini','dejan-stankovic']],tactics:['balanced','counter'],seed:47,mode:'ko'};
const a=E.simulate(input),b=E.simulate(input);
assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'simulation must be deterministic');
console.log('PASS: Van Persie LEGEND + STREET HERO, no duplicate, 184 players, existing stats/traits unchanged, search and deterministic T3 match.');
