'use strict';
const assert=require('node:assert/strict'),FX=require('../src/viewer-v4/fx.js'),{loadViewer,fixture}=require('./viewer/harness.cjs');
const record=fixture(),original=JSON.stringify(record),T=loadViewer().CageViewerTimeline,tl=T.buildTimeline(record),cues=FX.buildCues(tl,record.result.events),goal=cues.find(c=>c.type==='goal');
const restLeft=FX.netMesh([],0,'left'),restRight=FX.netMesh([],0,'right');
// Compare with actual artwork, rather than two constants that could agree but be wrong.
for(const name of ['arena.svg','arena-golden.svg']){
 const art=require('node:fs').readFileSync(require('node:path').join(__dirname,'../design/qwen-30b/arena',name),'utf8');
 const m=art.match(/<g id="markings">[\s\S]*?<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
 assert(m,'painted boundary missing in '+name);const [x,y,w,h]=m.slice(1).map(Number);
 assert.equal(FX.WORLD.x0,x);assert.equal(FX.WORLD.x1,x+w);assert.equal(FX.WORLD.y0,y);assert.equal(FX.WORLD.y1,y+h);
 assert.equal(restLeft.front,x,'left mouth is off painted goal line');assert.equal(restRight.front,x+w,'right mouth is off painted goal line');
 for(const width of [350,980,1680]){const fit=FX.fit(width,width*650/1200);assert.equal(fit.x+restLeft.front*fit.scale,fit.x+FX.WORLD.x0*fit.scale);assert.equal(fit.x+restRight.front*fit.scale,fit.x+FX.WORLD.x1*fit.scale);}
}
assert.equal(restLeft.front,FX.WORLD.leftGoal);assert.equal(restRight.front,FX.WORLD.rightGoal);
assert.equal(restLeft.front+restRight.front,FX.WORLD.w);assert.equal(restLeft.back+restRight.back,FX.WORLD.w);
assert.equal(restLeft.top,restLeft.backTop,'goal must be rectangular, not tapered');
assert.equal(restLeft.bottom,restLeft.backBottom,'goal must have straight side rails');
assert.equal(Math.abs(restLeft.front-restLeft.back),52,'goal must have shallow net depth');
for(let i=0;i<restLeft.strands.length;i++)for(let j=0;j<restLeft.strands[i].length;j++){
 const left=restLeft.strands[i][j],right=restRight.strands[i][j];
 assert(Math.abs(left.x+right.x-FX.WORLD.w)<1e-8);assert.equal(left.y,right.y);
 assert(left.x<=restLeft.front&&left.x>=restLeft.back,'net crosses the field/scoring plane');
 assert(left.y>=restLeft.top&&left.y<=restLeft.bottom);
}
const resting=FX.netMesh([],0,goal.side),active=FX.netMesh(cues,goal.at+.09,goal.side);
assert.notDeepEqual(active.strands,resting.strands,'recorded goal must deform the woven mesh');
assert.deepEqual(FX.netMesh(cues,goal.at-.01,goal.side),resting,'no early ripple');
assert.deepEqual(FX.netMesh(cues,goal.at+1.21,goal.side),resting,'ripple must settle');
assert.deepEqual(FX.netMesh(cues,goal.at+.09,goal.side,true),resting,'reduced motion must retain static net');
const opposite=goal.side==='left'?'right':'left';assert.deepEqual(FX.netMesh(cues,goal.at+.09,opposite),FX.netMesh([],0,opposite),'wrong goal reacted');
assert.deepEqual(active,FX.netMesh(cues,goal.at+.09,goal.side),'seeking must reproduce the same deformation');
for(let i=0;i<active.strands.length;i++){
 assert.deepEqual(active.strands[i][0],resting.strands[i][0],'net attachment moved');
 assert.deepEqual(active.strands[i].at(-1),resting.strands[i].at(-1),'net attachment moved');
}
const mobile=FX.netMesh([],0,'left',false,.25);assert(mobile.strands.length<restLeft.strands.length,'small-screen weave should reduce clutter');
assert.equal(mobile.front,restLeft.front);assert.equal(mobile.back,restLeft.back);
assert.equal(JSON.stringify(record),original,'net design changed the match');
console.log('GOAL_NET_DESIGN_PASS mirrored recessed geometry, fixed scoring plane/attachments, correct-goal-only ripple, deterministic seek, static reduced motion, simpler mobile mesh, record unchanged');
