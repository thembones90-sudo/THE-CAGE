(async()=>{const out=document.createElement('pre');out.id='v66-gk-recovery-result';document.body.append(out);const $=id=>document.getElementById(id),check=(x,msg)=>{if(!x)throw Error(msg)};
try{
 const stage=sessionStorage.getItem('v66-gk-recovery-step');
 if(stage==='reloaded'){
  const deadline=Number(sessionStorage.getItem('v66-gk-deadline')),saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk'));
  const snap=window.CageRandomDraft.snapshot();
  check(snap.keeperStage==='pickingA'&&snap.keeperUsedCount===0,'GK phase was not restored');
  check(saved.keeperState.deadline===deadline,'Ten-second deadline was reset after refresh');
  check(saved.keeperState.offer.length===5&&snap.picks.length===6,'private offer or outfield picks lost');
  $('gkReveal').click();
  check($('gkPool').querySelectorAll('.gk-choice').length===5,'saved offer no longer visible');
  const offerNames=[...$('gkPool').querySelectorAll('.gk-choice strong')].map(x=>x.textContent);
  const originalNames=JSON.parse(sessionStorage.getItem('v66-gk-offer-names'));
  check(JSON.stringify(offerNames)===JSON.stringify(originalNames),'GK offer changed after refresh');
  out.textContent='V66_GK_RESTORE_PASS 5 original cards, six outfield picks and unchanged absolute 10s deadline after reload';
  sessionStorage.removeItem('v66-gk-recovery-step');sessionStorage.removeItem('v66-gk-deadline');sessionStorage.removeItem('v66-gk-offer-names');return;
 }
 $('keeperMode').checked=true;$('begin').click();let spins=0;
 const tick=setInterval(()=>{
 try{const snap=window.CageRandomDraft.snapshot();
  if(snap.picks.length<6){
   if(!$('handoff').classList.contains('hidden')&&!$('reveal').disabled)$('reveal').click();
   if(!$('selection').classList.contains('hidden'))$('pool').querySelector('button.card')?.click();
  }else if(snap.keeperStage==='pending'){
   clearInterval(tick);$('gkReveal').click();
   const saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk'));
   check(saved.keeperState.stage==='pickingA','keeper clock not started');
   sessionStorage.setItem('v66-gk-deadline',String(saved.keeperState.deadline));
   sessionStorage.setItem('v66-gk-offer-names',JSON.stringify([...$('gkPool').querySelectorAll('.gk-choice strong')].map(x=>x.textContent)));
   sessionStorage.setItem('v66-gk-recovery-step','reloaded');location.reload();return;
  }
  if(++spins>60)throw Error('keeper phase missing');
 }catch(e){clearInterval(tick);out.textContent='V66_GK_RESTORE_FAIL '+e.stack;}
 },65);
}catch(e){out.textContent='V66_GK_RESTORE_FAIL '+e.stack;}
})();
