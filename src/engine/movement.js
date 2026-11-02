// THE CAGE M1: continuous movement layer (owner-approved, 2026-11-01).
// PASSIVE: it reads the authoritative tactical state at each event and simulates where the eight bodies
// (six outfield players, two goalkeepers) and the ball physically are, at 4 Hz, with attribute-limited
// physics. It draws no random numbers and writes nothing back, so decisions, events and outcomes are
// unchanged. Where the physical position cannot honour the tactical cell in time, it LOGS a
// contradiction instead of snapping the body (M3 will make decisions depend on real positions).
(function(root,factory){const api=factory();root.CageMovement=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const {sqrt,atan2,sin,cos,round,abs,min,max,sign,ceil,PI,imul}=Math; // local bindings: hot physics loop
const VERSION='m1-v1',HZ=4,DT=1/HZ,L=40,W=20,CELL_X=L/4,CELL_Y=W/3,QUANT=10; // metres; positions stored in decimetres
const clamp=(v,a,b)=>v<a?a:v>b?b:v,hyp=(x,y)=>sqrt(x*x+y*y);
const STATES=['idle','walk','jog','run','sprint','brake','turn'];
// Attribute-driven physical profile (readable, documented):
// top speed from pace, acceleration and turning from agility, braking stronger than acceleration, ball-carrying control from technique.
function profile(a){
 const pace=a.pace??70,agi=a.agi??70,tech=a.tech??70;
 const vmax=5.6+3.6*clamp((pace-40)/60,0,1);      // 5.6 m/s (slow) .. 9.2 m/s (elite pace)
 const accel=2.6+2.9*clamp((agi-40)/60,0,1);      // m/s^2
 const brake=accel*1.35;                            // braking is stronger than accelerating
 const turn=(PI/180)*(55+70*clamp((agi-40)/60,0,1)); // max heading change per slice at low speed
 const control=.75+.25*clamp((tech-40)/60,0,1);     // fraction of top speed kept while carrying the ball
 return {vmax,accel,brake,turn,control};
}
function keeperProfile(g){const r=g?.r||{};return profile({pace:60+.3*(r.sweeping??80),agi:r.reflexes??85,tech:r.distribution??80});}
const centre=c=>({x:(c.x+.5)*CELL_X,y:(c.y+.5)*CELL_Y});
const inCell=(p,c,tol)=>p.x>=c.x*CELL_X-tol&&p.x<=(c.x+1)*CELL_X+tol&&p.y>=c.y*CELL_Y-tol&&p.y<=(c.y+1)*CELL_Y+tol;
function create({teams,keepers,styles,wallBrake}){
 // wallBrake (cage-t3-14+): bodies brake before the pitch boundary instead of stopping dead on it. Off for older engines,
 // which call create() without it, so their recorded movement replays byte-for-byte.
 // bodies: outfield in engine order (team 0 then team 1), then the two keepers (team 0's, team 1's)
 const bodies=[];
 for(const team of teams)for(const q of team.ps){const c=centre(q.pos);bodies.push({id:q.id,team:team.ti,kind:'outfield',q,prof:profile(q.c.a),x:c.x,y:c.y,vx:0,vy:0,state:0,stateRuns:[]});}
 if(keepers)keepers.forEach((g,i)=>{bodies.push({id:g.id,team:i,kind:'keeper',g,style:styles?.[i]||null,prof:keeperProfile(g),x:i===0?1:L-1,y:W/2,vx:0,vy:0,state:0,stateRuns:[]});});
 const ball={x:L/2,y:W/2,vx:0,vy:0};
 const flat=[],contradictions=[],stats={slices:0,maxSpeed:{},impossible:0,byType:{}};
 const lastCells={};let frameCount=0,now=0,lastT=0,targets=null,ballTarget={x:L/2,y:W/2},keeperAction=null;
 // Deterministic slot inside a shared cell so co-located bodies do not stack (presentation-neutral, physics target only).
 function slots(positions,carrierId){
  const byCell={};for(const b of bodies)if(b.kind==='outfield'){const c=positions[b.id];const k=c.x+','+c.y;(byCell[k]=byCell[k]||[]).push(b);}
  const t={};
  for(const [k,list] of Object.entries(byCell)){
   const [cx,cy]=k.split(',').map(Number),ctr=centre({x:cx,y:cy});
   const others=list.filter(b=>b.id!==carrierId).sort((a,b)=>a.team-b.team||(a.id<b.id?-1:1));
   if(list.some(b=>b.id===carrierId))t[carrierId]={...ctr,cell:{x:cx,y:cy}};
   others.forEach((b,i)=>{const ang=(2*PI*i)/max(1,others.length)+(b.team?PI/others.length:0),rad=others.length>1||list.length>1?2.2:0;
    t[b.id]={x:clamp(ctr.x+rad*cos(ang),cx*CELL_X+.6,(cx+1)*CELL_X-.6),y:clamp(ctr.y+rad*sin(ang),cy*CELL_Y+.6,(cy+1)*CELL_Y-.6),cell:{x:cx,y:cy}};});
  }
  return t;
 }
 // Keeper target: tracks the ball across the goal (narrowing the angle), line height from style; runs to the ball on a logged sweep/claim.
 function keeperTarget(b){
  const goalX=b.team===0?0:L,dir=b.team===0?1:-1,dist=abs(ball.x-goalX),near=clamp(1-dist/22,0,1);
  const sweeperLine=b.style==='SWEEPER KEEPER'?3.2:b.style==='COMMANDER'||b.style==='DISTRIBUTOR'?2.2:1.4;
  let depth=1+(sweeperLine-1)*(1-near)+1.2*near,y=W/2+(ball.y-W/2)*(.25+.4*near);
  if(keeperAction&&keeperAction.gk===b.id&&now<keeperAction.until){depth=clamp(abs(ball.x-goalX),1,16);y=ball.y;}
  return {x:goalX+dir*depth,y:clamp(y,W*.22,W*.78)};
 }
 function steer(b,target,dt,carrying,fatigue){
  const p=b.prof,vmax=p.vmax*(carrying?p.control:1)*(1-.06*fatigue),dx=target.x-b.x,dy=target.y-b.y,dist=hyp(dx,dy);
  // arrive behaviour: desired speed limited by what braking allows over the remaining distance
  const want=dist<.05?0:min(vmax,sqrt(2*p.brake*dist));
  let dvx=dist>0?dx/dist*want:0,dvy=dist>0?dy/dist*want:0;
  const sp=hyp(b.vx,b.vy);
  // turning: at speed a body cannot change heading faster than its turn rate (scaled down with speed) -> momentum
  let turned=false;
  if(sp>.5&&want>.3){const cur=atan2(b.vy,b.vx),des=atan2(dvy,dvx);let d=atan2(sin(des-cur),cos(des-cur));const maxT=p.turn*(1-.55*sp/p.vmax);
   if(abs(d)>maxT){d=sign(d)*maxT;const keep=max(.35,cos(abs(d)))*min(want,sp);dvx=cos(cur+d)*keep;dvy=sin(cur+d)*keep;turned=true;}}
  // acceleration / braking limits on the velocity change
  const ddx=dvx-b.vx,ddy=dvy-b.vy,dd=hyp(ddx,ddy),newSp=hyp(dvx,dvy),lim=(newSp<sp?p.brake:p.accel)*dt;
  if(dd>lim){b.vx+=ddx/dd*lim;b.vy+=ddy/dd*lim;}else{b.vx=dvx;b.vy=dvy;}
  const sp2=hyp(b.vx,b.vy);
  if(wallBrake){const cap=(pos,v,max)=>v<0?-min(-v,sqrt(2*p.brake*pos)):v>0?min(v,sqrt(2*p.brake*(max-pos))):v;b.vx=cap(b.x,b.vx,L);b.vy=cap(b.y,b.vy,W);}
  b.x=clamp(b.x+b.vx*dt,0,L);b.y=clamp(b.y+b.vy*dt,0,W);
  const braking=sp2<sp-.4;
  b.state=sp2<.4?0:braking?5:turned?6:sp2<2?1:sp2<4?2:sp2<.85*p.vmax?3:4;
  return sp2;
 }
 function slice(){
  for(const b of bodies){
   const tgt=b.kind==='keeper'?keeperTarget(b):(targets&&targets[b.id])||{x:b.x,y:b.y};
   const carrying=b.kind==='outfield'&&targets&&targets.__carrier===b.id,fatigue=b.kind==='outfield'?min(1,(b.q.fat||0)/140):0;
   const sp=steer(b,tgt,DT,carrying,fatigue);
   if(sp>b.maxSp)b.maxSp=sp;
   const runs=b.stateRuns,last=runs[runs.length-1];if(last&&last[0]===b.state)last[1]++;else runs.push([b.state,1]);
  }
  // ball: follows its target (carrier's feet or the loose-ball point) at ball speed
  const bt=targets?targets.__body:null,tx=bt?bt.x+clamp(bt.vx*.12,-.8,.8):ballTarget.x,ty=bt?bt.y+clamp(bt.vy*.12,-.8,.8):ballTarget.y;
  const bdx=tx-ball.x,bdy=ty-ball.y,bd=hyp(bdx,bdy),step=min(bd,22*DT);if(bd>0){ball.x+=bdx/bd*step;ball.y+=bdy/bd*step;}
  for(const b of bodies){flat.push(round(b.x*QUANT),round(b.y*QUANT));}flat.push(round(ball.x*QUANT),round(ball.y*QUANT));frameCount++;
  stats.slices++;now+=DT;
 }
 // Called at every engine event BEFORE it is recorded: move to event time toward the post-action cells, then check consistency.
 let slotKey='';
 function advance(t,{positions,carrierId,ballCell,event}){
  let key=carrierId||'';for(const b of bodies)if(b.kind==='outfield'){const c=positions[b.id];key+='|'+c.x+c.y;}
  if(key!==slotKey){targets=slots(positions,carrierId);targets.__carrier=carrierId||null;targets.__body=carrierId?bodies.find(b=>b.id===carrierId):null;slotKey=key;}
  ballTarget=ballCell?centre(ballCell):ballTarget;
  // A logged sweep or claim is a physical run that takes time: it stays active for 1.5 s of match time.
  if(event&&(event.type==='gk_sweep'||event.type==='gk_claim'))keeperAction={gk:event.gk,until:t+1.5};else if(keeperAction&&now>=keeperAction.until)keeperAction=null;
  const span=max(0,t-lastT);lastT=t;
  while(now+DT<=t+1e-9)slice();
  // Two kinds of contradiction, both LOGGED (never hidden by snapping):
  //  lag: after match time has advanced, a body is still outside the cell the tactics say it occupies;
  //  relocation: the tactics move a body two or more cells in zero match time (physically impossible).
  const log=(b,c,kind,impossible)=>{const ctr=centre(c),d=hyp(b.x-ctr.x,b.y-ctr.y);contradictions.push([event?.i??-1,bodies.indexOf(b),round(d*QUANT),impossible?1:0,kind]);if(impossible)stats.impossible++;
   const k=event?.type||'none',bt=stats.byType[k]||(stats.byType[k]={contradictions:0,impossible:0,lag:0,relocation:0});bt.contradictions++;bt[kind===1?'relocation':'lag']++;if(impossible)bt.impossible++;};
  for(const b of bodies){if(b.kind!=='outfield')continue;const c=positions[b.id],prev=lastCells[b.id];
   if(span===0&&prev&&(abs(prev.x-c.x)+abs(prev.y-c.y))>=2)log(b,c,1,true);
   else if(span>0&&!inCell(b,c,1.0)){const ctr=centre(c),d=hyp(b.x-ctr.x,b.y-ctr.y);log(b,c,0,d>b.prof.vmax*span+CELL_X);}
   lastCells[b.id]={x:c.x,y:c.y};}
 }
 // Compact deterministic encoding: first frame absolute (int16), then int8 deltas per coordinate; base64.
 function encode(){
  const n=frameCount,m=bodies.length+1,w=2*m,bytes=new Uint8Array(4*m);let o=0,overflow=0;
  if(n){for(let k=0;k<m;k++){const x=flat[2*k],y=flat[2*k+1];bytes[o++]=x&255;bytes[o++]=(x>>8)&255;bytes[o++]=y&255;bytes[o++]=(y>>8)&255;}}
  const head=bytes.slice(0,o),deltas=[];
  for(let f=1;f<n;f++)for(let i=0;i<w;i++){let d=flat[f*w+i]-flat[(f-1)*w+i];if(d>127||d<-127){overflow++;d=clamp(d,-127,127);}deltas.push(d);}
  const outB=[...head];for(let i=0;i<deltas.length;){if(deltas[i]===0){let r=1;while(i+r<deltas.length&&deltas[i+r]===0&&r<255)r++;if(r>=3){outB.push(128,r);i+=r;continue;}}outB.push(deltas[i]&255);i++;}
  return {data:b64(Uint8Array.from(outB)),overflow};
 }
 function finish(){
  const enc=encode();
  const out={version:wallBrake?VERSION+'+wall':VERSION,hz:HZ,units:'dm',pitch:{length:L,width:W},bodies:bodies.map(b=>({id:b.id,team:b.team,kind:b.kind,style:b.style||undefined,vmax:+b.prof.vmax.toFixed(2),accel:+b.prof.accel.toFixed(2),brake:+b.prof.brake.toFixed(2),turnDeg:+(b.prof.turn*180/PI).toFixed(1)})).concat([{id:'ball',kind:'ball'}]),
   frames:frameCount,positions:enc.data,deltaOverflow:enc.overflow,
   states:{legend:STATES,encoding:'byte=(state<<5)|run(1..31), base64',runs:Object.fromEntries(bodies.map(b=>{const out=[];for(const [st,run] of b.stateRuns){let r=run;while(r>0){const k=min(31,r);out.push((st<<5)|k);r-=k;}}return [b.id,b64(Uint8Array.from(out))];}))},
   contradictions:{fields:['eventIndex','bodyIndex','distanceDm','impossible','kind(0 lag,1 relocation)'],rows:contradictions},summary:{contradictions:contradictions.length,impossible:stats.impossible,byEventType:stats.byType,maxSpeed:Object.fromEntries(bodies.map(b=>[b.id,+(b.maxSp||0).toFixed(2)]))}};
  out.hash=fnv(JSON.stringify([out.positions,out.states.runs,out.contradictions]));
  return out;
 }
 return {advance,finish};
}
function fnv(s){let h=2166136261;for(let i=0;i<s.length;i++)h=imul(h^s.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,'0');}
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64(bytes){const out=new Array(ceil(bytes.length/3));for(let i=0,j=0;i<bytes.length;i+=3,j++){const a=bytes[i],b=bytes[i+1],c=bytes[i+2],n=(a<<16)|((b||0)<<8)|(c||0);out[j]=B64[(n>>18)&63]+B64[(n>>12)&63]+(i+1<bytes.length?B64[(n>>6)&63]:'=')+(i+2<bytes.length?B64[n&63]:'=');}return out.join('');}
function decode(m){ // returns frames[f][body]=[x,y] in metres
 const bin=[],str=m.positions;for(let i=0;i<str.length;i+=4){const n=(B64.indexOf(str[i])<<18)|(B64.indexOf(str[i+1])<<12)|((str[i+2]==='='?0:B64.indexOf(str[i+2]))<<6)|(str[i+3]==='='?0:B64.indexOf(str[i+3]));bin.push((n>>16)&255);if(str[i+2]!=='=')bin.push((n>>8)&255);if(str[i+3]!=='=')bin.push(n&255);}
 const k=m.bodies.length,frames=[];let o=0;const s16=v=>v>32767?v-65536:v,s8=v=>v>127?v-256:v;
 const first=[];for(let j=0;j<k;j++){const x=s16(bin[o]|(bin[o+1]<<8)),y=s16(bin[o+2]|(bin[o+3]<<8));o+=4;first.push([x,y]);}frames.push(first);
 const deltas=[];while(o<bin.length){const v=bin[o++];if(v===128){const r=bin[o++];for(let z=0;z<r;z++)deltas.push(0);}else deltas.push(s8(v));}
 let di=0;for(let f=1;f<m.frames;f++){const prev=frames[f-1],cur=[];for(let j=0;j<k;j++){const x=prev[j][0]+deltas[di++],y=prev[j][1]+deltas[di++];cur.push([x,y]);}frames.push(cur);}
 return frames.map(fr=>fr.map(([x,y])=>[x/QUANT,y/QUANT]));
}
return Object.freeze({VERSION,HZ,DT,L,W,profile,create,decode});
});
