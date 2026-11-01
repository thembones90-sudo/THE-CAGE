'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const files=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const ctx={window:{location:{search:''}}};vm.createContext(ctx);
for(const f of files){vm.runInContext(read(f),ctx,{filename:f});if(f==='src/replay/records.js')break;}
const E=ctx.window.CageEngine,old=ctx.window.CageEngineV65,oldKeeper=ctx.window.CageEngineV66,oldT38=ctx.window.CageEngineT38,oldT310=ctx.window.CageEngineT310,oldT311=ctx.window.CageEngineT311,G=ctx.window.CageGoalkeepers,Records=ctx.window.CageRecords;
assert.equal(E.VERSION,require('./baseline-current.cjs').CURRENT_ENGINE);assert.equal(oldT38.VERSION,'cage-t3-8');assert.equal(oldKeeper.VERSION,'cage-t3-7');assert.equal(old.VERSION,'cage-t3-6');assert.equal(G.players.length,50);assert.equal(ctx.window.CageEngineT39.VERSION,'cage-t3-9');
assert.equal(ctx.window.CAGE_ENGINE_REGISTRY['cage-t3-6'].VERSION,'cage-t3-6');assert.equal(ctx.window.CAGE_ENGINE_REGISTRY['cage-t3-7'].VERSION,'cage-t3-7');assert.equal(ctx.window.CAGE_ENGINE_REGISTRY['cage-t3-8'].VERSION,'cage-t3-8');assert.equal(oldT310.VERSION,'cage-t3-10');assert.equal(oldT311.VERSION,'cage-t3-11');
const team=[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']];
const base={teams:team,tactics:['balanced','press'],mode:'score',traits:{enabled:true}},pair=['gianluigi-buffon','rene-higuita'];
// Pinned original T3-7 GK event hashes from the immutable f0acb82 checkpoint.
const HISTORIC_T37=Object.freeze({100:'bb5034c8',101:'0f9f68e5',102:'b15b625c',103:'c0e2dea5',1500:'00414879',1570:'b8527420',9999:'945b2364'});
for(const [seed,hash] of Object.entries(HISTORIC_T37)){const result=oldKeeper.simulate({...base,seed:Number(seed),keepers:pair});assert.equal(result.eventHash,hash,'Archived T3-7 event hash changed for seed '+seed);}
let saves=0,parries=0,multi=0,goals=0;
for(let seed=100;seed<145;seed++){
 const config={...base,seed},a=old.simulate(config),b=E.simulate(config);
 const oldCheckpoint=oldT310.simulate(config);assert.equal(a.eventHash,oldCheckpoint.eventHash,'Frozen T3-10 no-GK engine must reproduce prior V6.5 hashes');
 if(oldCheckpoint.decidedBy==='regulation'){assert.equal(a.eventHash,oldT311.simulate(config).eventHash,'Frozen T3-11 must preserve no-keeper regulation: seed '+seed);}
 const originalRecord=Records.make(config,b,1);assert.equal(Records.reproduce(originalRecord).eventHash,b.eventHash);
 const historical=JSON.parse(JSON.stringify(originalRecord));historical.engineVersion='cage-t3-6';historical.paramsVersion=old.PARAMS_VERSION;historical.result=JSON.parse(JSON.stringify(a));assert.equal(Records.reproduce(historical).eventHash,a.eventHash,'V65 historical T3 replay must use archived engine');
 const cg={...config,keepers:pair},x=E.simulate(cg),y=E.simulate(cg);
 const oldGK=oldKeeper.simulate(cg),legacyKeeper=Records.make(cg,x,1),archived=JSON.parse(JSON.stringify(legacyKeeper));archived.result=JSON.parse(JSON.stringify(oldGK));delete archived.keeperRatingsVersion;
 archived.engineVersion='cage-t3-7';archived.paramsVersion=oldKeeper.PARAMS_VERSION;assert.equal(Records.reproduce(archived).eventHash,oldGK.eventHash,'Original V6.6 GK replays must reproduce from frozen T3-7');

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
