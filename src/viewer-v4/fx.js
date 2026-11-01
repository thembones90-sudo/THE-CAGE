/* THE CAGE / V4: purely cosmetic event-log anchored goal + wall-pass responses.
   No scores or simulation here. CommonJS for offline contract tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CageViewerV4FX=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Match the painted boundary in BOTH arena SVGs, not their larger turf bed.
// The goal mouth, normalized replay coordinates and effects share this plane.
const WORLD=Object.freeze({w:1200,h:650,x0:133,x1:1067,y0:90,y1:560,leftGoal:133,rightGoal:1067,netLeft:81,netRight:1119});
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
   x:WORLD.x0+(bound(worldX,0,3)+.5)*(WORLD.x1-WORLD.x0)/4,source:'recorded-wall-pass',positionInferred:true,eventIndex:s.i});
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
// A recessed, tensioned net. Only the interior mesh deforms; posts and the
// recorded scoring plane remain fixed. Exact impact height is inferred above.
function netMesh(cues,tau,side,reducedMotion=false,scale=1){
 const left=side==='left',front=left?WORLD.leftGoal:WORLD.rightGoal,back=front+(left?-52:52);
 const rows=scale<.45?10:16,columns=scale<.45?2:4,source=Array.isArray(cues)?cues:[];
 function point(depth,across){
  const y=242+166*across;
  const ripple=reducedMotion?0:strongestNet(source,tau,side,y)*Math.sin(Math.PI*depth)*Math.sin(Math.PI*across);
  return {x:front+(back-front)*depth+ripple,y};
 }
 const strands=[];
 for(let col=1;col<=columns;col++)strands.push(Array.from({length:rows+1},(_,row)=>point(col/(columns+1),row/rows)));
 for(let row=1;row<rows;row++)strands.push(Array.from({length:9},(_,col)=>point(col/8,row/rows)));
 return {front,back,top:242,bottom:408,backTop:242,backBottom:408,strands};
}
function paintNet(ctx,cues,tau,side,reducedMotion=false,options={}){
 const scale=Math.max(.1,Number(options.scale)||1),net=netMesh(cues,tau,side,reducedMotion,scale),{front,back,top,bottom,backTop,backBottom}=net;
 const outline=()=>{ctx.beginPath();ctx.moveTo(front,top);ctx.lineTo(back,backTop);ctx.lineTo(back,backBottom);ctx.lineTo(front,bottom);ctx.closePath();};
 ctx.save();ctx.lineJoin='miter';ctx.lineCap='butt';
 // Straight football goal: shallow rectangular net, no taper or brackets.
 outline();ctx.fillStyle='#142724';ctx.fill();
 ctx.save();outline();ctx.clip();
 const lineWidth=Math.min(2.1,Math.max(1.15,.5/scale));
 for(const strand of net.strands){
  ctx.beginPath();strand.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.strokeStyle='rgba(225,238,229,.68)';ctx.lineWidth=lineWidth;ctx.stroke();
 }
 ctx.restore();
 // Slim white rails with a slightly stronger pitch-facing crossbar.
 ctx.beginPath();ctx.moveTo(front,top);ctx.lineTo(back,backTop);ctx.lineTo(back,backBottom);ctx.lineTo(front,bottom);
 ctx.strokeStyle='#d8e4df';ctx.lineWidth=2.8;ctx.stroke();
 ctx.beginPath();ctx.moveTo(front,top);ctx.lineTo(front,bottom);ctx.strokeStyle='#ffffff';ctx.lineWidth=4.5;ctx.stroke();
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
return {WORLD,buildCues,netOffset,strongestNet,pulse,netMesh,paintNet,paintEffects,goldenParticles,paintGolden,fit};
});
