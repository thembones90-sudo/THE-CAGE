'use strict';
// Portable paired-seed regression: V5.4.1 baseline data is archived in JSON.
// This test runs CURRENT engine on all identical recorded seed pairs, so it
// does not depend on a neighboring SKYNET Windows worktree.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'v55-paired-tactics-results.json'),'utf8'));
const W=require('./viewer/harness.cjs').loadEngine(),E=W.CageEngine;
assert.equal(E.VERSION,'cage-t3-6');assert.equal(W.THE_CAGE_PLAYERS.length,182);
const D1=['paolo-maldini','nemanja-vidic','jaap-stam'],D2=['alessandro-nesta','john-terry','fabio-cannavaro'];
const M1=['paolo-maldini','michael-ballack','ronaldo-nazario'],M2=['nemanja-vidic','luka-modric','thierry-henry'];
const A1=['cristiano-ronaldo','lionel-messi','thierry-henry'],A2=['ruud-gullit','luka-modric','alessandro-nesta'];
const inputs=[
 {name:'DDD Possession vs Press',teams:[D1,D2],tactics:['possession','press'],seedBase:600000},
 {name:'DDD Press vs Counter',teams:[D1,D2],tactics:['press','counter'],seedBase:700000},
 {name:'Balanced Press vs Balanced',teams:[M1,M2],tactics:['press','balanced'],seedBase:800000},
 {name:'Attack Possession vs Press',teams:[A1,A2],tactics:['possession','press'],seedBase:900000}
];
let total=0,finished=0,caps=0;
for(const c of inputs){
 const archived=fixture.conditions.find(x=>x.name===c.name);
 assert(archived,c.name+' baseline missing');
 const [before,candidate]=archived.versions;
 assert.equal(before.engine,'cage-t3-5');assert.equal(candidate.engine,E.VERSION);
 const durations=[];let wins=0,fail=0,firstSideWins=0;
 for(let seed=0;seed<fixture.seedPairs;seed++)for(let reversed=0;reversed<2;reversed++){
  const config={teams:reversed?[c.teams[1],c.teams[0]]:c.teams,
    tactics:reversed?[c.tactics[1],c.tactics[0]]:c.tactics,seed:c.seedBase+seed,mode:'ko'};
  total++;
  try{
   const r=E.simulate(config);
   assert.equal(r.events.filter(e=>e.type==='goal').length,1);
   assert.equal(r.score.reduce((a,b)=>a+b,0),1);
   wins+=r.winner===(reversed?1:0);
   firstSideWins+=r.winner===0;
   durations.push(r.duration);finished++;
  }catch(e){if(/safety limit/.test(e.message)){fail++;caps++;}else throw e;}
 }
 durations.sort((a,b)=>a-b);
 const actual={engine:E.VERSION,games:fixture.seedPairs*2,completed:durations.length,caps:fail,
   winPctA:+(100*wins/durations.length).toFixed(2),
   p95:durations[Math.floor(durations.length*.95)]||null,
   kickoffSide0Pct:+(100*firstSideWins/durations.length).toFixed(2)};
 assert.deepEqual(actual,candidate,'V5.5 event outcomes drifted from verified paired fixture for '+c.name);
 if(c.name==='DDD Possession vs Press'){
  assert(actual.winPctA>=12&&actual.winPctA-before.winPctA>=5);
  assert(actual.caps<=before.caps+3);
 }
 if(c.name==='DDD Press vs Counter')assert(actual.winPctA>=35&&actual.winPctA<=65);
 if(c.name==='Balanced Press vs Balanced')assert(Math.abs(actual.winPctA-before.winPctA)<=14);
 console.log('V55_PORTABLE_PAIRED',JSON.stringify({matchup:c.name,oldCaps:before.caps,newCaps:actual.caps,oldWin:before.winPctA,newWin:actual.winPctA}));
}
assert.equal(total,3600);
console.log('V55_PORTABLE_PAIRED_PASS',total,'real T3-v6 matches','completed='+finished,'caps='+caps,'all full-match outcomes frozen against source-independent fixture');
