// THE CAGE V5.2 — Deterministic visual locomotion and Golden Relic kinetics.
// Motion is sampled solely from the verified replay timeline. No gameplay,
// exact footwork, physics telemetry, shot outcomes, or tactics are inferred here.
// All signals are cosmetics and safe to recompute in any replay/seek order.
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.CageKinetics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FIELD=Object.freeze({w:980,h:510});
const TAU_STEP=.115, TURN_STEP=.24, MAX_SPEED=370, MAX_ACCEL=850;
const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
const boundedTime=(t,end)=>clamp(t,0,end);
const length=(a,b)=>Math.hypot(a,b);
function direction(a,b){return Math.atan2(b,a);}
function wrapAngle(a){return Math.atan2(Math.sin(a),Math.cos(a));}
function deltaPoint(a,b,dt){
 if(!dt)return {vx:0,vy:0,speed:0,heading:0};
 const vx=(b.u-a.u)*FIELD.w/dt,vy=(b.v-a.v)*FIELD.h/dt;
 const speed=Math.min(MAX_SPEED,length(vx,vy));
 return {vx,vy,speed,heading:direction(vx,vy)};
}
function velocity(tl,T,id,time,window=TAU_STEP){
 const a=boundedTime(time-window,tl.total),b=boundedTime(time+window,tl.total);
 const left=T.playersAt(tl,a)[id],right=T.playersAt(tl,b)[id];
 return deltaPoint(left,right,b-a);
}
function ballVelocity(tl,T,time,window=.055){
 const a=boundedTime(time-window,tl.total),b=boundedTime(time+window,tl.total);
 const left=T.ballAt(tl,a),right=T.ballAt(tl,b);
 return deltaPoint(left,right,b-a);
}
function classify(speed){
 if(speed<7)return 'idle';
 if(speed<32)return 'jog';
 return 'sprint';
}
function orientationFromSpeeds(speed,earlier,later,team,t0,t1){
 let heading=speed.heading,source='recorded-travel';
 // A static token never receives a fictional run: only its facing is drawn.
 if(speed.speed<7){
   if(later.speed>=7){heading=later.heading;source='upcoming-recorded-travel';}
   else if(earlier.speed>=7){heading=earlier.heading;source='prior-recorded-travel';}
   else{heading=team===0?0:Math.PI;source='neutral-team-axis';}
 }
 const turnRaw=earlier.speed>=7&&later.speed>=7?wrapAngle(later.heading-earlier.heading):0;
 const turnRate=t1>t0?clamp(turnRaw/(t1-t0),-9,9):0;
 const accel=clamp((later.speed-earlier.speed)/(t1-t0||1),-MAX_ACCEL,MAX_ACCEL);
 return {heading:wrapAngle(heading),speed:speed.speed,turnRate,accel,gait:classify(speed.speed),source};
}
function orientationFor(id,t,tl,T,teamOf){
 const speed=velocity(tl,T,id,t),earlier=velocity(tl,T,id,t-TURN_STEP),later=velocity(tl,T,id,t+TURN_STEP);
 const t0=boundedTime(t-TURN_STEP,tl.total),t1=boundedTime(t+TURN_STEP,tl.total);
 return orientationFromSpeeds(speed,earlier,later,teamOf[id],t0,t1);
}
function sample(tl,T,tau,motion){
 if(!tl||!T||!motion||!tl.ids||!tl.teamOf)throw Error('Recorded timeline and V5.1 sample are required');
 const t=boundedTime(Number(tau)||0,tl.total);
 const windows=[-TURN_STEP-TAU_STEP,-TURN_STEP+TAU_STEP,-TAU_STEP,TAU_STEP,TURN_STEP-TAU_STEP,TURN_STEP+TAU_STEP];
 const samples=windows.map(delta=>{const time=boundedTime(t+delta,tl.total);return {time,positions:T.playersAt(tl,time)};});
 const [e0,e1,c0,c1,l0,l1]=samples;
 const t0=boundedTime(t-TURN_STEP,tl.total),t1=boundedTime(t+TURN_STEP,tl.total),players={};
 for(const id of tl.ids){
   const speed=deltaPoint(c0.positions[id],c1.positions[id],c1.time-c0.time);
   const earlier=deltaPoint(e0.positions[id],e1.positions[id],e1.time-e0.time);
   const later=deltaPoint(l0.positions[id],l1.positions[id],l1.time-l0.time);
   players[id]=orientationFromSpeeds(speed,earlier,later,tl.teamOf[id],t0,t1);
 }
 const b=ballVelocity(tl,T,t);
 const seg=tl.segments[T.segmentIndex(tl,t)];
 const isFlight=Boolean(motion.ball.flight);
 const recordedType=seg.type;
 const shot=Boolean(isFlight&&['shot_attempt','goal','shot_miss','free_kick','block'].includes(recordedType));
 const intensity=clamp(b.speed/260,0,1);
 const trail=isFlight?Math.max(3.2,Math.min(27,b.speed*.074)):0;
 return {t,players,ball:{
    heading:b.heading,speed:b.speed,intensity,trail,
    spin:t*2.9+Math.min(8,b.speed*.017),flight:isFlight,shot,source:'event-derived-sampled-position'
  },inferred:true};
}
return {FIELD,TAU_STEP,TURN_STEP,clamp,wrapAngle,deltaPoint,velocity,ballVelocity,orientationFor,classify,sample};
});
