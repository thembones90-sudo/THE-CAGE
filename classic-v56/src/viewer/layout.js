// THE CAGE 2D viewer: within-cell layout. Pure and deterministic (architecture §C.4).
// The engine records 4x3 cells only; where players stand INSIDE a cell is presentation,
// inferred from engagement roles and labelled as such in the UI.
(()=>{'use strict';
const C=window.CageViewerCoords;
function hash32(...parts){let h=2166136261>>>0;for(const p of parts){const s=String(p);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;h=Math.imul(h^0x9e,16777619)>>>0;}h^=h>>>15;h=Math.imul(h,0x2c1b3c6d)>>>0;h^=h>>>12;return h>>>0;}
const unit=(...p)=>hash32(...p)/4294967296; // [0,1), deterministic
// Slot offsets in cell units [dx along x, dy along y].
const TEMPLATES={
  1:[[0,0]],
  2:[[-.22,0],[.22,0]],
  3:[[-.24,-.18],[-.24,.18],[.26,0]],
  4:[[-.3,0],[.3,0],[0,-.27],[0,.27]],
  5:[[-.3,-.2],[0,-.2],[.3,-.2],[-.16,.22],[.16,.22]],
  6:[[-.3,-.2],[0,-.2],[.3,-.2],[-.3,.22],[0,.22],[.3,.22]]};
const JITTER=.04;
// Cache ONLY pure seeded within-cell offsets. Same (seed,beat,player) always
// produces the same two coordinates, including on seek or replay.
// Limit the cache to avoid unbounded memory across different recorded matches.
const JITTER_CACHE=new Map(),MAX_JITTER_CACHE=15000;
function cachedJitter(seed,beat,id){
  const key=seed+'|'+beat+'|'+id;
  let pair=JITTER_CACHE.get(key);
  if(pair)return pair;
  pair=[(unit(seed,beat,id,'x')*2-1)*JITTER,(unit(seed,beat,id,'y')*2-1)*JITTER];
  if(JITTER_CACHE.size>=MAX_JITTER_CACHE)JITTER_CACHE.clear();
  JITTER_CACHE.set(key,pair);
  return pair;
}
// positions: {id:{x,y}} world cells. ctx: {teamOf, poss, carrier, challenger, helper, seed, beat, jitter}
function assign(positions,ctx){const out={},cells=new Map(),ids=Object.keys(positions).sort();
  for(const id of ids){const p=positions[id],k=p.x+','+p.y;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(id);}
  const dir=ctx.poss===0||ctx.poss===1?C.attackDir(ctx.poss):1;
  for(const [k,occ] of [...cells.entries()].sort((a,b)=>a[0]<b[0]?-1:1)){
    const cell=positions[occ[0]],centre=C.cellCenter(cell),tpl=TEMPLATES[Math.min(6,occ.length)].map(([dx,dy],i)=>({dx,dy,i,s:dx*dir}));
    // Goal-side ordering: slots further along the attack direction belong to defenders.
    const bySide=tpl.slice().sort((a,b)=>b.s-a.s||a.dy-b.dy||a.i-b.i);
    const tb=(a,b)=>(ctx.teamOf[a]-ctx.teamOf[b])||(a<b?-1:a>b?1:0);
    const defs=occ.filter(id=>ctx.teamOf[id]!==ctx.poss).sort(tb),atts=occ.filter(id=>ctx.teamOf[id]===ctx.poss).sort(tb);
    const defSlots=bySide.slice(0,defs.length),attSlots=bySide.slice(defs.length);const placed={};
    const take=(list,pred)=>{let best=0;for(let i=1;i<list.length;i++)if(pred(list[i])<pred(list[best]))best=i;return list.splice(best,1)[0];};
    const remainingAtt=atts.slice();
    if(ctx.carrier&&remainingAtt.includes(ctx.carrier)){placed[ctx.carrier]=take(attSlots,s=>Math.hypot(s.dx,s.dy)*10+s.i*1e-3);remainingAtt.splice(remainingAtt.indexOf(ctx.carrier),1);}
    for(const id of remainingAtt)placed[id]=attSlots.shift();
    const order=[ctx.challenger,ctx.helper].filter(id=>id&&defs.includes(id));for(const id of defs)if(!order.includes(id))order.push(id);
    const anchor=ctx.carrier&&placed[ctx.carrier]?placed[ctx.carrier]:{dx:0,dy:0};
    for(const id of order)placed[id]=id===ctx.challenger?take(defSlots,s=>Math.hypot(s.dx-anchor.dx,s.dy-anchor.dy)+s.i*1e-3):defSlots.shift();
    for(const id of occ){const s=placed[id];let jx=0,jy=0;if(ctx.jitter!==false){[jx,jy]=cachedJitter(ctx.seed,ctx.beat,id);}
      out[id]={u:centre.u+(s.dx+jx)/C.COLS,v:centre.v+(s.dy+jy)/C.ROWS,slot:s.i,cell:{x:cell.x,y:cell.y},shared:occ.length};}
  }
  return out;}
// Short broadcast-style label: surname, abbreviated when long (RONALDINHO -> R'DINHO).
function label(name){const parts=String(name||'?').trim().split(/\s+/),last=parts.length>1&&/^(del|de|van|da|di|dos|von)$/i.test(parts.at(-2))?parts.slice(-2).join(' '):parts.at(-1);const up=last.toUpperCase();return up.length>9?up[0]+"'"+up.slice(-5):up;}
window.CageViewerLayout={TEMPLATES,JITTER,hash32,unit,assign,label};
})();
