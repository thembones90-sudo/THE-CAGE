'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const before=JSON.parse(fs.readFileSync(path.join(root,'tests/v55-baseline.json'),'utf8'));
const after=JSON.parse(fs.readFileSync(path.join(root,'tests/v55-candidate-final.json'),'utf8'));
const W=require('./viewer/harness.cjs').loadEngine(),E=W.CageEngine,I=W.CageTacticalIntelligence;
assert.equal(before.engine,'cage-t3-5');assert.equal(after.engine,'cage-t3-6');
assert.equal(E.PARAMS_VERSION,'t3-space-5');
assert.equal(W.THE_CAGE_PLAYERS.length,182);
assert.equal(before.rows.length,24);assert.equal(after.rows.length,24);
let maxOtherShift=0,capsBefore=0,capsAfter=0;
for(let i=0;i<before.rows.length;i++){
 const a=before.rows[i],b=after.rows[i];
 assert.equal(a.lineup,b.lineup);assert.deepEqual(a.tactics,b.tactics);
 assert.equal(a.matches,140);assert.equal(b.matches,140);
 assert.equal(b.matches,b.caps+b.completed,'completed + safety limits must equal scheduled games');
 capsBefore+=a.caps;capsAfter+=b.caps;
 if(a.lineup!==1){
  assert.equal(a.caps,0);assert.equal(b.caps,0,'unexpected timeout introduced for ordinary lineup '+JSON.stringify(b.tactics));
  const shift=Math.abs(a.winPctA-b.winPctA);maxOtherShift=Math.max(maxOtherShift,shift);
  assert(shift<=12,'ordinary teams unacceptably shifted winner rate '+b.tactics+' '+shift);
 }
}
const one=(r,first,second)=>r.rows.find(x=>x.lineup===1&&x.tactics[0]===first&&x.tactics[1]===second);
const a=one(before,'possession','press'),b=one(after,'possession','press');
assert(b.winPctA>=15&&b.winPctA-a.winPctA>=5,'positionally unrealistic Press advantage not corrected');
const pc=one(after,'press','counter');assert(pc.winPctA>=40&&pc.winPctA<=65,'press vs counter remains one-sided');
const p=one(after,'press','balanced');assert(p.winPctA>=40&&p.winPctA<=70,'press vs balanced remains one-sided');
assert(capsAfter<=capsBefore+3,'new tactics substantially raised capped games');
console.log('V55_BALANCE_GATES_PASS '+JSON.stringify({cases:24,gamesPerEngine:3360,capBefore:capsBefore,capAfter:capsAfter,DDD_possession_vs_press:{before:a.winPctA,after:b.winPctA},DDD_press_vs_counter:pc.winPctA,DDD_press_vs_balanced:p.winPctA,maxOrdinaryWinRateShift:maxOtherShift}));
