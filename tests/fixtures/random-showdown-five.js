(async()=>{
const o=document.createElement('pre');o.id='five-test';document.body.append(o);
const $=id=>document.getElementById(id);const check=(x,m)=>{if(!x)throw Error(m)};
try{
const stage=sessionStorage.getItem('cage-five-fixture-stage');
if(stage==='reload'){
 const s=window.CageRandomDraft.snapshot();
 check(s.champion!==null,'champion survives reload');
 check(Math.max(s.wins.A,s.wins.B)===3,'victory count retained');
 check(s.history.length>=3&&s.history.length<=5,'history retained');
 check(s.used.length===s.history.length*6,'exhaustion retained');
 check($('next-round').classList.contains('hidden'),'champion cannot start another round');
 sessionStorage.removeItem('cage-five-fixture-stage');
 localStorage.removeItem('the-cage.random-showdown.v60');
 o.textContent='FIVE_ROUND_TEST_PASS '+s.history.length+' rounds / '+s.used.length+' unique players / champion '+s.champion+' / restore safe';return;
}
localStorage.removeItem('the-cage.random-showdown.v60');
$('begin').click();
const used=new Set(),recorded=[];let ctl;
const mount=window.CageViewer.mount;
window.CageViewer.mount=(...args)=>{ctl=mount(...args);return ctl;};
for(let round=1;round<=5;round++){
 let state=window.CageRandomDraft.snapshot();check(state.round===round,'round index');
 check(!state.champion,'champion prematurely');
 for(let pick=0;pick<6;pick++){
  $('reveal').click();state=window.CageRandomDraft.snapshot();
  check(state.pool.length===15,'not 15 pool');
  check(state.pool.every(id=>!used.has(id)),'exhausted candidate returned');
  const id=state.pool[0];check(!used.has(id),'duplicate footballer');
  $('pool').querySelector('button.card').click();used.add(id);
 }
 check(window.CageRandomDraft.snapshot().used.length===round*6,'used count');
 $('fight').click();check(!!ctl,'viewer not mounted');
 check($('result').textContent==='MATCH IN PROGRESS','premature result');
 const pending=window.CageRandomDraft.snapshot();check(pending.pending,'pending record missing');
 const saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v60'));check(saved.pending.round===round,'pending saved');
 const seed=saved.pending.config.seed;recorded.push(seed);
 ctl.setSpeed('instant');
 state=window.CageRandomDraft.snapshot();
 check(state.history.length===round,'round not finalized');
 check(state.wins.A+state.wins.B===round,'wins not accounted');
 check($('result').textContent.includes('WINS'),'no winner displayed');
 $('watch-again').click();check(ctl.playback.mode==='replay','replay mode false');
 check(JSON.parse(localStorage.getItem('the-cage.random-showdown.v60')).history[round-1].config.seed===seed,'replay changed seed');
 const champion=Math.max(state.wins.A,state.wins.B)>=3;
 if(champion){check(state.champion!==null,'champion not declared');check($('next-round').classList.contains('hidden'),'next allowed for champion');break;}
 $('next-round').click();
 check(window.CageRandomDraft.snapshot().used.length===round*6,'exhausted list reset on new round');
 check(window.CageRandomDraft.snapshot().rerolls.A===1,'reroll not reset');
}
const done=window.CageRandomDraft.snapshot();
check(done.wins.A+done.wins.B>=3&&done.wins.A+done.wins.B<=5,'showdown size');
check(Math.max(done.wins.A,done.wins.B)===3,'first to 3 not achieved');
check(done.history.length===done.wins.A+done.wins.B,'history mismatch');
check(used.size===done.history.length*6,'repeats across rounds');
window.CageViewer.mount=mount;
sessionStorage.setItem('cage-five-fixture-stage','reload');
location.reload();
}catch(e){o.textContent='FIVE_ROUND_TEST_FAIL '+e.stack;}
})();