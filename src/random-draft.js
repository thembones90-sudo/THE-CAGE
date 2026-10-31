(()=>{'use strict';
const $=id=>document.getElementById(id);
const roster=window.THE_CAGE_PLAYERS||[];
const byId=new Map(roster.map(p=>[p.id,p]));
const engine=window.CageEngine;
const game={winner:null,picks:[],claimed:new Set(),pool:[],rerolls:{A:1,B:1},deadline:0,clock:null,active:false,ready:false,finished:false};
const sideName=s=>s==='A'?'COMMANDER':'OPPONENT';
function randomInt(max){if(!Number.isSafeInteger(max)||max<=0)throw Error('Invalid random bound');const cap=4294967296,limit=cap-(cap%max);let v;do{v=crypto.getRandomValues(new Uint32Array(1))[0];}while(v>=limit);return v%max;}
function sample(pool,count){const a=pool.slice();for(let i=0;i<Math.min(count,a.length);i++){const k=i+randomInt(a.length-i);[a[i],a[k]]=[a[k],a[i]];}return a.slice(0,count);}
function currentSide(){if(game.picks.length===6)return null;return game.picks.length%2===0?game.winner:game.winner==='A'?'B':'A';}
function candidates(exclude=[]){const blocked=new Set([...game.claimed,...exclude]);return sample(roster.filter(p=>!blocked.has(p.id)),15).map(p=>p.id);}
function stopClock(){if(game.clock!==null)clearInterval(game.clock);game.clock=null;game.active=false;}
function showError(msg){$('error').textContent=msg;}
function tick(){if(!game.active)return;const rem=Math.max(0,Math.ceil((game.deadline-Date.now())/1000));$('clock').textContent=rem;if(rem===0){const id=game.pool[randomInt(game.pool.length)];claim(id,true);}}
function squads(){for(const side of ['A','B']){const root=$('squad'+side);root.replaceChildren();const picks=game.picks.filter(p=>p.side===side);if(!picks.length)root.textContent='No picks yet';for(const pick of picks){const p=byId.get(pick.id);const line=document.createElement('div');line.className='pick';line.textContent=p.name+' · '+(p.role||'?')+' · '+(p.careerTier||p.tier||'')+' · OVR '+window.CageOverall.read(p);root.append(line);}}}
function render(){if(!game.active)return;const s=currentSide(),root=$('pool');const advice=$('counterAdvice');advice.replaceChildren();advice.classList.add('hidden');if($('hints').checked&&window.CageTraits?.COUNTERPLAY){const enemy=game.picks.filter(x=>x.side!==s);for(const pick of enemy){const p=byId.get(pick.id);for(const trait of [p?.traits?.primary,p?.traits?.secondary]){const clue=window.CageTraits.COUNTERPLAY[trait];if(!clue)continue;const line=document.createElement('p');line.textContent=p.name+' ('+trait+'): '+clue;advice.append(line);}}if(enemy.length){advice.classList.remove('hidden');}}$('current').textContent=sideName(s)+' picks now';$('phase').textContent='PICK '+(game.picks.length+1)+' / 6';$('reroll').disabled=game.rerolls[s]===0;$('reroll').textContent='REROLL 15 ('+game.rerolls[s]+' LEFT)';root.replaceChildren();for(const id of game.pool){const p=byId.get(id),card=document.createElement('button');card.className='card';card.type='button';const title=document.createElement('div');title.className='name';title.textContent=p.name;const meta=document.createElement('div');meta.className='meta';meta.textContent=[p.country,p.role,p.careerTier||p.tier].filter(Boolean).join(' · ');const stats=document.createElement('div');stats.className='stats';const r=p.r||{};stats.textContent=Object.entries(r).filter(([k])=>['pace','tech','pass','finish','def','phys'].includes(k)).map(([k,v])=>k.toUpperCase()+' '+v).join(' · ');const heading=document.createElement('div');heading.className='card-head';const badge=document.createElement('div');badge.className='card-ovr';badge.setAttribute('aria-label','Overall rating '+window.CageOverall.read(p));badge.textContent=window.CageOverall.read(p);const small=document.createElement('small');small.textContent='OVR';badge.append(small);heading.append(title,badge);card.append(heading,meta,stats);const traits=p.traits;if(traits){const t=document.createElement('div');t.className='meta';t.textContent='TRAITS: '+[traits.primary,traits.secondary].filter(Boolean).join(' / ');card.append(t);}const cls=p.playerClass||p.class||p.archetype;if(cls){const c=document.createElement('div');c.className='meta';c.textContent='CLASS: '+cls;card.append(c);}const more=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Full scouting';const full=document.createElement('div');full.className='stats';full.textContent=Object.entries(r).map(([k,v])=>k.replaceAll('_',' ')+' '+v).join(' · ');more.append(summary,full);const strengths=p.strengths||p.weaknesses;if(strengths){const extra=document.createElement('p');extra.className='meta';extra.textContent=(p.strengths?'Strengths: '+String(p.strengths)+' ':'')+(p.weaknesses?'Weaknesses: '+String(p.weaknesses):'');more.append(extra);}card.append(more);card.addEventListener('click',e=>{if(e.target.closest('summary')||e.target.closest('details'))return;claim(id,false);});root.append(card);}tick();}
function handoff(){stopClock();$('selection').classList.add('hidden');$('handoff').classList.remove('hidden');$('game').classList.remove('hidden');$('finished').classList.add('hidden');$('passTitle').textContent=sideName(currentSide())+' · YOUR TURN';$('phase').textContent='PICK '+(game.picks.length+1)+' / 6';$('current').textContent='Pool concealed until handoff';$('clock').textContent='20';$('pool').replaceChildren();squads();}
function startPick(){if(game.picks.length>=6){finishDraft();return;}game.pool=candidates();if(game.pool.length===0){showError('No eligible footballers remain.');return;}game.deadline=Date.now()+20000;game.active=true;$('handoff').classList.add('hidden');$('selection').classList.remove('hidden');render();game.clock=setInterval(tick,150);}
function claim(id,automatic){if(!game.active||!game.pool.includes(id)||game.claimed.has(id))return;if(!automatic&&Date.now()>=game.deadline){id=game.pool[randomInt(game.pool.length)];automatic=true;}const s=currentSide();stopClock();game.claimed.add(id);game.picks.push({side:s,id,automatic:!!automatic});squads();showError(automatic?'Time expired: '+byId.get(id).name+' automatically drafted for '+sideName(s):sideName(s)+' selected '+byId.get(id).name);game.pool=[];handoffAfterClaim();}
function handoffAfterClaim(){if(game.picks.length===6){finishDraft();return;}handoff();}
function finishDraft(){stopClock();game.finished=true;game.pool=[];$('handoff').classList.add('hidden');$('selection').classList.add('hidden');$('finished').classList.remove('hidden');$('phase').textContent='DRAFT COMPLETE';$('current').textContent='Both squads locked · 3 players each';$('clock').textContent='✓';$('reroll').disabled=true;squads();}
function begin(){clearMatchViewer();stopClock();game.winner=randomInt(2)?'A':'B';game.picks=[];game.claimed.clear();game.rerolls={A:1,B:1};game.pool=[];game.finished=false;showError('');$('coinResult').textContent='COIN TOSS: '+sideName(game.winner)+' WINS FIRST PICK';$('intro').classList.add('hidden');$('game').classList.remove('hidden');$('result').textContent='';$('details').replaceChildren();handoff();}
let matchViewer=null;
function clearMatchViewer(){
  if(matchViewer){matchViewer.destroy();matchViewer=null;}
  $('draft-arena').classList.add('hidden');
  $('draft-arena-viewer').replaceChildren();
}
function fight(){
  if(!game.finished||!engine||typeof engine.simulate!=='function'){showError('Match engine unavailable.');return;}
  clearMatchViewer();
  const teams=['A','B'].map(side=>game.picks.filter(p=>p.side===side).map(p=>p.id));
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];
  const config={teams,tactics:[$('tacticA').value,$('tacticB').value],seed,mode:'ko',traits:{enabled:true}};
  try{
    const result=engine.simulate(config);
    const record=window.CageRecords.make(config,result,1);
    const names=Object.fromEntries(teams.flat().map(id=>[id,byId.get(id)?.name||id]));
    const lines=window.CageCommentary.commentate(result,seed,['Commander','Opponent']);
    $('result').textContent='MATCH IN PROGRESS';
    $('details').replaceChildren();
    $('draft-arena').classList.remove('hidden');
    matchViewer=window.CageViewer.mount($('draft-arena-viewer'),record,{mode:'live',speed:'dynamic',autoplay:false,names,lines});
    matchViewer.on('end',()=>{
      $('result').textContent=(result.winner===0?'COMMANDER':'OPPONENT')+' WINS · '+result.score.join(' : ');
      const goal=result.events.find(e=>e.type==='goal');
      $('details').textContent=goal?'Winning goal: '+(byId.get(goal.actor)?.name||goal.actor):'Match completed';
    });
    matchViewer.play();
    $('draft-arena').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }catch(e){clearMatchViewer();showError('Match viewer error: '+e.message);}
}
$('begin').addEventListener('click',begin);
$('reveal').addEventListener('click',startPick);
$('reroll').addEventListener('click',()=>{if(!game.active)return;const s=currentSide();if(!game.rerolls[s])return;if(Date.now()>=game.deadline){tick();return;}game.rerolls[s]=0;const old=game.pool.slice();game.pool=candidates(old);if(game.pool.length===0)game.pool=candidates();render();});
$('restart').addEventListener('click',()=>{clearMatchViewer();stopClock();$('intro').classList.remove('hidden');$('game').classList.add('hidden');$('handoff').classList.add('hidden');$('hints').checked=false;game.finished=false;});
$('fight').addEventListener('click',fight);
$('hints').addEventListener('change',()=>{$('hintNote').textContent=$('hints').checked?'Indicators require verified class-counter relationships. No speculative advice is shown.':'Optional guidance shows only when supported by actual player class data.';});
window.CageRandomDraft={snapshot:()=>({winner:game.winner,picks:game.picks.map(x=>({...x})),rerolls:{...game.rerolls},pool:game.pool.slice(),active:game.active,finished:game.finished}),sample};
if(roster.length<21)showError('Roster failed to load or has insufficient distinct players.');
})();