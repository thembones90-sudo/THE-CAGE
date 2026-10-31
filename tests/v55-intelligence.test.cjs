'use strict';
const assert=require('node:assert/strict'),W=require('./viewer/harness.cjs').loadEngine(),E=W.CageEngine,I=W.CageTacticalIntelligence;
assert(I&&typeof I.engagement==='function'&&typeof I.forwardTarget==='function');
const ps=['paolo-maldini','nemanja-vidic','jaap-stam'].map(id=>E.BY_ID[id]),mixed=['paolo-maldini','michael-ballack','ronaldo-nazario'].map(id=>E.BY_ID[id]);
const d=Object.fromEntries(['press','balanced','possession','counter'].map(t=>[t,E.policy(ps,t)]));
assert(d.press.blockHeight>d.balanced.blockHeight&&d.balanced.blockHeight>d.counter.blockHeight);
assert(I.engagement(2,d.press,false,E.P)>I.engagement(2,d.balanced,false,E.P));
assert(I.engagement(2,d.balanced,false,E.P)>I.engagement(2,d.counter,false,E.P));
assert(I.engagement(1,d.balanced,true,E.P)>I.engagement(1,d.balanced,false,E.P));
assert.equal(I.engagement(3,d.press,false,E.P),1);
assert.equal(I.engagement(3,d.counter,false,E.P),1);
for(const t of Object.values(d))for(let x=0;x<=3;x++)for(const recent of [true,false]){
 const e=I.engagement(x,t,recent,E.P);assert(Number.isFinite(e)&&e>=0&&e<=1);
}
assert.throws(()=>I.engagement(7,d.press,false,E.P),/zone/);
assert.equal(d.press.restDefence,2,'All-defender high press starts with defensive shape intact');
assert.equal(d.press.commitForward,1);assert.equal(d.press.latePressEligible,true);assert.equal(E.P.decisions.pressSurgeAfter,1500);
assert.equal(E.policy(mixed,'press').commitForward,3,'Mixed lineup must retain viable aggressive pressing');
const carrier={id:'passer',pos:{x:1,y:1}},forwards=[
 {id:'blocked-runner',pos:{x:3,y:1},c:{a:{pace:88},ATT:90}},
 {id:'open-runner',pos:{x:2,y:0},c:{a:{pace:83},ATT:85}}
];
const spatial={oriented:(p,t)=>t===0?p.x:3-p.x,passingDefenders:(teams,t,from,to)=>to.y===1?[{id:'def1'},{id:'def2'}]:[]};
const selected=I.forwardTarget(forwards,carrier,0,spatial,[{},{}]);
assert.equal(selected.id,'open-runner','through target should prefer actual available passing lane');
assert.equal(I.forwardTarget([],carrier,0,spatial,[{},{}]),null);
assert.equal(I.outletWeight(false,selected,d.counter,d.press,E.P),0);
assert.equal(I.outletWeight(true,null,d.counter,d.press,E.P),0);
assert(I.outletWeight(true,selected,d.counter,d.press,E.P)>I.outletWeight(true,selected,d.counter,d.counter,E.P));
const result=E.simulate({teams:[ps.map(p=>p.id),['alessandro-nesta','john-terry','fabio-cannavaro']],tactics:['press','possession'],seed:2026,mode:'ko'});
assert.equal(result.events.filter(e=>e.type==='goal').length,1);
E.validateEvidence(result.events,{teams:[ps.map(p=>p.id),['alessandro-nesta','john-terry','fabio-cannavaro']],tactics:['press','possession']});
// Verify the late tactical adaptation really changes *recorded commitments*,
// not the scoreboard, and is only activated after prolonged real play.
const dconfig={teams:[ps.map(p=>p.id),['alessandro-nesta','john-terry','fabio-cannavaro']],tactics:['press','possession'],seed:0,mode:'ko'};
let observed=false;
for(let i=1;i<=170&&!observed;i++){
 const match=E.simulate({...dconfig,seed:30000+i});
 if(match.duration<=E.P.decisions.pressSurgeAfter+200)continue;
 const first=match.events.find(e=>e.t<500&&e.calc?.commitment);
 const later=match.events.find(e=>e.t>=E.P.decisions.pressSurgeAfter+20&&e.calc?.commitment);
 if(!first||!later)continue;
 const num=e=>dconfig.teams[0].filter(id=>e.calc.commitment[id]===true).length;
 assert.equal(num(first),1,'Press should not begin with two fake attackers');
 assert.equal(num(later),2,'Long, genuinely scoreless match should adapt its shape');
 E.validateEvidence(match.events,{...dconfig,seed:30000+i});
 assert.equal(match.events.filter(e=>e.type==='goal').length,1);
 observed=true;
}
assert(observed,'no authentic long match sampled to verify recorded adaptive commitment');
console.log('V55_INTELLIGENCE_TEST_PASS press policy zones, authentic role viability, lane-aware receiver, outlet guard, positional evidence');
