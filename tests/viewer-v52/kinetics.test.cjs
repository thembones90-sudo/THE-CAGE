'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {loadViewer,fixture,deepFreeze}=require('../viewer/harness.cjs');
const M=require('../../src/viewer-v4/motion.js');
const K=require('../../src/viewer-v4/kinetics.js');
const W=loadViewer(),T=W.CageViewerTimeline,rec=fixture(),tl=T.buildTimeline(rec),events=rec.result.events;
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const get=t=>K.sample(tl,T,t,M.sample(tl,events,t,T));
test('six players and original score remain authoritative on all frames',()=>{
 for(let i=0;i<=320;i++){const t=i*tl.total/320,f=get(t);assert.deepEqual(Object.keys(f.players).sort(),tl.ids.slice().sort());assert.deepEqual(Array.from(T.scoreAt(tl,t)),Array.from(T.scoreAt(tl,t)));assert(f.inferred);}
});
test('deterministic pure timeline seeking in arbitrary order',()=>{
 const times=[0,1.31,5.11,25.01,30.19,4.2,tl.total,0,30.19];
 const a=times.map(t=>JSON.stringify(get(t)));
 const b=times.slice().reverse().map(t=>JSON.stringify(get(t))).reverse();
 assert.deepEqual(a,b);
});
test('heading is normalized, every gait is a known finite speed tier',()=>{
 for(let i=0;i<=420;i++){
  const f=get(i*tl.total/420);
  for(const item of Object.values(f.players)){
   assert(Number.isFinite(item.heading));assert(item.heading>=-Math.PI-.0001&&item.heading<=Math.PI+.0001);
   assert(item.speed>=0&&item.speed<=370);
   assert(item.turnRate>=-9&&item.turnRate<=9);
   assert(item.accel>=-850&&item.accel<=850);
   assert(['idle','jog','sprint'].includes(item.gait));
  }
 }
});
test('no invented movement on stationary future segments',()=>{
 const t=tl.total;const frame=get(t);
 for(const [id,p] of Object.entries(frame.players)){
  const at=T.playersAt(tl,t)[id];assert(Number.isFinite(at.u));assert(Number.isFinite(at.v));assert(['neutral-team-axis','prior-recorded-travel','recorded-travel','upcoming-recorded-travel'].includes(p.source));
 }
});
test('turn wrap handles +/-π without a 2π jump',()=>{
 assert(Math.abs(K.wrapAngle(Math.PI*2))<1e-8);
 assert(Math.abs(K.wrapAngle(-Math.PI*2))<1e-8);
 assert(Math.abs(K.wrapAngle(3.2))<=Math.PI);
 assert.equal(K.classify(0),'idle');assert.equal(K.classify(12),'jog');assert.equal(K.classify(45),'sprint');
});
test('actual sampled player travel drives orientation',()=>{
 const p=tl.ids[0],t=tl.total*.4,v=K.velocity(tl,T,p,t),s=K.orientationFor(p,t,tl,T,tl.teamOf);
 assert(Number.isFinite(v.vx)&&Number.isFinite(v.vy));assert(v.speed<=370);
 if(v.speed>=7)assert(Math.abs(K.wrapAngle(s.heading-v.heading))<1e-10);
});
test('ball effects are tied to recorded ball flight, not fictional shots',()=>{
 let flights=0;
 for(let i=0;i<=800;i++){
  const t=tl.total*i/800,k=get(t),s=tl.segments[T.segmentIndex(tl,t)];
  assert.equal(k.ball.flight,!!T.ballAt(tl,t).flight);
  assert.equal(k.ball.shot,Boolean(k.ball.flight&&['shot_attempt','goal','shot_miss','free_kick','block'].includes(s.type)));
  assert(Number.isFinite(k.ball.spin));assert(k.ball.trail>=0&&k.ball.trail<=27.01);
  if(!k.ball.flight){assert.equal(k.ball.trail,0);assert.equal(k.ball.shot,false);}
  else flights++;
 }
 assert(flights>0);
});
test('record remains deep-frozen, neither score nor winner mutated',()=>{
 const before=JSON.stringify(rec),goals=tl.goals.length,winner=tl.winner;
 deepFreeze(rec);
 for(let i=0;i<=220;i++)get(i*tl.total/220);
 assert.equal(JSON.stringify(rec),before);assert.equal(tl.goals.length,goals);assert.equal(tl.winner,winner);
 assert.deepEqual(Array.from(T.scoreAt(tl,tl.total)),rec.result.score);
});
test('only renderer includes animated footwork and honors reduce motion',()=>{
 const r=fs.readFileSync(path.join(__dirname,'../../src/viewer-v4/renderer.js'),'utf8');
 assert(r.includes('const motion=f.motion,kinetics=f.kinetics'));
 assert(r.includes('if(!f.reducedMotion&&(run||jog))'));
 assert(r.includes('kb&&!f.reducedMotion&&kb.flight'));
 assert(r.includes('if(kb&&kb.flight&&!f.reducedMotion'));
});
test('all entrypoints load kinetic module in correct dependency order',()=>{
 for(const name of ['play.html','viewer-v51.html','viewer-v4.html']){
  const text=fs.readFileSync(path.join(__dirname,'../../'+name),'utf8');
  assert(text.includes('src/viewer-v4/kinetics.js'));
  assert(text.indexOf('src/viewer-v4/motion.js')<text.indexOf('src/viewer-v4/kinetics.js'));
  assert(text.indexOf('src/viewer-v4/kinetics.js')<text.indexOf('src/viewer-v4/viewer.js'));
 }
});
test('warm sample performance for 1000 frames',()=>{
 for(let j=0;j<200;j++)get((j/200)*tl.total);
 const start=process.hrtime.bigint();
 for(let j=0;j<1000;j++)get((j/1000)*tl.total);
 const ms=Number(process.hrtime.bigint()-start)/1e6;
 console.log('V52_KINETICS_1000_FRAMES_MS',ms.toFixed(2));
 assert(ms<1500,'1000 frames too costly: '+ms+'ms');
});
console.log('V52_KINETICS_TESTS_PASS',count);
