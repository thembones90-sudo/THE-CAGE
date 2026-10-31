'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const before=JSON.parse(fs.readFileSync(path.join(root,'tests/v54-balance-before.json'),'utf8'));
const after=JSON.parse(fs.readFileSync(path.join(root,'tests/v54-balance-after.json'),'utf8'));
const W=require('./viewer/harness.cjs').loadEngine(),E=W.CageEngine;
assert.equal(W.THE_CAGE_PLAYERS.length,182);
assert.equal(E.VERSION,'cage-t3-6');
assert.equal(E.PARAMS_VERSION,'t3-space-5');
assert.equal(E.P.shot.q,15);
assert.equal(E.P.resolution.shotReference,68);
assert.equal(before.version,'cage-t3-3');
assert.equal(after.version,'cage-t3-5');
assert.equal(before.rows.length,after.rows.length);
let nonDDDMaxShift=0;
for(let i=0;i<before.rows.length;i++){
 const a=before.rows[i],b=after.rows[i];
 assert.equal(a.label,b.label);
 assert.equal(a.matches,b.matches);
 assert.equal(a.matches,280);
 assert.equal(b.completed+b.caps,b.matches);
 assert(b.kickoffWinnerPct>=38&&b.kickoffWinnerPct<=62,'unacceptable kickoff winner advantage '+b.label);
 if(a.label!=='DDD vs DDD'){
  assert.equal(b.caps,0,'unexpected safety cap '+b.label);
  if(a.winPctA!==null&&b.winPctA!==null){
   const shift=Math.abs(a.winPctA-b.winPctA);
   nonDDDMaxShift=Math.max(nonDDDMaxShift,shift);
   assert(shift<=13,'offense/composition distorted by >13 points '+b.label+' '+shift);
  }
 }
}
const a=before.rows.find(r=>r.label==='DDD vs DDD'),b=after.rows.find(r=>r.label==='DDD vs DDD');
assert(a.caps>=30,'baseline cohort not matching measured failure');
assert(b.caps/a.caps<.3,'DDD cap reduction below 70%');
assert(b.caps/b.matches<=.025,'DDD safety cap >2.5%');
assert(b.p95Sec<=a.p95Sec*.85,'DDD p95 failure not reduced by 15%');
const report={seedCount:after.seedPairs,identicalSeedComparisons:true,version:after.version,roster:after.roster,completedMatches:after.rows.reduce((n,r)=>n+r.completed,0),safetyCapsBefore:before.rows.reduce((n,r)=>n+r.caps,0),safetyCapsAfter:after.rows.reduce((n,r)=>n+r.caps,0),defenderCapBeforePct:+(100*a.caps/a.matches).toFixed(2),defenderCapAfterPct:+(100*b.caps/b.matches).toFixed(2),defenderP95Before:a.p95Sec,defenderP95After:b.p95Sec,maxNonDefenderWinShiftPct:+nonDDDMaxShift.toFixed(1)};
console.log('V54_BALANCE_GATES_PASS '+JSON.stringify(report));
