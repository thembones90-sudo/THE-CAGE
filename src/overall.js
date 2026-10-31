// THE CAGE OVR V2.0: distinct skill domains and positional archetypes from 17 prime ratings.
// Display-only. No career-tier, folklore, trait or identity boost enters the formula.
(()=>{
'use strict';
const DOMAIN_KEYS=Object.freeze(['mobility','control','creation','scoring','defending','power','intelligence','engine']);
const PROFILES=Object.freeze({
 ST:[
  {name:'Poacher',w:{scoring:48,mobility:8,control:10,creation:4,intelligence:11,power:12,engine:7}},
  {name:'Mobile striker',w:{scoring:32,mobility:25,control:21,creation:4,intelligence:6,power:8,engine:4}}
 ],
 CF:[
  {name:'False nine',w:{scoring:23,mobility:9,control:26,creation:23,intelligence:12,power:5,engine:2}},
  {name:'Second striker',w:{scoring:34,mobility:15,control:18,creation:12,intelligence:10,power:8,engine:3}}
 ],
 CAM:[
  {name:'Classic playmaker',w:{scoring:6,mobility:3,control:29,creation:37,intelligence:21,power:2,engine:2}},
  {name:'Attacking runner',w:{scoring:24,mobility:17,control:22,creation:18,intelligence:10,power:5,engine:4}}
 ],
 CM:[
  {name:'Deep orchestrator',w:{scoring:3,mobility:3,control:28,creation:38,intelligence:20,defending:3,power:2,engine:3}},
  {name:'Box to box',w:{scoring:17,mobility:12,control:17,creation:20,intelligence:12,defending:10,power:6,engine:6}},
  {name:'Ball winner',w:{mobility:16,control:9,creation:11,intelligence:5,defending:41,power:8,engine:10}}
 ],
 CDM:[
  {name:'Defensive screen',w:{mobility:3,control:8,creation:21,intelligence:10,defending:47,power:8,engine:3}},
  {name:'Deep distributor',w:{mobility:2,control:14,creation:36,intelligence:15,defending:26,power:5,engine:2}}
 ],
 LW:[
  {name:'Goalscoring winger',w:{scoring:28,mobility:18,control:25,creation:13,intelligence:8,power:6,engine:2}},
  {name:'Wide creator',w:{scoring:11,mobility:16,control:30,creation:26,intelligence:12,power:3,engine:2}}
 ],
 RW:[
  {name:'Goalscoring winger',w:{scoring:28,mobility:18,control:25,creation:13,intelligence:8,power:6,engine:2}},
  {name:'Wide creator',w:{scoring:11,mobility:16,control:30,creation:26,intelligence:12,power:3,engine:2}}
 ],
 LM:[
  {name:'Two-way wide midfielder',w:{scoring:11,mobility:16,control:20,creation:23,intelligence:10,defending:7,power:7,engine:6}},
  {name:'Wide playmaker',w:{scoring:6,mobility:17,control:24,creation:32,intelligence:10,defending:4,power:4,engine:3}}
 ],
 RM:[
  {name:'Two-way wide midfielder',w:{scoring:11,mobility:16,control:20,creation:23,intelligence:10,defending:7,power:7,engine:6}},
  {name:'Wide playmaker',w:{scoring:6,mobility:17,control:24,creation:32,intelligence:10,defending:4,power:4,engine:3}}
 ],
 LB:[
  {name:'Defending fullback',w:{mobility:13,control:7,creation:10,intelligence:4,defending:53,power:10,engine:3}},
  {name:'Attacking fullback',w:{mobility:22,control:12,creation:25,intelligence:8,defending:23,power:6,engine:4}}
 ],
 RB:[
  {name:'Defending fullback',w:{mobility:13,control:7,creation:10,intelligence:4,defending:53,power:10,engine:3}},
  {name:'Attacking fullback',w:{mobility:22,control:12,creation:25,intelligence:8,defending:23,power:6,engine:4}}
 ],
 CB:[
  {name:'Traditional centre-back',w:{mobility:5,control:2,creation:2,intelligence:5,defending:70,power:15,engine:1}},
  {name:'Ball-playing centre-back',w:{mobility:7,control:12,creation:18,intelligence:8,defending:43,power:10,engine:2}}
 ]
});
// A zero-weight or missing skill never silently contributes. Every profile must be normalized.
for(const [position,arr] of Object.entries(PROFILES)){
 for(const entry of arr){
  const sum=Object.values(entry.w).reduce((a,b)=>a+b,0);
  if(sum!==100)throw Error('OVR profile weights must total 100: '+position+'/'+entry.name+'='+sum);
  for(const [k,value] of Object.entries(entry.w))if(!DOMAIN_KEYS.includes(k)||!Number.isFinite(value)||value<0)throw Error('Invalid OVR domain: '+position+'/'+k);
  Object.freeze(entry.w);Object.freeze(entry);
 }
 Object.freeze(arr);
}
function n(obj,key,id){const value=obj?.[key];if(!Number.isFinite(value)||value<0||value>100)throw Error('OVR requires valid '+key+' for '+id);return value;}
function domains(p){
 if(!p||!p.r)throw Error('OVR requires player and prime ratings');
 const r=p.r;
 const id=p.id||'?';
 // NOTE: pass/passing, finish/finishing and phys/physical are duplicate datasets:
 // only one copy contributes. Technique, touch and dribbling are blended into ONE domain.
 const pace=n(r,'pace',id),tech=n(r,'tech',id),pass=n(r,'pass',id),
       finish=n(r,'finish',id),def=n(r,'def',id),phys=n(r,'phys',id),
       touch=n(r,'first_touch',id),dribble=n(r,'dribbling',id),
       vision=n(r,'vision',id),shooting=n(r,'shooting',id),stamina=n(r,'stamina',id),
       tackle=n(r,'tackling',id),position=n(r,'positioning',id),composure=n(r,'composure',id);
 // Only 14 independent prime skill inputs are used; duplicated aliases are ignored.
 // Do not use provisional tactical ratings: they load after card scripts in some views.
 return Object.freeze({
  mobility:pace,
  control:0.30*tech+0.35*touch+0.35*dribble,
  creation:0.58*pass+0.42*vision,
  scoring:0.70*finish+0.30*shooting,
  defending:0.45*def+0.30*tackle+0.25*position,
  power:phys,
  intelligence:composure,
  engine:stamina
 });
}
function evaluate(player){
 const pos=player.position||(player.role==='D'?'CB':player.role==='M'?'CM':'ST'),profiles=PROFILES[pos];
 if(!profiles)throw Error('OVR unsupported position: '+pos);
 const parts=domains(player);
 const options=profiles.map(x=>({archetype:x.name,score:Object.entries(x.w).reduce((s,[k,v])=>s+parts[k]*v,0)/100}));
 const winner=options.reduce((best,v)=>v.score>best.score?v:best);
 return Object.freeze({position:pos,archetype:winner.archetype,score:Number(winner.score.toFixed(3)),domains:parts});
}
// A limited exception remains visible instead of stealth-editing Alex's prime ratings.
// It must be removed when the full 184-player ratings themselves are editorially calibrated.
const REVIEW_OVERRIDES=Object.freeze({
 'alex-de-souza':Object.freeze({overall:89,status:'provisional-pending-owner-approval',reason:'Prime technical ratings currently make the raw CAM score disproportionately high; requires full input audit.'})
});
function raw(p){const value=evaluate(p).score;return Math.max(1,Math.min(99,Math.round(value)));}
function compute(p){const patch=REVIEW_OVERRIDES[p.id];return patch?patch.overall:raw(p);}
function apply(ps){if(!Array.isArray(ps))throw Error('Expected player array');const seen=new Set();for(const p of ps){if(seen.has(p.id))throw Error('Duplicate OVR player '+p.id);seen.add(p.id);p.overall=compute(p);}return ps.length;}
const loadedPlayers=apply(window.THE_CAGE_PLAYERS);
window.CageOverall=Object.freeze({VERSION:'overall-v2.0-provisional',PROFILES,REVIEW_OVERRIDES,domains,evaluate,raw,compute,read:p=>p.overall??compute(p),apply,loadedPlayers});
})();