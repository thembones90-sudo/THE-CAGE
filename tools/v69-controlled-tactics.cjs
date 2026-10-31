'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);const c={window:{location:{search:''}}};vm.createContext(c);for(const f of scripts){vm.runInContext(read(f),c,{filename:f});if(f==='src/cage-engine.js')break;}const E=c.window.CageEngine;
const squads={
 mixed:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],
 creators:[['zinedine-zidane','ronaldinho','ronaldo-nazario'],['andres-iniesta','michael-ballack','lionel-messi']],
 defenders:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]};
const matchups=[['press','possession'],['counter','press'],['possession','balanced'],['counter','balanced']];
const n=40,rows=[];
for(const [group,teams] of Object.entries(squads))for(const [a,b] of matchups){
 const metrics={matches:0,failures:0,winA:0,winB:0,goals:0,possessionA:0,golden:0,surge:0,avgScoreA:0};
 for(let assignments=0;assignments<2;assignments++)for(let swap=0;swap<2;swap++)for(let i=0;i<n;i++){
  // Assign first tactic to each trio in turn. Independently flip home/away sides.
  const teams0=swap?[teams[1],teams[0]]:teams;
  const tact0=assignments?[b,a]:[a,b];
  const tacts=swap?[tact0[1],tact0[0]]:tact0;
  const indexA=tacts.indexOf(a);const cfg={teams:teams0,tactics:tacts,seed:733300+i,mode:'score',traits:{enabled:true},keepers:swap?['manuel-neuer','gianluigi-buffon']:['gianluigi-buffon','manuel-neuer']};
  try{const out=E.simulate(cfg);metrics.matches++;metrics.goals+=out.score[0]+out.score[1];metrics.winA+=out.winner===indexA;metrics.winB+=out.winner===1-indexA;metrics.avgScoreA+=out.score[indexA];metrics.golden+=out.decidedBy==='golden_goal';metrics.surge+=out.events.filter(x=>x.type==='golden_goal_pressure').length;metrics.possessionA+=E.stats(out,teams0)[indexA].team.poss;}catch(e){metrics.failures++;if(metrics.failures<=1)console.log('ENGINE_CAP',group,a,b,e.message);}
 }
 const x={group,tacticA:a,tacticB:b,attempted:metrics.matches+metrics.failures,failures:metrics.failures,
 winAPct:metrics.matches?+(100*metrics.winA/metrics.matches).toFixed(1):null,
 avgGoals:metrics.matches?+(metrics.goals/metrics.matches).toFixed(2):null,
 avgGoalsA:metrics.matches?+(metrics.avgScoreA/metrics.matches).toFixed(2):null,
 possAPct:metrics.matches?+(metrics.possessionA/metrics.matches).toFixed(1):null,
 goldenPct:metrics.matches?+(100*metrics.golden/metrics.matches).toFixed(1):null,
 pressure:metrics.surge};rows.push(x);console.log('CONTROLLED_TACTICS',JSON.stringify(x));
}
fs.writeFileSync(path.join(root,'docs/V69_ENGINE_CONTROLLED_TACTICS.json'),JSON.stringify({seedStart:733300,seeds:40,assignments:2,startingSideSwaps:2,baseline:'6cc81ba',version:E.VERSION,goalkeepers:['gianluigi-buffon','manuel-neuer'],rows},null,2)+'\n');
