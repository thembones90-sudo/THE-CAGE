'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const files=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const c={window:{location:{search:''}}};vm.createContext(c);
for(const f of files){vm.runInContext(read(f),c,{filename:f});if(f==='src/replay/records.js')break;}
const E=c.window.CageEngine,G=c.window.CageGoalkeepers,R=c.window.CageRecords,Rules=c.window.CageGoalkeeperRules;
assert.equal(E.VERSION,'cage-t3-12');
const synthetic=Object.assign({},G.BY_ID['gianluigi-buffon'],{r:{...G.BY_ID['gianluigi-buffon'].r,distribution:99,sweeping:99}});
const weak=Object.assign({},synthetic,{r:{...synthetic.r,distribution:67,sweeping:63}});
assert(Rules.distribute(synthetic,0,.75).successful&&!Rules.distribute(weak,0,.75).successful);
assert(Rules.sweep(synthetic,3,.24).cleared&&!Rules.sweep(weak,3,.24).cleared);
const teams=[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']];
const config={teams,tactics:['balanced','press'],mode:'score',traits:{enabled:true},keepers:['gianluigi-buffon','rene-higuita']};
let counts={sweep:0,cleared:0,release:0,completed:0,intercepted:0,save:0,parry:0,goals:0};
for(let seed=1500;seed<1650;seed++){
 const cfg={...config,seed},a=E.simulate(cfg),b=E.simulate(cfg);
 assert.equal(a.eventHash,b.eventHash);assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.equal(a.events.filter(e=>e.type==='goal').length,a.score[0]+a.score[1]);
 const record=R.make(cfg,a,1);assert.equal(R.reproduce(record).eventHash,a.eventHash);
 for(const e of a.events){if(e.type==='gk_sweep'){counts.sweep++;if(e.outcome==='cleared')counts.cleared++;assert.equal(e.gk,cfg.keepers[1-e.team]);assert.equal(e.outcome==='cleared',e.roll<e.p);}
 else if(e.type==='gk_distribution'){counts.release++;counts.completed+=e.outcome==='complete'?1:0;counts.intercepted+=e.outcome==='intercepted'?1:0;assert.equal(e.gk,cfg.keepers[e.team]);assert.equal(e.outcome==='complete',e.roll<e.p);}
 else if(e.type==='gk_save')counts.save++;else if(e.type==='gk_parry')counts.parry++;else if(e.type==='goal')counts.goals++;}
 if(seed===1500){
  const fake=JSON.parse(JSON.stringify(record)),release=fake.result.events.find(e=>e.type==='gk_distribution');
  assert(release);release.outcome=release.outcome==='complete'?'intercepted':'complete';
  assert.throws(()=>R.validate(fake),/distribution|hash/i,'Forged keeper release must not validate');
  const forgedCat=JSON.parse(JSON.stringify(record));const reaction=forgedCat.result.events.find(e=>['gk_save','gk_parry','shot_miss'].includes(e.type)&&e.gk);
  assert(reaction,'Expected at least one keeper classification');reaction.catRoll=1;
  assert.throws(()=>R.validate(forgedCat),/classification roll/i,'Goalkeeper classification must reject out-of-range RNG');
  const forgedThreshold=JSON.parse(JSON.stringify(record)),threshold=forgedThreshold.result.events.find(e=>['gk_save','gk_parry','shot_miss'].includes(e.type)&&e.gk);
  threshold.onTargetP=0;assert.throws(()=>R.validate(forgedThreshold),/classification disagrees/i,'Forged goalkeeper classification threshold must not validate');
 }
}
assert(counts.sweep>0&&counts.release>0&&counts.cleared>0&&counts.completed>0&&counts.intercepted>0,'All keeper dynamics must actually occur');
console.log('V66_GK_DYNAMICS_PASS 150 deterministic rounds and authenticated replays',JSON.stringify(counts));
