'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const files=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const ctx={window:{location:{search:''}}};vm.createContext(ctx);
for(const f of files){vm.runInContext(read(f),ctx,{filename:f});if(f==='src/replay/records.js')break;}
const E=ctx.window.CageEngine,old=ctx.window.CageEngineV65,G=ctx.window.CageGoalkeepers,Records=ctx.window.CageRecords;
assert.equal(E.VERSION,'cage-t3-7');assert.equal(old.VERSION,'cage-t3-6');assert.equal(G.players.length,30);
assert.equal(ctx.window.CAGE_ENGINE_REGISTRY['cage-t3-6'].VERSION,'cage-t3-6');
const team=[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']];
const base={teams:team,tactics:['balanced','press'],mode:'score',traits:{enabled:true}},pair=['gianluigi-buffon','rene-higuita'];
let saves=0,parries=0,multi=0,goals=0;
for(let seed=100;seed<145;seed++){
 const config={...base,seed},a=old.simulate(config),b=E.simulate(config);
 assert.equal(a.eventHash,b.eventHash,'no-GK simulation must reproduce V6.5 exactly: seed '+seed);
 assert.equal(JSON.stringify(a),JSON.stringify(b),'no GK version changes must preserve all V6.5 result bytes');
 const originalRecord=Records.make(config,a,1);assert.equal(Records.reproduce(originalRecord).eventHash,a.eventHash);
 const historical=JSON.parse(JSON.stringify(originalRecord));historical.engineVersion='cage-t3-6';assert.equal(Records.reproduce(historical).eventHash,a.eventHash,'V65 historical T3 replay must use archived engine');
 const cg={...config,keepers:pair},x=E.simulate(cg),y=E.simulate(cg);
 assert.equal(JSON.stringify(x),JSON.stringify(y),'keeper deterministic simulation');
 assert.deepEqual(Array.from(x.keepers),pair);
 const gkRecord=Records.make(cg,x,1);assert.equal(gkRecord.schema,2);assert.equal(Records.reproduce(gkRecord).eventHash,x.eventHash);
 if(seed===100){const forged=JSON.parse(JSON.stringify(gkRecord));forged.result.keeperStats[pair[0]].saves++;assert.throws(()=>Records.validate(forged),/statistics disagree/);const changed=JSON.parse(JSON.stringify(gkRecord));changed.config.keepers[0]=pair[1];assert.throws(()=>Records.validate(changed));}
 assert.equal(x.score[0]+x.score[1],x.events.filter(z=>z.type==='goal').length);
 const actions=x.events.filter(z=>z.type==='gk_save'||z.type==='gk_parry');for(const e of actions)assert(pair.includes(e.gk));
 saves+=x.events.filter(z=>z.type==='gk_save').length;parries+=x.events.filter(z=>z.type==='gk_parry').length;goals+=x.events.filter(z=>z.type==='goal').length;
 if(x.score[0]+x.score[1]>1)multi++;
}
assert(saves>0&&parries>0&&goals>0);
assert.throws(()=>E.simulate({...base,seed:2,keepers:[pair[0],pair[0]]}),/different supported goalkeepers/);
console.log('V66_T3_GK_ENGINE_PASS 45 preserved historical result hashes, 45 deterministic keeper matches, '+saves+' saves, '+parries+' parries, '+goals+' goals, '+multi+' multi-goal');
