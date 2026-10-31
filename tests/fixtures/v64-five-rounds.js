(async()=>{
const o=document.createElement('pre');o.id='v64-five-result';document.body.append(o);
const $=id=>document.getElementById(id),check=(x,m)=>{if(!x)throw Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const existing=sessionStorage.getItem('v64-five-stage');
 if(existing==='reload'){
  const s=window.CageRandomDraft.snapshot(),saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v60'));
  check(s.mode==='solo'&&s.difficulty==='ruthless','solo mode not restored');
  check(s.champion&&Math.max(s.wins.A,s.wins.B)===3,'champion lost on reload');
  check(saved.used.length===s.history.length*6,'exhaustion lost');
  check($('next-round').classList.contains('hidden'),'finished showdown reopened');
  check($('tacticB').disabled,'CPU tactic not locked on restore');
  sessionStorage.removeItem('v64-five-stage');localStorage.removeItem('the-cage.random-showdown.v60');
  o.textContent='V64_CPU_FIVE_PASS '+s.history.length+' rounds, '+saved.used.length+' exhausted, historical save preserved, CPU mode and trophy restored';return;
 }
 localStorage.removeItem('the-cage.random-showdown.v60');
 $('gameMode').value='solo';$('gameMode').dispatchEvent(new Event('change'));$('cpuDifficulty').value='ruthless';
 let ctl;const mount=window.CageViewer.mount;window.CageViewer.mount=(...args)=>{ctl=mount(...args);return ctl;};
 $('begin').click();
 let exhausted=new Set(),rounds=0;
 for(let round=1;round<=5;round++){
  let s=window.CageRandomDraft.snapshot();
  check(s.round===round,'round index');
  for(let steps=0;!s.finished;steps++){
   if(steps>110)throw Error('CPU draft stalled '+JSON.stringify(s));
   if(!$('handoff').classList.contains('hidden')&&!$('reveal').disabled)$('reveal').click();
   if(!$('selection').classList.contains('hidden')){const card=$('pool').querySelector('button.card');if(card)card.click();}
   await sleep(75);s=window.CageRandomDraft.snapshot();
  }
  check(s.mode==='solo'&&s.difficulty==='ruthless','mode lost');
  check(s.picks.length===6&&s.picks.filter(p=>p.side==='B').length===3,'CPU failed to draft trio');
  check(s.picks.every(p=>!exhausted.has(p.id)),'player exhaustion violated');
  s.picks.forEach(p=>exhausted.add(p.id));
  check($('tacticB').disabled,'CPU tactic not selected');
  $('fight').click();check(!!ctl,'match viewer unavailable');
  ctl.setSpeed('instant');
  s=window.CageRandomDraft.snapshot();
  check(s.history.length===round,'round not awarded');
  check(s.used.length===round*6,'exhausted player count wrong');
  rounds=round;
  if(s.champion)break;
  $('arena-next').click();
 }
 const final=window.CageRandomDraft.snapshot();
 check(final.champion&&Math.max(final.wins.A,final.wins.B)===3,'showdown winner wrong');
 check(exhausted.size===rounds*6,'repeat picks');
 window.CageViewer.mount=mount;
 sessionStorage.setItem('v64-five-stage','reload');location.reload();
}catch(e){o.textContent='V64_CPU_FIVE_FAIL '+e.stack;}
})();
