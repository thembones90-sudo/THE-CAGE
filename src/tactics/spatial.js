(()=>{'use strict';const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),lim=window.CageCapabilities.lim;
const world=(zone,team)=>({x:team===0?zone.x:3-zone.x,y:{left:0,centre:1,right:2}[zone.lane]}),oriented=(p,team)=>team===0?p.x:3-p.x;
function commitment(team){const order=team.ps.slice().sort((a,b)=>(b.c.ATT-b.c.DEF)-(a.c.ATT-a.c.DEF));order.forEach((p,i)=>p.committed=i<(team.policy.commitForward+(team.lateSurge?1:0)));}
function initial(team){commitment(team);for(const [i,p] of team.ps.entries()){p.pos={x:team.ti===0?{anchor:0,link:1,spear:2}[p.duty]:3-{anchor:0,link:1,spear:2}[p.duty],y:i};p.moveCredit=1;}}
function move(p,target){const m=window.CageTacticalParams.P.movement;p.moveCredit=Math.min(m.creditCap,p.moveCredit+m.creditBase+m.agilityCredit*p.c.a.agi/100);if(p.moveCredit<1)return;p.moveCredit--;if(Math.abs(target.x-p.pos.x)>=Math.abs(target.y-p.pos.y)&&target.x!==p.pos.x)p.pos.x+=Math.sign(target.x-p.pos.x);else if(target.y!==p.pos.y)p.pos.y+=Math.sign(target.y-p.pos.y);}
function duties(team){const ranked=team.ps.slice().sort((a,b)=>oriented(a.pos,team.ti)-oriented(b.pos,team.ti)||b.c.DEF-a.c.DEF);ranked.forEach((q,i)=>q.duty=['anchor','link','spear'][i]);}
// M3 off-ball intelligence (cage-t3-14, P.offball present). Runs pick open cells; defenders block the passing lane to the
// most dangerous runner and mark the next one goal-side, handing marks off instead of chasing across; positional discipline
// (approved personality v3) decides who leaves a job to double the ball or steps up from rest defence. No RNG draws.
const discipline=id=>{const v=window.CAGE_PERSONALITY&&window.CAGE_PERSONALITY.discipline[id];return Number.isFinite(v)?v:50;};// unscored: neutral, no tendency
function pathCells(from,to){const cells=[{...from}];let p={...from};while(p.x!==to.x||p.y!==to.y){if(p.x!==to.x)p.x+=Math.sign(to.x-p.x);else p.y+=Math.sign(to.y-p.y);cells.push({...p});}return cells;}
function offballAttack(teams,poss,carrier,zone,ball){const O=window.CageTacticalParams.P.offball,attack=teams[poss],defs=teams[1-poss].ps.filter(o=>o.oop===0),bx=zone.x,toW=(ox,y)=>({x:poss===0?ox:3-ox,y});
  const space=c=>Math.min(2,...defs.map(o=>dist(o.pos,c))),lane=c=>passingDefenders(teams,poss,ball,c).length,taken=[];
  const runners=attack.ps.filter(q=>q!==carrier&&q.committed).sort((a,b)=>b.c.ATT-a.c.ATT||(a.id<b.id?-1:1));
  for(const q of runners){const cands=[[bx+1,ball.y],[bx+1,ball.y-1],[bx+1,ball.y+1],[bx,ball.y-1],[bx,ball.y+1]].filter(([ox,y])=>ox<=3&&y>=0&&y<=2).map(([ox,y])=>toW(ox,y)).filter(c=>!taken.some(t=>t.x===c.x&&t.y===c.y));
    let best=null,bs=-Infinity;for(const c of cands){const sc=O.space*space(c)-O.lane*lane(c)+O.ahead*(oriented(c,poss)-bx)+(taken.length&&c.y!==taken[0].y?O.width:0);if(sc>bs+1e-9){bs=sc;best=c;}}
    if(!best)best=toW(Math.min(3,bx+1),ball.y);taken.push(best);q.target=best;q.job='run';q.on=null;q.handoff=false;move(q,best);}
  let restIndex=0;for(const q of attack.ps){if(q===carrier||q.committed)continue;let ox=Math.min(1,Math.max(0,bx-1));const y=restIndex++===0?1:ball.y===0?2:0;
    // Adventurous (low-discipline) rest players step up level with the ball, thinning the rest defence.
    const adv=discipline(q.id)<O.adventure;if(adv)ox=Math.max(ox,Math.min(2,bx));q.target=toW(ox,y);q.job=adv?'step_up':'rest';q.on=null;q.handoff=false;move(q,q.target);}
  if(carrier){carrier.job='ball';carrier.on=null;carrier.handoff=false;}}
function offballDefend(teams,poss,carrier,zone,ball){const O=window.CageTacticalParams.P.offball,m=window.CageTacticalParams.P.movement,attack=teams[poss],defend=teams[1-poss];
  const available=defend.ps.slice().sort((a,b)=>(a.oop>0)-(b.oop>0)||dist(a.pos,ball)-dist(b.pos,ball)||(a.id<b.id?-1:1));
  const first=available[0];first.target={...ball};first.job='ball';first.on=carrier?carrier.id:null;first.handoff=false;move(first,first.target);
  const others=available.slice(1),goalX=defend.ti===0?0:3,stepHome=c=>({x:c.x+Math.sign(goalX-c.x),y:c.y});
  // Real danger (P-07): how far forward the runner is, plus his attacking capability. No names, no labels.
  const threats=attack.ps.filter(q=>q!==carrier).map(q=>({q,danger:oriented(q.pos,poss)+q.c.ATT/100})).sort((a,b)=>b.danger-a.danger||(a.q.id<b.q.id?-1:1));
  const jobs=[];
  if(threats[0]){const cells=pathCells(ball,threats[0].q.pos),cell=cells[Math.max(1,Math.floor((cells.length-1)/2))]||threats[0].q.pos;jobs.push({job:'lane',on:threats[0].q.id,cell});}
  if(threats[1]){const r=threats[1].q,ahead=oriented(r.pos,poss)>oriented(ball,poss),cell=ahead&&r.pos.x!==goalX?stepHome(r.pos):{...r.pos};jobs.push({job:'mark',on:r.id,cell});}
  while(jobs.length<others.length){const x=Math.max(0,oriented(ball,defend.ti)-(defend.policy.compactness>=m.compactHelp?0:1));jobs.push({job:'cover',on:null,cell:{x:defend.ti===0?x:3-x,y:lim(ball.y+(ball.y===2?-1:1),0,2)}});}
  // Keep marks (hand-off only when swapping saves at least O.handoff cells of running).
  let order=others.map((q,i)=>i);if(others.length===2){const cost=o=>dist(others[0].pos,jobs[o[0]].cell)+dist(others[1].pos,jobs[o[1]].cell),man=q=>q.job==='lane'||q.job==='mark'?q.on:null,keep=man(others[0])&&man(others[0])===jobs[1].on||man(others[1])&&man(others[1])===jobs[0].on?[1,0]:[0,1],alt=[1-keep[0],1-keep[1]];
    order=cost(alt)+O.handoff<=cost(keep)?alt:keep;}
  let doubled=false;others.forEach((q,i)=>{const j=jobs[order[i]],prev=q.job==='lane'||q.job==='mark'?q.on:null;let target=j.cell,job=j.job,on=j.on;
    // Low positional discipline: leave the job to double the ball when it is next to him (one player at most).
    if(!doubled&&q.oop===0&&discipline(q.id)<O.doubleUp&&dist(q.pos,ball)<=1&&j.job!=='cover'){target={...ball};job='double';on=carrier?carrier.id:null;doubled=true;}
    q.handoff=!!(prev&&on&&prev!==on&&(job==='lane'||job==='mark'));q.target={x:target.x,y:target.y};q.job=job;q.on=on;move(q,target);});}
function update(teams,poss,carrier,zone,tick){const ball=world(zone,poss),attack=teams[poss],defend=teams[1-poss],rotated=[];carrier.pos={...ball};
const m=window.CageTacticalParams.P.movement,period=Math.max(m.rotationPeriodMin,Math.round(m.rotationPeriodBase-m.rotationPeriodScale*attack.policy.rotation));if(tick>0&&tick%period===0){const able=attack.ps.filter(q=>q!==carrier&&q.committed&&q.twoWay),reserve=attack.ps.find(q=>!q.committed&&q.c.pass>=m.rotationPass);const drop=able.find(q=>reserve&&q.c.DEF>=reserve.c.DEF-m.rotationDeficit);if(drop&&reserve){drop.committed=false;reserve.committed=true;rotated.push(drop.id,reserve.id);}}
if(window.CageTacticalParams.P.offball){offballAttack(teams,poss,carrier,zone,ball);offballDefend(teams,poss,carrier,zone,ball);teams.forEach(duties);return rotated;}
let supportIndex=0,restIndex=0;for(const q of attack.ps){if(q===carrier)continue;let x,y;if(q.committed){if(supportIndex++===0){x=Math.min(3,zone.x+window.CageTacticalParams.P.spatial.advance);y=ball.y;}else{x=zone.x;y=ball.y===2?1:ball.y+1;}}else{x=Math.min(1,Math.max(0,zone.x-1));y=restIndex++===0?1:ball.y===0?2:0;}q.target={x:poss===0?x:3-x,y};move(q,q.target);}
const available=defend.ps.slice().sort((a,b)=>(a.oop>0)-(b.oop>0)||dist(a.pos,ball)-dist(b.pos,ball)),defX=oriented(ball,defend.ti),runners=attack.ps.filter(q=>q!==carrier).sort((a,b)=>oriented(b.pos,poss)-oriented(a.pos,poss));
for(const [i,q] of available.entries()){let target;if(i===0)target=ball;else if(i===1){const x=Math.max(0,defX-(defend.policy.compactness>=m.compactHelp?0:1)),y=lim(ball.y+(ball.y===2?-1:1),0,2);target={x:defend.ti===0?x:3-x,y};}else{const runner=runners[0];target=runner?{x:runner.pos.x,y:runner.pos.y}:{...ball};}q.target={x:target.x,y:target.y};move(q,target);}
teams.forEach(duties);return rotated;}
function context(teams,poss,carrier,zone){const ball=world(zone,poss),radius=window.CageTacticalParams.P.spatial.radius,near=teams[1-poss].ps.filter(q=>q.oop===0&&dist(q.pos,ball)<=radius).sort((a,b)=>dist(a.pos,ball)-dist(b.pos,ball)),support=teams[poss].ps.filter(q=>q!==carrier&&q.oop===0&&dist(q.pos,ball)<=radius),d=near[0]||null,helper=near[1]||null;
return {d,helper,support,ball,attackers:1+support.length,defenders:near.length,defenderIds:near.map(q=>q.id),supportQ:Math.min(2,support.reduce((s,q)=>s+(q.c.dribble+q.c.pass)/200,0)),helpQ:helper?Math.min(1,(helper.c.tackle+helper.c.intercept)/200*teams[1-poss].policy.compactness):0,positions:Object.fromEntries(teams.flatMap(t=>t.ps.map(q=>[q.id,{...q.pos}]))),availability:Object.fromEntries(teams.flatMap(t=>t.ps.map(q=>[q.id,q.oop]))),commitment:Object.fromEntries(teams.flatMap(t=>t.ps.map(q=>[q.id,q.committed]))),distance:dist};}
function passingDefenders(teams,poss,from,to){const cells=[];let p={...from};cells.push({...p});while(p.x!==to.x||p.y!==to.y){if(p.x!==to.x)p.x+=Math.sign(to.x-p.x);else p.y+=Math.sign(to.y-p.y);cells.push({...p});}return teams[1-poss].ps.filter(q=>q.oop===0).map(q=>({q,distance:Math.min(...cells.map(p=>dist(p,q.pos)))})).filter(v=>v.distance<=1).sort((a,b)=>a.distance-b.distance||(b.q.c.intercept-a.q.c.intercept)).map(v=>v.q);}
window.CageSpatial={dist,world,oriented,commitment,initial,update,context,passingDefenders,discipline};})();
