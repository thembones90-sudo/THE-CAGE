'use strict';const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const c={window:{location:{search:''}}};vm.createContext(c);for(const m of fs.readFileSync('play.html','utf8').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){vm.runInContext(fs.readFileSync(m[1],'utf8'),c,{filename:m[1]});if(m[1]==='src/replay/records.js')break;}
const E=c.window.CageEngine,R=c.window.CageRecords;const squads={
 mixed:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],
 creators:[['zinedine-zidane','ronaldinho','ronaldo-nazario'],['andres-iniesta','michael-ballack','lionel-messi']],
 defenders:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]
};
let eligible=0,linked=0,linkedGoals=0,bad=0,nonGK=0,freeKicks=0,tamperChecked=false;
for(const [group,teams] of Object.entries(squads))for(const k of [false,true])for(let i=0;i<160;i++){
 const cfg={teams,tactics:i%2?['press','possession']:['balanced','balanced'],mode:'score',traits:{enabled:true},seed:923200+i,...(k?{keepers:['gianluigi-buffon','manuel-neuer']}:{})};
 let r;try{r=E.simulate(cfg);}catch(e){bad++;console.log('ERR',group,i,e.message);continue;}
 for(const e of r.events){
  if(e.type==='shot_attempt'&&e.kind==='fk'){freeKicks++;assert(e.creator===undefined&&e.linkBoost===undefined,'Free kick must not get a chance creation bonus');}
  if((e.type==='pass'||e.type==='through_ball')&&e.calc?.creativeLink>0){eligible++;if(!(e.calc.creativeLink<=.22&&cfg.teams[e.team].includes(e.actor)&&e.outcome==='complete'))throw Error('Illegal crafted pass');}
  if(e.type==='shot_attempt'&&e.creator){linked++;if(!(cfg.teams[e.team].includes(e.creator)&&e.linkBoost>0&&e.linkBoost<=.22))throw Error('Illegal creator');}
  if(e.type==='goal'&&e.calc?.linkBoost>0)linkedGoals++;
 }

 if(!tamperChecked){const original=r.events.find(e=>e.type==='shot_attempt'&&e.creator);if(original){
    const forged=JSON.parse(JSON.stringify(R.make(cfg,r,1))),ev=forged.result.events.find(e=>e.i===original.i);
    ev.creator='nonexistent-creator';
    forged.result.eventHash=E.hashEvents(forged.result.events);
    assert.throws(()=>R.validate(forged),/creative link|provenance|unknown role/,'Rehashed forged creative-link evidence must fail import validation');
    tamperChecked=true;
 }}
 if(!k)nonGK++;
 if(i===0||i===15||i===80){const record=R.make(cfg,r,1);if(R.reproduce(record).eventHash!==r.eventHash)throw Error('Replay failed');}
}
if(!linked||!eligible||!linkedGoals||!freeKicks||!tamperChecked)throw Error('No link mechanics actually used '+JSON.stringify({eligible,linked,linkedGoals}));
console.log('T312_LINK_SANITY',JSON.stringify({eligiblePasses:eligible,linkedShotAttempts:linked,linkedGoals,failures:bad,noKeeperGames:nonGK,freeKicks,tamperRejected:tamperChecked}));
