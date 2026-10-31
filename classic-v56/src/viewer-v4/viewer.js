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
 <input data-k="seek" type="range" min="0" max="1000" value="0" aria-label="Seek">
 <span class="cv-ptime" data-k="ptime" title="Playback time (real) vs timeline">0:00 / 0:00</span>
</div>
<div class="cv-sr" data-k="ticker" aria-live="polite"></div>
</div>`;const q=k=>el.querySelector('[data-k="'+k+'"]');return q;}

function mount(el,record,opts){
  if(!G||!Audio)throw Error('Golden Goal presentation dependencies missing');
  const o=Object.assign({speed:'dynamic',mode:'live',teamNames:['Commander','Opponent'],names:{},lines:null,showdown:null,autoplay:false},opts||{});
  freeze(record); // invariant I5: the viewer cannot write to the record
  const tl=T.buildTimeline(record,o.timeline),events=(record.result||record).events;
  const name=id=>id?(o.names[id]||titleCase(id)):'';
  const labels={},numbers={};tl.ids.forEach(id=>{labels[id]=L.label(name(id));numbers[id]=tl.teams[tl.teamOf[id]].indexOf(id)+1;});
  const lines=T.schedule(tl,o.lines||basicLines(events,name));const cues=window.CageViewerV4FX.buildCues(tl,events);
  const q=shell(el,o),root=el.querySelector('.cv-root'),canvas=el.querySelector('canvas'),renderer=Rn.createRenderer(canvas),pb=K.createPlayback(tl,{speed:o.speed,mode:o.mode});
  const listeners={},emit=(n,d)=>(listeners[n]||[]).slice().forEach(f=>f(d));
  const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.querySelector('.cv-round').textContent=tl.round?'ROUND '+tl.round:'MATCH';
  el.querySelector('.cv-a').textContent=o.teamNames[0].toUpperCase();el.querySelector('.cv-b').textContent=o.teamNames[1].toUpperCase();
  q('showdown').textContent=o.showdown?o.showdown.A+'–'+o.showdown.B:'—';q('sdchip').textContent=o.showdown?(o.showdown.label||'BEFORE ROUND'):'NOT IN FILE';
  // Starting tactical choices come DIRECTLY from the immutable match record.
  // This is context, not live tactical intelligence invented by the viewer.
  const recordedTactics=record.config&&Array.isArray(record.config.tactics)?record.config.tactics:null;
  q('tactics').innerHTML=recordedTactics&&recordedTactics.length===2?
    '<small>RECORDED TACTICS · '+esc(record.engineVersion||'UNKNOWN ENGINE')+'</small><div>'+
    '<b class="t0">'+esc(String(recordedTactics[0]).toUpperCase())+'</b>'+
    '<span>VS</span><b class="t1">'+esc(String(recordedTactics[1]).toUpperCase())+'</b></div>'+
    '<div class="cv-surge" data-k="surge" hidden></div>':'';

  const inferredMotionNote='V5.2 body facing, acceleration trails, turning and ball-flight styling are deterministic inferred visuals from recorded positions; they are not measured individual footwork.';
  q('notes').innerHTML=tl.notes.concat(tl.warnings,[inferredMotionNote]).map(n=>'<li>'+esc(n)+'</li>').join('');
  q('speed').value=pb.speed;canvas.setAttribute('aria-label','Top-down cage pitch: '+tl.teams.map((t,i)=>o.teamNames[i]+' '+t.map(name).join(', ')).join(' versus '));
  let raf=0,last=null,shown=-1,flashUntil=0,trail=[],commHidden=false,lastSeg=-1,goalShown=false,now=0,goldenCue=null,goldenAt=0,goldenTimer=null;
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
    const overlay=q('golden');
    overlay.innerHTML=G.markup(cue,T.scoreAt(tl,goal.tau+0.0001));
    overlay.hidden=false;overlay.classList.toggle('cv-golden-replay',!!replay);
    if(goldenTimer!==null)clearTimeout(goldenTimer);
    goldenTimer=setTimeout(()=>{
      // UI-only handoff, independent of throttled animation frames.
      goldenTimer=null;goldenCue=null;overlay.hidden=true;
      root.classList.remove('cv-goal-in-progress');
      q('goalcard').hidden=!(goalShown&&tl.goals.some(g=>pb.tau>=g.tau));
    },G.DURATION*1000);
    goalShown=true;flashUntil=now+.6;
    const card=q('goalcard');
    card.hidden=false;
    card.innerHTML='<b>'+G.escapeText(cue.type)+'</b><span>'+G.escapeText(cue.scorer)+'</span>'+
      (cue.assist?'<small>assist '+G.escapeText(cue.assist)+'</small>':'')+
      '<em>'+G.escapeText(cue.teamName.toUpperCase())+' WIN'+(tl.round?' ROUND '+tl.round:'')+'</em>'+
      (replay?'<i>REPLAY</i>':'');
    q('replay').disabled=false;
    sound.play(replay); // no sound unless user enabled it from a direct click
    emit('goal',{goal,replay});
  }));
  unsub.push(pb.on('segment',d=>emit('beat',d)));
  unsub.push(pb.on('end',d=>emit('end',d)));
  unsub.push(pb.on('replayStart',()=>{if(goldenTimer!==null)clearTimeout(goldenTimer);goldenTimer=null;q('goalcard').hidden=true;q('golden').hidden=true;goldenCue=null;trail=[];}));
  unsub.push(pb.on('replayEnd',()=>emit('replayEnd',{})));
  function dismissCinematic(){
    if(goldenTimer!==null)clearTimeout(goldenTimer);
    goldenTimer=null;goldenCue=null;q('golden').hidden=true;
    root.classList.remove('cv-goal-in-progress');
  }
  function syncComm(tau){const target=lines.filter(l=>l.tau<=tau).length;if(target===shown)return;const ol=q('comm');if(target<shown){ol.innerHTML='';shown=0;}
    const frag=document.createDocumentFragment();for(let k=Math.max(0,shown);k<target;k++){const l=lines[k],li=document.createElement('li');li.className='imp'+(l.imp||0);li.innerHTML='<time>'+mmss(l.t)+'</time> '+esc(l.text);frag.appendChild(li);}ol.appendChild(frag);shown=target;ol.scrollTop=ol.scrollHeight;
    if(target){q('ticker').textContent=lines[target-1].text;}}
  function frame(){const tau=pb.tau,si=T.segmentIndex(tl,tau),seg=tl.segments[si],motion=M.sample(tl,events,tau,T),kinetics=Kin.sample(tl,T,tau,motion),players=motion.positions,ball=motion.ball,score=T.scoreAt(tl,tau);
    if(si!==lastSeg&&tau<(tl.segments[lastSeg]||{tau0:-1}).tau0)trail=[];lastSeg=si;
    if(!reduce){trail.push({u:ball.u,v:ball.v});if(trail.length>14)trail.shift();}
    const goldenPhase=G.phase(goldenCue,tau,goldenAt,now,reduce);
    const golden=q('golden');golden.hidden=!goldenPhase.visible;
    root.classList.toggle('cv-goal-in-progress',goldenPhase.visible);
    // Cinematic first, persistent goal card second. Also protect seeking
    // backwards: the goal card must never be visible before the real event.
    const confirmedGoal=goalShown&&tl.goals.some(g=>tau>=g.tau);
    q('goalcard').hidden=goldenPhase.visible||!confirmedGoal;
    const contact=seg.contact?[seg.contact.id,seg.contact.carrier||seg.carrier].filter(Boolean):null;
    renderer.draw({tau,cues,motion,kinetics,players,ball,teamOf:tl.teamOf,labels,numbers,carrier:ball.owner,contact,oop:seg.oop,flash:Math.max(0,(flashUntil-now)/.6),trail,reducedMotion:reduce,focus:seg.carrier});
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
    q('onball').innerHTML=who?'<small>ON THE BALL</small> <b class="t'+tl.teamOf[who]+'">'+esc(name(who))+'</b>':'<small>LOOSE BALL</small>';
    const b=q('banner');const ban=ev.type==='restart'&&seg.move===0||ev.type==='restart'&&T.phase(seg,tau)<.6?'KICK-OFF':ev.transition&&ev.type==='turnover'?'COUNTER':ev.type==='free_kick'?'FREE KICK':ev.type==='foul'?'FOUL':'';b.textContent=ban;b.classList.toggle('on',!!ban);
    const action=q('action');action.textContent=motion.showEvent&&seg.type!=='goal'?motion.label+(motion.roles.actor?' / '+name(motion.roles.actor).toUpperCase():''):'';action.classList.toggle('on',!!action.textContent);
    if(!goalShown&&tau<(tl.goals[0]||{tau:Infinity}).tau)q('goalcard').hidden=true;
    syncComm(tau);}
  function loop(ts){raf=requestAnimationFrame(loop);const dt=last===null?0:Math.min(.1,(ts-last)/1000);last=ts;now+=dt;pb.advance(dt);frame();}
  const on=(k,ev,fn)=>{const n=q(k);n.addEventListener(ev,fn);unsub.push(()=>n.removeEventListener(ev,fn));};
  on('play','click',()=>{pb.toggle();});on('tap','click',()=>{pb.toggle();});
  on('restart','click',()=>{pb.seek(0);dismissCinematic();goalShown=false;q('goalcard').hidden=true;trail=[];});
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
  on('seek','input',e=>{pb.seek(tl.total*e.target.value/1000);dismissCinematic();trail=[];goalShown=pb.tau>=(tl.goals[0]||{tau:Infinity}).tau&&goalShown;});
  on('commtoggle','click',e=>{commHidden=!commHidden;root.classList.toggle('cv-nocomm',commHidden);e.target.textContent=commHidden?'Show':'Hide';e.target.setAttribute('aria-pressed',String(!commHidden));});
  const key=e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();pb.toggle();}else if(e.code==='ArrowRight'){pb.seek(pb.tau+3);dismissCinematic();}else if(e.code==='ArrowLeft'){pb.seek(pb.tau-3);dismissCinematic();}};
  root.addEventListener('keydown',key);unsub.push(()=>root.removeEventListener('keydown',key));
  const vis=()=>{if(document.hidden)pb.pause();};document.addEventListener('visibilitychange',vis);unsub.push(()=>document.removeEventListener('visibilitychange',vis));
  const rs=()=>{renderer.resize();frame();};const ro=typeof ResizeObserver==='function'?new ResizeObserver(rs):null;if(ro){ro.observe(canvas);unsub.push(()=>ro.disconnect());}else{window.addEventListener('resize',rs);unsub.push(()=>window.removeEventListener('resize',rs));}
  renderer.resize();frame();raf=requestAnimationFrame(loop);if(o.autoplay)pb.play();
  const ctl={timeline:tl,cues,playback:pb,
    play(){pb.play();return ctl;},pause(){pb.pause();return ctl;},resume(){pb.resume();return ctl;},toggle(){pb.toggle();return ctl;},
    seek(tau){pb.seek(tau);if(goldenCue&&pb.tau<goldenCue.tau)dismissCinematic();return ctl;},render(){frame();return ctl;},setSpeed(s){pb.setSpeed(s);q('speed').value=s;return ctl;},replayGoal(){return pb.replayGoal();},
    on(n,fn){(listeners[n]=listeners[n]||[]).push(fn);return ()=>{listeners[n]=listeners[n].filter(f=>f!==fn);};},
    destroy(){cancelAnimationFrame(raf);if(goldenTimer!==null)clearTimeout(goldenTimer);goldenTimer=null;sound.dispose();unsub.forEach(f=>f());el.innerHTML='';}};
  return ctl;}
window.CageViewer={mount,basicLines};
})();
