'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('play.html'),files=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const c={window:{location:{search:''}}};vm.createContext(c);
for(const file of files){vm.runInContext(read(file),c,{filename:file});if(file==='src/replay/records.js')break;}
const W=c.window,live=W.CageGoalkeepers,old=W.CageGoalkeepersGK30,R=W.CageRecords,E=W.CageEngine;
assert.equal(live.players.length,50);assert.equal(old.players.length,30);assert.equal(E.VERSION,require('./baseline-current.cjs').CURRENT_ENGINE);
assert.equal(live.BY_ID['jose-luis-chilavert'].careerTier,'LEGEND');
assert.equal(live.BY_ID['jose-luis-chilavert'].overall,90);
assert.equal(old.BY_ID['jose-luis-chilavert'].careerTier,'ELITE');
assert.equal(old.BY_ID['jose-luis-chilavert'].overall,85);
assert.deepEqual(Array.from(live.BY_ID['jose-luis-chilavert'].folklore),['STREET HERO','STREET VILLAIN','TALISMAN']);
assert.equal(live.RANKED.length,50);assert.equal(live.RANK_BY_ID['jose-luis-chilavert'],live.RANKED.findIndex(g=>g.id==='jose-luis-chilavert')+1);
for(const g of live.players){assert(Number.isInteger(g.overall));assert.equal(g.overall,live.rawOverall(g));assert(live.RANK_BY_ID[g.id]>=1&&live.RANK_BY_ID[g.id]<=50);}
const expected=fs.readFileSync(path.join(root,'src/goalkeepers-gk30.js'),'utf8').replace('root.CageGoalkeepersGK30=api','root.CageGoalkeepers=api');
const archived=fs.readFileSync(path.join(root,'src/cage-engine-v69.js'),'utf8');assert(archived.includes('gk30-v66-provisional-20261031'));
assert(expected.includes("['jose-luis-chilavert','Jose Luis Chilavert','Paraguay','ELITE'"));
const config={teams:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],tactics:['balanced','press'],mode:'score',traits:{enabled:true},seed:24680,keepers:['jose-luis-chilavert','manuel-neuer']};
const current=E.simulate(config);const currentRecord=R.make(config,current,1);
assert.equal(currentRecord.keeperRatingsVersion,live.RATINGS_VERSION);
assert.equal(R.reproduce(currentRecord).eventHash,current.eventHash);
let count=0;
for(const version of ['cage-t3-7','cage-t3-8','cage-t3-9']){
 const engine=W.CAGE_ENGINE_REGISTRY[version];assert(engine&&engine.VERSION===version);
 W.CageGoalkeepers=old;let oldResult,record;try{oldResult=engine.simulate(config);record=JSON.parse(JSON.stringify(R.make(config,oldResult,1)));}finally{W.CageGoalkeepers=live;}
 record.engineVersion=version;record.paramsVersion=engine.PARAMS_VERSION;
 if(version!=='cage-t3-9')delete record.keeperRatingsVersion;
 const before=W.CageGoalkeepers;
 const replay=R.reproduce(record);assert.equal(replay.eventHash,oldResult.eventHash);
 assert.equal(W.CageGoalkeepers,before,'Historical catalog not restored after replay');
 // Guard against a switched goalkeeper, an invalid ratings snapshot or a new-tier fingerprint.
 const tamper=JSON.parse(JSON.stringify(record));tamper.rosterFingerprint='wrong';
 assert.throws(()=>R.reproduce(tamper),/ratings version/);
 count++;
}
assert.throws(()=>live.catalog('invented-roster'),/Unknown goalkeeper ratings catalog/);
console.log('V68_GK50_HISTORY_PASS 50 new, 30 frozen, Chilavert LEGEND90 plus HERO/VILLAIN/TALISMAN; '+count+' historical T3 GK replay engines and live T3-10 reproduced');
