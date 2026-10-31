/* THE CAGE V5.6: goal presentation derived ONLY from the immutable match record.
   Not a rules engine: no simulate(), no results, no random draws, no score changes.
   CommonJS for pure offline tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CageGoalExperience=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DURATION=2.6,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function goalData(timeline,events,goal,teams,names,replay=false){
 if(!goal||!timeline||!Array.isArray(timeline.goals)||!Array.isArray(events))throw Error('A recorded goal and event timeline are required');
 const e=events[goal.i];
 if(!e||e.type!=='goal'||e.i!==goal.i||e.team!==goal.team||e.actor!==goal.actor)throw Error('Golden Goal cue must match a recorded goal event');
 if(!timeline.goals.some(g=>g.i===goal.i&&g.tau===goal.tau))throw Error('Goal cue not on authoritative timeline');
 const team=teams[goal.team],scorer=names(e.actor),assist=e.assist&&e.assist!==e.actor?names(e.assist):null;
 if(typeof team!=='string'||!team||typeof scorer!=='string'||!scorer)throw Error('Incomplete recorded goal identity');
 return Object.freeze({eventIndex:e.i,tau:goal.tau,team:goal.team,teamName:team,scorer,assist,round:timeline.round||null,
  type:(goal.golden||timeline.golden)?'GOLDEN GOAL':'GOAL',replay:!!replay,source:'recorded-match-goal',isGolden:!!(goal.golden||timeline.golden),isWinner:!!(goal.golden||timeline.golden)&&goal.team===timeline.winner});
}
function phase(cue,tau,activeTime,now,reducedMotion=false){
 if(!cue||tau<cue.tau-1e-6)return Object.freeze({visible:false,progress:0,flash:0});
 const age=Math.max(0,now-activeTime);
 const visible=age<DURATION;
 return Object.freeze({visible,progress:clamp(age/DURATION,0,1),flash:reducedMotion?0:visible?Math.exp(-age*3.2):0});
}
function escapeText(x){return String(x).replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));}
function markup(cue,score){
 if(!cue)throw Error('Goal cue required');
 const names=escapeText(cue.teamName),scorer=escapeText(cue.scorer),assist=cue.assist?'<small>ASSIST // '+escapeText(cue.assist)+'</small>':'';
 const valid=Array.isArray(score)&&score.length===2&&score.every(n=>Number.isInteger(n)&&n>=0);
 const scoreHtml=valid?'<span class="cv-golden-score">'+score[0]+' : '+score[1]+'</span>':'';
 return '<div class="cv-golden-rail">THE CAGE <span>///</span> MATCH EVENT '+String(cue.eventIndex).padStart(3,'0')+'</div>'+
 '<div class="cv-golden-core"><span class="cv-golden-eyebrow">'+(cue.replay?'SLOW-MOTION REPLAY // ':cue.isGolden?'FINAL STRIKE // ':'REGULATION GOAL // ')+escapeText(cue.type)+'</span>'+
 '<span class="cv-golden-doors" aria-hidden="true"><i></i><i></i></span>'+
 '<strong class="cv-golden-title">GOAL<span class="cv-golden-period">.</span></strong>'+
 '<span class="cv-golden-scorer">'+scorer+'</span>'+assist+
 '<div class="cv-golden-winner"><span>'+(cue.isWinner?'WINNER // ':'GOAL FOR // ')+names+'</span>'+scoreHtml+'</div></div>'+
 '<div class="cv-golden-foot">RECORDED EVENT <span>◆</span> ACTUAL RESULT'+(cue.round?' <span>◆</span> ROUND '+cue.round:'')+'</div>';
}
return Object.freeze({DURATION,goalData,phase,markup,escapeText});
});
