'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const c={window:{location:{search:''}}};vm.createContext(c);
for(const m of read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){vm.runInContext(read(m[1]),c,{filename:m[1]});if(m[1]==='src/replay/records.js')break;}
const W=c.window,E=W.CageEngineT311,old=W.CageEngineT310,Records=W.CageRecords;
assert.equal(E.VERSION,'cage-t3-11');assert.equal(W.CageEngine.VERSION,require('./baseline-current.cjs').CURRENT_ENGINE);assert.equal(old.VERSION,'cage-t3-10');assert.equal(W.CAGE_ENGINE_REGISTRY['cage-t3-10'],old);
const set={
 mixed:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],
 defenders:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]
};
const counters={scenarios:0,oldCapped:0,newCapped:0,newOvertime:0,goldenKickoffs:0,nonGKOvertime:0,nonGKPressure:0,regulationUnchanged:0,oldReplays:0,pressure:0};
for(const [group,teams] of Object.entries(set))for(const withKeepers of [false,true])for(let i=0;i<95;i++){
 const cfg={teams,tactics:i%2?['press','possession']:['balanced','balanced'],seed:869500+i,mode:'score',traits:{enabled:true},...(withKeepers?{keepers:['gianluigi-buffon','manuel-neuer']}:{})};
 let baseline=null;try{baseline=old.simulate(cfg);}catch(e){if(!String(e.message).includes('safety limit'))throw e;counters.oldCapped++;}
 let r;try{r=E.simulate(cfg);}catch(e){counters.newCapped++;console.log('NEW_OVERTIME_FAILURE',group,withKeepers,cfg.seed,e.message);continue;}
 counters.scenarios++;
 assert.equal(r.events.filter(e=>e.type==='goal').length,r.score[0]+r.score[1]);
 assert(r.winner===0||r.winner===1);
 assert.deepEqual(JSON.stringify(E.simulate(cfg)),JSON.stringify(r),'T3-11 RNG must be deterministic');
 if(baseline){
  const rec=JSON.parse(JSON.stringify(Records.make(cfg,W.CageEngine.simulate(cfg),1)));rec.engineVersion='cage-t3-10';rec.paramsVersion=old.PARAMS_VERSION;rec.result=JSON.parse(JSON.stringify(baseline));
  assert.equal(Records.reproduce(rec).eventHash,baseline.eventHash,'Archived T3-10 must replay exactly');counters.oldReplays++;
  if(baseline.decidedBy==='regulation'){assert.equal(r.eventHash,baseline.eventHash,'Regulation outcome must stay identical');counters.regulationUnchanged++;}
 }
 const startIndex=r.events.findIndex(e=>e.type==='golden_goal_start');
 if(startIndex>=0){
  counters.newOvertime++;if(!withKeepers)counters.nonGKOvertime++;
  const next=r.events[startIndex+1];
  assert(next&&next.type==='restart'&&next.reason==='golden_kickoff','Golden Goal must resume from neutral kickoff');
  assert(next.zone.x===0,'Golden Goal kickoff ball must start in first zone');
  assert(next.team===0||next.team===1);
  counters.goldenKickoffs++;
  assert.equal(r.decidedBy,'golden_goal');assert(r.events.at(-1).type==='goal');
 }else assert.equal(r.decidedBy,'regulation');
 for(const e of r.events.filter(e=>e.type==='golden_goal_pressure')){
  counters.pressure++;if(!withKeepers)counters.nonGKPressure++;
  assert.equal(e.reason,'prolonged_overtime_risk');
  assert(e.t>=r.regulationSeconds+900);
 }
 const saved=Records.make(cfg,W.CageEngine.simulate(cfg),1);assert.equal(Records.reproduce(saved).eventHash,saved.result.eventHash);
}
assert.equal(counters.newCapped,0,'New Golden Goal must finish in controlled sample');
assert(counters.goldenKickoffs>0&&counters.nonGKOvertime>0);
assert(counters.nonGKPressure>0,'No-keeper mode must also receive pressure relief when overtime stalls');
console.log('V69_GOLDEN_KICKOFF_PASS',JSON.stringify(counters));
