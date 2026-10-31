'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const Motion=require('../src/viewer-v4/motion.js');
const families={
 shot_attempt:'shot',shot_miss:'shot',free_kick:'setpiece',press:'contact',block:'contact',
 dribble_duel:'contact',race:'contact',pass:'pass',through_ball:'pass',carry:'carry'
};
for(const [event,expected] of Object.entries(families))assert.equal(Motion.actionKind(event),expected,event);
assert.equal(Motion.actionKind('wall_pass',false),'pass');
assert.equal(Motion.actionKind('wall_pass',true),'contact');
// Only actual timeline contact may upgrade a wall pass to a contact broadcast.
function sampled(type,contact){const event={i:0,type,actor:'a',opp:'b',team:0,outcome:'complete'};
 const seg={i:0,type,contact:contact?{id:'b',carrier:'a'}:null,tau0:0,tau1:1};
 const tl={ids:['a','b'],total:1,segments:[seg]};
 const timeline={segmentIndex(){return 0;},phase(){return .5;},playersAt(){return {a:{u:.2,v:.4},b:{u:.35,v:.4}};},ballAt(){return {u:.25,v:.45,flight:false};}};
 return Motion.sample(tl,[event],.5,timeline);
}
const setpiece=sampled('free_kick',false);
assert.equal(setpiece.label,'FREE KICK');
assert.equal(setpiece.showEvent,true);
assert.equal(Motion.actionKind(setpiece.type), 'setpiece');
for(const type of ['race','wall_pass']){
 const action=sampled(type,true);
 assert.equal(action.roles.defender,'b',type+' defender must be recorded contact');
 assert.equal(action.challenge,true,type+' contact must be recorded');
 assert.equal(action.showEvent,true);
 assert.equal(Motion.actionKind(action.type,action.challenge),'contact');
}
assert.equal(Motion.actionKind('wall_pass',sampled('wall_pass',false).challenge),'pass');
const context={window:{CageViewerCoords:{},CageViewerV4FX:{},CageLabelLayout:{}}};
vm.createContext(context);vm.runInContext(read('src/viewer-v4/renderer.js'),context,{filename:'renderer.js'});
const canPaint=context.window.CageViewerRenderer.shouldPaintRecordedAction;
assert.equal(canPaint({motion:{showEvent:true},reducedMotion:false}),true);
assert.equal(canPaint({motion:{showEvent:true},reducedMotion:true}),false);
assert.equal(canPaint({motion:{showEvent:false},reducedMotion:false}),false);
assert.equal(canPaint({reducedMotion:false}),false);
const renderer=read('src/viewer-v4/renderer.js'),viewer=read('src/viewer-v4/viewer.js');
assert(renderer.includes('if(!shouldPaintRecordedAction(f))return;'));
assert(viewer.includes("M.actionKind(seg.type,!!seg.contact)"));
assert(renderer.includes("'wall_pass'")&&renderer.includes("'race'"));
console.log('V63_RECORDED_ACTION_PASS 13 event classifications; free kick setpiece; race/wall pass gated by recorded contact; reduced-motion canvas action disabled');
