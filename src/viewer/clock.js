// THE CAGE 2D viewer: playback clock. Pure state machine, no DOM, no wall clock.
// The host feeds real elapsed seconds into advance(); speed, pause, seek and replay
// only move the playhead tau. They never touch the Timeline or the record (invariant I2).
// 'end' fires at most once per live playback (I4). Goal replays and replay mounts never fire it (I3).
(()=>{'use strict';
const T=window.CageViewerTimeline;
// boost: extra rate for safe build-up (possessions with no danger). Full has no condensation.
const SPEEDS={
  full:{label:'Full',boost:1},
  // Full match at a fixed multiple of real match time (1x: one match second per second), no condensation.
  x075:{label:'Full 0.75×',boost:1,real:.75},
  x1:{label:'Full 1×',boost:1,real:1},
  x15:{label:'Full 1.5×',boost:1,real:1.5},
  x2:{label:'Full 2×',boost:1,real:2},
  dramatic:{label:'Dramatic',boost:1.6,factor:1/1.4},
  dynamic:{label:'Dynamic',boost:3,factor:1},
  fast:{label:'Fast',boost:3,factor:1/.45},
  instant:{label:'Instant'}};
const REPLAY_RATE=.5; // goal replay at half of Full speed
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

function dynamicBase(tl,boost){const target=clamp(tl.duration*.3,30,45);let w=0;for(const s of tl.segments)w+=(s.tau1-s.tau0)/(s.danger?1:boost);return Math.max(1,w/target);}

function createPlayback(tl,opts){
  const o=Object.assign({speed:'dynamic',mode:'live'},opts||{}),listeners={};
  const st={tau:0,state:'ready',speed:SPEEDS[o.speed]?o.speed:'dynamic',mode:o.mode==='replay'?'replay':'live',endFired:false,replay:null,seg:0,goalsSeen:new Set()};
  const emit=(name,data)=>{(listeners[name]||[]).slice().forEach(fn=>fn(data));};
  function base(){const sp=SPEEDS[st.speed];if(sp.real)return Math.max(1e-3,tl.total/Math.max(1,tl.duration))*sp.real;if(!sp.factor)return 1;return dynamicBase(tl,SPEEDS.dynamic.boost)*sp.factor;}
  let baseRate=base();
  function rateAt(tau){if(st.replay)return REPLAY_RATE;const sp=SPEEDS[st.speed],seg=tl.segments[T.segmentIndex(tl,tau)];return Math.max(.05,baseRate*(seg.danger?1:(sp.boost||1)));}
  function crossings(from,to){const b=T.segmentIndex(tl,to);for(let i=st.seg+1;i<=b;i++)emit('segment',{index:i,beat:tl.segments[i].beat});st.seg=b;
    for(const g of tl.goals)if(from<g.tau&&to>=g.tau)emit('goal',{goal:g,replay:!!st.replay||st.mode==='replay'});}
  function finish(){if(st.replay){st.replay=null;st.state='ended';emit('replayEnd',{});return;}
    st.state='ended';if(st.mode==='live'&&!st.endFired){st.endFired=true;emit('end',{finalScore:tl.finalScore.slice(),winner:tl.winner});}}
  const api={
    get tau(){return st.tau;},get state(){return st.state;},get speed(){return st.speed;},get mode(){return st.mode;},get inReplay(){return !!st.replay;},get endFired(){return st.endFired;},
    on(name,fn){(listeners[name]=listeners[name]||[]).push(fn);return ()=>{listeners[name]=(listeners[name]||[]).filter(f=>f!==fn);};},
    play(){if(st.speed==='instant'&&!st.replay){const from=st.tau;st.tau=tl.total;crossings(from,st.tau);finish();return api;}
      if(st.state==='ended'&&!st.replay){st.tau=0;st.seg=0;}st.state='playing';return api;},
    pause(){if(st.state==='playing')st.state='paused';return api;},
    resume(){if(st.state==='paused')st.state='playing';return api;},
    toggle(){return st.state==='playing'?api.pause():st.state==='paused'?api.resume():api.play();},
    seek(tau){st.tau=clamp(+tau||0,0,tl.total);st.seg=T.segmentIndex(tl,st.tau);if(st.replay&&st.tau<st.replay.from)st.replay=null;if(st.state==='ended'&&st.tau<tl.total)st.state='paused';return api;},
    setSpeed(name){if(!SPEEDS[name])throw Error('Unknown speed '+name);st.speed=name;baseRate=base();if(name==='instant'&&st.state==='playing'&&!st.replay)api.play();return api;},
    replayGoal(){const g=tl.goals[tl.goals.length-1];if(!g)return false;st.replay={from:g.replayFrom};st.tau=g.replayFrom;st.seg=T.segmentIndex(tl,st.tau);st.state='playing';emit('replayStart',{from:g.replayFrom,goal:g});return true;},
    // Advance by real seconds. Returns the new tau.
    advance(real){if(st.state!=='playing'||!(real>0))return st.tau;if(st.tau>=tl.total){finish();return st.tau;}let left=real,tau=st.tau;
      while(left>1e-9&&tau<tl.total){const seg=tl.segments[T.segmentIndex(tl,tau)],r=rateAt(tau),room=Math.max(seg.tau1-tau,1e-6),need=room/r;if(need>=left){tau+=left*r;left=0;}else{tau=seg.tau1;left-=need;}}
      tau=Math.min(tau,tl.total);const from=st.tau;st.tau=tau;crossings(from,tau);if(tau>=tl.total)finish();return st.tau;},
    // Estimated real seconds for the whole match at the current speed (for the UI).
    estimate(){if(st.speed==='instant')return 0;let s=0;for(const g of tl.segments)s+=(g.tau1-g.tau0)/rateAt(g.tau0);return s;}
  };
  return api;}
window.CageViewerClock={SPEEDS,REPLAY_RATE,createPlayback,dynamicBase};
})();
