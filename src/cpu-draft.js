// THE CAGE V6.4 IRON INTELLIGENCE. Draft-only AI. No engine access, future-pool access, rating or outcome modifications.
(function(root){'use strict';
const LEVELS=Object.freeze(['casual','competitive','ruthless']);
const TACTICS=Object.freeze(['balanced','press','possession','counter']);
const rand=rng=>Math.min(0.999999999,Math.max(0,Number(rng())));
const role=p=>{const r=String(p.role||p.position||'').toUpperCase();if(/^(D|CB|RB|LB|LWB|RWB|DEF)/.test(r))return 'D';if(/^(M|CM|CDM|CAM|AM|RM|LM|MID)/.test(r))return 'M';return 'F';};
const val=(p,key)=>Number(p.r?.[key]||0);
const ovr=p=>Number(p.overall||p.ovr||0);
// All seventeen calibrated attributes contribute to decisions. This is a transparent
// football scouting heuristic, never an engine-side rating or inferred win percentage.
const WEIGHTS=Object.freeze({
 D:{pace:.05,tech:.025,pass:.035,finish:.005,def:.15,phys:.10,first_touch:.02,dribbling:.02,passing:.05,vision:.025,finishing:.005,shooting:.005,stamina:.07,physical:.10,tackling:.16,positioning:.13,composure:.08},
 M:{pace:.04,tech:.095,pass:.14,finish:.02,def:.04,phys:.035,first_touch:.095,dribbling:.07,passing:.12,vision:.105,finishing:.015,shooting:.02,stamina:.055,physical:.015,tackling:.03,positioning:.05,composure:.055},
 F:{pace:.115,tech:.08,pass:.04,finish:.15,def:.005,phys:.045,first_touch:.08,dribbling:.08,passing:.025,vision:.045,finishing:.10,shooting:.075,stamina:.035,physical:.035,tackling:.005,positioning:.04,composure:.05}
});
const family=t=>['Wall','Enforcer','Anticipator','Hunter','Libero'].includes(t)?'D':['Maestro','Architect','Destroyer','Engine','Surgeon'].includes(t)?'M':'F';
function score(p,selected=[],opponent=[],level='competitive'){
 const kind=role(p),count=selected.filter(x=>role(x)===kind).length,roles=new Set(selected.map(role));
 const w=WEIGHTS[kind],den=Object.values(w).reduce((a,b)=>a+b,0);
 const strength=Object.entries(w).reduce((sum,[k,v])=>sum+val(p,k)*v,0)/den;
 const lacks=roles.size<3&&!roles.has(kind),finalGap=selected.length===2&&lacks;
 // Complementary roles matter, but a gifted same-role selection remains possible.
 const fit=(finalGap?11:lacks?8:-(count*5));
 let synergy=0;
 for(const q of selected){
  if(role(q)!==kind)synergy+=(val(p,'passing')+val(q,'first_touch')+val(p,'vision')+val(q,'positioning'))/400*3;
  const a=p.traits?.primary,b=q.traits?.primary;if(a&&b&&family(a)!==family(b))synergy+=1.2;
 }
 let total=ovr(p)*.48+strength*.46+fit+synergy;
 if(level==='ruthless'){
  const other=opponent.map(role);
  if(kind==='D'&&other.filter(r=>r==='F').length>=2)total+=Math.min(3.5,val(p,'tackling')*.035);
  if(kind==='F'&&other.filter(r=>r==='D').length>=2)total+=Math.min(3.5,val(p,'dribbling')*.035);
  if(kind==='M'&&other.filter(r=>r==='M').length>=2)total+=Math.min(2.5,val(p,'composure')*.025);
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
 const avg=k=>team.reduce((s,p)=>s+val(p,k),0)/3,roles=team.map(role),enemy=opponent.map(role);
 const nD=roles.filter(x=>x==='D').length,nM=roles.filter(x=>x==='M').length,nF=roles.filter(x=>x==='F').length;
 const scores={
  balanced:79+2*(Number(nD>0)+Number(nM>0)+Number(nF>0)),
  press:avg('pace')*.14+avg('stamina')*.31+avg('tackling')*.23+avg('positioning')*.16+avg('phys')*.16,
  possession:avg('pass')*.16+avg('passing')*.24+avg('vision')*.20+avg('first_touch')*.14+avg('composure')*.16+avg('tech')*.10,
  counter:avg('pace')*.24+avg('shooting')*.12+avg('finishing')*.17+avg('finish')*.17+avg('positioning')*.13+avg('stamina')*.09+avg('vision')*.08
 };
 if(level==='ruthless'){
  if(enemy.filter(x=>x==='F').length>=2)scores.counter+=2.2;
  if(enemy.filter(x=>x==='D').length>=2)scores.possession+=2;
  if(enemy.filter(x=>x==='M').length>=2)scores.press+=1.5;
  if(nM>=2)scores.possession+=2.1;
  if(nD>=2)scores.counter+=1.8;
 }
 const noise=level==='ruthless'?0.2:4.6;
 return TACTICS.map(k=>({k,v:scores[k]+(rand(rng)-.5)*noise})).sort((a,b)=>b.v-a.v||a.k.localeCompare(b.k))[0].k;
}
const api=Object.freeze({LEVELS,TACTICS,role,score,choose,tactic});
root.CageCpu=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
