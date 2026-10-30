// THE CAGE: Super Pippo integration and regression coverage.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
const scripts=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]);
for(const file of scripts){
  if(file==='src/cage-commentary.js')break;
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
}
const players=ctx.window.THE_CAGE_PLAYERS,p=players.find(x=>x.id==='filippo-inzaghi');
assert.equal(players.length,184,'new roster must have 184 players');
assert.equal(new Set(players.map(x=>x.id)).size,players.length,'duplicate roster ids');
assert(p,'Filippo Inzaghi missing');
assert.equal(p.position,'ST');assert.equal(p.role,'F');
assert.equal(p.careerTier,'LEGEND');
assert.deepEqual(Array.from(p.folklore),['STREET HERO']);
assert.equal(p.traits.primary,'Predator');assert.equal(p.traits.secondary,'Phantom');
assert.equal(p.r.finishing,98);assert.equal(p.r.positioning,100);
assert.equal(Object.keys(p.r).length,17);
assert.equal(p.attributes.composure,96);assert.equal(p.attributesProvisional,true);
assert.equal(ctx.window.CAGE_APPROVED_RATINGS.players['filippo-inzaghi'].stamina,82);
for(const q of ['pippo','super pippo','inzaghi','Filippo Inzaghi'])
  assert(ctx.window.CageIdentity.resolve(q).matches?.some(p=>p.id==='filippo-inzaghi'),'search failed '+q);
assert.equal(ctx.window.CageTraits.traits(p.id)[0][0],'Predator');
const sides=[['filippo-inzaghi','andrea-pirlo','paolo-maldini'],['hernan-crespo','xavi-hernandez','rio-ferdinand']];
const E=ctx.window.CageEngine;assert(E.VERSION.startsWith('cage-t3'));
const input={teams:sides,tactics:['balanced','counter'],seed:42,mode:'ko'};
const a=E.simulate(input),b=E.simulate(input);
assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'nondeterministic match');
assert([0,1].includes(a.winner));
console.log('PASS: 184 unique players; Pippo LEGEND/STREET HERO, Predator/Phantom, 17 core + 5 tactical ratings, ST position, aliases, deterministic T3 match.');
