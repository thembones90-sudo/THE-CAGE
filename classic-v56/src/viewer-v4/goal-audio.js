/* THE CAGE V5.6: original WebAudio goal sting, silent unless user explicitly opts in.
   No music assets, remote loads, recordings or network requests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CageGoalAudio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// An explicit sound choice remains active between rounds in this page only.
// A page refresh creates a new module and returns to the OFF default.
let sessionOptIn=false;
function create(opts={}){
 const getCtx=opts.contextFactory||(()=>{const C=(typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext));return C?new C():null;});
 let ctx=null,master=null,enabled=false,disposed=false;
 function init(){
  if(disposed)return false;
  if(!ctx){try{ctx=getCtx();if(!ctx)return false;master=ctx.createGain();master.gain.value=.16;master.connect(ctx.destination);}catch(_){ctx=null;master=null;return false;}}
  if(ctx.state==='suspended'&&typeof ctx.resume==='function')ctx.resume().catch(()=>{});
  return true;
 }
 function tone(freq,at,duration,wave,level,endFreq){
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=wave;osc.frequency.setValueAtTime(freq,at);
  if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq),at+duration);
  gain.gain.setValueAtTime(.0001,at);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level),at+.013);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(gain);gain.connect(master);osc.start(at);osc.stop(at+duration+.025);
 }
 function setEnabled(value){
  if(disposed)return false;
  if(!value){enabled=false;sessionOptIn=false;return false;}
  enabled=init();sessionOptIn=enabled;return enabled;
 }
 function play(replay=false){
  if(!enabled||disposed||!ctx||ctx.state==='closed')return false;
  try{
   const at=ctx.currentTime+.008,soft=replay?.46:1;
   // 100% original synthetic metallic impact and two-note triumph.
   tone(94,at,.34,'triangle',.72*soft,47);
   tone(184,at+.025,.46,'sawtooth',.17*soft,139);
   tone(466.16,at+.19,.48,'sine',.25*soft);
   tone(698.46,at+.38,.58,'triangle',.23*soft);
   tone(932.33,at+.57,.85,'sine',.17*soft);
   return true;
  }catch(_){return false;}
 }
 function dispose(){disposed=true;enabled=false;const c=ctx;ctx=null;master=null;if(c&&typeof c.close==='function')try{const r=c.close();if(r&&typeof r.catch==='function')r.catch(()=>{});}catch(_){}}
 return Object.freeze({setEnabled,play,dispose,restore:()=>sessionOptIn?setEnabled(true):false,get enabled(){return enabled;},get disposed(){return disposed;}});
}
return Object.freeze({create});
});
