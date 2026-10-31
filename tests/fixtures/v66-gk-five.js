(async()=>{const out=document.createElement('pre');out.id='v66-gk-five-result';document.body.append(out);const $=id=>document.getElementById(id),check=(ok,msg)=>{if(!ok)throw Error(msg)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 $('keeperMode').checked=true;$('gameMode').value='solo';$('gameMode').dispatchEvent(new Event('change'));$('cpuDifficulty').value='competitive';let controller;
 const original=window.CageViewer.mount;window.CageViewer.mount=(...args)=>{controller=original(...args);return controller;};
 $('begin').click();const usedGK=new Set();let rounds=0;
 for(let r=1;r<=5;r++){
  for(let i=0;i<150;i++){const s=window.CageRandomDraft.snapshot();
   if(s.finished)break;
   if(s.picks.length<6){if(!$('handoff').classList.contains('hidden')&&!$('reveal').disabled)$('reveal').click();
    if(!$('selection').classList.contains('hidden')){$('pool').querySelector('button.card')?.click();}}
   else if(s.keeperStage==='pending'||s.keeperStage==='handoffB'){
    if(!$('gkReveal').classList.contains('hidden'))$('gkReveal').click();
   }else if(s.keeperStage==='pickingA')$('gkPool').querySelector('.gk-choice')?.click();
   await sleep(65);
  }
  const s=window.CageRandomDraft.snapshot();check(s.finished&&s.keepers?.A&&s.keepers?.B,'incomplete GK round '+r);
  for(const id of [s.keepers.A,s.keepers.B]){check(!usedGK.has(id),'goalkeeper reused '+id);usedGK.add(id);}
  $('fight').click();check(controller,'viewer not mounted');controller.setSpeed('instant');
  await sleep(120);const after=window.CageRandomDraft.snapshot();
  check(after.history.length===r,'match result not committed '+r+' '+JSON.stringify(after));
  check(after.keeperUsedCount===r*2,'GK exhaustion mismatch '+r);
  const save=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk'));const record=save.history.at(-1);
  check(record.schema===2&&record.config.keepers.length===2,'GK record schema/identity invalid');
  check(window.CageRecords.reproduce(record).eventHash===record.result.eventHash,'GK replay not reproducible');
  rounds=r;if(after.champion)break;$('arena-next').click();
 }
 const end=window.CageRandomDraft.snapshot();check(end.champion&&Math.max(end.wins.A,end.wins.B)===3,'no first-to-three champion');
 check(usedGK.size===rounds*2,'repeated keeper across showdown');window.CageViewer.mount=original;
 out.textContent='V66_GK_FIVE_PASS '+rounds+' rounds, '+usedGK.size+' exhausted keepers, champion '+end.champion+', schema2 replayed every round';
}catch(e){out.textContent='V66_GK_FIVE_FAIL '+e.stack;}
})();
