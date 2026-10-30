'use strict';
const assert=require('node:assert/strict');
const {loadViewer,fixture}=require('../viewer/harness.cjs');
const V=loadViewer(),T=V.CageViewerTimeline,r=fixture(),tl=T.buildTimeline(r);
let peak=0,violations=[],longs=0;
for(const seg of tl.segments){
 const steps=Math.max(10,Math.ceil((seg.tau1-seg.tau0)*100));
 let prev=T.playersAt(tl,seg.tau0),last=seg.tau0;
 for(let k=1;k<=steps;k++){
  const t=seg.tau0+(seg.tau1-seg.tau0)*k/steps;
  const curr=T.playersAt(tl,t);
  for(const id of tl.ids){
   const px=Math.hypot((curr[id].u-prev[id].u)*980,(curr[id].v-prev[id].v)*510)/(t-last);
   peak=Math.max(peak,px);
   if(px>390)violations.push({i:seg.i,type:seg.type,id,px:Math.round(px),budget:seg.motionBudgeted,delta:seg.tau1-seg.tau0});
  }
  prev=curr;last=t;
 }
 if(seg.motionBudgeted)longs++;
}
console.log(JSON.stringify({mode:tl.mode,engineVersion:tl.engineVersion,segments:tl.segments.length,retimed:longs,peakPxS:+peak.toFixed(2),violations:violations.slice(0,14)},null,2));
assert.equal(violations.length,0,'Overspeed interpolation is cosmetic but visually unacceptable');
assert.equal(tl.goals.length,1);
assert.deepEqual(Array.from(T.scoreAt(tl,tl.total)),r.result.score);
console.log('V53_VISUAL_MOTION_BUDGET_PASS');
