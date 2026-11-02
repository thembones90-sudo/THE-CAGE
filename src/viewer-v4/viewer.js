// THE CAGE 2D viewer: DOM shell + animation loop.
// CageViewer.mount(el, record, opts) -> controller {play, pause, resume, toggle, seek, setSpeed, replayGoal, destroy, on}
// The viewer is read-only over the record: it freezes it, never simulates, never writes a
// score anywhere, and never invents gameplay. Commentary lines are supplied by the host
// (CageCommentary over the same events) and only scheduled here.
(()=>{'use strict';
const T=window.CageViewerTimeline,K=window.CageViewerClock,Rn=window.CageViewerRenderer,L=window.CageViewerLayout,M=window.CageViewerMotion,Kin=window.CageKinetics,G=window.CageGoalExperience,Audio=window.CageGoalAudio;
const mmss=t=>{t=Math.max(0,Math.floor(t));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');};
const real=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
const titleCase=id=>String(id).split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// Minimal event-log lines, used only when the commentary module is unavailable.
// Reads recorded fields; adds no facts.
function basicLines(events,name){const out=[];for(const e of events){const A=name(e.actor),O=e.opp?name(e.opp):'',Tg=e.target?name(e.target):'';let s=null;
  switch(e.type){case 'restart':s='Kick-off: '+A+'.';break;case 'pass':s=e.outcome==='complete'?A+' passes to '+Tg+'.':A+' looks for '+Tg+'; '+O+' cuts it out.';break;case 'through_ball':s=e.outcome==='complete'?A+' plays '+Tg+' through.':A+' tries to release '+Tg+'; '+O+' intercepts.';break;
    case 'dribble_duel':s=e.outcome==='attacker_wins'?A+' beats '+O+'.':e.outcome==='fouled'?O+' fouls '+A+'.':O+' wins it from '+A+'.';break;case 'wall_pass':s=e.outcome==='attacker_wins'?A+' plays it off the boards past '+O+'.':O+' reads '+A+"'s wall pass.";break;
    case 'press':s=e.outcome==='ball_won'?A+' presses and wins it from '+O+'.':O+' holds off the press of '+A+'.';break;case 'shot_attempt':s=A+' shoots.';break;case 'block':s='Blocked by '+A+'.';break;case 'shot_miss':s=e.outcome==='off_post_or_wide'?'Just wide!':'Wide.';break;
    case 'rebound':s=A+' wins the loose ball.';break;case 'free_kick':s='Free kick: '+A+'.';break;case 'goal':s='GOAL: '+A+(e.assist?' (assist '+name(e.assist)+')':'')+'.';break;case 'race':s=e.outcome==='attacker_clear'?A+' wins the race with '+O+'.':O+' recovers on '+A+'.';break;}
  if(s)out.push({i:e.i,t:e.t,imp:e.type==='goal'?3:e.type==='shot_attempt'?2:0,text:s});}return out;}

function shell(el,o){el.innerHTML=`<div class="cv-root" tabindex="-1">
<header class="cv-scoreboard" aria-label="Scoreboard">
 <div class="cv-round"></div>
 <div class="cv-match" aria-label="Match score"><span class="cv-team cv-a"></span><span class="cv-score" data-k="score">0–0</span><span class="cv-team cv-b"></span><small>MATCH</small></div>
 <div class="cv-clock" aria-label="Simulation clock"><span data-k="clock">00:00</span><small>SIM CLOCK</small></div>
 <div class="cv-showdown" aria-label="Showdown score"><small>SHOWDOWN</small><span data-k="showdown">–</span><em class="cv-chip" data-k="sdchip"></em></div>
 <div class="cv-state" data-k="state">READY</div>
</header>
<div class="cv-key" aria-label="Pitch marker legend"><span><i class="cv-key-a" aria-hidden="true"></i><b data-k="key-a"></b></span><span><i class="cv-key-b" aria-hidden="true"></i><b data-k="key-b"></b></span><span><i class="cv-key-carrier" aria-hidden="true"></i>On the ball</span><span><i class="cv-key-keeper" aria-hidden="true">GK</i>Goalkeeper</span><span><i class="cv-key-ball" aria-hidden="true"></i>Ball</span></div>
<div class="cv-main">
 <div class="cv-stage"><canvas class="cv-canvas" role="img" aria-label="Top-down cage pitch"></canvas>
  <div class="cv-banner" data-k="banner" aria-hidden="true"></div>
  <div class="cv-action" data-k="action" aria-hidden="true"></div>
  <div class="cv-goalcard" data-k="goalcard" hidden></div>
  <div class="cv-golden" data-k="golden" role="status" aria-live="polite" aria-atomic="true" hidden></div>
  <button class="cv-tap" data-k="tap" aria-label="Play or pause"></button>
 </div>
 <aside class="cv-side">
  <div class="cv-tactics" data-k="tactics" role="note" aria-label="Recorded starting tactics"></div>
  <div class="cv-onball" data-k="onball">&nbsp;</div>
  <h2>Commentary <button class="cv-mini" data-k="commtoggle" aria-pressed="true">Hide</button></h2>
  <ol class="cv-comm" data-k="comm" aria-live="polite"></ol>
  <details class="cv-notes"><summary>What is recorded vs inferred</summary><ul data-k="notes"></ul></details>
 </aside>
</div>
<div class="cv-controls" role="toolbar" aria-label="Playback controls">
 <button data-k="restart" aria-label="Restart">⏮</button>
 <button data-k="play" class="cv-primary" aria-label="Play">▶</button>
 <label class="cv-speed">Speed <select data-k="speed">${Object.entries(K.SPEEDS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label>
 <button data-k="sound" aria-pressed="false" aria-label="Enable goal sound" title="Original synthetic goal sound; optional and off by default">Sound: Off</button>
 <button data-k="replay" disabled>⟲ Goal replay</button>
 <div class="cv-seekbar"><input data-k="seek" type="range" min="0" max="1000" value="0" aria-label="Seek"><div class="cv-marks" data-k="marks" aria-label="Key moments"></div></div>
 <span class="cv-ptime" data-k="ptime" title="Playback time (real) vs timeline">0:00 / 0:00</span>
</div>
<div class="cv-sr" data-k="ticker" aria-live="polite"></div>
<section class="cv-final" data-k="final" role="status" aria-live="polite" hidden></section>
</div>`;const q=k=>el.querySelector('[data-k="'+k+'"]');return q;}

function mount(el,record,opts){
  if(!G||!Audio)throw Error('Golden Goal presentation dependencies missing');
  const o=Object.assign({speed:'dynamic',mode:'live',teamNames:['Commander','Opponent'],names:{},lines:null,showdown:null,autoplay:false},opts||{});
  freeze(record); // invariant I5: the viewer cannot write to the record
  const tl=T.buildTimeline(record,o.timeline),events=(record.result||record).events;
  // M2: draw the engine's recorded movement when the record has it; older records keep the inferred motion.
  const RM=window.CageRecordedMotion?window.CageRecordedMotion.create(tl,record):null,TP=RM?RM.timelineApi(T):T;
  const name=id=>id?(o.names[id]||window.CageGoalkeepers?.BY_ID[id]?.name||titleCase(id)):'';
  const labels={},numbers={};tl.ids.forEach(id=>{labels[id]=L.label(name(id));numbers[id]=tl.teams[tl.teamOf[id]].indexOf(id)+1;});
  const lines=T.schedule(tl,o.lines||basicLines(events,name));const cues=window.CageViewerV4FX.buildCues(tl,events);
  const moments=window.CageKeyMoments?window.CageKeyMoments.build(tl):[];
  const q=shell(el,o),root=el.querySelector('.cv-root'),canvas=el.querySelector('canvas'),renderer=Rn.createRenderer(canvas),pb=K.createPlayback(tl,{speed:o.speed,mode:o.mode});
  const listeners={},emit=(n,d)=>(listeners[n]||[]).slice().forEach(f=>f(d));
  const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.querySelector('.cv-round').textContent=o.draftMatch?'DRAFT MATCH · ROUND '+(tl.round||1):tl.round?'ROUND '+tl.round:'MATCH';
  if(o.draftMatch){const badge=el.querySelector('.cv-showdown');badge.querySelector('small').textContent='SHOWDOWN';q('showdown').textContent=o.showdown?o.showdown.A+' : '+o.showdown.B:'0 : 0';q('sdchip').textContent='FIRST TO 3 WINS';}
  el.querySelector('.cv-a').textContent=o.teamNames[0].toUpperCase();el.querySelector('.cv-b').textContent=o.teamNames[1].toUpperCase();
  q('key-a').textContent=o.teamNames[0];q('key-b').textContent=o.teamNames[1];
  if(!o.draftMatch){q('showdown').textContent=o.showdown?o.showdown.A+'–'+o.showdown.B:'—';q('sdchip').textContent=o.showdown?(o.showdown.label||'BEFORE ROUND'):'NOT IN FILE';}
  // Starting tactical choices come DIRECTLY from the immutable match record.
  // This is context, not live tactical intelligence invented by the viewer.
  const recordedTactics=record.config&&Array.isArray(record.config.tactics)?record.config.tactics:null;
  q('tactics').innerHTML=recordedTactics&&recordedTactics.length===2?
    '<small>RECORDED TACTICS · '+esc(record.engineVersion||'UNKNOWN ENGINE')+'</small><div>'+
    '<b class="t0">'+esc(String(recordedTactics[0]).toUpperCase())+'</b>'+
    '<span>VS</span><b class="t1">'+esc(String(recordedTactics[1]).toUpperCase())+'</b></div>'+
    '<div class="cv-surge" data-k="surge" hidden></div>':'';

  const inferredMotionNote='Body facing, trails, connector lines and the small owned-ball foot offset are inferred display styling. They never change recorded positions, events or outcomes.';
  q('notes').innerHTML=tl.notes.concat(tl.warnings,[RM?'Player, goalkeeper and ball positions are the recorded engine movement ('+RM.version+', 4 Hz), drawn as recorded.':inferredMotionNote]).map(n=>'<li>'+esc(n)+'</li>').join('');
  // Time bar: one marker per key moment; clicking jumps to the start of its build-up.
  const marked=moments;
  q('marks').innerHTML=marked.map((m,k)=>{const ev=events[m.i]||{},who=ev.actor||ev.gk||m.actor,score=m.kind==='goal'?' '+T.scoreAt(tl,m.tau+1e-4).join('–'):'';
    const tip=mmss(m.t)+' · '+m.label+(who&&m.kind!=='golden'?' · '+name(m.kind==='save'?ev.gk||who:who):'')+score;
    return '<button type="button" class="cv-mark cv-mark-'+m.kind+(m.team===1?' cv-mark-b':m.team===0?' cv-mark-a':'')+'" data-m="'+k+'" style="left:'+(100*m.tau/tl.total).toFixed(3)+'%" title="'+esc(tip)+'" aria-label="'+esc(tip)+'"></button>';}).join('');
  q('speed').value=pb.speed;canvas.setAttribute('aria-label','Top-down cage pitch: '+tl.teams.map((t,i)=>o.teamNames[i]+' '+t.map(name).join(', ')+(tl.keepers?.[i]?', goalkeeper '+name(tl.keepers[i]):'')).join(' versus '));
  let raf=0,last=null,shown=-1,flashUntil=0,trail=[],commHidden=false,lastSeg=-1,now=0,goldenCue=null,goldenAt=0,goldenTimer=null,goldenEndTau=Infinity,viewEnded=false;
  const sound=Audio.create();
  if(sound.restore()){
    const toggle=q('sound');toggle.textContent='Sound: On';
    toggle.setAttribute('aria-pressed','true');toggle.setAttribute('aria-label','Disable goal sound');
    toggle.classList.add('cv-audio-on');
  }
  const unsub=[];
  unsub.push(pb.on('goal',({goal,replay})=>{
    // The cinematic is decoration around a REAL, already recorded goal.
    // It never calls the game engine or modifies the result, score or clock.
    const cue=G.goalData(tl,events,goal,o.teamNames,name,replay);
    goldenCue=cue;goldenAt=now;
    goldenEndTau=tl.segments.find(s=>s.i>goal.i&&events[s.i].type==='restart')?.tau0??Infinity;
    root.dataset.goalSide=cue.team===0?'a':'b';
    const overlay=q('golden');
    overlay.innerHTML=G.markup(cue,T.scoreAt(tl,goal.tau+0.0001));
    overlay.hidden=false;overlay.classList.toggle('cv-golden-replay',!!replay);
    if(goldenTimer!==null)clearTimeout(goldenTimer);
    goldenTimer=setTimeout(()=>{
      // UI-only handoff, independent of throttled animation frames.
      goldenTimer=null;goldenCue=null;overlay.hidden=true;
      root.classList.remove('cv-goal-in-progress');
      delete root.dataset.goalSide;
      q('goalcard').hidden=true;
    },G.DURATION*1000);
    flashUntil=now+.6;
    const card=q('goalcard');
    card.hidden=true;
    card.innerHTML='<b>'+G.escapeText(cue.type)+'</b><span>'+G.escapeText(cue.scorer)+'</span>'+
      (cue.assist?'<small>assist '+G.escapeText(cue.assist)+'</small>':'')+
      '<em>'+G.escapeText(cue.teamName.toUpperCase())+((cue.isWinner?' WINS':' SCORES')+(cue.isWinner&&tl.round?' ROUND '+tl.round:''))+'</em>'+
      (replay?'<i>REPLAY</i>':'');
    q('replay').disabled=false;
    sound.play(replay); // no sound unless user enabled it from a direct click
    emit('goal',{goal,replay});
  }));
  unsub.push(pb.on('segment',d=>emit('beat',d)));
  unsub.push(pb.on('end',d=>{dismissCinematic();emit('end',d);}));
  unsub.push(pb.on('replayStart',()=>{dismissCinematic();viewEnded=false;trail=[];}));
  unsub.push(pb.on('replayEnd',()=>emit('replayEnd',{})));
  function dismissCinematic(){
    if(goldenTimer!==null)clearTimeout(goldenTimer);
    goldenTimer=null;goldenCue=null;goldenEndTau=Infinity;q('golden').hidden=true;q('goalcard').hidden=true;
    root.classList.remove('cv-goal-in-progress');
    delete root.dataset.goalSide;
  }
  function syncComm(tau){const target=lines.filter(l=>l.tau<=tau).length;if(target===shown)return;const ol=q('comm');if(target<shown){ol.innerHTML='';shown=0;}
    const frag=document.createDocumentFragment();for(let k=Math.max(0,shown);k<target;k++){const l=lines[k],li=document.createElement('li');li.className='imp'+(l.imp||0);li.innerHTML='<time>'+mmss(l.t)+'</time> '+esc(l.text);frag.appendChild(li);}ol.appendChild(frag);shown=target;ol.scrollTop=ol.scrollHeight;
    if(target){q('ticker').textContent=lines[target-1].text;}}
  function frame(){const tau=pb.tau,si=T.segmentIndex(tl,tau),seg=tl.segments[si],motion=M.sample(tl,events,tau,TP),kinetics=Kin.sample(tl,TP,tau,motion),players=motion.positions,ball=motion.ball,score=T.scoreAt(tl,tau);
    if(si!==lastSeg&&tau<(tl.segments[lastSeg]||{tau0:-1}).tau0)trail=[];lastSeg=si;
    if(!reduce){trail.push({u:ball.u,v:ball.v});if(trail.length>14)trail.shift();}
    const ended=pb.state==='ended'&&!pb.inReplay&&tau>=tl.total;
    if(goldenCue&&(tau<goldenCue.tau||tau>=goldenEndTau||ended))dismissCinematic();
    const goldenPhase=G.phase(goldenCue,tau,goldenAt,now,reduce);
    const golden=q('golden');golden.hidden=!goldenPhase.visible;
    root.classList.toggle('cv-goal-in-progress',goldenPhase.visible);
    // A goal is a temporary cue; the host owns the result panel below the pitch.
    q('goalcard').hidden=true;
    q('final').hidden=!ended||o.draftMatch;
    if(ended&&!o.draftMatch)q('final').textContent='FULL TIME · '+(tl.winner>=0?o.teamNames[tl.winner].toUpperCase()+' WINS':'DRAW')+' · '+tl.finalScore.join(' – ');
    const contact=seg.contact?[seg.contact.id,seg.contact.carrier||seg.carrier].filter(Boolean):null;
    renderer.draw({tau,cues,motion,kinetics,players,ball,teamOf:tl.teamOf,keepers:tl.keepers,keeperLabels:Object.fromEntries((tl.keepers||[]).map(id=>[id,'GK · '+L.label(name(id))])),keeperPos:RM&&RM.keepersAt(tau).every(Boolean)?RM.keepersAt(tau):Array.isArray(tl.keepers)&&tl.keepers.length===2?[0,1].map(side=>window.CageViewerRenderer.keeperStanceAt(tl,events,T,tl.keepers,tau,side,reduce)):null,keeperEvent:(['gk_save','gk_parry','gk_sweep','gk_distribution','gk_claim'].includes(events[seg.i]?.type)||(events[seg.i]?.gk&&events[seg.i]?.calc?.keeperMode))?events[seg.i]:null,keeperPhase:T.phase(seg,tau),labels,numbers,carrier:ball.owner,contact,oop:seg.oop,flash:Math.max(0,(flashUntil-now)/.6),trail,reducedMotion:reduce,focus:seg.carrier});
    q('score').textContent=score[0]+'–'+score[1];q('clock').textContent=mmss(T.clockAt(tl,tau));
    const st=pb.inReplay?'REPLAY':pb.state==='ended'?'FULL TIME':pb.state==='playing'?(o.mode==='replay'?'▶ REPLAY':'● LIVE'):pb.state==='paused'?'❚❚ PAUSED':'READY';q('state').textContent=st;root.dataset.state=pb.inReplay||o.mode==='replay'?'replay':pb.state;
    q('play').textContent=pb.state==='playing'?'❚❚':'▶';q('play').setAttribute('aria-label',pb.state==='playing'?'Pause':'Play');
    q('seek').value=String(Math.round(1000*tau/tl.total));q('ptime').textContent=real(tau)+' / '+real(tl.total)+(seg.danger||pb.speed==='full'?'':' ≫');
    const ev=events[seg.i],who=ball.owner||seg.carrier;
    const surge=q('surge');
    if(surge){
      const status=(record.result.shapes||[]).map((shape,side)=>{
        const ids=record.config?.teams?.[side]||[];
        const committed=ids.filter(id=>ev.calc?.commitment?.[id]===true).length;
        return shape.policy?.latePressEligible&&ev.t>=1500&&committed>=2?o.teamNames[side]:null;
      }).filter(Boolean);
      surge.hidden=status.length===0;
      surge.textContent=status.length?'LATE HIGH-PRESS SURGE · '+status.join(' / '):'';
    }
    q('onball').innerHTML=ended?'<small>FULL TIME</small> <b>Match complete</b>':who?'<small>ON THE BALL</small> <b class="t'+tl.teamOf[who]+'">'+esc(name(who))+'</b>':'<small>LOOSE BALL</small>';
    const b=q('banner');const ban=ev.type==='golden_goal_start'?'GOLDEN GOAL OVERTIME · NEXT GOAL WINS':ev.type==='restart'&&seg.move===0||ev.type==='restart'&&T.phase(seg,tau)<.6?'KICK-OFF':ev.transition&&ev.type==='turnover'?'COUNTER':ev.type==='free_kick'?'FREE KICK':ev.type==='foul'?'FOUL':'';b.textContent=ban;b.classList.toggle('on',!!ban);
    const action=q('action');action.textContent=motion.showEvent&&seg.type!=='goal'?motion.label+(motion.roles.actor?' / '+name(motion.roles.actor).toUpperCase():''):'';action.classList.toggle('on',!!action.textContent);const actionKind=action.textContent?M.actionKind(seg.type,!!seg.contact):'';action.dataset.kind=actionKind;q('action').closest('.cv-stage').dataset.action=actionKind;
    if(ended){b.classList.remove('on');action.classList.remove('on');}
    syncComm(tau);
    if(ended&&!viewEnded){viewEnded=true;emit('viewEnd',{});}else if(!ended)viewEnded=false;}
  function loop(ts){raf=requestAnimationFrame(loop);const dt=last===null?0:Math.min(.1,(ts-last)/1000);last=ts;now+=dt;pb.advance(dt);frame();}
  const on=(k,ev,fn)=>{const n=q(k);n.addEventListener(ev,fn);unsub.push(()=>n.removeEventListener(ev,fn));};
  on('play','click',()=>{pb.toggle();});on('tap','click',()=>{pb.toggle();});
  on('restart','click',()=>{pb.seek(0);dismissCinematic();trail=[];});
  on('speed','change',e=>{pb.setSpeed(e.target.value);});
  on('sound','click',()=>{
    const active=sound.setEnabled(!sound.enabled);
    const button=q('sound');
    button.textContent=active?'Sound: On':'Sound: Off';
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',active?'Disable goal sound':'Enable goal sound');
    button.classList.toggle('cv-audio-on',active);
  });
  on('replay','click',()=>{pb.replayGoal();});
  on('marks','click',e=>{const b=e.target.closest('.cv-mark');if(!b)return;const m=marked[+b.dataset.m];if(!m)return;pb.seek(m.from);dismissCinematic();trail=[];if(pb.state!=='playing')pb.play();});
  on('seek','input',e=>{pb.seek(tl.total*e.target.value/1000);dismissCinematic();trail=[];});
  on('commtoggle','click',e=>{commHidden=!commHidden;root.classList.toggle('cv-nocomm',commHidden);e.target.textContent=commHidden?'Show':'Hide';e.target.setAttribute('aria-pressed',String(!commHidden));});
  const key=e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();pb.toggle();}else if(e.code==='ArrowRight'){pb.seek(pb.tau+3);dismissCinematic();}else if(e.code==='ArrowLeft'){pb.seek(pb.tau-3);dismissCinematic();}};
  root.addEventListener('keydown',key);unsub.push(()=>root.removeEventListener('keydown',key));
  const vis=()=>{if(document.hidden)pb.pause();};document.addEventListener('visibilitychange',vis);unsub.push(()=>document.removeEventListener('visibilitychange',vis));
  const rs=()=>{renderer.resize();frame();};const ro=typeof ResizeObserver==='function'?new ResizeObserver(rs):null;if(ro){ro.observe(canvas);unsub.push(()=>ro.disconnect());}else{window.addEventListener('resize',rs);unsub.push(()=>window.removeEventListener('resize',rs));}
  renderer.resize();frame();raf=requestAnimationFrame(loop);if(o.autoplay)pb.play();
  const ctl={timeline:tl,cues,playback:pb,moments,
    setShowdown(score){if(score&&[score.A,score.B].every(n=>Number.isInteger(n)&&n>=0&&n<=3))q('showdown').textContent=score.A+' : '+score.B;return ctl;},
    play(){pb.play();return ctl;},pause(){pb.pause();return ctl;},resume(){pb.resume();return ctl;},toggle(){pb.toggle();return ctl;},
    seek(tau){pb.seek(tau);if(goldenCue&&pb.tau<goldenCue.tau)dismissCinematic();return ctl;},render(){frame();return ctl;},setSpeed(s){pb.setSpeed(s);q('speed').value=s;return ctl;},replayGoal(){return pb.replayGoal();},
    on(n,fn){(listeners[n]=listeners[n]||[]).push(fn);return ()=>{listeners[n]=listeners[n].filter(f=>f!==fn);};},
    destroy(){cancelAnimationFrame(raf);if(goldenTimer!==null)clearTimeout(goldenTimer);goldenTimer=null;sound.dispose();unsub.forEach(f=>f());el.innerHTML='';}};
  return ctl;}
window.CageViewer={mount,basicLines};
})();
