(async()=>{
const o=document.createElement('pre');o.id='recover-test';document.body.append(o);
const $=id=>document.getElementById(id);const check=(x,m)=>{if(!x)throw Error(m)};
try{
 const stage=sessionStorage.getItem('cage-recover-stage');
 if(stage==='round2-unplayed'){
  const s=window.CageRandomDraft.snapshot();
  check(s.round===2&&s.history.length===1&&s.finished&&!s.pending,'round 2 reload lost pre-match state');
  check(s.used.length===12,'round 2 exhausted player count incorrect');
  check(!$('fight').disabled,'fight disabled after round 2 draft reload');
  check($('next-round').classList.contains('hidden'),'next round incorrectly enabled before playing round 2');
  $('fight').click();
  check(window.CageRandomDraft.snapshot().pending,'round 2 match not started after reload');
  const saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v60'));
  check(saved.pending.round===2,'wrong round replay');
  localStorage.removeItem('the-cage.random-showdown.v60');
  sessionStorage.removeItem('cage-recover-stage');
  o.textContent='RECOVERY_TEST_PASS candidate pool and timer, pending match, round-2 pre-match reload, no duplicate players';return;
 }
 if(stage==='pending'){
  const s=window.CageRandomDraft.snapshot();
  check(s.pending,'pending match missing on reload');check(s.history.length===0,'match awarded before completion');
  check($('watch-again').textContent.includes('REPLAY'),'pending recovery control missing');
  let controller;const m=window.CageViewer.mount;
  window.CageViewer.mount=(...a)=>{controller=m(...a);return controller;};
  $('watch-again').click();check(controller.playback.mode==='live','pending match recovered as replay instead of live');
  controller.setSpeed('instant');
  const end=window.CageRandomDraft.snapshot();
  check(end.history.length===1&&end.wins.A+end.wins.B===1,'pending match not finalized after resumed playback');
  check(end.used.length===6,'player exhaustion changed on reload');
  $('next-round').click();check(window.CageRandomDraft.snapshot().round===2,'round 2 not started');check(!$('round-intermission').classList.contains('hidden'),'round-two intermission not shown after prior match');check($('intermission-score').textContent==='SERIES '+end.wins.A+' : '+end.wins.B,'intermission standings changed across reload');
  for(let i=0;i<6;i++){ $('reveal').click();const next=window.CageRandomDraft.snapshot();check(next.pool.length===15,'round 2 pool missing');check(next.pool.every(id=>!end.used.includes(id)),'round 1 player appeared in round 2');$('pool').querySelector('button.card').click(); }
  check(window.CageRandomDraft.snapshot().finished,'round 2 draft not locked');
  sessionStorage.setItem('cage-recover-stage','round2-unplayed');location.reload();return;
 }
 if(stage==='pool'){
  const saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v60'));
  const s=window.CageRandomDraft.snapshot();
  check(s.pool.length===15,'saved pool not recovered');
  check(s.pool.join(',')===saved.pool.join(','),'candidate pool changed on reload');
  $('reveal').click();
  const opened=window.CageRandomDraft.snapshot();
  check(opened.pool.join(',')===saved.pool.join(','),'new pool generated after reload');
  check(opened.pool.length===15,'reveal failed');
  check($('clock').textContent!=='20'||saved.deadline>=Date.now()-50,'timer status ambiguous');
  for(let i=0;i<6;i++){
   if(i>0)$('reveal').click();
   const state=window.CageRandomDraft.snapshot();
   check(state.pool.length===15,'pick pool invalid '+i);
   $('pool').querySelector('button.card').click();
  }
  $('fight').click();check(window.CageRandomDraft.snapshot().pending,'pending record not saved');
  sessionStorage.setItem('cage-recover-stage','pending');location.reload();return;
 }
 localStorage.removeItem('the-cage.random-showdown.v60');
 $('begin').click();$('reveal').click();
 const s=window.CageRandomDraft.snapshot();check(s.pool.length===15,'initial pool missing');
 sessionStorage.setItem('cage-recover-stage','pool');location.reload();
}catch(e){o.textContent='RECOVERY_TEST_FAIL '+e.stack;}
})();