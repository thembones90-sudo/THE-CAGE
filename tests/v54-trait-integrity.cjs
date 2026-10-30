'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {loadEngine}=require('./viewer/harness.cjs');
const W=loadEngine(),E=W.CageEngine,T=W.CageTraits,ps=W.THE_CAGE_PLAYERS;
assert.equal(ps.length,182);
assert.equal(T.CATALOG.length,15);
assert.equal(new Set(T.CATALOG).size,15);
assert.deepEqual(Object.keys(T.COUNTERPLAY).sort(),Array.from(T.CATALOG).sort());
const names=new Set(T.CATALOG),primary={},secondary={};
for(const p of ps){
 assert(p.traits&&p.traits.primary&&p.traits.secondary,'missing assigned primary/secondary '+p.id);
 assert(names.has(p.traits.primary),'unknown primary '+p.id);
 assert(names.has(p.traits.secondary),'unknown secondary '+p.id);
 assert.notEqual(p.traits.primary,p.traits.secondary,'two distinct tactical classes required');
 primary[p.traits.primary]=(primary[p.traits.primary]||0)+1;
 secondary[p.traits.secondary]=(secondary[p.traits.secondary]||0)+1;
 assert.equal(JSON.stringify(T.traits(p.id)),JSON.stringify([[p.traits.primary,1],[p.traits.secondary,.5]]));
}
for(const name of T.CATALOG){assert(primary[name]>=1,'no primary representative '+name);assert(secondary[name]>=1,'no secondary representative '+name);}
const actions=['carry','pass','through','outlet','shoot','dribble','wall','shield'];
const base=Object.fromEntries(actions.map(x=>[x,1]));
const contexts=[
 {x:0,engaged:false,transition:false,hasRunner:true,covered:true,support:1},
 {x:1,engaged:true,transition:true,hasRunner:true,covered:true,support:1},
 {x:2,engaged:false,transition:true,hasRunner:true,covered:true,support:1},
 {x:3,engaged:true,transition:false,hasRunner:false,covered:false,support:0}
];
let affected=0;
for(const name of names){
 const representatives=ps.filter(p=>p.traits.primary===name);
 let outcome=false;
 for(const p of representatives)for(const c of contexts){
  const a=T.weights(p.id,base,c),eng=T.engagement(p.id,.45,c);
  assert.deepEqual(Object.keys(a.weights).sort(),actions.slice().sort());
  for(const val of Object.values(a.weights))assert(Number.isFinite(val)&&val>=0,'nonfinite weight '+name);
  assert(eng>=0&&eng<=1,'impossible engagement probability '+name);
  if(actions.some(x=>Math.abs(a.weights[x]-1)>1e-6)||Math.abs(eng-.45)>1e-6)outcome=true;
 }
 assert(outcome,'class has no observable decisions across relevant situations: '+name);
 affected++;
}
const squads=[
 [['paolo-maldini','michael-ballack','ronaldo-nazario'],['nemanja-vidic','jay-jay-okocha','djalminha']],
 [['roy-keane','paul-scholes','ryan-giggs'],['claude-makelele','frank-lampard','michael-essien']],
 [['lionel-messi','luka-modric','zinedine-zidane'],['cristiano-ronaldo','sergio-ramos','andres-iniesta']]
];
let same=0,different=0,checked=0;
for(let i=0;i<75;i++){
 const teams=squads[i%squads.length],config={teams,tactics:['balanced','press'],seed:65000+i,mode:'ko',traits:{enabled:true}};
 const a=E.simulate(config),b=E.simulate(config);
 assert.equal(a.eventHash,b.eventHash,'traits introduced nondeterminism');
 assert.equal(JSON.stringify(a),JSON.stringify(b),'trait result not reproducible');
 E.validateEvidence(a.events,config);
 assert.equal(a.events.filter(x=>x.type==='goal').length,1);
 assert.equal(a.score[0]+a.score[1],1);
 const baseline=E.simulate({...config,traits:undefined});
 if(a.eventHash===baseline.eventHash)same++;else different++;
 checked++;
}
assert(different>=5,'trait mode did not measurably alter tactical decisions');
console.log('V54_TRAITS_PASS roster='+ps.length+' classes='+affected+' configMode=opt-in scenarios='+checked+' changedByTraits='+different+' same='+same);
