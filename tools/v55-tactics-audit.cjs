'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const W=require('../tests/viewer/harness.cjs').loadEngine(),E=W.CageEngine;
const teams=[
 [['paolo-maldini','michael-ballack','ronaldo-nazario'],['nemanja-vidic','luka-modric','thierry-henry']],
 [['paolo-maldini','nemanja-vidic','jaap-stam'],['alessandro-nesta','john-terry','fabio-cannavaro']],
 [['cristiano-ronaldo','lionel-messi','thierry-henry'],['ruud-gullit','luka-modric','alessandro-nesta']],
 [['roy-keane','paul-scholes','frank-lampard'],['claude-makelele','ryan-giggs','robin-van-persie']]
];
const modes=[['balanced','balanced'],['press','balanced'],['counter','balanced'],['possession','balanced'],['press','counter'],['possession','press']];
const n=Number(process.env.CAGE_V55_AUDIT_SEEDS||70),rows=[];
for(let match=0;match<teams.length;match++)for(const [tA,tB] of modes){
 const stats={matches:0,caps:0,winsA:0,events:0,shots:0,passes:0,completedPasses:0,pressEvents:0,pressWins:0,tackles:0,turnovers:0,throughs:0,blocked:0,transitions:0,pressX:[0,0,0,0],shotX:[0,0,0,0],duration:[],uniqueHashes:new Set()};
 for(let k=0;k<n;k++)for(let side=0;side<2;side++){
  const config={teams:side?[teams[match][1],teams[match][0]]:teams[match],tactics:side?[tB,tA]:[tA,tB],seed:250000+match*100000+k,mode:'ko'};
  stats.matches++;
  try{
   const r=E.simulate(config);assert.equal(r.events.filter(e=>e.type==='goal').length,1);
   stats.winsA+=r.winner===(side?1:0);stats.duration.push(r.duration);stats.uniqueHashes.add(r.eventHash);
   for(const e of r.events){
    stats.events++;if(e.type==='shot_attempt'){stats.shots++;if(e.zone)stats.shotX[e.zone.x]++;}
    if(e.type==='pass'){stats.passes++;stats.completedPasses+=e.outcome==='complete';}
    if(e.type==='through_ball')stats.throughs++;
    if(e.type==='press'){stats.pressEvents++;stats.pressWins+=e.outcome==='ball_won';if(e.zone)stats.pressX[e.zone.x]++;}
    if(e.type==='dribble_duel'&&e.outcome==='defender_wins')stats.tackles++;
    if(e.type==='turnover')stats.turnovers++;
    if(e.type==='block')stats.blocked++;
    if(e.type==='turnover'&&e.transition)stats.transitions++;
   }
  }catch(e){if(/safety limit/.test(e.message))stats.caps++;else throw e;}
 }
 const completed=stats.duration.length;
 stats.duration.sort((a,b)=>a-b);
 const row={lineup:match,tactics:[tA,tB],matches:stats.matches,completed,caps:stats.caps,winPctA:completed?+(stats.winsA/completed*100).toFixed(1):null,p95Sec:stats.duration[Math.min(completed-1,Math.floor(completed*.95))],eventsPerGame:+(stats.events/(completed||1)).toFixed(2),shotsPerGame:+(stats.shots/(completed||1)).toFixed(2),passesPerGame:+(stats.passes/(completed||1)).toFixed(2),pressPerGame:+(stats.pressEvents/(completed||1)).toFixed(2),pressWinRatePct:+(100*stats.pressWins/(stats.pressEvents||1)).toFixed(1),turnoversPerGame:+(stats.turnovers/(completed||1)).toFixed(2),throughPerGame:+(stats.throughs/(completed||1)).toFixed(2),pressX:stats.pressX,shotX:stats.shotX};
 rows.push(row);
 console.log('V55_AUDIT',JSON.stringify({lineup:match,tactics:row.tactics,caps:row.caps,win:row.winPctA,p95:row.p95Sec,press:row.pressPerGame,shots:row.shotsPerGame}));
}
const output={engine:E.VERSION,seedsPerPair:n,mode:'mirrored',rows};
const name=process.env.CAGE_V55_AUDIT_OUTPUT||'v55-baseline.json';
fs.writeFileSync(path.resolve(__dirname,'../tests/'+name),JSON.stringify(output,null,2)+'\n');
console.log('V55_AUDIT_DONE',rows.length,'conditions',rows.reduce((n,r)=>n+r.matches,0),'games','caps',rows.reduce((n,r)=>n+r.caps,0));
