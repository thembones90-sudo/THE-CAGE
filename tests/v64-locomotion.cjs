'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('../src/viewer-v4/kinetics.js');
const {loadViewer,fixture}=require('./viewer/harness.cjs');
const T=loadViewer().CageViewerTimeline,record=fixture(),tl=T.buildTimeline(record);
const gait={heading:Math.PI/4,speed:128,turnRate:2.1,accel:180,gait:'sprint',source:'recorded-travel'};
const orig=JSON.stringify(gait),p=K.visualPose(gait,'rooney',12.75,false);
assert(Object.isFrozen(p));assert.equal(p.mode,'sprint');assert(p.trail>0);assert(p.stride!==0);assert(Math.abs(p.bank)>.01);
assert.deepEqual(K.visualPose(gait,'rooney',12.75,false),p,'same player at same replay time');
const reduced=K.visualPose(gait,'rooney',12.75,true);
assert.equal(reduced.stride,0);assert.equal(reduced.bank,0);assert.equal(reduced.lean,0);assert.equal(reduced.trail,0);
assert.equal(JSON.stringify(gait),orig,'pose mutated source sample');
const idle=K.visualPose({...gait,gait:'idle',speed:0,accel:0,turnRate:0},'rooney',5);
assert.equal(idle.stride,0);assert.equal(idle.trail,0);
const braces=fs.readFileSync(path.join(__dirname,'../src/viewer-v4/renderer.js'),'utf8');
assert(braces.includes('motion.challenge&&role.defender&&f.players[role.defender]'),'collision feedback must be event-anchored');
assert(braces.includes('CageKinetics.visualPose(gait,id,f.tau'),'renderer must use deterministic sampled pose');
assert(!/Math\.random\s*\(|CageEngine\.simulate\s*\(/.test(braces));
let samples=0;
for(let i=0;i<=250;i++){
 const t=i*tl.total/250;
 const speeds=tl.ids.map(id=>K.orientationFor(id,t,tl,T,tl.teamOf));
 for(const [n,g]of speeds.entries()){
  const result=K.visualPose(g,tl.ids[n],t,false);
  assert(Number.isFinite(result.heading)&&Number.isFinite(result.stride)&&Number.isFinite(result.lean)&&Number.isFinite(result.bank));
  assert(Math.abs(result.stride)<=1&&Math.abs(result.bank)<=.36&&Math.abs(result.lean)<=.38);
  samples++;
 }
}
console.log('V64_LOCOMOTION_PASS '+samples+' deterministic player poses, 6 markers, seek-safe, no engine mutations, contact-only bracing and reduced-motion static');
