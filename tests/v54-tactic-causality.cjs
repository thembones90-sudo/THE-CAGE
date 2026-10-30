'use strict';
const assert=require('node:assert/strict'),W=require('./viewer/harness.cjs').loadEngine(),E=W.CageEngine;
const team=['roy-keane','paul-scholes','frank-lampard'];
const opp=['claude-makelele','ryan-giggs','robin-van-persie'];
const cards=Object.keys(E.TACTICS),p=team.map(id=>E.BY_ID[id]);
assert.deepEqual(cards,['balanced','possession','press','counter']);
const policy=Object.fromEntries(cards.map(name=>[name,E.policy(p,name)]));
assert(policy.possession.tempo>policy.balanced.tempo,'possession fails tempo emphasis');
assert(policy.counter.directness>policy.balanced.directness,'counter directness not distinct');
assert(policy.press.blockHeight>policy.balanced.blockHeight,'pressing height not distinct');
assert(policy.counter.restDefence>=policy.balanced.restDefence,'counter rest shape not deeper');
let diverseSeeds=0,all=0,totals=Object.fromEntries(cards.map(x=>[x,{pass:0,through_ball:0,shot_attempt:0,press:0,turnover:0,goal:0,matches:0}]));
for(let seed=90000;seed<90100;seed++){
 const hashes=[];
 for(const tactic of cards){
  const config={teams:[team,opp],tactics:[tactic,'balanced'],seed,mode:'ko'};
  const a=E.simulate(config),b=E.simulate(config);
  assert.equal(a.eventHash,b.eventHash,'tactic broke deterministic replays '+tactic);
  assert.equal(a.score[0]+a.score[1],1,'missing goal '+tactic);
  E.validateEvidence(a.events,config);
  hashes.push(a.eventHash);
  const t=totals[tactic];t.matches++;
  for(const e of a.events)if(t[e.type]!==undefined)t[e.type]++;
  all++;
 }
 if(new Set(hashes).size>=3)diverseSeeds++;
}
assert(diverseSeeds>=80,'tactics are cosmetically different, not real decisions');
for(const tactic of cards)assert(totals[tactic].goal===totals[tactic].matches,'goal count must equal completed games for tactic '+tactic);
assert(totals.press.press/totals.press.matches>totals.balanced.press/totals.balanced.matches*1.08,'press tactic does not create noticeably more recorded pressing attempts');
assert(totals.possession.pass/totals.possession.matches>totals.counter.pass/totals.counter.matches*1.08,'no observable possession difference');
console.log('V54_TACTIC_CAUSALITY_PASS seedSets=100 outcomes='+all+' distinctSeedSets='+diverseSeeds+' distributions='+JSON.stringify(totals));
