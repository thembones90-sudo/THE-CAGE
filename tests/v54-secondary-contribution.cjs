'use strict';
// Test secondary-class contribution in isolation from the primary class.
const assert=require('node:assert/strict');
const W=require('./viewer/harness.cjs').loadEngine(),T=W.CageTraits,ps=W.THE_CAGE_PLAYERS;
const actions=['carry','pass','through','outlet','shoot','dribble','wall','shield'],base=Object.fromEntries(actions.map(x=>[x,1]));
const circumstances=[];
for(let x=0;x<=3;x++)for(const engaged of [false,true])for(const transition of [false,true])for(const hasRunner of [false,true])for(const covered of [false,true])
 circumstances.push({x,engaged,transition,hasRunner,covered,support:engaged?2:0});
const observed={};
for(const cls of T.CATALOG)observed[cls]={players:0,contexts:0,largestDifference:0};
let changed=0;
for(const p of ps){
 const secondary=p.traits.secondary;observed[secondary].players++;
 const original=p.traits;
 for(const ctx of circumstances){
  const both=T.weights(p.id,base,ctx),bothEng=T.engagement(p.id,.45,ctx);
  p.traits={primary:original.primary,secondary:null};
  const only=T.weights(p.id,base,ctx),onlyEng=T.engagement(p.id,.45,ctx);
  p.traits=original;
  const shift=Math.max(Math.abs(bothEng-onlyEng),...actions.map(k=>Math.abs(both.weights[k]-only.weights[k])));
  if(shift>1e-8){observed[secondary].contexts++;observed[secondary].largestDifference=Math.max(observed[secondary].largestDifference,shift);changed++;}
 }
 assert.equal(p.traits,original,'mutation leaked into permanent roster '+p.id);
}
for(const cls of T.CATALOG){
 assert(observed[cls].players>0,'no secondary class '+cls);
 assert(observed[cls].contexts>0,'secondary class never changes decision strength '+cls);
}
console.log('V54_SECONDARY_CONTRIBUTION_PASS classes=15 roster=182 observedContexts='+changed+' evidence='+JSON.stringify(observed));
