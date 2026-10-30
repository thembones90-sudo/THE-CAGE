'use strict';
// Seeded factual T3 diagnostics. Does not change engine, players or outcome.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const W=require('../tests/viewer/harness.cjs').loadEngine();
const E=W.CageEngine,ROSTER=W.THE_CAGE_PLAYERS;
assert.equal(ROSTER.length,182);
const R=Object.fromEntries(ROSTER.map(p=>[p.id,p]));
const squads={
balancedA:['paolo-maldini','michael-ballack','ronaldo-nazario'],
balancedB:['nemanja-vidic','luka-modric','thierry-henry'],
defenseA:['paolo-maldini','nemanja-vidic','jaap-stam'],
defenseB:['alessandro-nesta','john-terry','fabio-cannavaro'],
attackA:['ronaldo-nazario','cristiano-ronaldo','thierry-henry'],
attackB:['lionel-messi','kylian-mbappe','robert-lewandowski'],
creatorsA:['paul-scholes','luka-modric','xavi-hernandez'],
creatorsB:['andres-iniesta','kevin-de-bruyne','toni-kroos'],
hybridA:['roy-keane','paul-scholes','frank-lampard'],
hybridB:['claude-makelele','ryan-giggs','robin-van-persie'],
};
for(const [name,ids] of Object.entries(squads))for(const id of ids) assert(R[id],name+' missing '+id);
const cases=[
 ['balanced','balancedA','balancedB','balanced','balanced'],
 ['DDD vs DDD','defenseA','defenseB','balanced','balanced'],
 ['DDD vs attack','defenseA','attackA','counter','press'],
 ['DDD vs balanced','defenseA','balancedB','counter','balanced'],
 ['attack vs balanced','attackA','balancedB','press','balanced'],
 ['creators vs balanced','creatorsA','balancedB','possession','balanced'],
 ['creators vs attack','creatorsA','attackB','possession','counter'],
 ['tactics press vs possession','hybridA','hybridB','press','possession'],
 ['tactics counter vs press','hybridA','hybridB','counter','press'],
 ['tactics possession vs counter','hybridA','hybridB','possession','counter'],
];
const num=Number(process.env.CAGE_V54_SEEDS||140),rows=[],version=E.VERSION;
const quant=(xs,p)=>xs[Math.min(xs.length-1,Math.floor(xs.length*p))]??null;
for(let i=0;i<cases.length;i++){
 const [label,an,bn,ta,tb]=cases[i];const x=squads[an],y=squads[bn],dur=[],events={},winnerA=[0,0],kickoff=[0,0];let caps=0,shots=0,passes=0,rebounds=0,goals=0,all=0,tactical=0;
 for(let s=0;s<num;s++)for(let rev=0;rev<2;rev++){
  const config={teams:rev?[y,x]:[x,y],tactics:rev?[tb,ta]:[ta,tb],seed:(i+1)*100000+s+1,mode:'ko'};
  try{
   const r=E.simulate(config);
   assert.equal(r.events.filter(e=>e.type==='goal').length,1);
   assert.equal(r.events.at(-1).type,'goal');
   assert(r.winner===0||r.winner===1);
   assert.equal(r.score[0]+r.score[1],1);
   winnerA[rev]+=r.winner===(rev?1:0)?1:0;
   kickoff[rev]+=r.winner===r.events[0].team?1:0;
   dur.push(r.duration);all++;
   for(const e of r.events){events[e.type]=(events[e.type]||0)+1;if(e.type==='shot_attempt')shots++;if(e.type==='pass')passes++;if(e.type==='rebound')rebounds++;if(e.type==='goal')goals++;}
  }catch(e){if(/safety limit/.test(e.message))caps++;else throw e;}
 }
 dur.sort((a,b)=>a-b);
 const row={label,squads:[an,bn],tactics:[ta,tb],matches:num*2,completed:all,caps,winPctA:all?+(winnerA.reduce((a,b)=>a+b,0)/all*100).toFixed(1):null,sideAWinPct:all?+(winnerA[0]/num*100).toFixed(1):null,sideBWinPct:all?+(winnerA[1]/num*100).toFixed(1):null,kickoffWinnerPct:all?+(kickoff.reduce((a,b)=>a+b,0)/all*100).toFixed(1):null,medianSec:quant(dur,.5),p95Sec:quant(dur,.95),p99Sec:quant(dur,.99),maxSec:dur.at(-1)||null,meanShots:all?+(shots/all).toFixed(1):0,meanPasses:all?+(passes/all).toFixed(1):0,eventCounts:events};
 rows.push(row);console.log('V54_CASE',JSON.stringify({label,n:all,caps,winA:row.winPctA,kick:row.kickoffWinnerPct,p95:row.p95Sec,p99:row.p99Sec,shots:row.meanShots}));
}
const result={version,roster:ROSTER.length,seedPairs:num,rows};
const output=path.resolve(__dirname,'../tests/'+(process.env.CAGE_V54_OUTPUT||'v54-balance-after.json'));
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log('V54_BASELINE_READY',output,'matches',rows.reduce((n,x)=>n+x.matches,0),'caps',rows.reduce((n,x)=>n+x.caps,0));
