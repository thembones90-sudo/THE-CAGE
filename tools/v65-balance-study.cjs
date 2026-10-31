'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]),c={window:{location:{search:''}}};vm.createContext(c);
for(const f of scripts){vm.runInContext(read(f),c,{filename:f});if(f==='src/cage-engine.js')break;}
const E=c.window.CageEngine,ps=c.window.THE_CAGE_PLAYERS;
if(ps.length!==194||E.VERSION!=='cage-t3-6')throw Error('Expected 194-player T3-6');
const teams=[
{label:'TITAN creators vs ELITE all-round',a:['paolo-maldini','zinedine-zidane','ronaldo-nazario'],b:['ledley-king','claudio-marchisio','antonio-valencia']},
{label:'Legend balanced trios',a:['nemanja-vidic','andrea-pirlo','thierry-henry'],b:['jaap-stam','luka-modric','andriy-shevchenko']},
{label:'Attack-heavy vs defensive specialists',a:['lionel-messi','cristiano-ronaldo','thierry-henry'],b:['paolo-maldini','nemanja-vidic','jaap-stam']},
{label:'Midfield-heavy vs mixed trio',a:['luka-modric','andrea-pirlo','michael-ballack'],b:['giorgio-chiellini','francesco-totti','gabriel-batistuta']}
];
const tactics=[['balanced','balanced'],['press','possession'],['possession','press'],['press','balanced'],['balanced','possession']];
const count=200,rows=[],matrix={};
function wilson(w,n){const p=w/n,z=1.96,a=1+z*z/n,m=(p+z*z/(2*n))/a,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/a;return [+(100*(m-h)).toFixed(1),+(100*(m+h)).toFixed(1)];}
for(let k=0;k<teams.length;k++){const pair=teams[k];for(const id of [...pair.a,...pair.b])if(!E.BY_ID[id])throw Error('Unknown player '+id);
for(let t=0;t<tactics.length;t++){const [ta,tb]=tactics[t];let w=0,multiGoalMatches=0,durations=[],goals=0;
for(let seed=0;seed<count;seed++)for(let swap=0;swap<2;swap++){
 const cfg={teams:swap?[pair.b,pair.a]:[pair.a,pair.b],tactics:swap?[tb,ta]:[ta,tb],seed:650000+k*10000+seed,mode:'score',traits:{enabled:true}};
 const r=E.simulate(cfg);if((swap?r.winner===1:r.winner===0))w++;
 if(r.score[0]+r.score[1]!==1)multiGoalMatches++;
 durations.push(r.duration);goals+=r.score[0]+r.score[1];
}
durations.sort((a,b)=>a-b);const row={cohort:pair.label,tacticA:ta,tacticB:tb,pairedSeeds:count,matches:count*2,winAPct:+(100*w/(count*2)).toFixed(1),ci95: wilson(w,count*2),multiGoalMatches,p95SimSeconds:durations[Math.floor(.95*(durations.length-1))]};rows.push(row);console.log('COHORT '+(k+1)+'/'+teams.length,'TACTIC '+(t+1)+'/'+tactics.length,JSON.stringify(row));
}}
for(const [ta,tb] of tactics){const subset=rows.filter(r=>r.tacticA===ta&&r.tacticB===tb),n=subset.reduce((a,r)=>a+r.matches,0),wins=subset.reduce((a,r)=>a+Math.round(r.winAPct*r.matches/100),0);matrix[ta+' / '+tb]={matches:n,winPct:+(100*wins/n).toFixed(1),ci95:wilson(wins,n),cohorts:subset.map(x=>({label:x.cohort,winPct:x.winAPct}))};}
const result={engine:E.VERSION,roster:ps.length,matchedPairSeeds:true,swappedStartingSides:true,newRegulationGoldenGoalMode:true,matchRule:'regulation + tied Golden Goal overtime',totalMatches:rows.reduce((n,r)=>n+r.matches,0),cohorts:teams,tactics,matrix,rows,methodology:'Four intentionally diverse fixed-trio matchups with all five tactics configurations, 200 identical seeds per matchup and swapped sides (8,000 simulations). Confidence intervals assume independent paired observations; this is exploratory, not a preregistered balance acceptance test. Team compositions may interact with tactics; no global win-rate is inferred.',date:'2026-10-31'};
fs.mkdirSync(path.join(root,'docs'),{recursive:true});fs.writeFileSync(path.join(root,'docs/V65_BALANCE_STUDY.json'),JSON.stringify(result,null,2)+'\n');console.log('V65_BALANCE_STUDY_COMPLETE',JSON.stringify(matrix));