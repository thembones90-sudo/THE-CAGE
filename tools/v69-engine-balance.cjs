'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]),c={window:{location:{search:''}}};vm.createContext(c);
for(const f of files){vm.runInContext(read(f),c,{filename:f});if(f==='src/cage-engine.js')break;}
const E=c.window.CageEngine,sets={
 balanced_roles:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],
 creators:[['zinedine-zidane','ronaldinho','ronaldo-nazario'],['andres-iniesta','michael-ballack','lionel-messi']],
 defenders:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]
},tactics=[['press','possession'],['counter','press'],['possession','balanced'],['balanced','balanced']],iterations=64;
const out=[],missing=new Set();
for(const [group,teams] of Object.entries(sets)){
 for(const ids of teams.flat())if(!E.BY_ID[ids])missing.add(ids);
}if(missing.size)throw Error('Missing player identities '+Array.from(missing));
for(const [group,squads] of Object.entries(sets))for(const [tacA,tacB] of tactics){
 let n=0,cap=0,goals=0,shoot=0,block=0,save=0,parry=0,winA=0,winB=0,draw=0,overtime=0,pressures=0,sumA=0,possA=0;
 for(let swap=0;swap<2;swap++)for(let i=0;i<iterations;i++){
  const teams=swap?[squads[1],squads[0]]:squads;
  const ts=swap?[tacB,tacA]:[tacA,tacB];
  const keepers=swap?['manuel-neuer','gianluigi-buffon']:['gianluigi-buffon','manuel-neuer'];
  try{
   const r=E.simulate({teams,tactics:ts,mode:'score',traits:{enabled:true},keepers,seed:971300+i});
   n++;goals+=r.score[0]+r.score[1];shoot+=r.events.filter(x=>x.type==='shot_attempt').length;block+=r.events.filter(x=>x.type==='block').length;save+=r.events.filter(x=>x.type==='gk_save').length;parry+=r.events.filter(x=>x.type==='gk_parry').length;
   const first=swap?1:0;winA+=r.winner===first;winB+=r.winner===1-first;draw+=r.winner===-1;
   sumA+=r.score[first];overtime+=r.decidedBy==='golden_goal';pressures+=r.events.filter(e=>e.type==='golden_goal_pressure').length;
   possA+=E.stats(r,teams)[first].team.poss;
  }catch(e){cap++;if(cap<=2)console.log('CAP',group,tacA,tacB,e.message)}
 }
 const row={group,tacticA:tacA,tacticB:tacB,sample:n+cap,success:n,failures:cap,goalsPerMatch:n?+(goals/n).toFixed(2):null,shotsPerMatch:n?+(shoot/n).toFixed(2):null,blockPct:shoot?+(100*block/shoot).toFixed(1):null,goalPerShotPct:shoot?+(100*goals/shoot).toFixed(1):null,savesPerMatch:n?+(save/n).toFixed(2):null,parriesPerMatch:n?+(parry/n).toFixed(2):null,firstTacticWinPct:n?+(100*winA/n).toFixed(1):null,secondTacticWinPct:n?+(100*winB/n).toFixed(1):null,firstTacticPossPct:n?+(possA/n).toFixed(1):null,firstTacticGoals:n?+(sumA/n).toFixed(2):null,draw,GoldenPct:n?+(100*overtime/n).toFixed(1):null,pressureEvents:pressures};
 out.push(row);console.log('ENGINE_AUDIT',JSON.stringify(row));
}
fs.writeFileSync(path.join(root,'docs/V69_ENGINE_BASELINE_BALANCE.json'),JSON.stringify({baselineCommit:'6cc81ba',engine:E.VERSION,method:'64 identical seeds per orientation (128 per matchup), three team compositions, same paired keeper identities, regulation score, first tactic label tracked across swaps',rows:out},null,2)+'\n');
