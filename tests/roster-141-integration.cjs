// THE CAGE: verify approved Nakata identity and current roster after adding player #141.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
const scripts=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
for(const file of scripts){if(file==='src/cage-commentary.js')break;vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});}
const players=ctx.window.THE_CAGE_PLAYERS,p=players.find(p=>p.id==='hidetoshi-nakata');
assert.equal(players.length,149);assert.equal(new Set(players.map(p=>p.id)).size,149);
assert(p,'missing Nakata');assert.equal(p.position,'CAM');assert.deepEqual(Array.from(p.secondaryPositions),['CM']);
assert.equal(p.careerTier,'LEGEND');assert.deepEqual(Array.from(p.folklore),['STREET HERO']);
assert.equal(p.traits.primary,'Surgeon');assert.equal(p.traits.secondary,'Engine');
assert.equal(p.r.pace,83);assert.equal(p.r.tech,88);assert.equal(p.r.pass,92);
assert.equal(p.r.vision,95);assert.equal(p.r.shooting,90);assert.equal(Object.keys(p.r).length,17);
assert.equal(p.attributes.work_rate,82);assert.equal(p.attributes.stamina,85);
assert.equal(Object.keys(p.attributes).length,5);
for(const query of ['Nakata','Hidetoshi Nakata','H Nakata','nakata hidetoshi'])
  assert(ctx.window.CageIdentity.resolve(query).matches?.some(x=>x.id===p.id),'search failed '+query);
assert.equal(ctx.window.CageTraits.traits(p.id)[0][0],'Surgeon');
const E=ctx.window.CageEngine;assert(E.VERSION.startsWith('cage-t3'));
const input={teams:[['hidetoshi-nakata','filippo-inzaghi','paolo-maldini'],['jay-jay-okocha','roy-keane','ronaldo-nazario']],tactics:['balanced','press'],seed:314,mode:'ko'};
const a=E.simulate(input),b=E.simulate(input);assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));assert([0,1].includes(a.winner));
console.log('PASS: 149 players; Nakata LEGEND/STREET HERO, CAM/CM, Surgeon/Engine, full ratings, search aliases, deterministic tactical match.');
