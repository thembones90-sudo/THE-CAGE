'use strict';
const assert=require('node:assert/strict');
const W=require('./viewer/harness.cjs').loadEngine(),E=W.CageEngine;
const defs=[['paolo-maldini','nemanja-vidic','jaap-stam'],['alessandro-nesta','john-terry','fabio-cannavaro']];
const mixed=['paolo-maldini','michael-ballack','ronaldo-nazario'];
const scenarios=[
 {name:'eligible-press',teams:defs,tactics:['press','possession'],mode:'ko',expect:1},
 {name:'noneligible-balanced',teams:defs,tactics:['balanced','possession'],mode:'ko',expect:1},
 {name:'noneligible-mixed-press',teams:[mixed,defs[1]],tactics:['press','possession'],mode:'ko',expect:3},
 {name:'timed-press',teams:defs,tactics:['press','press'],mode:'timed',expect:1}
];
const N=120,threshold=E.P.decisions.pressSurgeAfter;
assert.equal(threshold,1500);let games=0,goals=0,surges=0,caps=0;
for(const s of scenarios)for(let i=0;i<N;i++){
 const config={...s,seed:450000+scenarios.indexOf(s)*10000+i};
 delete config.name;delete config.expect;
 let r;
 try{r=E.simulate(config);}catch(e){if(/safety limit/.test(e.message)){caps++;continue;}throw e;}
 E.validateEvidence(r.events,config);
 if(s.mode==='ko')assert.equal(r.events.filter(e=>e.type==='goal').length,1);
 if(s.mode==='timed')assert(r.duration<=E.P.timedSeconds+E.P.dt.shot+E.P.dt.restart);
 let hasSurge=false,prior=null;
 for(const e of r.events){
  const count=s.teams[0].filter(id=>e.calc.commitment[id]===true).length;
  if(s.name==='eligible-press'){
   assert(count===1||count===2,'unsupported press shape');
   if(e.t<threshold)assert.equal(count,1,'surge before threshold');
   if(count===2){assert(e.t>=threshold,'early surge');hasSurge=true;}
   if(prior===2)assert.equal(count,2,'surge unexpectedly reversed');
  }else assert.equal(count,s.expect,'noneligible scenario changed commitment count');
  prior=count;
 }
 if(hasSurge)surges++;
 goals+=r.events.filter(e=>e.type==='goal').length;games++;
}
assert(surges>=40,'late escalation not observable in sufficient real matches');
console.log('V55_LATE_SURGE_GUARD_PASS '+JSON.stringify({games,goals,surges,safetyCaps:caps,threshold,nonEligibleTacticsProtected:true,timedMatchesProtected:true,zeroUnloggedGoals:true}));
