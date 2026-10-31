// THE CAGE 2D viewer: Canvas 2D renderer. Draws a frame sampled from the Timeline.
// No game logic, no randomness, no event creation: it only paints what it is given.
(()=>{'use strict';
const C=window.CageViewerCoords,FX=window.CageViewerV4FX,Names=window.CageLabelLayout;
const TOKENS={'--cage-turf':'#1f4d2b','--cage-turf-2':'#225430','--cage-line':'rgba(235,245,235,.78)','--cage-steel':'#8c96a3','--cage-mesh':'rgba(190,200,210,.16)','--cage-flood':'rgba(255,248,220,.10)','--cage-surround':'#0d1014',
  '--team-a':'#3aa0ff','--team-a-ink':'#04121f','--team-b':'#ff5a52','--team-b-ink':'#1f0504','--ball':'#ffffff','--danger':'#e0283c','--momentum':'#ffb627','--verified':'#3ccf6e','--label-font':'600 11px system-ui, sans-serif','--grid':'rgba(255,255,255,.07)'};
function readTokens(el){const cs=el&&typeof getComputedStyle==='function'?getComputedStyle(el):null,o={};for(const k in TOKENS){const v=cs&&cs.getPropertyValue(k).trim();o[k]=v||TOKENS[k];}return o;}

// Guard shared by the real canvas drawing path and reduced-motion regression.
function shouldPaintRecordedAction(f){return !!(f.motion&&f.motion.showEvent&&!f.reducedMotion);}
function createRenderer(canvas){
  const ctx=canvas.getContext('2d');let tk=readTokens(canvas),arena=null,rect=null,W=0,H=0,dpr=1,world=null,arenaKey='';
  const img={};for(const [key,url] of Object.entries({
    iron:'design/qwen-30b/arena/arena.svg',golden:'design/qwen-30b/arena/arena-golden.svg',ball:'design/qwen-30b/arena/relic-ball.svg'
  })){const i=new Image();img[key]=i;i.onload=()=>{arena=null;};i.onerror=()=>{console.warn('V4 arena image failed:',url);arena=null;};i.src=url;}
  const selectedVariant=()=>window.CageViewerV4Variant==='golden'?'golden':'iron';
  function resize(){const box=canvas.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=Math.max(1,Math.round(box.width));H=Math.max(1,Math.round(box.height));canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);world=FX.fit(W,H);rect={x:world.x+FX.WORLD.x0*world.scale,y:world.y+FX.WORLD.y0*world.scale,w:(FX.WORLD.x1-FX.WORLD.x0)*world.scale,h:(FX.WORLD.y1-FX.WORLD.y0)*world.scale};tk=readTokens(canvas);arena=drawArena();arenaKey=selectedVariant();}
  function px(p){return C.toPixels(p,rect);}
  function drawArena(){const off=document.createElement('canvas');off.width=canvas.width;off.height=canvas.height;const g=off.getContext('2d');g.scale(dpr,dpr);
    g.fillStyle=tk['--cage-surround'];g.fillRect(0,0,W,H);
    const art=img[selectedVariant()];
    if(art&&art.complete&&art.naturalWidth){g.drawImage(art,world.x,world.y,world.w,world.h);return off;}
    // cage mesh around the pitch
    g.strokeStyle=tk['--cage-mesh'];g.lineWidth=1;const step=10;for(let x=-H;x<W;x+=step){g.beginPath();g.moveTo(x,0);g.lineTo(x+H,H);g.stroke();g.beginPath();g.moveTo(x+H,0);g.lineTo(x,H);g.stroke();}
    const r=rect,stripes=8;for(let i=0;i<stripes;i++){g.fillStyle=i%2?tk['--cage-turf']:tk['--cage-turf-2'];g.fillRect(r.x+r.w*i/stripes,r.y,r.w/stripes+.5,r.h);}
    // floodlight vignette
    const fl=g.createRadialGradient(r.x+r.w/2,r.y+r.h/2,r.h*.1,r.x+r.w/2,r.y+r.h/2,r.w*.65);fl.addColorStop(0,tk['--cage-flood']);fl.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=fl;g.fillRect(r.x,r.y,r.w,r.h);
    // recorded 4x3 engine grid: the only positional resolution the engine records
    g.strokeStyle=tk['--grid'];g.setLineDash([4,6]);g.lineWidth=1;for(let i=1;i<C.COLS;i++){if(i===2)continue;const x=r.x+r.w*i/C.COLS;g.beginPath();g.moveTo(x,r.y);g.lineTo(x,r.y+r.h);g.stroke();}for(let j=1;j<C.ROWS;j++){const y=r.y+r.h*j/C.ROWS;g.beginPath();g.moveTo(r.x,y);g.lineTo(r.x+r.w,y);g.stroke();}g.setLineDash([]);
    g.strokeStyle=tk['--cage-line'];g.lineWidth=2;g.strokeRect(r.x,r.y,r.w,r.h);g.beginPath();g.moveTo(r.x+r.w/2,r.y);g.lineTo(r.x+r.w/2,r.y+r.h);g.stroke();
    g.beginPath();g.arc(r.x+r.w/2,r.y+r.h/2,r.h*.14,0,Math.PI*2);g.stroke();g.beginPath();g.arc(r.x+r.w/2,r.y+r.h/2,3,0,Math.PI*2);g.fillStyle=tk['--cage-line'];g.fill();
    for(const side of [0,1]){const bx=side?r.x+r.w-r.w*.09:r.x;g.strokeRect(bx,r.y+r.h*.28,r.w*.09,r.h*.44);
      const gx=side?r.x+r.w:r.x-r.w*.028,gw=r.w*.028;g.fillStyle='rgba(255,255,255,.12)';g.fillRect(gx,r.y+r.h*.4,gw,r.h*.2);g.strokeStyle=tk['--cage-steel'];g.lineWidth=3;g.strokeRect(gx,r.y+r.h*.4,gw,r.h*.2);g.strokeStyle=tk['--cage-line'];g.lineWidth=2;}
    // steel cage frame
    g.strokeStyle=tk['--cage-steel'];g.lineWidth=5;const m=r.h*.035;g.beginPath();if(g.roundRect)g.roundRect(r.x-m-r.w*.03,r.y-m,r.w+2*m+r.w*.06,r.h+2*m,10);else g.rect(r.x-m-r.w*.03,r.y-m,r.w+2*m+r.w*.06,r.h+2*m);g.stroke();
    return off;}
  // V6.2: action lighting reads ONLY the recorded event segment and sampled
  // replay positions. It never creates new passes, shots, collisions or goals.
  function paintRecordedAction(f,R){
    const motion=f.motion;
    if(!shouldPaintRecordedAction(f))return;
    const phase=Math.max(0,Math.min(1,motion.phase||0));
    const strength=Math.pow(Math.sin(Math.PI*phase),1.4);
    if(strength<.02)return;
    const kind=motion.type,role=motion.roles||{};
    const shot=kind==='shot_attempt'||kind==='shot_miss';
    const defensive=['press','block','dribble_duel','race'].includes(kind)||(kind==='wall_pass'&&motion.challenge);
    const actor=role.actor&&f.players[role.actor]&&px(f.players[role.actor]);
    // A shot flash is centred at the sampled ball, not an invented goal contact.
    if(shot&&f.ball){
      const b=px(f.ball),radius=R*(1.9+phase*1.35);
      ctx.save();ctx.globalAlpha=strength*.78;
      const light=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,radius*2.4);
      light.addColorStop(0,'rgba(255,231,148,.47)');
      light.addColorStop(.32,'rgba(242,180,77,.22)');
      light.addColorStop(1,'rgba(242,180,77,0)');
      ctx.fillStyle=light;ctx.beginPath();ctx.arc(b.x,b.y,radius*2.4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffe3a0';ctx.lineWidth=2.2;
      ctx.beginPath();ctx.arc(b.x,b.y,radius,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    // Tackle/press feedback appears only for recorded challenges and contacts.
    if(defensive&&motion.challenge&&role.defender&&f.players[role.defender]){
      const p=px(f.players[role.defender]),radius=R*(1.35+phase*.95);
      ctx.save();ctx.globalAlpha=strength*.8;
      ctx.strokeStyle='#f1a0a3';ctx.lineWidth=2.3;
      ctx.beginPath();ctx.arc(p.x,p.y,radius,-.6,Math.PI+.8);ctx.stroke();
      for(let i=0;i<5;i++){
        const a=(i*2.4)+phase*.35;
        ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*radius*1.12,p.y+Math.sin(a)*radius*1.12);
        ctx.lineTo(p.x+Math.cos(a)*radius*1.45,p.y+Math.sin(a)*radius*1.45);ctx.stroke();
      }ctx.restore();
    }
    // Actor spotlight is a subtle ground marker; it never changes team roles.
    if(actor&&['carry','dribble_duel','through_ball','pass','press','block','race','wall_pass'].includes(kind)){
      ctx.save();ctx.globalAlpha=strength*.64;
      ctx.strokeStyle=defensive?'#ed9197':'#e6c77e';ctx.lineWidth=1.8;
      ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.ellipse(actor.x,actor.y,R*2.1,R*1.23,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  }

  // Keeper markers are SEPARATE from the six recorded outfield positions.
  // A lateral save motion occurs only during a logged goalkeeper action.
  function paintGoalkeepers(f,R){
    if(!Array.isArray(f.keepers)||f.keepers.length!==2)return;
    for(const side of [0,1]){
      const id=f.keepers[side],event=f.keeperEvent,active=event&&event.gk===id,phase=Math.max(0,Math.min(1,f.keeperPhase||0));
      let lane=.5;
      if(active&&event.zone?.lane){const target={left:.39,centre:.5,right:.61}[event.zone.lane]??.5;
        lane=f.reducedMotion?target:.5+(target-.5)*Math.sin(Math.PI*phase/2);
      }
      const outSweep=active&&event.type==='gk_sweep',at=px({u:side===0?(outSweep?.12:.035):(outSweep?.88:.965),v:lane}),radius=R*.82;
      ctx.save();
      ctx.fillStyle='rgba(4,13,21,.80)';ctx.strokeStyle=side===0?'#78c9ff':'#ffbd88';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(at.x,at.y,radius+2,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#f6d98b';ctx.font='800 '+Math.max(8,Math.round(radius*.83))+'px system-ui';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('GK',at.x,at.y);
      if(active&&!f.reducedMotion){
        const burst=Math.sin(Math.PI*phase);
        if(burst>0){ctx.strokeStyle=event.type==='gk_parry'?'#ffbf67':'#9af0cc';ctx.globalAlpha=burst*.8;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(at.x,at.y,radius+6+burst*8,0,Math.PI*2);ctx.stroke();}
      }
      ctx.restore();
    }
  }
  // frame: {players, ball, teamOf, labels, carrier, contact:[ids], oop:[ids], flash, trail:[{u,v}], reducedMotion, showLabels, focus}
  function draw(f){if(!rect)resize();if(!arena||arenaKey!==selectedVariant()){arena=drawArena();arenaKey=selectedVariant();}ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(arena,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
    if(f.cues){ctx.save();ctx.translate(world.x,world.y);ctx.scale(world.scale,world.scale);
      FX.paintNet(ctx,f.cues,f.tau,'left',f.reducedMotion);FX.paintNet(ctx,f.cues,f.tau,'right',f.reducedMotion);ctx.restore();}
    const R=Math.max(7,rect.h*.042),ids=Object.keys(f.players).sort((a,b)=>f.players[a].v-f.players[b].v);
    // V5.1 MOVEMENT READABILITY: subtle momentum ticks & recorded pass trail.
    // Both are pure presentation. NEVER alter the sampled score or event outcome.
    const motion=f.motion,kinetics=f.kinetics;
    if(motion&&!f.reducedMotion){
      if(motion.pass&&motion.ball.flight){
        const start=px(motion.pass.from),end=px(motion.pass.to);
        ctx.save();ctx.lineCap='round';
        const beam=ctx.createLinearGradient(start.x,start.y,end.x,end.y);
        beam.addColorStop(0,'rgba(246,212,136,.12)');
        beam.addColorStop(.45,'rgba(255,220,143,.65)');
        beam.addColorStop(1,'rgba(255,243,190,.92)');
        ctx.shadowColor='rgba(241,177,76,.63)';ctx.shadowBlur=5;
        ctx.strokeStyle=beam;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();
        ctx.restore();
      }
      ctx.save();ctx.lineCap='round';
      for(const runner of motion.runners){
        if(!f.players[runner.id])continue;
        const p=px(f.players[runner.id]);
        const dx=runner.du*rect.w,dy=runner.dv*rect.h,len=Math.hypot(dx,dy);
        if(len<3)continue;
        const delta=Math.min(17,len*.66),nx=dx/len,ny=dy/len;
        ctx.strokeStyle=f.teamOf[runner.id]===0?'rgba(106,216,239,.46)':'rgba(242,127,136,.46)';
        ctx.lineWidth=2.1;ctx.beginPath();ctx.moveTo(p.x-nx*6,p.y-ny*6);
        ctx.lineTo(p.x-nx*(delta+6),p.y-ny*(delta+6));ctx.stroke();
      }
      ctx.restore();
    }
    // ball trail (presentation)
    if(!f.reducedMotion&&f.trail&&f.trail.length>1){ctx.lineCap='round';for(let i=1;i<f.trail.length;i++){const a=px(f.trail[i-1]),b=px(f.trail[i]);ctx.strokeStyle='rgba(225,176,75,'+(.05+.28*i/f.trail.length)+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
    paintRecordedAction(f,R);
    paintGoalkeepers(f,R);
    for(const id of ids){const p=px(f.players[id]);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(p.x+2,p.y+R*.75,R*.9,R*.38,0,0,Math.PI*2);ctx.fill();}
    for(const id of ids){const p=px(f.players[id]),team=f.teamOf[id],col=team===0?tk['--team-a']:tk['--team-b'],ink=team===0?tk['--team-a-ink']:tk['--team-b-ink'],dim=f.oop&&f.oop.includes(id);
      ctx.globalAlpha=dim?.5:1;
      if(f.contact&&f.contact.includes(id)){ctx.strokeStyle=tk['--danger'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,R+5,0,Math.PI*2);ctx.stroke();}
      if(motion&&motion.showEvent){
        const role=motion.roles;
        if(id===role.actor&&(motion.type==='shot_attempt'||motion.type==='through_ball'||motion.type==='pass')){
          ctx.strokeStyle='rgba(249,224,155,.88)';ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(p.x,p.y,R+6,0,Math.PI*2);ctx.stroke();
        }
        if(id===role.defender&&motion.challenge){
          ctx.strokeStyle='rgba(239,132,132,.85)';ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(p.x,p.y,R+6,0,Math.PI*2);ctx.stroke();
        }
        if(id===role.receiver&&(motion.type==='pass'||motion.type==='through_ball')){
          ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(238,205,111,.65)';ctx.lineWidth=1.7;
          ctx.beginPath();ctx.arc(p.x,p.y,R+6,0,Math.PI*2);ctx.stroke();ctx.restore();
        }
      }
      if(id===f.carrier){ctx.save();ctx.strokeStyle=tk['--momentum'];ctx.lineWidth=3;ctx.shadowColor='#f5c65a';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,R+4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.lineWidth=1.2;ctx.strokeStyle='rgba(255,246,194,.8)';ctx.beginPath();ctx.arc(p.x,p.y,R+7,-Math.PI*.66,Math.PI*.23);ctx.stroke();ctx.restore();}
      // V5.2: a deterministic heading notch and compact moving-foot cues.
      // These only paint cosmetic graphics. No centerpoint or match cell changes.
      if(kinetics&&kinetics.players[id]){
        const gait=kinetics.players[id],angle=gait.heading,run=gait.gait==='sprint',jog=gait.gait==='jog';
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
        ctx.fillStyle=run?'rgba(240,228,188,.92)':jog?'rgba(215,227,220,.80)':'rgba(151,173,174,.61)';
        ctx.beginPath();ctx.moveTo(R+7,0);ctx.lineTo(R+1,-3.2);ctx.lineTo(R+1,3.2);ctx.closePath();ctx.fill();
        if(!f.reducedMotion&&(run||jog)){
          const cadence=Math.min(16,4+gait.speed*.055);
          const swing=Math.sin((f.tau||0)*cadence+String(id).length*.7)*1.6;
          const intensity=run?1:.55;
          ctx.lineWidth=1.9;ctx.strokeStyle=team===0?'rgba(130,232,240,.88)':'rgba(252,157,164,.88)';
          ctx.lineCap='round';
          for(const side of [-1,1]){
            const back=-R-2-(side*swing)*intensity;
            ctx.beginPath();ctx.moveTo(back,side*(R*.54));ctx.lineTo(back-4,side*(R*.54)+side*.7);ctx.stroke();
          }
          if(run&&Math.abs(gait.turnRate)>1.5){
            ctx.strokeStyle='rgba(255,232,173,.70)';ctx.lineWidth=1;
            ctx.beginPath();ctx.arc(0,0,R+10,-.25,.25,gait.turnRate<0);ctx.stroke();
          }
        }
        ctx.restore();
      }
      // Premium token finish: visual shading only. No positions, physics or event state change.
      ctx.save();ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=R*.55;ctx.shadowOffsetY=2;
      const metal=ctx.createRadialGradient(p.x-R*.35,p.y-R*.5,R*.06,p.x,p.y,R*1.15);
      metal.addColorStop(0,'#f4f7f3');metal.addColorStop(.15,col);metal.addColorStop(.72,col);metal.addColorStop(1,'#101b22');
      ctx.fillStyle=metal;ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.strokeStyle=ink;ctx.lineWidth=2.3;ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,R*.77,Math.PI*1.12,Math.PI*1.83);ctx.stroke();
      ctx.fillStyle=ink;ctx.font='800 '+Math.round(R*.95)+'px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(f.numbers&&f.numbers[id]||''),p.x,p.y+.5);
      ctx.globalAlpha=1;}
    // Collision-aware legend labels are placed AFTER tokens so the whole
    // six-player shape can be considered. No player position is changed.
    if(f.showLabels!==false){
      ctx.save();ctx.font=W<650?'700 10px system-ui, sans-serif':tk['--label-font'];
      ctx.textAlign='center';ctx.textBaseline='middle';
      const labelPlayers=ids.map(id=>{const p=px(f.players[id]),name=f.labels[id]||'';return {id,x:p.x,y:p.y,name,width:ctx.measureText(name).width+10};});
      const safe={x:Math.max(0,rect.x+2),y:Math.max(0,rect.y+2),w:Math.min(W,rect.x+rect.w-2)-Math.max(0,rect.x+2),h:Math.min(H,rect.y+rect.h-2)-Math.max(0,rect.y+2)};
      const labelBoxes=Names.place(labelPlayers,safe,R,{carrier:f.carrier,actor:motion&&motion.roles.actor,defender:motion&&motion.roles.defender,height:W<650?13:15,gap:3});
      for(const b of labelBoxes){
        const teamColor=f.teamOf[b.id]===0?tk['--team-a']:tk['--team-b'];
        ctx.save();ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=5;
        ctx.fillStyle='rgba(5,12,16,.94)';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.restore();
        ctx.fillStyle=teamColor;ctx.fillRect(b.x,b.y,3,b.h);
        ctx.strokeStyle=b.id===f.carrier?'rgba(244,201,105,.95)':'rgba(134,155,157,.54)';ctx.lineWidth=.9;ctx.strokeRect(b.x+.45,b.y+.45,b.w-.9,b.h-.9);
        ctx.fillStyle=b.id===f.carrier||b.id===f.focus?tk['--momentum']:'#f2f6f4';
        ctx.fillText(b.name,b.x+b.w/2,b.y+b.h/2+.5);
      }
      ctx.restore();
    }
    if(f.ball){const b=px(f.ball),lift=(f.reducedMotion?0:f.ball.lift||0),br=Math.max(3.5,R*.42)*(1+.35*lift),kb=kinetics&&kinetics.ball;
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(b.x+1+lift*4,b.y+br*.6+lift*6,br,br*.45,0,0,Math.PI*2);ctx.fill();
      if(kb&&kb.flight&&!f.reducedMotion&&kb.speed>18){
        const trail=Math.min(31,kb.trail),ux=Math.cos(kb.heading),uy=Math.sin(kb.heading);
        ctx.save();ctx.lineCap='round';
        const gradient=ctx.createLinearGradient(b.x-ux*trail,b.y-uy*trail,b.x,b.y);
        gradient.addColorStop(0,'rgba(234,185,84,0)');
        gradient.addColorStop(.55,'rgba(239,189,85,'+(kb.intensity*.28).toFixed(3)+')');
        gradient.addColorStop(1,'rgba(255,221,141,'+(kb.intensity*.58).toFixed(3)+')');
        ctx.strokeStyle=gradient;ctx.lineWidth=kb.shot?Math.min(6,br*.67):Math.min(3.5,br*.37);
        ctx.beginPath();ctx.moveTo(b.x-ux*trail,b.y-uy*trail);ctx.lineTo(b.x-ux*br*.45,b.y-uy*br*.45);ctx.stroke();
        ctx.restore();
      }
      const golden=img.ball,ballR=Math.max(6,br*1.55);
      ctx.save();
      ctx.strokeStyle='rgba(249,214,121,.69)';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(b.x,b.y-lift*8,ballR+2,0,Math.PI*2);ctx.stroke();
      ctx.restore();
      if(golden&&golden.complete&&golden.naturalWidth){ctx.save();ctx.translate(b.x,b.y-lift*8);
        if(kb&&!f.reducedMotion&&kb.flight&&kb.speed>45){ctx.rotate(kb.heading);ctx.scale(1+Math.min(.25,kb.intensity*.25),1-Math.min(.13,kb.intensity*.13));}
        ctx.rotate(kb?kb.spin:motion?motion.spin:(f.tau||0)*6);
        ctx.shadowColor='#f3c55bc0';ctx.shadowBlur=9;ctx.drawImage(golden,-ballR,-ballR,ballR*2,ballR*2);ctx.restore();}
      else{ctx.fillStyle='#d6a447';ctx.beginPath();ctx.arc(b.x,b.y-lift*8,ballR,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#382407';ctx.lineWidth=1.5;ctx.stroke();}}
    if(f.cues){ctx.save();ctx.translate(world.x,world.y);ctx.scale(world.scale,world.scale);
      FX.paintEffects(ctx,f.cues,f.tau,f.reducedMotion);ctx.restore();}
    // All goal flashes now derive solely from recorded goal cues, never arbitrary playback state.
    if(f.flash>0&&!f.reducedMotion&&!f.cues){ctx.fillStyle='rgba(255,240,200,'+(.45*f.flash)+')';ctx.fillRect(0,0,W,H);}
  }
  return {resize,draw,get rect(){return rect;},tokens:()=>tk};
}
window.CageViewerRenderer={TOKENS,createRenderer,shouldPaintRecordedAction,v4:true};
})();
