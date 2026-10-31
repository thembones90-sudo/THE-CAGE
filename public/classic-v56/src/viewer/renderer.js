// THE CAGE 2D viewer: Canvas 2D renderer. Draws a frame sampled from the Timeline.
// No game logic, no randomness, no event creation: it only paints what it is given.
(()=>{'use strict';
const C=window.CageViewerCoords;
const TOKENS={'--cage-turf':'#1f4d2b','--cage-turf-2':'#225430','--cage-line':'rgba(235,245,235,.78)','--cage-steel':'#8c96a3','--cage-mesh':'rgba(190,200,210,.16)','--cage-flood':'rgba(255,248,220,.10)','--cage-surround':'#0d1014',
  '--team-a':'#3aa0ff','--team-a-ink':'#04121f','--team-b':'#ff5a52','--team-b-ink':'#1f0504','--ball':'#ffffff','--danger':'#e0283c','--momentum':'#ffb627','--verified':'#3ccf6e','--label-font':'600 11px system-ui, sans-serif','--grid':'rgba(255,255,255,.07)'};
function readTokens(el){const cs=el&&typeof getComputedStyle==='function'?getComputedStyle(el):null,o={};for(const k in TOKENS){const v=cs&&cs.getPropertyValue(k).trim();o[k]=v||TOKENS[k];}return o;}

function createRenderer(canvas){
  const ctx=canvas.getContext('2d');let tk=readTokens(canvas),arena=null,rect=null,W=0,H=0,dpr=1;
  function resize(){const box=canvas.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=Math.max(1,Math.round(box.width));H=Math.max(1,Math.round(box.height));canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);rect=C.fitPitch(W,H,1.8,.07);tk=readTokens(canvas);arena=drawArena();}
  function px(p){return C.toPixels(p,rect);}
  function drawArena(){const off=document.createElement('canvas');off.width=canvas.width;off.height=canvas.height;const g=off.getContext('2d');g.scale(dpr,dpr);
    g.fillStyle=tk['--cage-surround'];g.fillRect(0,0,W,H);
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
  // frame: {players, ball, teamOf, labels, carrier, contact:[ids], oop:[ids], flash, trail:[{u,v}], reducedMotion, showLabels, focus}
  function draw(f){if(!rect)resize();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(arena,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
    const R=Math.max(7,rect.h*.042),ids=Object.keys(f.players).sort((a,b)=>f.players[a].v-f.players[b].v);
    // ball trail (presentation)
    if(!f.reducedMotion&&f.trail&&f.trail.length>1){ctx.lineCap='round';for(let i=1;i<f.trail.length;i++){const a=px(f.trail[i-1]),b=px(f.trail[i]);ctx.strokeStyle='rgba(255,255,255,'+(.04+.22*i/f.trail.length)+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
    for(const id of ids){const p=px(f.players[id]);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(p.x+2,p.y+R*.75,R*.9,R*.38,0,0,Math.PI*2);ctx.fill();}
    for(const id of ids){const p=px(f.players[id]),team=f.teamOf[id],col=team===0?tk['--team-a']:tk['--team-b'],ink=team===0?tk['--team-a-ink']:tk['--team-b-ink'],dim=f.oop&&f.oop.includes(id);
      ctx.globalAlpha=dim?.5:1;
      if(f.contact&&f.contact.includes(id)){ctx.strokeStyle=tk['--danger'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,R+5,0,Math.PI*2);ctx.stroke();}
      if(id===f.carrier){ctx.strokeStyle=tk['--momentum'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,R+3,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle=ink;ctx.font='700 '+Math.round(R*.95)+'px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(f.numbers&&f.numbers[id]||''),p.x,p.y+.5);
      if(f.showLabels!==false){const lab=f.labels[id]||'';ctx.font=tk['--label-font'];const w=ctx.measureText(lab).width+8;ctx.fillStyle='rgba(8,10,14,.72)';ctx.fillRect(p.x-w/2,p.y-R-18,w,14);ctx.fillStyle=id===f.focus?tk['--momentum']:'#f2f4f7';ctx.fillText(lab,p.x,p.y-R-11);}
      ctx.globalAlpha=1;}
    if(f.ball){const b=px(f.ball),lift=(f.reducedMotion?0:f.ball.lift||0),br=Math.max(3.5,R*.42)*(1+.35*lift);
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(b.x+1+lift*4,b.y+br*.6+lift*6,br,br*.45,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=tk['--ball'];ctx.beginPath();ctx.arc(b.x,b.y-lift*8,br,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=1;ctx.stroke();}
    if(f.flash>0&&!f.reducedMotion){ctx.fillStyle='rgba(255,240,200,'+(.45*f.flash)+')';ctx.fillRect(0,0,W,H);}
  }
  return {resize,draw,get rect(){return rect;},tokens:()=>tk};
}
window.CageViewerRenderer={TOKENS,createRenderer};
})();
