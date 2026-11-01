'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]);
const ctx={window:{location:{search:''}}};vm.createContext(ctx);for(const f of source){vm.runInContext(read(f),ctx,{filename:f});if(f==='src/cage-engine.js')break;}
const E=ctx.window.CageEngineT311,TA=E.TACTICS,baseline=Object.fromEntries(Object.entries(TA).map(([k,v])=>[k,{...v}]));
const squads={
 mixed:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],
 creators:[['zinedine-zidane','ronaldinho','ronaldo-nazario'],['andres-iniesta','michael-ballack','lionel-messi']],
 defenders:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]
};
const variants=[
 {name:'baseline',posTempo:1.5,posRisk:.8,pressEngage:.8,pressCp:1.6},
 {name:'gentle',posTempo:1.35,posRisk:.88,pressEngage:.77,pressCp:1.5},
 {name:'moderate',posTempo:1.24,posRisk:.92,pressEngage:.73,pressCp:1.4},
 {name:'strong',posTempo:1.13,posRisk:.97,pressEngage:.69,pressCp:1.3}
],pairings=[['press','possession'],['possession','balanced'],['counter','press'],['counter','balanced']];
const rows=[],N=24;
for(const v of variants){
 Object.assign(TA.possession,baseline.possession,{tempo:v.posTempo,risk:v.posRisk});Object.assign(TA.press,baseline.press,{engageHigh:v.pressEngage,cp:v.pressCp});
 for(const [group,teams] of Object.entries(squads))for(const [a,b] of pairings){
  let games=0,loss=0,aWin=0,aPoss=0,totalGoals=0,golden=0;
  for(let assign=0;assign<2;assign++)for(let swap=0;swap<2;swap++)for(let i=0;i<N;i++){
   const Ts=swap?[teams[1],teams[0]]:teams,t0=assign?[b,a]:[a,b],tacs=swap?[t0[1],t0[0]]:t0,idx=tacs.indexOf(a);
   const config={teams:Ts,tactics:tacs,keepers:swap?['manuel-neuer','gianluigi-buffon']:['gianluigi-buffon','manuel-neuer'],traits:{enabled:true},mode:'score',seed:912700+i};
   try{const r=E.simulate(config);games++;aWin+=r.winner===idx;totalGoals+=r.score[0]+r.score[1];golden+=r.decidedBy==='golden_goal';aPoss+=E.stats(r,Ts)[idx].team.poss;}catch(e){loss++;if(loss<=1)console.log('SWEEP_FAILURE',v.name,group,a,b,e.message);}
  }
  const result={variant:v.name,group,a,b,games,failures:loss,winAPct:games?+(100*aWin/games).toFixed(1):null,possAPct:games?+(aPoss/games).toFixed(1):null,goalsPerMatch:games?+(totalGoals/games).toFixed(2):null,goldenPct:games?+(100*golden/games).toFixed(1):null};rows.push(result);console.log('T312_SWEEP',JSON.stringify(result));
 }
}
fs.writeFileSync('docs/T312_TACTIC_PARAMETER_SWEEP.json',JSON.stringify({engine:E.VERSION,method:'24 seeds x 2 tactic-to-roster assignments x 2 starting sides, each pairing; same goalkeepers, deterministic base seed; parameter-only candidates',variants,rows},null,2)+'\n');
