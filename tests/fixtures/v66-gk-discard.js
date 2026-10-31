(async()=>{const o=document.createElement('pre');o.id='v66-discard-result';document.body.append(o);
const $=id=>document.getElementById(id),check=(v,msg)=>{if(!v)throw Error(msg)};
try{
 if(sessionStorage.getItem('v66-discard-stage')==='reloaded'){
  sessionStorage.removeItem('v66-discard-stage');
  check(!localStorage.getItem('the-cage.random-showdown.v66-gk'),'GK save resurrected');
  check(!$('intro').classList.contains('hidden'),'Discarded GK showdown restored on reload');
  check(!window.CageRandomDraft.snapshot().keeperMode,'GK mode not cleared');
  o.textContent='V66_GK_DISCARD_PASS no resurrected keeper save, hidden panel, cleared state and timers';
  return;
 }
 $('keeperMode').checked=true;$('begin').click();let i=0;
 const poll=setInterval(()=>{
 try{
 const s=window.CageRandomDraft.snapshot();
 if(s.picks.length<6){if(!$('handoff').classList.contains('hidden')&&!$('reveal').disabled)$('reveal').click();
 if(!$('selection').classList.contains('hidden'))$('pool').querySelector('button.card')?.click();}
 else if(s.keeperStage==='pending'){
  clearInterval(poll);$('gkReveal').click();
  check($('gkPool').querySelectorAll('.gk-choice').length===5,'goalkeeper state not active');
  check(!!localStorage.getItem('the-cage.random-showdown.v66-gk'),'GK save not created');
  window.confirm=()=>true;$('restart').click();
  check(!localStorage.getItem('the-cage.random-showdown.v66-gk'),'GK key was not cleared');
  check(window.CageRandomDraft.snapshot().keeperUsedCount===0,'keeper exhaustion was not reset');
  check($('keeperDraftPhase').classList.contains('hidden'),'GK draft leaked after restart');
  sessionStorage.setItem('v66-discard-stage','reloaded');location.reload();
 }if(++i>120)throw Error('GK draft did not start');
 }catch(e){clearInterval(poll);o.textContent='V66_GK_DISCARD_FAIL '+e.stack;}
 },70);
}catch(e){o.textContent='V66_GK_DISCARD_FAIL '+e.stack;}
})();
