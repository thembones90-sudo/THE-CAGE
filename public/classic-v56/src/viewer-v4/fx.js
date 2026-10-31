/* THE CAGE / V4: purely cosmetic event-log anchored goal + wall-pass responses.
   No scores or simulation here. CommonJS for offline contract tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CageViewerV4FX=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WORLD=Object.freeze({w:1200,h:650,x0:110,x1:1090,y0:70,y1:580,leftGoal:109,rightGoal:1091,netLeft:27,netRight:1102});
function bound(x,a,b){return Math.min(b,Math.max(a,x));}
function buildCues(tl,events){
 if(!tl||!Array.isArray(tl.goals)||!Array.isArray(tl.segments)||!Array.isArray(events))throw Error('Authoritative timeline and events required');
 const cues=[];
 for(const g of tl.goals){
  const e=events[g.i];
  if(!e||e.type!=='goal'||e.team!==g.team)throw Error('Unmatched goal event '+g.i);
  cues.push({type:'goal',side:g.team===0?'right':'left',at:g.tau,goalEventIndex:g.i,
   // The event log does not record exact goal contact pixel: y=325 is presentation only.
   impactY:325,force:.88,source:'recorded-goal',positionInferred:true});
 }
 for(const s of tl.segments){
  const e=events[s.i];
  if(!e||e.type!=='wall_pass')continue;
  const lane=e.zone&&e.zone.lane;
  // Wall passes are recorded; visual contact position within the cell is inferred.
  if(lane!=='left'&&lane!=='right')continue;
  const worldX=e.zone&&Number.isInteger(e.zone.x)?(e.team===0?e.zone.x:3-e.zone.x):1;
  cues.push({type:'wall_pass',side:lane==='left'?'top':'bottom',at:s.tau0+Math.min(.45,s.move*.45),
   x:110+(bound(worldX,0,3)+.5)*245,source:'recorded-wall-pass',positionInferred:true,eventIndex:s.i});
 }
 return cues.sort((a,b)=>a.at-b.at||(a.goalEventIndex??a.eventIndex)-(b.goalEventIndex??b.eventIndex));
}
function netOffset(cue,tau,y){
 if(!cue||cue.type!=='goal')return 0;
 const dt=tau-cue.at;
 if(dt<0||dt>=1.2)return 0;
 const falloff=Math.exp(-Math.pow((y-cue.impactY)/95,2));
 const amp=13*bound(cue.force||0,0,1)*Math.exp(-9*dt)*Math.sin(15.46*dt)*falloff;
 return cue.side==='right'?amp:-amp;
}
function strongestNet(cues,tau,side,y){
 let d=0;
 for(const cue of cues){if(cue.type==='goal'&&cue.side===side)d+=netOffset(cue,tau,y);}
 return bound(d,-13,13);
}
function pulse(cue,tau){
 const dt=tau-cue.at;
 if(dt<0)return 0;
 if(cue.type==='goal'){
  if(dt>=1.1)return 0;
  const v=dt<.16?dt/.16:Math.exp(-5.7*(dt-.16))*(1-dt/1.1);
  return bound(v,0,1);
 }
 if(cue.type==='wall_pass'){
  if(dt>=.52)return 0;
  return Math.exp(-8*dt)*(1-dt/.52);
 }
 return 0;
}
function paintNet(ctx,cues,tau,side,reducedMotion=false){
 const left=side==='left',x0=left?27:1102,y0=245,width=71,height=160;
 ctx.save();
 ctx.fillStyle='#111b21';ctx.strokeStyle='#80949a';ctx.lineWidth=3;
 ctx.fillRect(x0,y0,width,height);ctx.strokeRect(x0,y0,width,height);
 ctx.fillStyle='#223239';ctx.fillRect(x0+3,y0+3,width-6,height-6);
 for(let row=0;row<7;row++)for(let col=0;col<4;col++){
  const x=x0+11+col*17+(row%2)*2.4,y=y0+13+row*22;
  const shift=reducedMotion?0:strongestNet(cues,tau,side,y);
  ctx.save();ctx.translate(x+shift,y);ctx.rotate((row+col)%2?-.42:.42);
  ctx.beginPath();ctx.ellipse(0,0,5.2,9.2,0,0,2*Math.PI);
  ctx.strokeStyle='#03090c';ctx.lineWidth=6.5;ctx.stroke();
  const metal=ctx.createLinearGradient(-7,-8,7,8);
  metal.addColorStop(0,'#f1f8f4');metal.addColorStop(.3,'#a6b9b8');metal.addColorStop(.64,'#536a70');metal.addColorStop(1,'#d7e5df');
  ctx.beginPath();ctx.ellipse(0,0,5.1,9.1,0,0,2*Math.PI);
  ctx.strokeStyle=metal;ctx.lineWidth=3.4;ctx.stroke();
  ctx.restore();
 }
 ctx.restore();
}
// Event-anchored metallic goal pulse: all particles and rays are derived from
// goal index and elapsed *playback* time, with no Math.random or game mutations.
function goldenParticles(cue,tau){
 if(!cue||cue.type!=='goal')return [];
 const age=tau-cue.at;
 if(age<0||age>2.1)return [];
 const side=cue.side==='right'?1:-1;
 const cx=side===1?WORLD.rightGoal:WORLD.leftGoal,y=cue.impactY;
 const scale=age/2.1,fade=Math.pow(1-scale,1.7);
 return Array.from({length:22},(_,i)=>{
  const angle=(i*2.399963229728653)+cue.goalEventIndex*.23;
  const speed=46+(i%7)*15;
  return {x:cx-side*(12+speed*age*.6),y:y+Math.sin(angle)*speed*age*.84+(i%4-1.5)*4,
    angle,life:fade,size:2+(i%4),source:'recorded-goal'};
 });
}
function paintGolden(ctx,cues,tau,reducedMotion){
 if(reducedMotion)return;
 for(const cue of cues){
  if(cue.type!=='goal')continue;
  const age=tau-cue.at;if(age<0||age>2.1)continue;
  const x=cue.side==='right'?WORLD.rightGoal:WORLD.leftGoal,y=cue.impactY;
  const fall=Math.pow(1-age/2.1,2);
  ctx.save();ctx.lineWidth=2.5;
  for(let ring=0;ring<3;ring++){
   const r=13+age*(85+ring*36);
   ctx.strokeStyle='rgba(255,206,115,'+(fall*(.38-ring*.08)).toFixed(3)+')';
   ctx.beginPath();ctx.ellipse(x,y,r,r*.61,0,0,Math.PI*2);ctx.stroke();
  }
  for(const part of goldenParticles(cue,tau)){
   ctx.save();ctx.translate(part.x,part.y);ctx.rotate(part.angle);
   ctx.fillStyle='rgba(248,206,123,'+(part.life*.6).toFixed(3)+')';
   ctx.fillRect(-part.size*.9,-.85,part.size*2.2,1.7);ctx.restore();
  }
  ctx.restore();
 }
}
function paintEffects(ctx,cues,tau,reducedMotion){
 if(reducedMotion)return;
 for(const cue of cues){
  const k=pulse(cue,tau);
  if(k<=0)continue;
  const x=cue.type==='goal'?(cue.side==='right'?WORLD.rightGoal:WORLD.leftGoal):cue.x;
  const y=cue.type==='goal'?cue.impactY:(cue.side==='top'?WORLD.y0:WORLD.y1);
  const radius=cue.type==='goal'?225:50;
  ctx.save();
  const grad=ctx.createRadialGradient(x,y,2,x,y,radius);
  if(cue.type==='goal'){
   grad.addColorStop(0,'rgba(252,219,139,'+(k*.32).toFixed(3)+')');
   grad.addColorStop(.38,'rgba(229,177,81,'+(k*.11).toFixed(3)+')');
   grad.addColorStop(1,'rgba(229,177,81,0)');
  }else{
   grad.addColorStop(0,'rgba(224,247,245,'+(k*.5).toFixed(3)+')');
   grad.addColorStop(1,'rgba(224,247,245,0)');
  }
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 paintGolden(ctx,cues,tau,reducedMotion);
}
function fit(w,h){const scale=Math.min(w/WORLD.w,h/WORLD.h);return {scale,x:(w-WORLD.w*scale)/2,y:(h-WORLD.h*scale)/2,w:WORLD.w*scale,h:WORLD.h*scale};}
return {WORLD,buildCues,netOffset,strongestNet,pulse,paintNet,paintEffects,goldenParticles,paintGolden,fit};
});
