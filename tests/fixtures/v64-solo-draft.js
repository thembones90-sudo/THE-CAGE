(async()=>{
const out=document.createElement('pre');out.id='v64-solo-result';document.body.append(out);
const $=id=>document.getElementById(id),check=(x,m)=>{if(!x)throw Error(m)};
try{
 const level=new URL(location.href).searchParams.get('level')||'competitive';
 check(window.CageCpu&&window.THE_CAGE_PLAYERS.length===217,'CPU module or approved 217-player roster missing');
 $('gameMode').value='solo';$('gameMode').dispatchEvent(new Event('change'));
 $('cpuDifficulty').value=level;
 check(!$('cpuDifficulty').disabled,'CPU difficulty disabled in solo mode');
 let leak=0,seenCpu=false,steps=0;
 let viewer;const mount=window.CageViewer.mount;window.CageViewer.mount=(...args)=>(viewer=mount(...args));
 $('begin').click();
 const poll=setInterval(()=>{
 try{
  const g=window.CageRandomDraft.snapshot();
  if(g.picks.length&&g.picks.some(p=>p.side==='B'))seenCpu=true;
  const cpuB=g.picks.length<6&&(g.picks.length%2===0?g.winner:(g.winner==='A'?'B':'A'))==='B';
  if(cpuB&&g.active&&(!$('selection').classList.contains('hidden')||$('pool').children.length))leak++;
  if(g.finished){
    clearInterval(poll);
    check(g.picks.length===6,'expected 6 unique picks');
    check(new Set(g.picks.map(p=>p.id)).size===6,'duplicate player claimed');
    check(g.picks.filter(p=>p.side==='A').length===3&&g.picks.filter(p=>p.side==='B').length===3,'not 3 outfield per side');
    check(g.keeperMode===true&&g.keepers&&g.keepers.A&&g.keepers.B&&g.keepers.A!==g.keepers.B,'3+1 is mandatory: both sides need a distinct goalkeeper '+JSON.stringify(g.keepers));
    check(seenCpu,'CPU never claimed any cards');
    check(leak===0,'CPU private pool briefly rendered: '+leak);
    check($('tacticB').disabled&&window.CageCpu.TACTICS.includes($('tacticB').value),'CPU tactic not locked');
    const saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk'));
    check(saved.mode==='solo'&&saved.difficulty===level,'solo difficulty not saved');
    check(saved.used.length===6,'exhaustion mismatch');
    $('fight').click();check(viewer,'viewer missing');viewer.setSpeed('instant');viewer.render();
    check(document.querySelector('.cv-b').textContent==='IRON AI','solo viewer team name inconsistent');
    check(document.querySelector('[data-k=golden]').hidden&&document.querySelector('[data-k=goalcard]').hidden,'full-time pitch obstructed');
    check(getComputedStyle($('finished')).display==='none','duplicate result/setup panel visible');
    check(!$('arena-outcome').classList.contains('hidden')&&$('arena-score').textContent.includes('–'),'single final result missing');
    const complete=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk')),record=window.CageRecords.expand(complete.history[0]);check(!('result' in complete.history[0]),'saves store only setup and seed');
    check(complete.history.length===1&&complete.wins.A+complete.wins.B===1,'result scored more than once');
    check(document.querySelector('[data-k=showdown]').textContent===complete.wins.A+' : '+complete.wins.B,'full-time series score is stale');
    check(window.CageRecords.reproduce(record).eventHash===record.result.eventHash,'presentation changed match');
    $('watch-again').click();check($('arena-outcome').classList.contains('hidden'),'result should wait until replay finishes');viewer.setSpeed('instant');viewer.render();
    check(!$('arena-outcome').classList.contains('hidden'),'result missing after replay');
    check(window.CageRandomDraft.snapshot().wins.A+window.CageRandomDraft.snapshot().wins.B===1,'replay awarded another win');
    window.CageViewer.mount=mount;
    out.textContent='V64_SOLO_BROWSER_PASS '+level+' mandatory 3+1, concealed CPU picks, matching team names, clear full-time pitch, one result panel, immutable replay and no duplicate win';
    return;
  }
  if(!$('handoff').classList.contains('hidden')&&!$('reveal').disabled){$('reveal').click();}
  if(!$('selection').classList.contains('hidden')){
    const card=$('pool').querySelector('button.card');if(card)card.click();
  }
  if(g.picks.length===6&&!g.finished){
    if(g.keeperStage==='pending'&&!$('gkReveal').classList.contains('hidden'))$('gkReveal').click();
    if(g.keeperStage==='pickingA'){const gk=$('gkPool').querySelector('.gk-choice');if(gk)gk.click();}
  }
  if(++steps>200)throw Error('solo draft stalled '+JSON.stringify(g));
 }catch(e){clearInterval(poll);out.textContent='V64_SOLO_BROWSER_FAIL '+e.stack;}
 },70);
}catch(e){out.textContent='V64_SOLO_BROWSER_FAIL '+e.stack;}
})();
