'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const list=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]);
const c={window:{location:{search:''}},Date};vm.createContext(c);
for(const f of list){if(f==='src/showdown-v5.js')break;vm.runInContext(read(f),c,{filename:f});}
const E=c.window.CageEngine,R=c.window.CageRecords,Timeline=c.window.CageViewerTimeline,G=c.CageGoalExperience||c.window.CageGoalExperience;
assert.equal(E.VERSION,'cage-t3-6');
const base={teams:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],tactics:['balanced','press'],mode:'score',traits:{enabled:true}};
let reg=null,golden=null,matched=0,moreGoals=0;
for(let seed=1000;seed<1240;seed++){
 const cfg={...base,seed},res=E.simulate(cfg),again=E.simulate(cfg);
 assert.equal(JSON.stringify(res),JSON.stringify(again),'seed nondeterminism '+seed);
 assert.equal(res.score.reduce((a,b)=>a+b,0),res.events.filter(e=>e.type==='goal').length);
 assert.equal(res.winner,res.score[0]>res.score[1]?0:1);
 assert(res.regulationAt>=res.regulationSeconds,'must complete regulation');
 assert(res.decidedBy==='regulation'||res.decidedBy==='golden_goal');
 if(res.decidedBy==='regulation'){assert.notEqual(res.regulationScore[0],res.regulationScore[1]);assert.equal(res.events.filter(x=>x.golden).length,0);reg??={cfg,res};}
 else {assert.equal(res.regulationScore[0],res.regulationScore[1]);assert.equal(res.events.filter(x=>x.golden).length,1);assert.equal(res.events.at(-1).golden,true);golden??={cfg,res};}
 if(res.score[0]+res.score[1]>1)moreGoals++;
 const record=R.make(cfg,res,1);
 assert.equal(R.reproduce(record).eventHash,res.eventHash);
 const tl=Timeline.buildTimeline(record);
 assert.deepEqual(Array.from(tl.finalScore),Array.from(res.score));
 assert.equal(tl.winner,res.winner);
 for(const goal of tl.goals){const cue=G.goalData(tl,res.events,goal,['Commander','Opponent'],id=>E.BY_ID[id]?.name||id);assert.equal(cue.isGolden,!!res.events[goal.i].golden);}
 matched++;
}
assert(reg&&golden,'must sample both regulation and tied Golden Goal');
assert(moreGoals>0,'must see multiple-goal matches');
const koConfig={...base,mode:'ko',seed:42},ko=E.simulate(koConfig);assert.equal(ko.score[0]+ko.score[1],1);assert(R.reproduce(R.make(koConfig,ko,1)));
const invalid=JSON.parse(JSON.stringify(golden.res));invalid.regulationScore[0]+=1;assert.throws(()=>R.make(golden.cfg,invalid,1),/Regulation score mismatch/);
const regRecord=R.make(reg.cfg,reg.res,1),rgoal=reg.res.events.filter(e=>e.type==='goal'),rTL=Timeline.buildTimeline(regRecord);
console.log('V65_SCORE_RULES_PASS '+matched+' deterministic score matches, '+moreGoals+' multiple-goal; golden seed '+golden.cfg.seed+' final '+golden.res.score.join(':')+' regulation '+golden.res.regulationScore.join(':')+'; regulation seed '+reg.cfg.seed+' final '+reg.res.score.join(':')+'; original KO preserved');
