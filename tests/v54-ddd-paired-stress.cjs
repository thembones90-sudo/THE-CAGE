'use strict';
// Strict paired-seed comparison. Never modifies source or simulates fake goals.
const W=require('../tests/viewer/harness.cjs').loadEngine(),E=W.CageEngine,P=E.P;
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const teams=[
 ['paolo-maldini','nemanja-vidic','jaap-stam'],
 ['alessandro-nesta','john-terry','fabio-cannavaro']
];
const n=Number(process.env.CAGE_V54_DDD_STRESS_SEEDS||500);
const rows=[];
for(const spec of [{name:'t3-3-parameter-baseline',q:11,ref:75},{name:'t3-4-candidate',q:15,ref:68}]){
 P.shot.q=spec.q;P.resolution.shotReference=spec.ref;
 const lengths=[],wins=[0,0],starts=[0,0];let caps=0,matches=0,goalCount=0,shots=0;
 for(let seed=1;seed<=n;seed++)for(let side=0;side<2;side++){
  const config={teams:side?[teams[1],teams[0]]:teams,tactics:['balanced','balanced'],seed:850000+seed,mode:'ko'};
  matches++;
  try{
    const result=E.simulate(config);
    assert.equal(result.events.at(-1).type,'goal');
    assert.equal(result.events.filter(e=>e.type==='goal').length,1);
    assert.equal(result.score.reduce((a,b)=>a+b,0),1);
    assert(result.duration<=E.P.maxSeconds);
    lengths.push(result.duration);wins[result.winner===side?0:1]++;
    const k=result.events[0].team;
    starts[result.winner===k?0:1]++;
    goalCount++;shots+=result.events.filter(e=>e.type==='shot_attempt').length;
  }catch(e){if(/safety limit/.test(e.message))caps++;else throw e;}
 }
 lengths.sort((a,b)=>a-b);
 rows.push({name:spec.name,shotQ:spec.q,shotReference:spec.ref,matches,completed:lengths.length,caps,capRatePct:+(100*caps/matches).toFixed(2),p50:lengths[Math.floor(lengths.length*.5)],p95:lengths[Math.floor(lengths.length*.95)],p99:lengths[Math.floor(lengths.length*.99)],max:lengths.at(-1),winsA:wins[0],kickoffWinPct:+(100*starts[0]/goalCount).toFixed(1),shotsPerComplete:+(shots/goalCount).toFixed(1)});
}
P.shot.q=15;P.resolution.shotReference=68;
const [before,after]=rows;
assert(after.caps<before.caps*.5,'candidate fails to halve defensively stale-mating seed sample');
assert(after.caps/after.matches<.03,'candidate not safe enough for experimental gate');
assert(after.kickoffWinPct>=38&&after.kickoffWinPct<=62,'kickoff advantage extreme');
const report={note:'500 paired seeds in each direction (1000 actual games per configuration), identical seed schedule and team compositions; no forced goals, no persistent modifications',roster:W.THE_CAGE_PLAYERS.length,rows};
fs.writeFileSync(path.resolve(__dirname,'../tests/v54-ddd-paired-stress.json'),JSON.stringify(report,null,2)+'\n');
console.log('V54_DDD_STRESS_PASS',JSON.stringify(report));
