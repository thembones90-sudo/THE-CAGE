'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),files=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]),ctx={window:{location:{search:''}}};vm.createContext(ctx);
for(const f of files){vm.runInContext(read(f),ctx,{filename:f});if(f==='src/replay/records.js')break;}
const E=ctx.window.CageEngine,old=ctx.window.CageEngineT38,R=ctx.window.CageRecords,G=ctx.window.CageGoalkeepers;
assert.equal(E.VERSION,require('./baseline-current.cjs').CURRENT_ENGINE);assert.equal(old.VERSION,'cage-t3-8');assert(G.RATINGS_VERSION.includes('v68'));
const base={teams:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],tactics:['balanced','press'],mode:'score',traits:{enabled:true},keepers:['gianluigi-buffon','rene-higuita']};
const hashes={100:'95be1c5d',101:'4483cdf2',102:'822c2162',103:'5ab0f48d',1500:'e60dbf5d',1570:'61fe5c6f',9999:'7b2f98b9'};
for(const [seed,hash] of Object.entries(hashes)){const cfg={...base,seed:+seed},r=old.simulate(cfg);assert.equal(r.eventHash,hash,'T3-8 archived event hash changed '+seed);const rec=R.make(cfg,r,1),legacy=JSON.parse(JSON.stringify(rec));legacy.engineVersion='cage-t3-8';legacy.paramsVersion=old.PARAMS_VERSION;delete legacy.keeperRatingsVersion;assert.equal(R.reproduce(legacy).eventHash,hash);}
let exposedShots=0,exposedResolved=0,failedSweeps=0,changed=0;
for(let seed=4000;seed<4100;seed++){
 const cfg={...base,seed},r=E.simulate(cfg),prev=old.simulate(cfg);
 if(r.eventHash!==prev.eventHash)changed++;
 assert.equal(R.reproduce(R.make(cfg,r,1)).eventHash,r.eventHash);
 for(const e of r.events){
  if(e.type==='gk_sweep'&&e.outcome==='beaten')failedSweeps++;
  if(e.type==='shot_attempt'&&e.keeperExposed){exposedShots++;assert(cfg.teams[e.team].includes(e.actor));}
  if((e.type==='goal'||e.type==='gk_save'||e.type==='gk_parry'||e.type==='shot_miss')&&e.calc?.exposureLogit===.52)exposedResolved++;
 }
 if(seed===4000){const rec=JSON.parse(JSON.stringify(R.make(cfg,r,1)));rec.keeperRatingsVersion='wrong-v';assert.throws(()=>R.validate(rec),/ratings version mismatch|Unknown goalkeeper ratings catalog/);}
}
assert(failedSweeps>0&&exposedShots>0&&exposedResolved>0&&changed>0,'Failed keeper sweeps must create real, recorded shot exposure');
for(let seed=4000;seed<4050;seed++){const cfg={...base,seed};delete cfg.keepers;const previous=ctx.window.CageEngineT310.simulate(cfg),current=E.simulate(cfg);assert.equal(previous.eventHash,old.simulate(cfg).eventHash,'Frozen T3-10 no-keeper baseline must equal original T3-8');if(previous.decidedBy==='regulation')assert.equal(ctx.window.CageEngineT311.simulate(cfg).eventHash,previous.eventHash,'Archived T3-11 must preserve non-GK regulation results');}
console.log('V67_SWEEP_EXPOSURE_PASS old T3-8 pinned=7, failed sweeps='+failedSweeps+', exposed shots='+exposedShots+', exposed resolved='+exposedResolved+', changed GK seeds='+changed+', no-GK parity=50');
