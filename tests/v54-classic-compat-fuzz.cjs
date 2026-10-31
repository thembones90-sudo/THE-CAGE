'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const W=require('./viewer/harness.cjs').loadEngine(),R=W.CageRecords,save=JSON.parse(fs.readFileSync(path.join(__dirname,'v54-classic-v53-3round.json'),'utf8'));
const record=save.history[0];
R.reproduce(record);
const changes=[
 r=>r.schema=999,r=>r.config=null,r=>r.config.seed=-1,r=>r.config.mode='league',
 r=>r.config.teams=[],r=>r.config.teams[0][0]='missing-player',
 r=>r.config.tactics[1]='glitch',r=>r.result=null,r=>r.result.events=null,
 r=>r.result.events=[],r=>r.result.events[0].actor='fake',
 r=>r.result.events[0].n=8,r=>r.result.events[0].t=-400,
 r=>r.result.events.at(-1).type='goal_miss',
 r=>r.result.score=[2,0],r=>r.result.winner=4,
 r=>r.result.duration=-99,r=>r.rosterFingerprint='fake',
 r=>r.engineVersion='cage-t3-3',r=>r.paramsVersion='fake',
 r=>r.config.traits={enabled:false}
];
let rejected=0;
for(const change of changes){
 const bad=R.copy(record);
 change(bad);
 assert.throws(()=>R.reproduce(bad),'malformed replay accepted: '+rejected);
 rejected++;
}
const savemut=[
 s=>s.wins.A=9,s=>s.history.push(s.history[0]),s=>s.claimed.A=[null],
 s=>s.round=44,s=>s.used=[],s=>s.counterIndicators='ON',
 s=>s.traitsMode='yes',s=>s.pending=s.history[0],
 s=>s.drafts=null,s=>s.pace='ultra'
];
for(const change of savemut){
 const bad=R.copy(save);
 change(bad);
 assert.throws(()=>R.validateSave(bad),'malformed save accepted: '+rejected);
 rejected++;
}
assert.equal(rejected,31);
assert.equal(R.reproduce(record).winner,record.result.winner);
console.log('V54_MALFORMED_SAVE_PASS rejected='+rejected+' forged replay or saved-state variants; valid historic replay still works');
