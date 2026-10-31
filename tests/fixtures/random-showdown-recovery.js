(async()=>{
const o=document.createElement('pre');o.id='recover-test';document.body.append(o);
const $=id=>document.getElementById(id);const check=(x,m)=>{if(!x)throw Error(m)};
try{
 const stage=sessionStorage.getItem('cage-recover-stage');
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
  localStorage.removeItem('the-cage.random-showdown.v60');sessionStorage.removeItem('cage-recover-stage');
  o.textContent='RECOVERY_TEST_PASS saved 15 candidate pool and timer, restored recorded pending match, finished once';return;
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