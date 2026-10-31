'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const files=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]),c={window:{location:{search:''}}};vm.createContext(c);
for(const f of files){vm.runInContext(read(f),c,{filename:f});if(f==='src/cage-engine.js')break;}
const old=c.window.CageEngineV66,E=c.window.CageEngine;
const teams=[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']],keepers=['gianluigi-buffon','manuel-neuer'];
let oldCaps=0,newCaps=0,pressures=0;
for(let i=0;i<180;i++){
 const cfg={teams,keepers,tactics:['balanced','press'],mode:'score',traits:{enabled:true},seed:780000+i};
 try{old.simulate(cfg)}catch(e){assert.match(e.message,/safety limit/);oldCaps++;}
 try{
  const r=E.simulate(cfg),o=r.events.filter(e=>e.type==='golden_goal_pressure');
  assert(o.length<=1,'Pressure transition must occur at most once');
  for(const e of o){assert.equal(e.reason,'prolonged_overtime_risk');assert(e.t>=r.regulationSeconds+900);assert.equal(r.decidedBy,'golden_goal');}
  pressures+=o.length;
  assert.equal(r.events.filter(e=>e.type==='goal').length,r.score[0]+r.score[1]);
  assert.notEqual(r.winner,-1,'Overtime must decide a winner');
  if(r.decidedBy==='golden_goal')assert.equal(r.events.at(-1).type,'goal');
 }catch(e){newCaps++;console.log('NEW_OT_FAIL',cfg.seed,e.message);}
}
assert(oldCaps>=2,'Test must cover original defender stall');
assert.equal(newCaps,0,'Extended Golden Goal must clear all known stall seeds');
assert(pressures>0,'Extended Golden Goal phase must have been exercised');
console.log('V66_GOLDEN_PRESSURE_PASS oldCaps='+oldCaps+' newCaps='+newCaps+' loggedPressurePhases='+pressures+' in 180 matched defender seeds');
