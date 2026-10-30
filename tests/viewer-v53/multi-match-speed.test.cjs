'use strict';
const assert=require('node:assert/strict');
const {loadEngine,loadViewer}=require('../viewer/harness.cjs');
const E=loadEngine(),W=loadViewer(),T=W.CageViewerTimeline;
const trios=[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ronaldinho','rivaldo','alessandro-del-piero'],['nemanja-vidic','jaap-stam','thomas-gravesen'],['jay-jay-okocha','djalminha','zinedine-zidane']];
const tactics=['balanced','counter','press'];
let matches=0,segments=0,peak=0,caps=0;
for(let k=0;k<30;k++){
 const a=trios[k%4],b=trios[(k+1+(k>>2)%3)%4];if(a===b||new Set([...a,...b]).size!==6)continue;
 const config={teams:[a,b],tactics:[tactics[k%3],tactics[(k+1)%3]],seed:4100+k,mode:'ko'};
 let result;try{result=E.CageEngine.simulate(config);}catch(e){if(/safety limit/.test(e.message)){caps++;continue;}throw e;}
 const original=JSON.stringify(result),rec=E.CageRecords.make(config,result,1),tl=T.buildTimeline(rec);
 for(const s of tl.segments){
   segments++;
   const steps=Math.max(8,Math.ceil((s.tau1-s.tau0)*20));let prev=T.playersAt(tl,s.tau0),last=s.tau0;
   for(let j=1;j<=steps;j++){
    const t=s.tau0+(s.tau1-s.tau0)*j/steps,next=T.playersAt(tl,t),dt=t-last;
    for(const id of tl.ids){
      const v=Math.hypot((next[id].u-prev[id].u)*980,(next[id].v-prev[id].v)*510)/dt;
      if(v>peak)peak=v;
      assert(v<385,'overspeed '+v.toFixed(2)+' seed '+config.seed+' event '+s.i+' '+s.type+' '+id);
    }prev=next;last=t;
   }
 }
 assert.equal(JSON.stringify(result),original,'record unchanged');matches++;
}
assert(matches>=15,'Too few true 182-player T3 matches');
console.log('V53_MULTI_MATCH_SPEED_PASS matches='+matches+' segments='+segments+' caps='+caps+' peak='+peak.toFixed(2)+'px/s');
