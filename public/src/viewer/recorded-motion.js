// THE CAGE 2D viewer: recorded movement (M2). When a record carries the engine's movement layer (result.movement,
// 4 Hz positions of all eight bodies and the ball), the viewer draws exactly those positions instead of inferring
// motion between grid cells. Pure function of record + timeline: no randomness, no events, deterministic seeking.
// Records without movement return null and keep the inferred timeline motion.
(()=>{'use strict';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const FLIGHT=10; // m/s: faster than any player can carry the ball, so the ball is travelling on its own
function create(tl,record){
  const m=((record&&record.result)||record||{}).movement,Mv=window.CageMovement;
  if(!m||!Mv||typeof Mv.decode!=='function'||!tl||!Array.isArray(tl.segments)||!tl.segments.length)return null;
  let fr;try{fr=Mv.decode(m);}catch(e){return null;}
  if(!fr.length)return null;
  const L=(m.pitch&&m.pitch.length)||40,W=(m.pitch&&m.pitch.width)||20,dt=1/(m.hz||4),last=fr.length-1;
  const idx={};m.bodies.forEach((b,j)=>{idx[b.id]=j;});
  const ballJ=m.bodies.findIndex(b=>b.kind==='ball'),keeperJ=[0,1].map(s=>m.bodies.findIndex(b=>b.kind==='keeper'&&b.team===s));
  if(ballJ<0||!tl.ids.every(id=>id in idx))return null;
  // Playback time -> simulation time. The timeline clock stands still while zero-time events play (about a third of
  // playback), which would freeze every body. Each standstill is collapsed to its midpoint and the clock is
  // interpolated between them, so bodies keep moving, slowing down through busy moments instead of stopping.
  const pts=[];for(const s of tl.segments){const moving=s.move>0&&s.t1>s.t0;pts.push([s.tau0,moving?s.t0:s.t1]);if(moving)pts.push([s.tau0+s.move,s.t1]);pts.push([s.tau1,s.t1]);}
  const kt=[],ks=[];
  for(let i=0;i<pts.length;){let j=i;while(j+1<pts.length&&Math.abs(pts[j+1][1]-pts[i][1])<1e-9)j++;
    const tau=i===0?pts[0][0]:j===pts.length-1?pts[j][0]:(pts[i][0]+pts[j][0])/2;
    if(!kt.length||tau>kt[kt.length-1]+1e-9){kt.push(tau);ks.push(pts[i][1]);}i=j+1;}
  function simAt(tau){if(tau<=kt[0])return ks[0];const n=kt.length;if(tau>=kt[n-1])return ks[n-1];let a=0,b=n-1;while(b-a>1){const c=(a+b)>>1;if(kt[c]<=tau)a=c;else b=c;}return ks[a]+(ks[b]-ks[a])*(tau-kt[a])/(kt[b]-kt[a]);}
  // Uniform Catmull-Rom through the recorded frames: passes exactly through every 4 Hz sample, no kinks at 60 fps.
  function at(j,t,smooth){const f=clamp(t/dt,0,last),i=Math.min(last,Math.floor(f)),k=f-i,p1=fr[i][j],p2=fr[Math.min(last,i+1)][j];
    if(!smooth||k===0)return [p1[0]+(p2[0]-p1[0])*k,p1[1]+(p2[1]-p1[1])*k];
    const p0=fr[Math.max(0,i-1)][j],p3=fr[Math.min(last,i+2)][j],k2=k*k,k3=k2*k,cr=(a,b,c,d)=>.5*(2*b+(c-a)*k+(2*a-5*b+4*c-d)*k2+(3*b-a-3*c+d)*k3);
    return [cr(p0[0],p1[0],p2[0],p3[0]),cr(p0[1],p1[1],p2[1],p3[1])];}
  const uv=p=>({u:clamp(p[0]/L,0,1),v:clamp(p[1]/W,0,1)});
  function playersAt(tau){const t=simAt(tau),o={};for(const id of tl.ids)o[id]=uv(at(idx[id],t,true));return o;}
  function keepersAt(tau){const t=simAt(tau);return keeperJ.map(j=>j<0?null:uv(at(j,t,true)));}
  function ballAt(tau,T){const t=simAt(tau),p=at(ballJ,t,false),q=at(ballJ,Math.max(0,t-dt/2),false),speed=Math.hypot(p[0]-q[0],p[1]-q[1])/(t>0?Math.min(t,dt/2):dt/2);
    const seg=T?tl.segments[T.segmentIndex(tl,tau)]:null,ref=T?T.ballAt(tl,tau):null,flight=speed>FLIGHT;
    let owner=null;if(!flight&&ref&&ref.owner&&idx[ref.owner]!=null){const c=at(idx[ref.owner],t,true);if(Math.hypot(c[0]-p[0],c[1]-p[1])<1.6)owner=ref.owner;}
    return {u:clamp(p[0]/L,0,1),v:clamp(p[1]/W,0,1),owner,flight,lift:0,net:!!(ref&&ref.net&&seg),speed};}
  // A timeline API whose positions are the recorded ones; segments, phases and clock stay the timeline's own.
  function timelineApi(T){return Object.assign(Object.create(T),{playersAt:(_tl,tau)=>playersAt(tau),ballAt:(_tl,tau)=>ballAt(tau,T)});}
  return {recorded:true,version:m.version,frames:fr.length,simAt,playersAt,keepersAt,ballAt,timelineApi};
}
window.CageRecordedMotion={create};
})();
