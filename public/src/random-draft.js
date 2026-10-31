(()=>{'use strict';
const $=id=>document.getElementById(id);
const roster=window.THE_CAGE_PLAYERS||[];
const byId=new Map(roster.map(p=>[p.id,p]));
const engine=window.CageEngine;
const game={winner:null,picks:[],claimed:new Set(),pool:[],rerolls:{A:1,B:1},deadline:0,clock:null,active:false,ready:false,finished:false,round:1,wins:{A:0,B:0},used:new Set(),history:[],pending:null,champion:null};
const sideName=s=>s==='A'?'COMMANDER':'OPPONENT';
const DRAFT_TRAIT_ICONS=Object.freeze({"Wall":"M4 9h24v16H4z M4 15h24 M4 20h24 M12 9v6 M20 15v5 M12 20v5","Enforcer":"M7 18l4-8 5 3 4-7 5 4 3 9-5 7H11z M12 21h13","Anticipator":"M3 16c6-9 20-9 26 0-6 9-20 9-26 0z M16 11a5 5 0 1 0 0 10a5 5 0 0 0 0-10","Tracker":"M9 5l4 8-5 8-5-8z M23 11l4 8-5 8-5-8z","Libero":"M16 3l12 5v10c0 6-7 10-12 12C11 28 4 24 4 18V8z M9 18l6-6 7 7","Maestro":"M5 24l21-17 M9 9l15 17 M19 6l8 6","Architect":"M4 26h24L16 5z M12 20l4-7 4 7z","Destroyer":"M16 4l3 8 9-2-5 7 5 7-9-2-3 8-3-8-9 2 5-7-5-7 9 2z","Engine":"M13 4h6l2 5 5-1 3 6-5 4 2 5-5 5-5-4-5 4-5-5 2-5-5-4 3-6 5 1z M16 12a4 4 0 1 0 0 8a4 4 0 0 0 0-8","Surgeon":"M4 16h24 M16 4v24 M7 7l18 18 M25 7L7 25 M16 10a6 6 0 1 0 0 12a6 6 0 0 0 0-12","Predator":"M5 6l6 17 5-13 5 13 6-17 M7 25h20","Magician":"M16 2l3 10 10 4-10 4-3 10-4-10-10-4 10-4z","Executioner":"M16 3a13 13 0 1 0 0 26a13 13 0 0 0 0-26 M16 9a7 7 0 1 0 0 14a7 7 0 0 0 0-14 M16 2v28 M2 16h28","Phantom":"M8 27V12C8 2 24 2 24 12v15l-5-4-4 4-4-4z M12 14h2m5 0h2","Juggernaut":"M5 24l7-18 4 9 4-9 7 18-5 5H10z M11 24h10"});
function draftTraitIcon(trait){const path=DRAFT_TRAIT_ICONS[trait]||(trait==='Hunter'?DRAFT_TRAIT_ICONS.Tracker:null);if(!path)return null;
 const icon=document.createElement('span');icon.className='draft-trait-icon';
 icon.innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="'+path+'"/></svg>';
 return icon;}

function randomInt(max){if(!Number.isSafeInteger(max)||max<=0)throw Error('Invalid random bound');const cap=4294967296,limit=cap-(cap%max);let v;do{v=crypto.getRandomValues(new Uint32Array(1))[0];}while(v>=limit);return v%max;}
function sample(pool,count){const a=pool.slice();for(let i=0;i<Math.min(count,a.length);i++){const k=i+randomInt(a.length-i);[a[i],a[k]]=[a[k],a[i]];}return a.slice(0,count);}
function currentSide(){if(game.picks.length===6)return null;return game.picks.length%2===0?game.winner:game.winner==='A'?'B':'A';}
function candidates(exclude=[]){const blocked=new Set([...game.used,...game.claimed,...exclude]);return sample(roster.filter(p=>!blocked.has(p.id)),15).map(p=>p.id);}
function stopClock(){if(game.clock!==null)clearInterval(game.clock);game.clock=null;game.active=false;const urgent=$('clock')?.parentElement;urgent?.classList.remove('urgent');}
function showError(msg){$('error').textContent=msg;}
function tick(){if(!game.active)return;const rem=Math.max(0,Math.ceil((game.deadline-Date.now())/1000));$('clock').textContent=rem;$('clock').parentElement.classList.toggle('urgent',rem<=5);if(rem===0){const id=game.pool[randomInt(game.pool.length)];claim(id,true);}}
function progress(){const el=$('draft-progress');el.replaceChildren();for(let i=0;i<6;i++){const pip=document.createElement('span');pip.className='draft-pip side-'+(i%2===0?game.winner==='A'?'a':'b':game.winner==='A'?'b':'a');pip.textContent=i+1;if(game.picks[i]){pip.classList.add('filled');pip.title=byId.get(game.picks[i].id)?.name||'Picked';}else pip.title='Upcoming pick '+(i+1);el.append(pip);}}
function squads(){progress();for(const side of ['A','B']){const root=$('squad'+side);root.replaceChildren();const picks=game.picks.filter(p=>p.side===side);if(!picks.length)root.textContent='No picks yet';for(const pick of picks){const p=byId.get(pick.id);const line=document.createElement('div');line.className='pick';line.textContent=p.name+' · '+(p.role||'?')+' · '+(p.careerTier||p.tier||'')+' · OVR '+window.CageOverall.read(p);root.append(line);}}}
function render(){if(!game.active)return;const s=currentSide(),root=$('pool');const advice=$('counterAdvice');advice.replaceChildren();advice.classList.add('hidden');if($('hints').checked&&window.CageTraits?.COUNTERPLAY){const enemy=game.picks.filter(x=>x.side!==s);for(const pick of enemy){const p=byId.get(pick.id);for(const trait of [p?.traits?.primary,p?.traits?.secondary]){const clue=window.CageTraits.COUNTERPLAY[trait];if(!clue)continue;const line=document.createElement('p');line.textContent=p.name+' ('+trait+'): '+clue;advice.append(line);}}if(enemy.length){advice.classList.remove('hidden');}}$('current').textContent=sideName(s)+' picks now';$('phase').textContent='PICK '+(game.picks.length+1)+' / 6';$('reroll').disabled=game.rerolls[s]===0;$('reroll').textContent='REROLL 15 ('+game.rerolls[s]+' LEFT)';root.replaceChildren();for(const id of game.pool){const p=byId.get(id),card=document.createElement('button'),wrap=document.createElement('div');wrap.className='draft-card-wrap';const family=/^(D|DEF)/i.test(p.role||'')?'def':/^(M|MID)/i.test(p.role||'')?'mid':'att';wrap.dataset.family=family;wrap.classList.add('tier-'+String(p.careerTier||p.tier||'').toLowerCase().replace(/[^a-z]/g,''));card.className='card';card.type='button';const title=document.createElement('div');title.className='name';title.textContent=p.name;const meta=document.createElement('div');meta.className='meta';meta.textContent=[p.country,p.careerTier||p.tier].filter(Boolean).join(' • ');
const role=document.createElement('div');role.className='draft-role';role.textContent=p.position||p.role||'PLAYER';
const icons={
def:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 16h12l8 13h10l5 7H9l-6-7 8-7z" fill="#12435c" stroke="#67d2fc" stroke-width="2.5" stroke-linejoin="round"/><circle cx="37" cy="16" r="7" fill="none" stroke="#b3e8ff" stroke-width="2"/><path d="M33 10l8 12M31 20l11-7M28 25l-7 2" stroke="#67d2fc" stroke-width="2"/></svg>',
mid:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7L6 37h36z" fill="#55410d" stroke="#f7d457" stroke-width="2.5"/><circle cx="24" cy="7" r="5" fill="#f7d457"/><circle cx="6" cy="37" r="5" fill="#f7d457"/><circle cx="42" cy="37" r="5" fill="#f7d457"/><path d="M16 27l6-9m9 13l7 2" stroke="#fff0a2" stroke-width="2.5"/></svg>',
att:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M25 7h20v32H25M29 7v32m8-32v32M25 18h20m-20 10h20" fill="none" stroke="#e2646c" stroke-width="2"/><path d="M4 38L24 18M7 25l13-7" stroke="#ff9992" stroke-width="3"/><circle cx="29" cy="14" r="6" fill="#f8b0a9" stroke="#e9474c" stroke-width="2"/></svg>'};
const icon=document.createElement('span');icon.className='draft-position-icon';icon.innerHTML=icons[family];role.prepend(icon);
const stats=document.createElement('div');stats.className='stats';const r=p.r||{};
for(const [key,label] of [['pace','PAC'],['tech','TEC'],['pass','PAS'],['finish','FIN'],['def','DEF'],['phys','PHY']]){
 const v=Number(r[key]||0),item=document.createElement('div');item.className='draft-stat';
 const labelEl=document.createElement('span');labelEl.textContent=label;
 const bar=document.createElement('span');bar.className='draft-stat-track';
 const fill=document.createElement('span');fill.className='draft-stat-fill';fill.style.width=Math.max(0,Math.min(100,v))+'%';bar.append(fill);
 const num=document.createElement('b');num.textContent=String(v);item.append(labelEl,bar,num);stats.append(item);
}
const heading=document.createElement('div');heading.className='card-head';const badge=document.createElement('div');badge.className='card-ovr';badge.setAttribute('aria-label','Overall rating '+window.CageOverall.read(p));badge.textContent=window.CageOverall.read(p);const small=document.createElement('small');small.textContent='OVR';badge.append(small);heading.append(title,badge);const tierTag=document.createElement('span');tierTag.className='draft-tier';tierTag.textContent=p.careerTier||p.tier||'UNRATED';card.append(heading,tierTag,role,meta,stats);
const folklore=Array.isArray(p.folklore)?p.folklore:[];
if(folklore.length){const specials=document.createElement('div');specials.className='draft-folklore';
 for(const raw of folklore){const tag=String(raw).trim(),chip=document.createElement('span');
 chip.className='draft-special special-'+tag.toLowerCase().replace(/[^a-z]+/g,'-');
 if(tag==='TALISMAN')chip.innerHTML='<svg viewBox="0 0 36 32" aria-hidden="true"><path d="M18 28L5 15C-1 8 7-1 15 6l3 3 3-3C29-1 37 8 31 15Z" fill="#e4b848" stroke="#f6d875" stroke-width="1.5"/><polyline points="5,16 11,16 14,11 17,21 20,14 23,16 31,16" stroke="#fff7c1" stroke-width="1.8" fill="none"/></svg>';
 if(tag==='UNDERDOG')chip.innerHTML='<svg viewBox="0 0 36 32" aria-hidden="true"><path d="M5 7l6 8 7-6 7 6 6-8-4 19H9Z" fill="none" stroke="#eec270" stroke-width="2"/><path d="M17 2l4 11-7 7 10 9" stroke="#f4df9c" stroke-width="2.5" fill="none"/></svg>';
 chip.append(document.createTextNode(tag.replace('STREET ','ST. ')));chip.title=tag;specials.append(chip);}
 card.append(specials);}
const traits=p.traits;if(traits){const t=document.createElement('div');t.className='draft-traits';for(const trait of [traits.primary,traits.secondary].filter(Boolean)){const chip=document.createElement('span');chip.textContent=trait;const glyph=draftTraitIcon(trait);if(glyph)chip.prepend(glyph);chip.classList.add(['Wall','Enforcer','Anticipator','Hunter','Tracker','Libero'].includes(trait)?'trait-def':['Maestro','Architect','Destroyer','Engine','Surgeon'].includes(trait)?'trait-mid':'trait-att');t.append(chip);}card.append(t);}const cls=p.playerClass||p.class||p.archetype;if(cls){const c=document.createElement('div');c.className='meta';c.textContent='CLASS: '+cls;card.append(c);}const more=document.createElement('details');more.className='draft-scout';const summary=document.createElement('summary');summary.textContent='Full scouting';const full=document.createElement('div');full.className='stats';full.textContent=Object.entries(r).map(([k,v])=>k.replaceAll('_',' ')+' '+v).join(' · ');more.append(summary,full);const strengths=p.strengths||p.weaknesses;if(strengths){const extra=document.createElement('p');extra.className='meta';extra.textContent=(p.strengths?'Strengths: '+String(p.strengths)+' ':'')+(p.weaknesses?'Weaknesses: '+String(p.weaknesses):'');more.append(extra);}card.setAttribute('aria-label','Draft '+p.name+', '+(p.position||p.role||'player')+', overall '+window.CageOverall.read(p));card.addEventListener('click',()=>claim(id,false));wrap.append(card,more);root.append(wrap);}tick();}
function handoff(){stopClock();$('selection').classList.add('hidden');$('handoff').classList.remove('hidden');$('game').classList.remove('hidden');$('finished').classList.add('hidden');$('passTitle').textContent=sideName(currentSide())+' · YOUR TURN';$('phase').textContent='PICK '+(game.picks.length+1)+' / 6';$('current').textContent='Pool concealed until handoff';$('clock').textContent='20';$('pool').replaceChildren();squads();$('reveal').focus({preventScroll:true});$('handoff').scrollIntoView({behavior:'auto',block:'start'});}
function startPick(){if(game.active)return;if(game.picks.length>=6){finishDraft();return;}if(game.pool.length!==15||!game.deadline){game.pool=candidates();game.deadline=Date.now()+20000;}if(game.pool.length===0){showError('No eligible footballers remain.');return;}game.active=true;$('handoff').classList.add('hidden');$('selection').classList.remove('hidden');render();saveShowdown();$('selection').setAttribute('tabindex','-1');$('selection').focus({preventScroll:true});$('selection').scrollIntoView({behavior:'auto',block:'start'});game.clock=setInterval(tick,150);}
function claim(id,automatic){if(!game.active||!game.pool.includes(id)||game.claimed.has(id))return;if(!automatic&&Date.now()>=game.deadline){id=game.pool[randomInt(game.pool.length)];automatic=true;}const s=currentSide();stopClock();game.claimed.add(id);game.used.add(id);game.picks.push({side:s,id,automatic:!!automatic});squads();showError(automatic?'Time expired: '+byId.get(id).name+' automatically drafted for '+sideName(s):sideName(s)+' selected '+byId.get(id).name);game.pool=[];handoffAfterClaim();saveShowdown();if(game.picks.length<6)$('reveal').focus({preventScroll:true});}
function handoffAfterClaim(){if(game.picks.length===6){finishDraft();return;}handoff();}
function finishDraft(){stopClock();const vs=$('versus-line');vs.replaceChildren();for(const side of ['A','VS','B']){const e=document.createElement('div');if(side==='VS'){e.className='versus-vs';e.textContent='VS';}else{e.className='versus-team '+side.toLowerCase();const h=document.createElement('h3');h.textContent=sideName(side);e.append(h);for(const pick of game.picks.filter(x=>x.side===side)){const line=document.createElement('span');line.textContent=byId.get(pick.id).name;e.append(line);}}vs.append(e);} game.finished=true;game.pool=[];$('handoff').classList.add('hidden');$('selection').classList.add('hidden');$('finished').classList.remove('hidden');$('phase').textContent='DRAFT COMPLETE';$('current').textContent='Both squads locked · 3 players each';$('clock').textContent='✓';$('reroll').disabled=true;squads();saveShowdown();$('finished').scrollIntoView({behavior:'auto',block:'start'});}
function begin(fresh=true){hideArenaOutcome();if(fresh){game.round=1;game.wins={A:0,B:0};game.used.clear();game.history=[];game.pending=null;game.champion=null;}clearMatchViewer();matchRecord=null;$('watch-again').classList.add('hidden');$('fight').disabled=false;$('tacticA').disabled=false;$('tacticB').disabled=false;stopClock();game.winner=randomInt(2)?'A':'B';game.picks=[];game.claimed.clear();game.rerolls={A:1,B:1};game.pool=[];game.finished=false;showError('');$('coinResult').textContent='COIN TOSS: '+sideName(game.winner)+' WINS FIRST PICK';$('intro').classList.add('hidden');$('game').classList.remove('hidden');$('result').textContent='';$('details').replaceChildren();$('next-round').classList.add('hidden');handoff();standings();saveShowdown();}

const SAVE_KEY='the-cage.random-showdown.v60';
function standings(){
 $('showdown-score').textContent='COMMANDER '+game.wins.A+' : '+game.wins.B+' OPPONENT';
 $('round-number').textContent='ROUND '+game.round+' / 5';
 const marks=$('round-history');marks.replaceChildren();
 for(let i=0;i<5;i++){const mark=document.createElement('span');mark.className='round-mark'+(game.history[i]?(game.history[i].result.winner===0?' a':' b'):i===game.round-1?' current':'');mark.title=game.history[i]?'Round '+(i+1)+': '+(game.history[i].result.winner===0?'Commander':'Opponent')+' won':'Round '+(i+1);marks.append(mark);}
}
function saveShowdown(){
 const state={schema:1,round:game.round,wins:game.wins,used:[...game.used],history:game.history,
 pending:game.pending,picks:game.picks,winner:game.winner,rerolls:game.rerolls,
 pool:game.pool,deadline:game.deadline,active:game.active,finished:game.finished,champion:game.champion};
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){showError('Unable to save showdown: '+e.message);}
}
function hideArenaOutcome(){$('arena-outcome').classList.add('hidden');}
function showArenaOutcome(record){
 const side=record.result.winner===0?'A':'B',isChampion=!!game.champion;
 $('arena-winner').textContent=isChampion?'THE CAGE CHAMPION: '+sideName(side):sideName(side)+' TAKES ROUND '+game.round;
 $('arena-summary').textContent='FINAL '+record.result.score.join(' : ')+' · SHOWDOWN '+game.wins.A+' : '+game.wins.B+(isChampion?' · FIRST TO THREE WINS':'');
 $('arena-next').classList.toggle('hidden',isChampion);
 $('arena-next').textContent='NEXT ROUND · '+(game.round+1)+' / 5';
 $('arena-outcome').classList.remove('hidden');
 $('arena-outcome').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}
function completeRound(record){
 if(!game.pending||game.pending!==record)return;
 game.history.push(record);game.pending=null;
 const side=record.result.winner===0?'A':'B';game.wins[side]++;
 if(game.wins[side]===3){game.champion=side;$('next-round').classList.add('hidden');
   const crown=document.createElement('div');crown.id='champion-celebration';crown.textContent='THE CAGE CHAMPION: '+sideName(side);
   $('details').replaceChildren(crown);
 }else{$('next-round').classList.remove('hidden');}
 standings();saveShowdown();showArenaOutcome(record);
}
function nextRound(){
 if(game.pending||!matchRecord||game.history.length!==game.round||game.champion||game.round>=5)return;
 game.round++;begin(false);
}
function restoreShowdown(){
 let s;try{s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){showError('Saved showdown cannot be read. Existing file was not deleted.');return;}
 if(!s)return;
 try{
  if(s.schema!==1||!Number.isInteger(s.round)||s.round<1||s.round>5||!Array.isArray(s.history)||s.history.length>5||!Array.isArray(s.used)||new Set(s.used).size!==s.used.length||s.used.some(id=>!byId.has(id)))throw Error('Unsupported saved showdown');
  let a=0,b=0,ids=new Set();
  for(let i=0;i<s.history.length;i++){const r=window.CageRecords.validate(s.history[i]);if(r.round!==i+1)throw Error('Round history mismatch');window.CageRecords.reproduce(r);for(const id of r.config.teams.flat()){if(ids.has(id))throw Error('Repeated historical player');ids.add(id);}if(r.result.winner===0)a++;else b++;}
  if(a!==s.wins.A||b!==s.wins.B)throw Error('Invalid recorded wins');
  if(s.pending){const r=window.CageRecords.validate(s.pending);window.CageRecords.reproduce(r);if(r.round!==s.round||s.history.length!==s.round-1)throw Error('Pending round mismatch');}
  if(s.history.length!==s.round-1 && !(s.history.length===s.round && !s.pending))throw Error('Invalid round count');
  if(!Array.isArray(s.picks)||s.picks.length>6||s.picks.some(x=>!['A','B'].includes(x.side)||!byId.has(x.id)))throw Error('Invalid draft picks');
  const completedCurrent=s.history.length===s.round&&!s.pending;if(completedCurrent){const teams=['A','B'].map(side=>s.picks.filter(x=>x.side===side).map(x=>x.id));if(JSON.stringify(teams)!==JSON.stringify(s.history.at(-1).config.teams))throw Error('Current picks differ from completed round');}else for(const x of s.picks){if(ids.has(x.id))throw Error('Footballer reused in another round');ids.add(x.id);}
  if(ids.size!==s.used.length||s.used.some(id=>!ids.has(id)))throw Error('Exhaustion mismatch');
  if(!Array.isArray(s.pool)||![0,15].includes(s.pool.length)||new Set(s.pool).size!==s.pool.length||s.pool.some(id=>!byId.has(id)||ids.has(id)))throw Error('Invalid saved candidate pool');
  if(!s.rerolls||!Number.isInteger(s.rerolls.A)||!Number.isInteger(s.rerolls.B)||![0,1].includes(s.rerolls.A)||![0,1].includes(s.rerolls.B))throw Error('Invalid saved rerolls');
  if(!Number.isFinite(s.deadline)||s.deadline<0||typeof s.active!=='boolean'||(s.active&&s.pool.length!==15))throw Error('Invalid saved draft timer');
  if(s.picks.length===6&&s.pending){const teams=['A','B'].map(side=>s.picks.filter(x=>x.side===side).map(x=>x.id));if(JSON.stringify(teams)!==JSON.stringify(s.pending.config.teams))throw Error('Pending squads differ from draft');}
  game.round=s.round;game.wins={A:a,B:b};game.history=s.history;game.used=new Set(s.used);
  game.picks=s.picks;game.claimed=new Set(s.picks.map(x=>x.id));
  game.winner=['A','B'].includes(s.winner)?s.winner:null;
  game.rerolls=s.rerolls||{A:1,B:1};game.pool=Array.isArray(s.pool)?s.pool:[];game.deadline=s.deadline||0;game.active=!!s.active;
  game.finished=!!s.finished;game.pending=s.pending||null;game.champion=s.champion||null;
  if(game.champion && game.wins[game.champion]!==3)throw Error('Invalid champion');
  $('intro').classList.add('hidden');$('game').classList.remove('hidden');standings();squads();
  if(game.finished){finishDraft();const currentRoundCompleted=game.history.length===game.round;
    matchRecord=game.pending||(currentRoundCompleted?game.history.at(-1):null);
    if(!matchRecord){$('fight').disabled=false;$('tacticA').disabled=false;$('tacticB').disabled=false;$('next-round').classList.add('hidden');$('watch-again').classList.add('hidden');$('result').textContent='SQUADS LOCKED · READY TO ENTER THE CAGE';}
    if(matchRecord){$('fight').disabled=true;$('tacticA').disabled=true;$('tacticB').disabled=true;
      $('tacticA').value=matchRecord.config.tactics[0];$('tacticB').value=matchRecord.config.tactics[1];
      $('watch-again').classList.remove('hidden');
      $('result').textContent=game.pending?'MATCH RECORD RECOVERED · WATCH REPLAY':(matchRecord.result.winner===0?'COMMANDER':'OPPONENT')+' WINS · '+matchRecord.result.score.join(' : ');
      if(!game.pending&&!game.champion)$('next-round').classList.remove('hidden');
    }
  }else{
    game.active=false;handoff();game.pool=Array.isArray(s.pool)?s.pool:[];game.deadline=s.deadline||0;
  }
  showError('Saved showdown restored. Exhausted players remain unavailable.');
 }catch(e){showError('Saved showdown not loaded: '+e.message+'. Your saved data was preserved.');}
}

let matchViewer=null, matchRecord=null;
function clearMatchViewer(){
  if(matchViewer){matchViewer.destroy();matchViewer=null;}
  $('draft-arena').classList.add('hidden');
  $('draft-arena-viewer').replaceChildren();
}
function fight(){
  if(matchRecord){showError('Match already locked. Start a new draft to play again.');return;}
  if(!game.finished||!engine||typeof engine.simulate!=='function'){showError('Match engine unavailable.');return;}
  clearMatchViewer();hideArenaOutcome();
  const teams=['A','B'].map(side=>game.picks.filter(p=>p.side===side).map(p=>p.id));
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];
  const config={teams,tactics:[$('tacticA').value,$('tacticB').value],seed,mode:'ko',traits:{enabled:true}};
  try{
    const result=engine.simulate(config);
    const record=window.CageRecords.make(config,result,game.round);
    game.pending=record;matchRecord=record;saveShowdown();
    const names=Object.fromEntries(teams.flat().map(id=>[id,byId.get(id)?.name||id]));
    const lines=window.CageCommentary.commentate(result,seed,['Commander','Opponent']);
    $('result').textContent='MATCH IN PROGRESS';
    $('details').replaceChildren();
    $('draft-arena').classList.remove('hidden');
    matchViewer=window.CageViewer.mount($('draft-arena-viewer'),record,{mode:'live',speed:'dynamic',autoplay:false,draftMatch:true,names,lines,showdown:{A:game.wins.A,B:game.wins.B,label:'BEFORE ROUND '+game.round}});
    matchViewer.on('end',()=>{completeRound(record);$('watch-again').classList.remove('hidden');
      $('result').textContent=(result.winner===0?'COMMANDER':'OPPONENT')+' WINS · '+result.score.join(' : ');
      const goal=result.events.find(e=>e.type==='goal');
      if(!game.champion)$('details').textContent=goal?'Winning goal: '+(byId.get(goal.actor)?.name||goal.actor):'Match completed';
    });
    matchRecord=record;
    $('fight').disabled=true;$('tacticA').disabled=true;$('tacticB').disabled=true;
    matchViewer.play();
    $('draft-arena').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }catch(e){clearMatchViewer();showError('Match viewer error: '+e.message);}
}
$('begin').addEventListener('click',begin);
$('reveal').addEventListener('click',startPick);
$('reroll').addEventListener('click',()=>{if(!game.active)return;const s=currentSide();if(!game.rerolls[s])return;if(Date.now()>=game.deadline){tick();return;}game.rerolls[s]=0;const old=game.pool.slice();game.pool=candidates(old);if(game.pool.length===0)game.pool=candidates();render();saveShowdown();$('selection').focus({preventScroll:true});});
$('restart').addEventListener('click',()=>{if((game.history.length>0||game.pending||game.finished)&&!window.confirm('Discard this showdown, all round results, and its saved progress?'))return;localStorage.removeItem(SAVE_KEY);game.round=1;game.wins={A:0,B:0};game.used.clear();game.history=[];game.pending=null;game.champion=null;standings();hideArenaOutcome();clearMatchViewer();matchRecord=null;$('watch-again').classList.add('hidden');$('fight').disabled=false;$('tacticA').disabled=false;$('tacticB').disabled=false;stopClock();$('intro').classList.remove('hidden');$('game').classList.add('hidden');$('handoff').classList.add('hidden');$('hints').checked=false;game.finished=false;});
$('fight').addEventListener('click',fight);
$('next-round').addEventListener('click',nextRound);
$('arena-next').addEventListener('click',nextRound);
$('arena-replay').addEventListener('click',()=>{$('watch-again').click();});
$('viewToggle').addEventListener('click',()=>{
 const selected=$('selection'),quick=selected.classList.toggle('quick-view');
 $('viewToggle').setAttribute('aria-pressed',String(quick));
 $('viewToggle').textContent=quick?'FULL SCOUT VIEW':'QUICK VIEW · ALL 15';
});

$('watch-again').addEventListener('click',()=>{
  if(!matchRecord)return;
  clearMatchViewer();
  const teams=matchRecord.config.teams;
  const names=Object.fromEntries(teams.flat().map(id=>[id,byId.get(id)?.name||id]));
  const lines=window.CageCommentary.commentate(matchRecord.result,matchRecord.config.seed,['Commander','Opponent']);
  $('draft-arena').classList.remove('hidden');
  const pending=game.pending===matchRecord;
  matchViewer=window.CageViewer.mount($('draft-arena-viewer'),matchRecord,{mode:pending?'live':'replay',draftMatch:true,speed:'dynamic',autoplay:false,names,lines,showdown:{A:game.wins.A,B:game.wins.B,label:'BEFORE ROUND '+game.round}});
  if(pending)matchViewer.on('end',()=>{completeRound(matchRecord);$('result').textContent=(matchRecord.result.winner===0?'COMMANDER':'OPPONENT')+' WINS · '+matchRecord.result.score.join(' : ');});
  else if(game.history.length===game.round)showArenaOutcome(matchRecord);
  matchViewer.play();
  $('draft-arena').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});

$('hints').addEventListener('change',()=>{$('hintNote').textContent=$('hints').checked?'Indicators require verified class-counter relationships. No speculative advice is shown.':'Optional guidance shows only when supported by actual player class data.';});
window.CageRandomDraft={snapshot:()=>({winner:game.winner,picks:game.picks.map(x=>({...x})),rerolls:{...game.rerolls},pool:game.pool.slice(),active:game.active,finished:game.finished,round:game.round,wins:{...game.wins},used:[...game.used],history:game.history.map(r=>({round:r.round,winner:r.result.winner,teams:r.config.teams})),pending:!!game.pending,champion:game.champion}),sample};
standings();if(roster.length<21)showError('Roster failed to load or has insufficient distinct players.');else restoreShowdown();
})();