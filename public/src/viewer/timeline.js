// THE CAGE 2D viewer: pure, deterministic timeline builder (architecture §C).
// buildTimeline(record, cfg) -> Timeline. Reads the recorded event log only.
// It never simulates, never creates gameplay events, never mutates the record and never
// uses randomness or wall-clock time. Everything below cell level (slots inside a cell,
// timing inside a step, shot placement) is presentation and is flagged as inferred.
(()=>{'use strict';
const C=window.CageViewerCoords,L=window.CageViewerLayout;
const VERSION='viewer-timeline-1',MAX_SCHEMA=2;
const ACTION={restart:1,carry:1,pass:1,through_ball:1,dribble_duel:1,wall_pass:1,press:1,shot_attempt:1,free_kick:1};
const PRE={recovery_run:1,rotation:1};
// Presentation holds (seconds of timeline at 1x "Full") for events that take no simulation time.
const HOLD={turnover:.35,race:.5,block:.4,gk_save:.7,gk_parry:.8,shot_miss:.5,rebound:.5,foul:.6,goal:1.6,free_kick:.9,restart:.8,recovery_run:.15,rotation:.25,shot_attempt:.5};
// Extra frozen-clock tail after a timed event (the clock stops while the moment lands).
const POST={restart:.6,goal:1.6};
const DEFAULTS={secPerSim:.35,minMove:.45,jitter:true};
// Screen/world travel is presentation-only. This does not touch the event log,
// 4x3 recorded cells, original simulation clock or score. An easer can turn a
// short (0.15s) stop-clock recovery into a 2,000px/s teleport unless its render
// duration is budgeted from actual recorded cell-to-cell distance.
const TRAVEL_BUDGET_PX_S=340;
const TRAVEL_EASE_MAX=1.5; // cubic smoothstep peak derivative

const DANGER_TYPES={shot_attempt:1,goal:1,through_ball:1,race:1,free_kick:1,foul:1,block:1,shot_miss:1,rebound:1};

const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const clamp01=k=>k<0?0:k>1?1:k;
const round=v=>Math.round(v*1e6)/1e6;
const pt=p=>({u:round(p.u),v:round(p.v)});

function fail(msg){const e=Error(msg);e.viewer=true;throw e;}

// Accepts a CageRecords record ({schema, config, result}) or a bare engine result ({events,...}).
function normalise(input){
  if(!input||typeof input!=='object')fail('No match record supplied.');
  const rec=input.result&&Array.isArray(input.result.events)?input:Array.isArray(input.events)?{schema:1,config:null,result:input}:null;
  if(!rec)fail('This file is not a recorded match (no event log found).');
  const schema=Math.max(Number(rec.viewerSchema)||0,Number(rec.result.schema)||0,1);
  if(schema>MAX_SCHEMA)fail('Replay recorded with viewer schema '+schema+'; this build supports schema '+MAX_SCHEMA+' or lower.');
  if(Number.isInteger(rec.schema)&&rec.schema>MAX_SCHEMA)fail('Replay record schema '+rec.schema+' is newer than this viewer supports (max '+MAX_SCHEMA+').');
  const ev=rec.result.events;if(!ev.length)fail('The event log is empty.');
  let prev=-1;for(let i=0;i<ev.length;i++){const e=ev[i];if(!e||e.i!==i||!Number.isFinite(e.t)||e.t<prev||(e.team!==0&&e.team!==1)||typeof e.type!=='string')fail('Event '+i+' is out of order or malformed.');prev=e.t;}
  let teams=rec.config&&Array.isArray(rec.config.teams)?rec.config.teams.map(t=>t.slice()):null;
  if(!teams){teams=[[],[]];for(const e of ev){if(e.actor&&!teams[e.team].includes(e.actor)&&!teams[1-e.team].includes(e.actor))teams[e.team].push(e.actor);if(e.target&&!teams[e.team].includes(e.target)&&!teams[1-e.team].includes(e.target))teams[e.team].push(e.target);if(e.opp&&!teams[1-e.team].includes(e.opp)&&!teams[e.team].includes(e.opp))teams[1-e.team].push(e.opp);}}
  const ids=teams.flat();if(teams.length!==2||teams.some(t=>t.length!==3)||new Set(ids).size!==6)fail('A cage match needs exactly three players per side.');
  return {rec,schema,events:ev,teams,ids};
}

function possessionAfter(e,prevPoss){
  switch(e.type){case 'restart':case 'turnover':return e.team;case 'rebound':return e.team;case 'press':case 'foul':case 'block':return 1-e.team;case 'recovery_run':return prevPoss;default:return C.frameTeam(e);}
}
function carrierOf(e){if(e.roles&&e.roles.carrier)return e.roles.carrier;if(e.type==='press'||e.type==='foul'||e.type==='block')return e.opp||null;return e.actor||null;}

// v0.4 records carry no off-ball positions: synthesise a static duty shape, put the
// event's carrier at the recorded ball cell, and flag every snapshot as inferred.
function homeShape(teams,shapes){const out={};teams.forEach((ids,ti)=>{const duty=shapes&&shapes[ti]&&shapes[ti].duty||{};const order=ids.slice();ids.forEach((id,k)=>{const d=duty[id],x={anchor:0,link:1,spear:2}[d];const ox=x===undefined?k:x;out[id]={x:ti===0?ox:3-ox,y:order.indexOf(id)};});});return out;}

function buildTimeline(record,cfgIn){
  const cfg=Object.assign({},DEFAULTS,cfgIn||{}),{rec,schema,events,teams,ids}=normalise(record);
  const teamOf={};teams.forEach((t,ti)=>t.forEach(id=>{teamOf[id]=ti;}));
  const seed=rec.config&&Number.isInteger(rec.config.seed)?rec.config.seed:0;
  const full=events.every(e=>e.positions&&ids.every(id=>e.positions[id]&&Number.isInteger(e.positions[id].x)&&Number.isInteger(e.positions[id].y)));
  const exactSteps=events.every(e=>Number.isInteger(e.step));
  const notes=['Player spacing inside a cell, run curves and shot placement are inferred presentation; cells, actors and outcomes are recorded.'];
  if(!full)notes.push('Off-ball positions were not recorded for this engine ('+(rec.engineVersion||'unknown')+'): ball-only mode, other players shown in a static duty shape.');
  if(!exactSteps)notes.push('Approximate timing: this record has no step index, so beats are grouped by event type.');

  // 1. Beats: one simulation step each. Exact with `step`, heuristic otherwise (§C.1).
  // Heuristic: an action opens a beat; recovery/rotation belong to the NEXT action's step;
  // consequences (turnover, race, block, miss, rebound, foul, goal) stay in the current beat.
  const beatOf=new Array(events.length);let beat=-1,pending=[],lastStep=null;
  for(let i=0;i<events.length;i++){const e=events[i];
    if(exactSteps){if(e.step!==lastStep){beat++;lastStep=e.step;}beatOf[i]=beat;continue;}
    if(PRE[e.type]){pending.push(i);continue;}
    if(ACTION[e.type]||beat<0)beat++;
    for(const p of pending)beatOf[p]=beat;pending=[];beatOf[i]=beat;}
  if(pending.length){beat++;for(const p of pending)beatOf[p]=beat;}

  // 2. Possessions and danger (for condensed playback and the goal replay).
  const possOf=new Array(events.length),possStart=new Array(events.length);let poss=null,start=0;
  for(let i=0;i<events.length;i++){const e=events[i],np=possessionAfter(e,poss);if(e.type==='restart'||e.type==='turnover'||np!==poss)start=i;poss=np;possOf[i]=poss;possStart[i]=start;}
  const danger={};for(let i=0;i<events.length;i++){const e=events[i],s=possStart[i];const prog=e.zone&&C.frameTeam(e)===possOf[i]&&e.zone.x>=2;if(DANGER_TYPES[e.type]||e.transition||prog)danger[s]=true;}

  // 3. Snapshots -> deterministic layouts.
  const home=full?null:homeShape(teams,rec.result.shapes);let lastBall=null;
  const snapshot=e=>{if(full)return e.positions;const s=Object.assign({},home),cell=C.eventCell(e)||lastBall,c=carrierOf(e);if(cell){lastBall=cell;if(c&&s[c])s[c]={x:cell.x,y:cell.y};if(e.actor&&e.actor!==c&&(e.type==='press'||e.type==='dribble_duel'||e.type==='wall_pass'))s[e.actor]={x:cell.x,y:cell.y};if(e.opp&&e.opp!==c&&(e.type==='dribble_duel'||e.type==='wall_pass'))s[e.opp]={x:cell.x,y:cell.y};}return s;};
  const layouts=events.map(e=>{const c=carrierOf(e),ch=e.roles&&e.roles.challenger||(e.type==='press'?e.actor:(e.type==='dribble_duel'||e.type==='wall_pass')?e.opp:null);const raw=L.assign(snapshot(e),{teamOf,poss:possOf[e.i]===null?C.frameTeam(e):possOf[e.i],carrier:c,challenger:ch,helper:e.roles&&e.roles.helper||null,seed,beat:beatOf[e.i],jitter:cfg.jitter});const o={};for(const id of ids)o[id]=pt(raw[id]);return o;});

  // 4. Segments: one per event. Clock moves only when simulation time moved.
  const segs=[];let tau=0,prevT=0,ball={id:carrierOf(events[0])||events[0].actor};const goals=[];let score=[0,0];
  for(let i=0;i<events.length;i++){const e=events[i],dt=round(e.t-prevT),moving=dt>0;
    let m=moving?Math.max(cfg.minMove,dt*cfg.secPerSim):0,h=moving?(POST[e.type]||0):(HOLD[e.type]||.3);
    const end=layouts[i],start=i?layouts[i-1]:layouts[0];
    let dur=round(m+h),seg={i,type:e.type,team:e.team,beat:beatOf[i],possStart:possStart[i],danger:!!danger[possStart[i]],tau0:round(tau),tau1:round(tau+dur),move:round(m),t0:prevT,t1:e.t,start,end,win:{},contact:null,ball:{start:ball,pieces:[]},inferred:!full,motionBudgeted:true};
    const dflt=moving?[0,.55]:[0,1];for(const id of ids)seg.win[id]=dflt;
    const mf=dur?m/dur:0;                 // fraction of the segment while the clock runs
    const P=(a,b,to)=>{seg.ball.pieces.push({a:round(a),b:round(b),to});ball=to;};
    const gain=(id,a=0,b=.35)=>{if(id&&!(ball.id===id&&!ball.pt))P(a,b,{id});};
    const c=carrierOf(e);
    switch(e.type){
      case 'restart':case 'turnover':case 'free_kick':gain(e.actor,0,e.type==='turnover'?.45:.4);if(moving)seg.win[e.actor]=[0,.9];break;
      case 'carry':gain(e.actor,0,.2);seg.win[e.actor]=[0,1];break;
      case 'pass':case 'through_ball':{gain(e.actor,0,.2);seg.win[e.actor]=[0,.5];const r=e.target;
        if(r&&e.outcome==='complete'){seg.win[r]=[0,.85];P(.55,1,{pt:end[r],toward:r});ball={id:r};}
        else if(r){const I=e.opp,from=end[e.actor],to=end[r];let cut=to;if(I&&end[I]){const dx=to.u-from.u,dy=to.v-from.v,len=dx*dx+dy*dy;const k=len?clamp01(((end[I].u-from.u)*dx+(end[I].v-from.v)*dy)/len):1;cut=pt({u:from.u+dx*k,v:from.v+dy*k});seg.win[I]=[0,.8];}seg.win[r]=[0,.85];P(.55,.9,{pt:cut,intercepted:true});}
        break;}
      case 'race':{const r=e.actor,d=e.opp;if(d&&end[d]&&end[r]){seg.contact={id:d,at:.6,p:near(end[r],end[d],.45)};seg.win[r]=[0,.6];}break;}
      case 'dribble_duel':case 'wall_pass':case 'press':{const cc=e.type==='press'?e.opp:e.actor,d=e.type==='press'?e.actor:e.opp;gain(cc,0,.2);
        if(d&&end[d]&&end[cc]){seg.contact={id:d,at:.7,p:near(end[cc],end[d],.35),carrier:cc};seg.win[cc]=[0,.7];}
        if(e.type==='wall_pass'){const cell=end[cc],board=cell.v<.5?0:1;P(.3,.5,{pt:pt({u:clamp01(cell.u+C.attackDir(e.team)*.05),v:board}),board:true});P(.5,.75,e.outcome==='defender_wins'?{id:d}:{id:cc});}
        else if(e.outcome==='defender_wins'||e.outcome==='ball_won')P(.72,.95,{id:d});
        break;}
      case 'shot_attempt':gain(e.actor,0,.2);seg.win[e.actor]=[0,.6];break;
      case 'goal':{const g=C.goalFor(e.team),side=L.unit(seed,e.i,'aim')*2-1;P(.02*mf,mf*.98,{pt:pt({u:g.u+(g.u?.012:-.012),v:.5+side*.06}),net:true});goals.push({i:e.i,team:e.team,actor:e.actor,assist:e.assist||null,kind:e.kind||null,transition:!!e.transition,golden:!!e.golden,tau:round(seg.tau0+m),replayFrom:null});score=score.slice();score[e.team]++;break;}
      case 'shot_miss':{const g=C.goalFor(e.team),sgn=L.unit(seed,e.i,'miss')<.5?-1:1,dv=e.outcome==='off_post_or_wide'?.105:.13+L.unit(seed,e.i,'wide')*.06,v=clamp01(.5+sgn*dv);P(.05,.5,{pt:pt({u:g.u+(g.u?.01:-.01),v}),post:e.outcome==='off_post_or_wide'});P(.5,.9,{pt:pt({u:g.u?g.u-.06:.06,v:clamp01(v+sgn*.05)}),wall:true});break;}
      case 'block':{const b=e.actor;P(.05,.35,{pt:end[b],block:true});P(.35,.7,{pt:pt({u:clamp01(end[b].u-C.attackDir(1-e.team)*.06),v:end[b].v})});break;}
      case 'rebound':P(.1,.7,{id:e.actor});seg.win[e.actor]=[0,.7];break;
      case 'foul':break;
      default:break; // recovery_run, rotation: no ball change
    }
    const av=e.calc&&e.calc.availability;seg.oop=av?ids.filter(id=>av[id]>0):[];
    // Each render segment has a physical visual-speed budget. This budget
    // changes presentation time only; t0/t1, all recorded cells, score, event
    // order, and the simulation clock remain the exact logged values.
    const distance=(a,b)=>Math.hypot((a.u-b.u)*980,(a.v-b.v)*510);
    let slope=0;
    for(const id of ids){
      const a=start[id],b=end[id],co=seg.contact;
      if(co&&co.id===id){
        slope=Math.max(slope,3*distance(a,co.p)/co.at,3*distance(co.p,b)/(1-co.at));
      }else slope=Math.max(slope,1.5*distance(a,b)/.85);
    }
    const required=round(slope/TRAVEL_BUDGET_PX_S+.015);
    if(required>dur){
      if(moving)m+=required-dur;
      else h+=required-dur;
      dur=required;seg.tau1=round(seg.tau0+dur);seg.move=round(m);
      // Timestamp of a recorded scoring event moves WITH its presentation
      // segment, never with the score or the simulation clock.
      for(const g of goals)if(g.i===i)g.tau=round(seg.tau0+m);
    }
    seg.score=score;seg.carrier=c;segs.push(seg);tau+=dur;prevT=e.t;}
  for(const g of goals){let s=segs[g.i].possStart;for(let j=g.i;j>=0;j--){if(events[j].type==='restart'||events[j].type==='turnover'){s=j;break;}}g.replayFrom=segs[s].tau0;}
  const beats=[];for(const s of segs){const b=beats[s.beat];if(!b)beats[s.beat]={index:s.beat,from:s.i,to:s.i,tau0:s.tau0,tau1:s.tau1};else{b.to=s.i;b.tau1=s.tau1;}}
  const recorded=Array.isArray(rec.result.score)?rec.result.score.slice():null,warnings=[];
  if(recorded&&(recorded[0]!==score[0]||recorded[1]!==score[1]))warnings.push('Recorded score '+recorded.join('-')+' differs from goal events '+score.join('-')+'; showing the goal events.');
  return {version:VERSION,schema,...(rec.config?.keepers?{keepers:rec.config.keepers.slice()}:{}),mode:full?'full':'ball-only',timing:exactSteps?'exact':'approximate',notes,warnings,engineVersion:rec.engineVersion||null,round:rec.round||null,seed,teams,teamOf,ids,
    eventCount:events.length,duration:events[events.length-1].t,total:round(tau),segments:segs,beats,goals,finalScore:score,winner:recorded?(recorded[0]===recorded[1]?-1:recorded[0]>recorded[1]?0:1):(score[0]===score[1]?-1:score[0]>score[1]?0:1),golden:goals.length===1&&(!rec.config||rec.config.mode==='ko'),goldenOvertime:rec.result.decidedBy==='golden_goal'};
}
// Point at `dist` cells from a toward b (a itself if they coincide: then offset along u).
function near(a,b,dist){const dx=(b.u-a.u)*C.COLS,dy=(b.v-a.v)*C.ROWS,len=Math.hypot(dx,dy);const ux=len?dx/len:1,uy=len?dy/len:0,d=Math.min(dist,len||dist);return pt({u:a.u+ux*d/C.COLS,v:a.v+uy*d/C.ROWS});}

// ---------- Sampling (pure) ----------
function segmentIndex(tl,tau){const s=tl.segments;if(tau<=0)return 0;if(tau>=tl.total)return s.length-1;let lo=0,hi=s.length-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(s[mid].tau0<=tau)lo=mid;else hi=mid-1;}return lo;}
function phase(seg,tau){const d=seg.tau1-seg.tau0;return d>0?clamp01((tau-seg.tau0)/d):1;}
function playerIn(seg,id,k){const a=seg.start[id],b=seg.end[id],w=seg.win[id]||[0,1];const c=seg.contact;
  // A budgeted segment uses bounded smoothstep across its entire duration:
  // no 0.15s leaps and no new tactical or goal events.
  if(seg.motionBudgeted&&(!c||c.id!==id)){const x=clamp01(k/.85);return C.lerp(a,b,x*x*(3-2*x));}
  if(c&&c.id===id){if(k<=c.at)return C.lerp(a,c.p,ease(clamp01(k/c.at)));return C.lerp(c.p,b,ease(clamp01((k-c.at)/(1-c.at))));}
  return C.lerp(a,b,ease(clamp01((k-w[0])/(w[1]-w[0]||1))));}
function playersAt(tl,tau){const seg=tl.segments[segmentIndex(tl,tau)],k=phase(seg,tau),o={};for(const id of tl.ids)o[id]=playerIn(seg,id,k);return o;}
function resolve(seg,ref,k){return ref.id?playerIn(seg,ref.id,k):ref.pt;}
function ballAt(tl,tau){const seg=tl.segments[segmentIndex(tl,tau)],k=phase(seg,tau);let cur=seg.ball.start;
  for(const p of seg.ball.pieces){if(k<p.a)break;if(k<p.b){const q=ease((k-p.a)/(p.b-p.a)),a=resolve(seg,cur,k),b=resolve(seg,p.to,k),pos=C.lerp(a,b,q);return {u:pos.u,v:pos.v,owner:null,flight:true,lift:p.to.board||p.to.net?0:Math.sin(Math.PI*q)};}cur=p.to;}
  const pos=resolve(seg,cur,k);return {u:pos.u,v:pos.v,owner:cur.id||null,flight:false,lift:0,net:!!cur.net};}
function clockAt(tl,tau){const seg=tl.segments[segmentIndex(tl,tau)];if(seg.t1===seg.t0||seg.move<=0)return seg.t1;const k=clamp01((tau-seg.tau0)/seg.move);return seg.t0+(seg.t1-seg.t0)*k;}
function scoreAt(tl,tau){const s=[0,0];for(const g of tl.goals)if(tau>=g.tau)s[g.team]++;return s;}
// Commentary lines ({i,text,...}) produced elsewhere from the same events -> release time on the timeline.
function schedule(tl,lines){return lines.filter(l=>Number.isInteger(l.i)&&tl.segments[l.i]).map(l=>{const s=tl.segments[l.i],g=tl.goals.find(x=>x.i===l.i);return Object.assign({},l,{tau:round(g?g.tau:s.move>0?s.tau0+s.move*.5:s.tau0)});}).sort((a,b)=>a.tau-b.tau||a.i-b.i);}
function hash(tl){let h=2166136261;const s=JSON.stringify(tl);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,'0');}
window.CageViewerTimeline={VERSION,MAX_SCHEMA,HOLD,POST,DEFAULTS,buildTimeline,segmentIndex,phase,playersAt,ballAt,clockAt,scoreAt,schedule,hash,near};
})();
