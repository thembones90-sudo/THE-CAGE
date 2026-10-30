'use strict';
const assert=require('node:assert/strict');
const Names=require('../../src/viewer-v4/label-layout.js');
const Motion=require('../../src/viewer-v4/motion.js');
const {loadViewer,fixture}=require('../viewer/harness.cjs');
const W=loadViewer(),T=W.CageViewerTimeline,rec=fixture(),tl=T.buildTimeline(rec);
const players={};for(const id of tl.ids)players[id]=rec.config.teams.flat().indexOf(id);
let checked=0,worst=0,overlap=0,baselineOverlap=0;
const bounds={x:34,y:20,w:420,h:207},R=8.5,assertBox=b=>{assert(b.x>=bounds.x-1e-6);assert(b.x+b.w<=bounds.x+bounds.w+1e-6);assert(b.y>=bounds.y-1e-6);assert(b.y+b.h<=bounds.y+bounds.h+1e-6);};
for(let i=0;i<=350;i++){
 const t=tl.total*i/350,m=Motion.sample(tl,rec.result.events,t,T);
 const sample=tl.ids.map((id,k)=>({id,name:id.slice(0,9).toUpperCase(),x:bounds.x+bounds.w*m.positions[id].u,y:bounds.y+bounds.h*m.positions[id].v,width:Math.max(26,id.length*5.8+10)}));
 const result=Names.place(sample,bounds,R,{carrier:m.ball.owner,actor:m.roles.actor,defender:m.roles.defender,height:13,gap:3});
 assert.equal(result.length,6);
 assert.deepEqual(JSON.parse(JSON.stringify(result)),JSON.parse(JSON.stringify(Names.place(sample,bounds,R,{carrier:m.ball.owner,actor:m.roles.actor,defender:m.roles.defender,height:13,gap:3}))));
 for(const b of result)assertBox(b);
 let area=0,naive=0;
 for(let j=0;j<6;j++)for(let k=j+1;k<6;k++){
  area+=Names.intersect(result[j],result[k]);
  naive+=Names.intersect({x:sample[j].x-sample[j].width/2,y:sample[j].y-24,w:sample[j].width,h:13},
                        {x:sample[k].x-sample[k].width/2,y:sample[k].y-24,w:sample[k].width,h:13});
 }
 overlap+=area;baselineOverlap+=naive;worst=Math.max(worst,area);checked++;
}
console.log('V51_LABEL_LAYOUT',checked,'frames','collision total',overlap.toFixed(1),'naive total',baselineOverlap.toFixed(1),'worst frame',worst.toFixed(1));
assert(overlap<=baselineOverlap*.6,'name collision should drop >=40% vs naive');
console.log('V51_LABEL_TEST_PASS');
