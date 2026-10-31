'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),ctx={window:{location:{search:''}}};vm.createContext(ctx);
for(const m of read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){vm.runInContext(read(m[1]),ctx,{filename:m[1]});if(m[1]==='src/cage-engine.js')break;}
const engines={T38:ctx.window.CageEngineT38,T39:ctx.window.CageEngine},squads={
 mixed:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],
 defense:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]},
 pairs={Strong:['gianluigi-buffon','manuel-neuer'],Street:['rene-higuita','jorge-campos']},N=90,rows=[];
for(const [squad,teams] of Object.entries(squads))for(const [pair,keepers] of Object.entries(pairs))for(const [engine,impl] of Object.entries(engines)){
 const x={squad,pair,engine,matches:N,caps:0,goals:0,golden:0,exposed:0,beaten:0};
 for(let i=0;i<N;i++){try{const result=impl.simulate({teams,keepers,seed:881200+i,tactics:['balanced','press'],mode:'score',traits:{enabled:true}});x.goals+=result.score[0]+result.score[1];x.golden+=result.decidedBy==='golden_goal';x.exposed+=result.events.filter(e=>e.type==='shot_attempt'&&e.keeperExposed).length;x.beaten+=result.events.filter(e=>e.type==='gk_sweep'&&e.outcome==='beaten').length;}catch(e){if(!e.message.includes('safety limit'))throw e;x.caps++;}}
 x.goalsPerCompleted=+((x.goals)/(N-x.caps)).toFixed(2);x.goldenPct=+((100*x.golden)/(N-x.caps)).toFixed(1);rows.push(x);console.log('V67_RISK_BALANCE',JSON.stringify(x));
}
fs.writeFileSync('docs/V67_SWEEP_RISK_PAIRED.json',JSON.stringify({seedStart:881200,sampleCount:N,description:'Same initial seeds, independent event paths once RNG diverges. T3-8 and T3-9 goalkeeper exposure impact.',rows},null,2)+'\n');
