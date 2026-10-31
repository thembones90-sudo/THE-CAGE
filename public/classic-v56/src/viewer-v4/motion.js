// THE CAGE V5.1 — Deterministic animation director.
// Explicitly PRESENTATION ONLY: all player cells, event types, possession, match
// outcomes, score and clock remain exclusively authoritative timeline data.
// Uses no random, network, mutation, timers, simulation or browser-only API.
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.CageViewerMotion=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ATTACK=new Set(['carry','pass','through_ball','dribble_duel','wall_pass','shot_attempt','free_kick','goal']);
const DEFENCE=new Set(['press','block','race','dribble_duel','wall_pass']);
const LABEL={
 restart:'KICK-OFF',turnover:'TURNOVER',carry:'CARRY',pass:'PASS',
 through_ball:'THROUGH BALL',dribble_duel:'ONE ON ONE',wall_pass:'WALL PASS',
 press:'PRESS',shot_attempt:'SHOT',shot_miss:'SHOT WIDE',block:'BLOCK',
 race:'FOOT RACE',rebound:'REBOUND',foul:'FOUL',free_kick:'FREE KICK',goal:'GOAL'
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=(k)=>{k=clamp(k,0,1);return k*k*(3-2*k);};
const hypot=(a,b)=>Math.hypot(a,b);
function cellSafe(p,moved){
 // A presentation-only defender feint must not cross a recorded 4x3 cell.
 // The closest cell is computed at the current timeline sample, not guessed
 // from some future event. Keep 2% of a cell as a safe margin.
 const cx=clamp(Math.floor(clamp(p.u,0,.999999)*4),0,3),cy=clamp(Math.floor(clamp(p.v,0,.999999)*3),0,2);
 return {u:clamp(moved.u,cx/4+.005,(cx+1)/4-.005),
         v:clamp(moved.v,cy/3+.007,(cy+1)/3-.007)};
}
function sample(tl,events,tau,T){
 if(!tl||!Array.isArray(tl.segments)||!events||!T)throw Error('Authoritative timeline required');
 const t=clamp(Number(tau)||0,0,tl.total);
 const i=T.segmentIndex(tl,t),seg=tl.segments[i],event=events[seg.i],k=T.phase(seg,t);
 if(!event||!event.type)throw Error('Recorded event missing');
 const raw=T.playersAt(tl,t),pos={};
 for(const id of tl.ids)pos[id]={u:raw[id].u,v:raw[id].v};
 const b=T.ballAt(tl,t),early=T.ballAt(tl,clamp(t-.105,0,tl.total));
 const role={actor:event.actor||null,receiver:event.target||null,defender:null,focus:null};
 if(DEFENCE.has(event.type))role.defender=event.type==='press'||event.type==='block'?event.actor:event.opp||null;
 if(role.defender&&!pos[role.defender])role.defender=null;
 if(role.actor&&!pos[role.actor])role.actor=null;
 if(role.receiver&&!pos[role.receiver])role.receiver=null;
 // Micro close-down is purely decorative: deterministic, short, same recorded
 // cell. Only a recorded contest permits the adjustment; a passive defender
 // never magically wins the ball or leaves the logged cell.
 if(seg.contact&&seg.contact.id&&pos[seg.contact.id]&&seg.contact.carrier&&pos[seg.contact.carrier]){
   const defender=seg.contact.id,point=pos[defender],toward=pos[seg.contact.carrier];
   const deltaU=toward.u-point.u,deltaV=toward.v-point.v,dist=hypot(deltaU,deltaV);
   if(dist>.0001){
     const amount=ease(k/.65)*(1-ease((k-.65)/.35)); // rise and settle; zero at both ends
     const f=Math.min(1,.018/dist)*amount;
     if(f>0.000001){const p=cellSafe(point,{u:point.u+deltaU*f,v:point.v+deltaV*f});
     pos[defender]=p;}
   }
 }
 const beforeAll=T.playersAt(tl,clamp(t-.08,0,tl.total));
 const afterAll=T.playersAt(tl,clamp(t+.08,0,tl.total));
 const samples=tl.ids.map(id=>{
   const before=beforeAll[id];
   const after=afterAll[id];
   return {id,du:after.u-before.u,dv:after.v-before.v};
 });
 const runners=samples.filter(p=>hypot(p.du*980,p.dv*510)>2.8)
   .map(p=>({id:p.id,du:p.du,dv:p.dv})); // real timeline delta only
 const ballSpeed=hypot((b.u-early.u)*980,(b.v-early.v)*510);
 const flight=!!b.flight;
 const targetedFlight=flight&&(event.type==='pass'||event.type==='through_ball');
 const active=ATTACK.has(event.type)||DEFENCE.has(event.type);
 return {
  tau:t,index:seg.i,type:event.type,label:LABEL[event.type]||event.type.replace(/_/g,' ').toUpperCase(),
  team:event.team,phase:k,positions:pos,ball:b,
  roles:role,runners,active,
  pass:targetedFlight?{from:{u:early.u,v:early.v},to:{u:b.u,v:b.v},
           receiver:event.target||null,complete:event.outcome==='complete'}:null,
  ballSpeed,spin:t*3.2+Math.min(6,ballSpeed/55),
  challenge:!!seg.contact&&(k>.18&&k<.9),
  showEvent:k>.08&&k<.94&&active,
  inferred:true
 };
}
return {sample,cellSafe,LABEL,ATTACK,DEFENCE};
});
