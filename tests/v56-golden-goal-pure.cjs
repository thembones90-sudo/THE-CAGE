'use strict';
const assert=require('node:assert/strict'),fx=require('../src/viewer-v4/fx.js');
const G=require('../src/viewer-v4/goal-experience.js'),A=require('../src/viewer-v4/goal-audio.js');
const {loadViewer,fixture,deepFreeze}=require('./viewer/harness.cjs');
const V=loadViewer(),T=V.CageViewerTimeline,K=V.CageViewerClock;
const record=deepFreeze(fixture()),original=JSON.stringify(record),tl=T.buildTimeline(record),goal=tl.goals[0];
const names=id=>id.replace(/-/g,' '),cue=G.goalData(tl,record.result.events,goal,['Commander','Opponent'],names);
assert.equal(cue.eventIndex,goal.i);assert.equal(cue.source,'recorded-match-goal');
assert.equal(cue.team,goal.team);assert.equal(cue.scorer,names(goal.actor));assert.equal(cue.replay,false);
assert(Object.isFrozen(cue));assert.equal(cue.isGolden,tl.golden);
assert(G.markup(cue,[1,0]).includes('RECORDED EVENT'));
assert(G.markup(cue,[1,0]).includes('1 : 0'));assert(G.markup(cue,[1,0]).includes('cv-golden-doors'));
const hostile=G.goalData(tl,record.result.events,goal,['<img src=x>','<img src=x>'],()=>'<script>danger</script>',true);
const html=G.markup(hostile,[1,0]);
assert(!html.includes('<script>')&&!html.includes('<img'));
assert(html.includes('&lt;script&gt;'));
assert(html.includes('&lt;img'));
assert(html.includes('SLOW-MOTION REPLAY'));
const fake=JSON.parse(JSON.stringify(goal));fake.i=0;
assert.throws(()=>G.goalData(tl,record.result.events,fake,['A','B'],names),/recorded goal/);
assert.throws(()=>G.goalData(tl,record.result.events,{...goal,tau:goal.tau+10},['A','B'],names),/authoritative timeline/);
assert.equal(G.phase(cue,cue.tau-1,0,0).visible,false);
assert.equal(G.phase(cue,cue.tau,10,10.5).visible,true);
assert.equal(G.phase(cue,cue.tau,10,10.5,true).flash,0);
assert.equal(G.phase(cue,cue.tau,10,20).visible,false);
assert.equal(G.phase(cue,cue.tau-1,10,11).visible,false);
const cues=fx.buildCues(tl,record.result.events),impact=cues.find(x=>x.type==='goal');
assert(impact&&impact.goalEventIndex===goal.i);
assert.deepEqual(fx.goldenParticles(impact,impact.at-1),[]);
assert.deepEqual(fx.goldenParticles(impact,impact.at+3),[]);
const parts=fx.goldenParticles(impact,impact.at+.35);
assert.equal(parts.length,22);
assert.deepEqual(parts,fx.goldenParticles(impact,impact.at+.35));
assert(parts.every(p=>p.source==='recorded-goal'&&Number.isFinite(p.x)&&Number.isFinite(p.y)));
const wrong=fx.goldenParticles({...impact,type:'wall_pass'},impact.at+.35);
assert.equal(wrong.length,0);
const calls=[],ctx={
 destination:{},
 createGain(){const node={gain:{value:0,setValueAtTime:(...x)=>calls.push(['gain',...x]),exponentialRampToValueAtTime:(...x)=>calls.push(['fade',...x])},connect(){}};return node;},
 createOscillator(){const node={frequency:{setValueAtTime:(...x)=>calls.push(['freq',...x]),exponentialRampToValueAtTime:(...x)=>calls.push(['sweep',...x])},connect(){},start(t){calls.push(['start',t]);},stop(t){calls.push(['stop',t]);}};return node;},
 currentTime:7,state:'running',close(){calls.push(['close']);return Promise.resolve();}
};
const sound=A.create({contextFactory:()=>ctx});
assert.equal(sound.enabled,false);assert.equal(sound.play(false),false);assert.equal(calls.length,0);
assert.equal(sound.setEnabled(true),true);assert.equal(sound.play(false),true);
assert.equal(calls.filter(c=>c[0]==='start').length,5);
assert.equal(calls.filter(c=>c[0]==='stop').length,5);
assert.equal(sound.setEnabled(false),false);assert.equal(sound.play(false),false);
assert.equal(calls.filter(c=>c[0]==='start').length,5);
sound.dispose();assert.equal(sound.disposed,true);assert.equal(sound.setEnabled(true),false);
// Explicit user opt-in follows the SAME page across new viewer rounds only.
const next=A.create({contextFactory:()=>ctx});
assert.equal(next.restore(),false,'new viewer must default silent after Off');
assert.equal(next.setEnabled(true),true);
next.dispose();
const following=A.create({contextFactory:()=>ctx});
assert.equal(following.restore(),true,'explicit session opt-in must survive viewer remount');
following.setEnabled(false);following.dispose();
const reset=A.create({contextFactory:()=>ctx});
assert.equal(reset.restore(),false,'explicit Off must propagate to later rounds');
reset.dispose();
assert.equal(JSON.stringify(record),original,'Goal presentation must never mutate saved match');
const pb=K.createPlayback(tl,{speed:'instant'});let wins=0,goals=0;
pb.on('end',()=>wins++);pb.on('goal',()=>goals++);
pb.play();assert.equal(wins,1);assert.equal(goals,1);
assert(pb.replayGoal());let guard=0;while(pb.state==='playing'&&guard++<1e5)pb.advance(.5);
assert.equal(wins,1,'goal replay must never re-award a round');
console.log('V56_GOLDEN_GOAL_PURE_PASS goal verified, HTML escaped, deterministic 22 particles, sound opt-in five original tones, protected record, replay no extra win');
