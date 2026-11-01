'use strict';
// V6.9 starting point verification. This test does NOT imply set-piece gameplay exists.
const assert=require('node:assert/strict');
const {CURRENT_ROSTER_SIZE,CURRENT_ENGINE,REPLAY_ENGINES,SNAPSHOT_184_STOP,SNAPSHOT_190_STOP}=require('./baseline-current.cjs');

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const ctx={window:{location:{search:''}}};
vm.createContext(ctx);
for(const file of scripts){
 vm.runInContext(read(file),ctx,{filename:file});
 if(file==='src/replay/records.js')break;
}
const {CageEngine:E,CageGoalkeepers:G,CageGoalkeepersGK30:old,CageRecords:R,CAGE_ENGINE_REGISTRY:versions}=ctx.window;
assert.equal(E.VERSION,CURRENT_ENGINE,'V6.9 set-piece work must start from the current main engine');
assert.equal(G.players.length,50);
assert.equal(old.players.length,30);
assert.equal(G.BY_ID['jose-luis-chilavert'].careerTier,'LEGEND');
assert.deepEqual(Array.from(G.BY_ID['jose-luis-chilavert'].folklore),['STREET HERO','STREET VILLAIN','TALISMAN']);
assert(G.BY_ID['rogerio-ceni']&&G.BY_ID['jose-luis-chilavert']);
for(const version of REPLAY_ENGINES){
 assert.equal(versions[version].VERSION,version,'Missing historical replay engine '+version);
}
const base={teams:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],tactics:['balanced','press'],mode:'score',traits:{enabled:true},seed:6999};
for(const config of [base,{...base,keepers:['jose-luis-chilavert','rogerio-ceni']}]){
 const a=E.simulate(config),b=E.simulate(config);
 assert.equal(a.eventHash,b.eventHash,'Engine must remain deterministic at start');
 const record=R.make(config,a,1);
 assert.equal(R.reproduce(record).eventHash,a.eventHash,'Replay must reproduce exactly at start');
 assert.equal(a.events.filter(e=>e.type==='goal').length,a.score[0]+a.score[1]);
 // Keepers currently do not take kicks; that is the NEXT implementation target.
 for(const e of a.events.filter(e=>e.type==='free_kick')){
  assert(config.teams[e.team].includes(e.actor),'Baseline free kicks must have an outfield taker');
 }
 assert(!a.events.some(e=>e.type==='gk_free_kick'||e.type==='gk_penalty'),'Set-piece feature should not be silently active');
}
console.log('V69_PREP_PASS: clean '+CURRENT_ENGINE+', 50 GK, owner-approved Chilavert folklore, Ceni identity, '+REPLAY_ENGINES.length+' replay engines, two reproducible matches, no unapproved GK set pieces.');
