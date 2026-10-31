// THE CAGE V6.4 IRON INTELLIGENCE. Draft-only AI. No engine access, future-pool access, rating or outcome modifications.
(function(root){'use strict';
const LEVELS=Object.freeze(['casual','competitive','ruthless']);
const TACTICS=Object.freeze(['balanced','press','possession','counter']);
const rand=rng=>Math.min(0.999999999,Math.max(0,Number(rng())));
const role=p=>{const r=String(p.role||p.position||'').toUpperCase();if(/^(D|CB|RB|LB|LWB|RWB|DEF)/.test(r))return 'D';if(/^(M|CM|CDM|CAM|AM|RM|LM|MID)/.test(r))return 'M';return 'F';};
const val=(p,key)=>Number(p.r?.[key]||0);
const ovr=p=>Number(p.overall||p.ovr||0);
function score(p,selected=[],opponent=[],level='competitive'){
 const seen=selected.map(role),kind=role(p),count=seen.filter(x=>x===kind).length;
 const roles=new Set(seen);
 const missing=!roles.has(kind),third=selected.length>=2&&missing;
 // Prefer complete D/M/F trios, without outlawing unusual tactical combinations.
 const balance=(third?15:missing?11:-9*count);
 const skills=kind==='D'?(val(p,'def')*.6+val(p,'phys')*.22+val(p,'pass')*.18):
   kind==='M'?(val(p,'pass')*.42+val(p,'tech')*.36+val(p,'phys')*.22):
   (val(p,'finish')*.45+val(p,'pace')*.29+val(p,'tech')*.26);
 const durability=(val(p,'stamina')+val(p,'composure'))/2;
 let total=ovr(p)*.52+skills*.32+durability*.09+balance*.45;
 if(level==='ruthless'){
   const other=opponent.map(role);
   if(other.length){const enemyD=other.filter(x=>x==='D').length,enemyF=other.filter(x=>x==='F').length;
     if(kind==='F'&&enemyD>=2)total+=Math.min(4,val(p,'tech')*.035);
     if(kind==='D'&&enemyF>=2)total+=Math.min(4,val(p,'def')*.04);}
   const partner=selected.filter(q=>role(q)!==kind);
   if(partner.length){total+=partner.reduce((s,q)=>s+Math.min(2.5,(val(q,'pass')+val(p,'tech'))/85),0);}
 }
 return total;
}
function choose({candidates,selected=[],opponent=[],level='competitive',rng=Math.random,rerollsLeft=0}){
 if(!LEVELS.includes(level))throw Error('Invalid CPU difficulty');
 if(!Array.isArray(candidates)||candidates.length!==15||new Set(candidates.map(p=>p.id)).size!==15)throw Error('CPU must receive exactly 15 unique candidates');
 const sorted=candidates.map(p=>({p,score:score(p,selected,opponent,level)})).sort((a,b)=>b.score-a.score||a.p.id.localeCompare(b.p.id));
 if(level==='casual')return {id:candidates[Math.floor(rand(rng)*candidates.length)].id,reroll:false};
 // An optional reroll discards the full original pool and is the same limited reroll humans have.
 const min=level==='ruthless'?78:74;
 if(rerollsLeft>0&&sorted[0].score<min)return {id:null,reroll:true};
 const noise=level==='ruthless'?0.5:4.8;
 const ranked=sorted.map(x=>({...x,value:x.score+(rand(rng)-.5)*noise})).sort((a,b)=>b.value-a.value||a.p.id.localeCompare(b.p.id));
 return {id:ranked[0].p.id,reroll:false};
}
function tactic(team,opponent=[],level='competitive',rng=Math.random){
 if(level==='casual')return TACTICS[Math.floor(rand(rng)*TACTICS.length)];
 if(team.length!==3)throw Error('CPU tactic requires locked trio');
 const n=team.length,avg=k=>team.reduce((s,p)=>s+val(p,k),0)/n;
 const def=team.filter(p=>role(p)==='D').length,mid=team.filter(p=>role(p)==='M').length;
 const scores={
  balanced:80+Math.min(5,Math.abs(def-1)*-2+Math.abs(mid-1)*-2),
  press:(avg('pace')*.25+avg('stamina')*.48+avg('def')*.27),
  possession:(avg('pass')*.45+avg('tech')*.4+avg('composure')*.15),
  counter:(avg('pace')*.42+avg('finish')*.31+avg('def')*.27)
 };
 if(level==='ruthless'){
  if(opponent.filter(p=>role(p)==='F').length>=2)scores.counter+=3;
  if(mid>=2)scores.possession+=3;
  if(def>=2)scores.counter+=2;
 }
 const list=TACTICS.map(k=>({k,v:scores[k]+(level==='competitive'?(rand(rng)-.5)*5:0)})).sort((a,b)=>b.v-a.v||a.k.localeCompare(b.k));
 return list[0].k;
}
const api=Object.freeze({LEVELS,TACTICS,role,score,choose,tactic});
root.CageCpu=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
