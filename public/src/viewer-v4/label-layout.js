// THE CAGE V5.1: Collision-aware tactical nameplates.
// Pure cosmetic layout. Player positions, scores and identities remain untouched.
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.CageLabelLayout=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function intersect(a,b){
 const x=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
 const y=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
 return Math.max(0,x)*Math.max(0,y);
}
// players: [{id,x,y,name,width}], all screen-local pixels.
// bounds: safe screen bounds. radius: drawn player disc radius.
function place(players,bounds,radius,opts={}){
 const h=opts.height||14,gap=opts.gap||4,R=Math.max(5,radius);
 const priority=id=>opts.carrier===id?3:opts.actor===id?2:opts.defender===id?1:0;
 const ordered=players.slice().sort((a,b)=>priority(b.id)-priority(a.id)||a.y-b.y||String(a.id).localeCompare(String(b.id)));
 const occupied=[],out=[];
 const clampBox=(x,y,w)=>({x:clamp(x,bounds.x,bounds.x+bounds.w-w),y:clamp(y,bounds.y,bounds.y+bounds.h-h),w,h});
 for(const p of ordered){
  const w=Math.min(bounds.w,Math.max(24,p.width));
  const optsXY=[
   [p.x-w/2,p.y-R-gap-h], [p.x-w/2,p.y+R+gap],
   [p.x+R+gap,p.y-h/2], [p.x-R-gap-w,p.y-h/2],
   [p.x+R+gap,p.y-R-gap-h],[p.x-R-gap-w,p.y-R-gap-h],
   [p.x+R+gap,p.y+R+gap],[p.x-R-gap-w,p.y+R+gap],
   [p.x-w/2,p.y-R-gap-h*2],[p.x-w/2,p.y+R+gap+h],
  ];
  let best=null,bestCost=Infinity;
  for(let i=0;i<optsXY.length;i++){
   const [rawX,rawY]=optsXY[i],box=clampBox(rawX,rawY,w);
   let penalty=Math.hypot(box.x+w/2-p.x,box.y+h/2-p.y)*.09+i*.14;
   for(const prior of occupied)penalty+=intersect(box,prior)*85;
   for(const q of players){
    const qr=R+(q.id===p.id?-2:2);
    const disc={x:q.x-qr,y:q.y-qr,w:qr*2,h:qr*2};
    penalty+=intersect(box,disc)*(q.id===p.id?12:55);
   }
   penalty+=(Math.abs(box.x-rawX)+Math.abs(box.y-rawY))*2;
   if(penalty<bestCost){bestCost=penalty;best=box;}
  }
  if(!best)continue;
  const item={...best,id:p.id,name:p.name};
  occupied.push(item);out.push(item);
 }
 return out;
}
return {place,intersect};
});
