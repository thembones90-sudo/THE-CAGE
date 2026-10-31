(async()=>{
 const out=document.createElement('pre');out.id='v66-gk-browser-result';document.body.append(out);
 const $=id=>document.getElementById(id),check=(x,m)=>{if(!x)throw Error(m)};
 try{
 const errors=[];window.addEventListener('error',e=>errors.push(e.message));
 check(window.CageGoalkeepers?.players.length===30,'missing keeper catalog');
 $('keeperMode').checked=true;$('gameMode').value='solo';$('gameMode').dispatchEvent(new Event('change'));$('cpuDifficulty').value='competitive';
 $('begin').click();let ticks=0,firstOffer=null,stageBSeen=false;
 const poll=setInterval(()=>{
 try{
   const s=window.CageRandomDraft.snapshot();
   if(s.picks.length<6){
     if(!$('handoff').classList.contains('hidden')&&!$('reveal').disabled)$('reveal').click();
     if(!$('selection').classList.contains('hidden')){const card=$('pool').querySelector('button.card');if(card)card.click();}
   }else if(!s.finished){
     check(!$('keeperDraftPhase').classList.contains('hidden'),'keeper phase must be visible');
     if(s.keeperStage==='pending'){if(!$('gkReveal').classList.contains('hidden'))$('gkReveal').click();}
     if(s.keeperStage==='pickingA'){
       const all=$('gkPool').querySelectorAll('.gk-choice');if(all.length===5){
         check(getComputedStyle($('gkPool')).display==='grid','GK offers lost responsive grid layout');
         for(const card of all){
           check(['TITAN','LEGEND','ELITE','STALWART','ACE'].includes(card.dataset.tier),'Missing tier styling');
           check(card.querySelectorAll('.gk-attribute').length===7,'Goalkeeper card must show all seven attributes');
           check(card.querySelector('.gk-ovr')?.textContent.trim().length>0,'GK OVR invisible');
           check(card.getAttribute('aria-label')?.includes('Select goalkeeper'),'GK card needs accessible selection label');
         }
         firstOffer=[...all].map(x=>x.querySelector('strong')?.textContent);all[0].click();
       }
     }
     if(s.keeperStage==='handoffB'||s.keeperStage==='pickingB'){
       stageBSeen=true;
       check($('gkPool').querySelectorAll('.gk-choice').length===0,'CPU private goalkeeper pool leaked');
     }
   }else{
     clearInterval(poll);check(stageBSeen,'never reached CPU goalkeeper turn');
     check(s.keepers?.A&&s.keepers?.B&&s.keepers.A!==s.keepers.B,'keeper picks must both be locked');
     check(s.keeperUsedCount===2,'keeper exhaustion count');
     check(s.picks.length===6,'six outfield picks');
     const saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk'));
     check(saved.schema===2&&saved.keeperMode===true,'GK save schema mismatch');
     check(saved.keeperState.picks.A===s.keepers.A&&saved.keeperState.picks.B===s.keepers.B,'saved keeper picks differ');
     check(!$('fight').disabled,'match unavailable');
     const originalSim=window.CageEngine.simulate;let trials=0;
     window.CageEngine.simulate=(config)=>{if(trials++===0)throw Error('Cage match safety limit: simulated fixture deadlock.');return originalSim(config);};
     $('fight').click();window.CageEngine.simulate=originalSim;
     check(trials===2,'match safety retry did not occur exactly once');
     const record=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk')).pending;
     check(record?.schema===2,'keeper match record schema 2');check(record.config.retryCount===1,'bounded safety retry not included in recorded config');
     check(record.config.keepers[0]===s.keepers.A&&record.config.keepers[1]===s.keepers.B,'engine keeper IDs differ');
     check(window.CageRecords.reproduce(record).eventHash===record.result.eventHash,'keeper replay fails reproduction');
     check(errors.length===0,'script errors: '+errors.join('; '));
     out.textContent='V66_GK_BROWSER_PASS 6 outfield picks + 2 keepers, 5-card private offers, CPU keeper pick concealed, schema2 save and deterministic replay';
   }
   if(++ticks>130)throw Error('Keeper draft browser timed out '+JSON.stringify(s));
 }catch(e){clearInterval(poll);out.textContent='V66_GK_BROWSER_FAIL '+e.stack;}
 },75);
 }catch(e){out.textContent='V66_GK_BROWSER_FAIL '+e.stack;}
})();
