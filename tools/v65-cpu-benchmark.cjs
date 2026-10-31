'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),C=require('../src/cpu-draft.js');
const list=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]),ctx={window:{location:{search:''}}};vm.createContext(ctx);
for(const file of list){vm.runInContext(read(file),ctx,{filename:file});if(file==='src/cage-engine.js')break;}
const E=ctx.window.CageEngine,players=ctx.window.THE_CAGE_PLAYERS,enemy=['ledley-king','claudio-marchisio','antonio-valencia'].map(id=>E.BY_ID[id]);
if(players.length!==194)throw Error('194 players required');
function rng(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function shuffle(items,random){const a=items.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const n=90,stats={};for(const k of C.LEVELS)stats[k]={win:0,games:0,overall:0,roleComplete:0,tactics:{},averageScore:0};
for(let seed=0;seed<n;seed++){
 const source=shuffle(players.filter(p=>!enemy.some(q=>q.id===p.id)),rng(70000+seed));
 const pools=[source.slice(0,15),source.slice(15,30),source.slice(30,45)];
 for(const difficulty of C.LEVELS){
  const chosen=[];let score=0;
  for(let pick=0;pick<3;pick++){
   const move=C.choose({candidates:pools[pick],selected:chosen,opponent:enemy.slice(0,pick),level:difficulty,rng:rng(80000+seed*33+pick+({casual:0,competitive:1,ruthless:2}[difficulty])),rerollsLeft:0});
   if(move.reroll||!move.id)throw Error('Invalid CPU selection');
   const p=pools[pick].find(x=>x.id===move.id);
   if(!p||chosen.some(x=>x.id===p.id))throw Error('CPU cheated');
   chosen.push(p);score+=C.score(p,chosen.slice(0,-1),enemy.slice(0,pick),'competitive');
  }
  const tactic=C.tactic(chosen,enemy,difficulty,rng(99000+seed*5+({casual:0,competitive:1,ruthless:2}[difficulty])));
  const st=stats[difficulty];st.overall+=chosen.reduce((sum,p)=>sum+p.overall,0)/3;st.roleComplete+=new Set(chosen.map(C.role)).size===3?1:0;st.averageScore+=score/3;st.tactics[tactic]=(st.tactics[tactic]||0)+1;
  for(let swap=0;swap<2;swap++){const teams=swap?[enemy.map(x=>x.id),chosen.map(x=>x.id)]:[chosen.map(x=>x.id),enemy.map(x=>x.id)],tactics=swap?['balanced',tactic]:[tactic,'balanced'];
    const result=E.simulate({teams,tactics,seed:730000+seed,mode:'score',traits:{enabled:true}});st.win+=swap?result.winner===1:result.winner===0;st.games++;
  }
 }
}
const report={mode:'regulation+GoldenGoal',cohorts:n,swappedSide:true,opponent:enemy.map(x=>x.id),levels:{}};
for(const [k,v] of Object.entries(stats)){report.levels[k]={matches:v.games,winRatePct:+(v.win/v.games*100).toFixed(1),averageOVR:+(v.overall/n).toFixed(2),completeTrioPct:+(v.roleComplete/n*100).toFixed(1),averageScoutingScore:+(v.averageScore/n).toFixed(2),tactics:v.tactics};}
console.log('IRON_AI_V65_BENCHMARK',JSON.stringify(report));fs.writeFileSync(path.join(root,'docs/V65_CPU_BENCHMARK.json'),JSON.stringify(report,null,2)+'\n');
