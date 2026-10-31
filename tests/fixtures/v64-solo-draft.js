(async()=>{
const out=document.createElement('pre');out.id='v64-solo-result';document.body.append(out);
const $=id=>document.getElementById(id),check=(x,m)=>{if(!x)throw Error(m)};
try{
 const level=new URL(location.href).searchParams.get('level')||'competitive';
 check(window.CageCpu&&window.THE_CAGE_PLAYERS.length===194,'CPU module or roster missing');
 $('gameMode').value='solo';$('gameMode').dispatchEvent(new Event('change'));
 $('cpuDifficulty').value=level;
 check(!$('cpuDifficulty').disabled,'CPU difficulty disabled in solo mode');
 let leak=0,seenCpu=false,steps=0;
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
    check(g.picks.filter(p=>p.side==='A').length===3&&g.picks.filter(p=>p.side==='B').length===3,'not 3v3');
    check(seenCpu,'CPU never claimed any cards');
    check(leak===0,'CPU private pool briefly rendered: '+leak);
    check($('tacticB').disabled&&window.CageCpu.TACTICS.includes($('tacticB').value),'CPU tactic not locked');
    const saved=JSON.parse(localStorage.getItem('the-cage.random-showdown.v60'));
    check(saved.mode==='solo'&&saved.difficulty===level,'solo difficulty not saved');
    check(saved.used.length===6,'exhaustion mismatch');
    out.textContent='V64_SOLO_BROWSER_PASS '+level+' 6 unique picks, 3 CPU turns, concealed pools, valid CPU tactic and saved mode';
    return;
  }
  if(!$('handoff').classList.contains('hidden')&&!$('reveal').disabled){$('reveal').click();}
  if(!$('selection').classList.contains('hidden')){
    const card=$('pool').querySelector('button.card');if(card)card.click();
  }
  if(++steps>100)throw Error('solo draft stalled '+JSON.stringify(g));
 }catch(e){clearInterval(poll);out.textContent='V64_SOLO_BROWSER_FAIL '+e.stack;}
 },70);
}catch(e){out.textContent='V64_SOLO_BROWSER_FAIL '+e.stack;}
})();
