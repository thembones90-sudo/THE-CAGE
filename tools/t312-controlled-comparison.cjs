'use strict';
const fs=require('fs'),vm=require('vm');
const c={window:{location:{search:''}}};vm.createContext(c);for(const m of fs.readFileSync('play.html','utf8').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){vm.runInContext(fs.readFileSync(m[1],'utf8'),c,{filename:m[1]});if(m[1]==='src/cage-engine.js')break;}
const old=c.window.CageEngineT311,now=c.window.CageEngine;
const squads={mixed:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],creators:[['zinedine-zidane','ronaldinho','ronaldo-nazario'],['andres-iniesta','michael-ballack','lionel-messi']],defenders:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]};
const matchups=[['press','possession'],['possession','balanced'],['counter','press'],['counter','balanced']],N=40,rows=[];
for(const [group,base] of Object.entries(squads))for(const [tacticA,tacticB] of matchups){
 const paired={};for(const [name,E] of [['T3-11',old],['T3-12',now]]){
 let games=0,failures=0,winA=0,goals=0,golden=0,possA=0,linked=0,linkGoals=0,shots=0,blocks=0;
 for(let assign=0;assign<2;assign++)for(let swap=0;swap<2;swap++)for(let i=0;i<N;i++){
  const teams=swap?[base[1],base[0]]:base,t0=assign?[tacticB,tacticA]:[tacticA,tacticB],tactics=swap?[t0[1],t0[0]]:t0,idx=tactics.indexOf(tacticA);
  try{const r=E.simulate({teams,tactics,mode:'score',traits:{enabled:true},keepers:swap?['manuel-neuer','gianluigi-buffon']:['gianluigi-buffon','manuel-neuer'],seed:944300+i});
   games++;winA+=r.winner===idx;goals+=r.score[0]+r.score[1];golden+=r.decidedBy==='golden_goal';possA+=E.stats(r,teams)[idx].team.poss;
   linked+=r.events.filter(e=>e.type==='shot_attempt'&&e.creator).length;linkGoals+=r.events.filter(e=>e.type==='goal'&&e.calc?.linkBoost>0).length;shots+=r.events.filter(e=>e.type==='shot_attempt').length;blocks+=r.events.filter(e=>e.type==='block').length;
  }catch(e){failures++;if(failures<=1)console.log('FAIL',group,tacticA,tacticB,name,e.message);}
 }
 paired[name]={games,failures,winAPct:games?+(100*winA/games).toFixed(1):null,goalsPerMatch:games?+(goals/games).toFixed(2):null,goldenPct:games?+(100*golden/games).toFixed(1):null,possAPct:games?+(possA/games).toFixed(1):null,linked,linkGoals,blockPct:shots?+(100*blocks/shots).toFixed(1):null};
 }
 const row={group,tacticA,tacticB,baseline:paired['T3-11'],candidate:paired['T3-12'],deltaWinAPoints:+(paired['T3-12'].winAPct-paired['T3-11'].winAPct).toFixed(1)};rows.push(row);console.log('T312_CONTROLLED',JSON.stringify(row));
}
fs.writeFileSync('docs/T312_CONTROLLED_COMPARISON.json',JSON.stringify({baseline:'cage-t3-11',candidate:'cage-t3-12',seedStart:944300,seeds:N,tacticAssignments:2,sideSwaps:2,method:'Both sides assigned both tactics, both sides swapped, same seeds and goalkeeper identities. Only 3 archetype pairings.',rows},null,2)+'\n');
