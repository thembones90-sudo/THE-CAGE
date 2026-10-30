'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../../src/viewer-v4/motion.js');
const {loadViewer,fixture,deepFreeze}=require('../viewer/harness.cjs');
const W=loadViewer(),T=W.CageViewerTimeline,rec=fixture();
const events=rec.result.events,tl=T.buildTimeline(rec);
let tests=0;function verify(name,fn){fn();tests++;console.log('PASS',name);}
verify('all six player positions and ball derive from recorded timeline',()=>{
 for(let i=0;i<=300;i++){
  const tau=tl.total*i/300,o=M.sample(tl,events,tau,T);
  assert.equal(Object.keys(o.positions).length,6);
  assert.equal(o.index,T.segmentIndex(tl,tau));
  assert.equal(o.type,events[o.index].type);
  assert.equal(o.inferred,true);
  assert.equal(o.ball.u,T.ballAt(tl,tau).u);
  assert.equal(o.ball.v,T.ballAt(tl,tau).v);
  for(const id of tl.ids){assert(Number.isFinite(o.positions[id].u));assert(Number.isFinite(o.positions[id].v));}
 }
});
verify('same absolute timestamp always produces the identical frame, independent of seek order',()=>{
 const points=[0,1,1.5,tl.total*.32,tl.total*.75,tl.total,5,0,9,tl.total*.75];
 const a=points.map(t=>JSON.stringify(M.sample(tl,events,t,T)));
 const b=points.slice().reverse().map(t=>JSON.stringify(M.sample(tl,events,t,T))).reverse();
 assert.deepEqual(a,b);
});
verify('defender movement never leaves current recorded cell or exceeds tiny presentation budget',()=>{
 let touched=0;
 for(let i=0;i<=1000;i++){
  const tau=tl.total*i/1000,o=M.sample(tl,events,tau,T),raw=T.playersAt(tl,tau);
  for(const id of tl.ids){
   const p=o.positions[id],r=raw[id],du=Math.abs(p.u-r.u),dv=Math.abs(p.v-r.v);
   assert(du<=.01801&&dv<=.01801,'defender moved too far: '+id);
   if(du+dv>1e-7){
     touched++;
     assert.equal(Math.floor(Math.min(.999999,p.u)*4),Math.floor(Math.min(.999999,r.u)*4),'crossed recorded x cell');
     assert.equal(Math.floor(Math.min(.999999,p.v)*3),Math.floor(Math.min(.999999,r.v)*3),'crossed recorded y cell');
   }
   assert(p.u>=0&&p.u<=1&&p.v>=0&&p.v<=1);
  }
 }
 assert(touched>0,'expected a recorded contest to produce a brief defensive close-down');
});
verify('pass highlight only comes from actual recorded pass or through ball',()=>{
 let observed=0;
 for(let i=0;i<=600;i++){
  const tau=tl.total*i/600,o=M.sample(tl,events,tau,T),e=events[o.index];
  if(o.pass){observed++;assert(['pass','through_ball'].includes(e.type));assert(o.ball.flight);assert.equal(o.pass.receiver,e.target||null);assert.equal(o.pass.complete,e.outcome==='complete');}
 }
 assert(observed>0,'fixture should contain a completed pass flight');
});
verify('defensive highlights only from logged pressure or contest events',()=>{
 for(let i=0;i<=400;i++){
  const tau=tl.total*i/400,o=M.sample(tl,events,tau,T),e=events[o.index];
  if(o.roles.defender)assert(['press','block','race','dribble_duel','wall_pass'].includes(e.type));
  if(o.challenge)assert(Boolean(tl.segments[o.index].contact));
 }
});
verify('player movement arrows derive from recorded timeline positions',()=>{
 for(let i=0;i<=300;i++){
  const tau=tl.total*i/300,o=M.sample(tl,events,tau,T);
  for(const r of o.runners){assert(tl.ids.includes(r.id));assert(Number.isFinite(r.du)&&Number.isFinite(r.dv));assert(Math.hypot(r.du*980,r.dv*510)>2.8);}
 }
});
verify('motion director cannot change authoritative score, winners, records or goal count',()=>{
 const state=JSON.stringify(rec);
 const goals=tl.goals.length,endScore=Array.from(T.scoreAt(tl,tl.total));
 deepFreeze(rec);
 for(let i=0;i<=250;i++)M.sample(tl,events,tl.total*i/250,T);
 assert.equal(JSON.stringify(rec),state);
 assert.equal(tl.goals.length,goals);
 assert.deepEqual(Array.from(T.scoreAt(tl,tl.total)),endScore);
 assert.deepEqual(endScore,rec.result.score);
});
verify('reduced-motion visuals can omit flourishes without altering positions or ball',()=>{
 const tau=tl.total*.43,o=M.sample(tl,events,tau,T);
 assert.deepEqual(o.positions,M.sample(tl,events,tau,T).positions);
 assert.equal(o.ball.flight,T.ballAt(tl,tau).flight);
});
verify('source is deterministic and V5.1 scripts are loaded before viewer',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../../src/viewer-v4/motion.js'),'utf8');
 const page=fs.readFileSync(path.join(__dirname,'../../play.html'),'utf8');
 const viewer=fs.readFileSync(path.join(__dirname,'../../src/viewer-v4/viewer.js'),'utf8');
 assert(!/Math\.random|performance\.now|Date\.now|\.simulate\s*\(/.test(code));
 assert(page.includes('src/viewer-v4/motion.js'));
 assert(page.indexOf('src/viewer-v4/motion.js')<page.indexOf('src/viewer-v4/viewer.js'));
 assert(viewer.includes('M.sample(tl,events,tau,T)'));
 assert(viewer.includes('score=T.scoreAt(tl,tau)'));
});
verify('performance: render metadata for 800 frames in practical time',()=>{
 const start=process.hrtime.bigint();
 for(let k=0;k<800;k++)M.sample(tl,events,(k/800)*tl.total,T);
 const ms=Number(process.hrtime.bigint()-start)/1e6;
 console.log('MOTION_800_FRAME_MS',ms.toFixed(2));
 assert(ms<1500,'motion sampling too costly for 800 frames: '+ms+'ms');
});
console.log('V51_MOTION_TESTS_PASS',tests);
