(()=>{'use strict';
const $=id=>document.getElementById(id),E=window.CageEngine,R=window.CageRecords,players=window.THE_CAGE_PLAYERS,byId=new Map(players.map(p=>[p.id,p]));
const routeTraitPreview=E.VERSION.startsWith('cage-t3')&&/[?&]traits=preview(?:&|$)/.test(location.search);let traitPreview=routeTraitPreview;
const KEY=E.VERSION.startsWith('cage-t3')?'the-cage.showdown.t3-preview.v1':'the-cage.showdown.v1',used=new Map(),claimed={A:[null,null,null],B:[null,null,null]},locked={A:false,B:false},drafts={A:['','',''],B:['','','']};
let wins={A:0,B:0},round=1,roundFinished=false,playing=false,timer=null,history=[],pending=null,viewRecord=null,replaying=false,canSave=false,candidate=null,bootChoice=false,generation=0,recoveryBlocked=false;
const tacticHelp={balanced:'Balanced: even priorities, with no specialist emphasis.',possession:'Possession: more patient passing and shielding; fewer direct runs and shots. Pressure can trap the buildup.',press:'High Press: more defensive engagement; higher fatigue and foul risk. Beaten pressure leaves recovery work.',counter:'Counterattack: deeper defence and more direct runs; less patient buildup and fewer pressing attempts.'};
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
const storageNote=node('p','','small muted');storageNote.id='save-status';$('status').after(storageNote);
const resumeBox=node('section',undefined,'panel resume-box hidden');resumeBox.id='resume-box';const resumeText=node('p'),continueButton=node('button','Continue showdown'),freshButton=node('button','Start fresh','secondary'),exportSavedButton=node('button','Export saved session (JSON)','secondary');exportSavedButton.id='export-saved-session';resumeBox.append(resumeText,continueButton,freshButton,exportSavedButton);
exportSavedButton.onclick=()=>{const data=localStorage.getItem(KEY)||candidate&&JSON.stringify(candidate);if(!data){setStatus('No saved session is available for export.',true);return;}const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='the-cage-saved-session-'+(E.VERSION.startsWith('cage-t3')?'t3':'classic')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('Saved session exported; the original remains in browser storage.');};document.querySelector('main > .grid').before(resumeBox);
const replayButton=node('button','Replay match');replayButton.id='replay-match';replayButton.disabled=true;$('next').after(replayButton);
const historyBox=node('section',undefined,'panel history-panel');historyBox.id='history';historyBox.append(node('h2','Showdown history'));const historyList=node('div');historyBox.append(historyList);$('arena').closest('section').after(historyBox);
const recap=node('div',undefined,'recap hidden');recap.id='recap';$('report').before(recap);
const viewerBox=node('section',undefined,'integrated-viewer hidden');viewerBox.id='integrated-viewer';viewerBox.setAttribute('aria-label','Actual recorded 2D football match');viewerBox.innerHTML='<div class="v5-viewer-heading"><span>LIVE IN THE CAGE</span><small>RECORDED EVENTS / EXACT MATCH SCORE</small></div><div id="v5-viewer-host"></div>'; $('arena').after(viewerBox);
let v5Controller=null,v5Monitor=null;
function destroyViewer(){if(v5Monitor!==null){clearInterval(v5Monitor);v5Monitor=null;}if(v5Controller){v5Controller.destroy();v5Controller=null;}viewerBox.classList.add('hidden');$('v5-viewer-host').replaceChildren();}
function showViewer(record,{live=false,atEnd=false}={}){
  destroyViewer();
  pitch.classList.add('hidden');
  viewerBox.classList.remove('hidden');
  const names=Object.fromEntries(record.config.teams.flat().map(id=>[id,byId.get(id)?.name||id]));
  let lines=null;
  try{lines=window.CageCommentary.commentate(record.result,record.config.seed,['Commander','Opponent']);}catch(e){console.warn('No commentary source available',e);}
  const known=history.some(r=>r.round===record.round)||pending===record;
  const previous=history.filter(r=>r.round<record.round);
  const beforeA=previous.filter(r=>r.result.winner===0).length,beforeB=previous.length-beforeA;
  v5Controller=window.CageViewer.mount($('v5-viewer-host'),record,{speed:paceToViewer($('pace').value),mode:live?'live':'replay',names,lines,showdown:known?{A:beforeA,B:beforeB,label:'BEFORE ROUND '+record.round}:null});
  if(atEnd)v5Controller.seek(v5Controller.timeline.total).pause();
  return v5Controller;
}
function paceToViewer(p){return {normal:'dynamic',fast:'fast',instant:'instant',dramatic:'dramatic'}[p]||'dynamic';}
const pitch=node('div',undefined,'pitch hidden');pitch.id='pitch';pitch.setAttribute('aria-label','Six-player match diagram');$('arena').after(pitch);
const importLabel=node('label','Load replay file');const importInput=node('input');importInput.type='file';importInput.accept='.json,application/json';importInput.id='import-replay';importLabel.htmlFor=importInput.id;historyBox.append(importLabel,importInput);const importStatus=node('p','','small');importStatus.setAttribute('role','status');historyBox.append(importStatus);
const recallHint=node('p','Enter a remembered surname, nickname or at least four letters, then press Enter to see matching full names. Confirming a claim is permanent.','small muted');recallHint.id='recall-hint';document.querySelector('main > .grid').before(recallHint);
document.querySelector('main > .grid').before(node('p',E.VERSION.startsWith('cage-t3')?
  'T3 PREVIEW: tactical balance unapproved. Full positional logs drive experimental 2D movement.':
  'CLASSIC V0.4: stable gameplay with limited positional telemetry and a static inferred off-ball shape. Use ?engine=t3 for the experimental full-positional viewer.','small badge'));
const traitNotice=node('p','15-CLASS TRAITS PREVIEW: deterministic situational class decisions enabled. Experimental balance only; this choice is recorded for exact replay.','small badge');
traitNotice.id='traits-mode-notice';document.querySelector('main > .grid').before(traitNotice);
function updateTraitNotice(){traitNotice.classList.toggle('hidden',!traitPreview);}updateTraitNotice();
for(const side of ['A','B']){const hint=node('p','','small muted');hint.id='help'+side;$('tactic'+side).after(hint);const duties=node('div',undefined,'duties small');duties.id='duties'+side;$('slots'+side).after(duties);$('tactic'+side).addEventListener('change',()=>{help();save();});}
function setStatus(text,bad=false){$('status').textContent=text;$('status').className=bad?'error':'muted';}
function firstSide(){return round%2?'A':'B';}
function turn(){const a=claimed.A.filter(Boolean).length,b=claimed.B.filter(Boolean).length;if(a+b===6)return null;const first=firstSide();return a===b?first:first==='A'?'B':'A';}
function allowed(side){return !bootChoice&&!playing&&!roundFinished&&!locked[side]&&turn()===side;}
function help(){for(const side of ['A','B']){const hint=$('help'+side);hint.textContent=tacticHelp[$('tactic'+side).value];$('duties'+side).replaceChildren();if(claimed[side].every(Boolean)){const ps=claimed[side].map(id=>byId.get(id)),shape=E.shape(ps);for(const [i,title] of ['Anchor','Creator','Attacker'].entries())$('duties'+side).append(node('div',title+': '+ps[shape.duty[i]].name));$('duties'+side).append(node('div','Roles are assigned from editorial abilities. No predicted winner.','muted'));}}}
function refresh(){
$('winsA').textContent=wins.A;$('winsB').textContent=wins.B;$('round').textContent=wins.A>=3||wins.B>=3?'SHOWDOWN COMPLETE':'ROUND '+round+' OF 5';$('pool').textContent=used.size+' used / '+(players.length-used.size)+' available';
$('play').disabled=bootChoice||recoveryBlocked||!!pending||playing||roundFinished||!locked.A||!locked.B;$('next').disabled=bootChoice||playing||!roundFinished||wins.A>=3||wins.B>=3;
for(const side of ['A','B']){$('lock'+side).disabled=bootChoice||playing||roundFinished||locked[side]||!claimed[side].every(Boolean);$('tactic'+side).disabled=bootChoice||playing||roundFinished||locked[side];for(const [i,slot] of [...$('slots'+side).children].entries()){slot.querySelector('input').disabled=!!claimed[side][i]||!allowed(side);slot.querySelector('button').disabled=!!claimed[side][i]||!allowed(side);slot.querySelectorAll('.confirm').forEach(b=>b.disabled=!allowed(side));}}
$('pace').disabled=playing||bootChoice;replayButton.disabled=playing||bootChoice||!history.length;importInput.disabled=playing||bootChoice;
document.body.classList.toggle('match-view',playing||roundFinished);document.querySelectorAll('[data-replay]').forEach(b=>b.disabled=playing||bootChoice);help();save();}
function capture(){return {schema:1,round,wins:{...wins},used:[...used],claimed:R.copy(claimed),locked:{...locked},drafts:R.copy(drafts),tactics:{A:$('tacticA').value,B:$('tacticB').value},pace:$('pace').value,roundFinished,history:R.copy(history),pending:R.copy(pending),traitsMode:traitPreview};}
function save(){if(!canSave||replaying)return;try{localStorage.setItem(KEY,JSON.stringify(capture()));storageNote.textContent='Saved on this browser automatically.';}catch(e){storageNote.textContent='Browser storage is unavailable or full. Keep this page open and export completed rounds.';}}
function claimedTile(root,input,btn,out,p){input.value=p.name;input.disabled=true;btn.disabled=true;root.classList.add('claimed');out.className='ok';out.replaceChildren(node('strong',p.name),node('span',p.country+' · Pace '+p.r.pace+' · Technique '+p.r.tech+' · Passing '+p.r.pass+' · Finishing '+p.r.finish+' · Defence '+p.r.def+' · Physical '+p.r.phys,'player-detail'));if(p.traits){out.append(node('div','TRAITS · '+p.traits.primary+' / '+p.traits.secondary,'small badge'));}if(p.careerTier||p.folklore?.length){out.append(node('div',[p.careerTier,...(p.folklore||[])].filter(Boolean).join(' · '),'small badge'));}if(p.talismanClubs?.length){out.append(node('div','TALISMAN CLUBS · '+p.talismanClubs.join(' / '),'small badge'));}}
function slot(side,i){const root=node('div',undefined,'slot'),input=node('input'),btn=node('button','Search & verify'),out=node('div',undefined,'small');const label=node('label','Footballer '+(i+1));input.id='recall-'+side+i;label.htmlFor=input.id;input.placeholder='Recall from memory';input.autocomplete='off';input.maxLength=100;input.setAttribute('aria-label',side+' footballer '+(i+1));input.value=drafts[side][i];out.setAttribute('role','status');root.append(label,input,btn,out);
function unavailable(p){if(!used.has(p.id))return false;out.textContent=p.name+' is already claimed by '+(used.get(p.id)==='A'?'Commander':'Opponent')+' for this showdown.';out.className='error';return true;}
function look(){if(!allowed(side)||claimed[side][i])return;out.replaceChildren();out.className='small';const query=input.value,stamp=generation,result=window.CageIdentity.resolve(query);if(result.error){out.textContent=result.error;out.className='error';return;}
if(result.kind==='correction')out.append(node('span','Close spelling match — confirm the identity carefully.'));
if(result.message)out.append(node('p',result.message,'small muted'));
for(const p of result.matches){if(result.matches.length===1&&unavailable(p))return;if(used.has(p.id)){out.append(node('p',p.name+' · already claimed for this showdown.','error'));continue;}const confirm=node('button','Claim '+p.name+' · '+p.country,'confirm');out.append(confirm);confirm.onclick=()=>{if(!allowed(side)||claimed[side][i]||stamp!==generation)return;if(input.value!==query){out.replaceChildren();return;}if(unavailable(p))return;used.set(p.id,side);claimed[side][i]=p.id;drafts[side][i]=p.name;claimedTile(root,input,btn,out,p);announceTurn();refresh();};}}
input.addEventListener('input',()=>{drafts[side][i]=input.value;out.replaceChildren();out.className='small';save();});input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();look();}});btn.onclick=look;
if(claimed[side][i])claimedTile(root,input,btn,out,byId.get(claimed[side][i]));return root;}
function build(){generation++;for(const side of ['A','B']){$('slots'+side).replaceChildren();for(let i=0;i<3;i++)$('slots'+side).append(slot(side,i));}}
function announceTurn(){const side=turn();setStatus(side?(side==='A'?'Commander':'Opponent')+' to recall and claim · Commander '+claimed.A.filter(Boolean).length+'/3 · Opponent '+claimed.B.filter(Boolean).length+'/3':'Both trios claimed. Choose tactics and lock.');}
function lock(side){if(bootChoice||playing||roundFinished||!claimed[side].every(Boolean))return;locked[side]=true;setStatus((side==='A'?'Commander':'Opponent')+' trio locked.');refresh();}
function stop(){if(timer!==null)clearInterval(timer);timer=null;playing=false;}
function clearPitch(){destroyViewer();pitch.replaceChildren();pitch.classList.add('hidden');pitch.classList.remove('scored');recap.classList.add('hidden');}
function statView(record){const st=E.stats(record.result,record.config.teams);$('report').replaceChildren();const row=(label,a,b)=>{const n=node('div',undefined,'stat');n.append(node('span',String(a)),node('span',label),node('span',String(b)));return n;};$('report').append(row('','COMMANDER','OPPONENT'));for(const [label,key] of [['Possession %','poss'],['Shots','shots'],['Completed passes','passesOk'],['Successful dribbles','dribblesOk'],['Tackles','tackles'],['Interceptions','interceptions'],['Goals','goals']])$('report').append(row(label,st[0].team[key],st[1].team[key]));}
const name=id=>byId.get(id)?.name||id;
function recapView(record){const events=record.result.events,goal=events.find(e=>e.type==='goal'),goalIndex=events.indexOf(goal);let start=0;for(let i=goalIndex-1;i>=0;i--){const e=events[i];if((e.type==='turnover'||e.type==='restart'||e.type==='rebound')&&e.team===goal.team){start=i;break;}}
recap.replaceChildren(node('h3',name(goal.actor)+' · winning goal'),node('p',goal.assist&&goal.assist!==goal.actor?'Recorded assist: '+name(goal.assist):'No assist recorded.'));
const chain=events.slice(start,goalIndex+1).filter(e=>['turnover','restart','rebound','pass','through_ball','dribble_duel','wall_pass','shot_attempt','goal'].includes(e.type));const list=node('ol');for(const e of chain){let text=e.type==='turnover'?name(e.actor)+' wins possession ('+e.reason.replace(/_/g,' ')+')':e.type==='restart'?name(e.actor)+' starts possession':e.type==='rebound'?name(e.actor)+' collects the loose ball':e.type==='pass'||e.type==='through_ball'?name(e.actor)+' → '+name(e.target)+' · '+e.outcome:e.type==='goal'?name(e.actor)+' scores':e.type==='shot_attempt'?name(e.actor)+' shoots':name(e.actor)+' · '+e.outcome.replace(/_/g,' ');list.append(node('li',ETime(e.t)+' · '+text+' [event '+e.i+']'));}recap.append(node('p','Decisive possession','small muted'),list,node('p','Seed '+record.config.seed+' · '+record.engineVersion+' · '+record.rosterVersion,'small muted'));recap.classList.remove('hidden');}
function ETime(t){return window.CageCommentary.mmss(Math.floor(t));}
function download(record){const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='the-cage-round-'+record.round+'-seed-'+record.config.seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function historyView(){historyList.replaceChildren();if(!history.length)historyList.append(node('p','Completed rounds and their replay files appear here.','muted'));for(const record of history){const box=node('article',undefined,'history-round');box.append(node('strong','Round '+record.round+' · '+(record.result.winner===0?'Commander':'Opponent')+' wins '+record.result.score.join('–')),node('p',record.config.teams.map(ids=>ids.map(name).join(' / ')).join(' vs '),'small'));const replay=node('button','Replay round '+record.round),exportButton=node('button','Export replay','secondary');replay.dataset.replay=String(record.round);replay.disabled=playing;replay.onclick=()=>replayRecord(record);exportButton.onclick=()=>download(record);box.append(replay,exportButton);historyList.append(box);}}
let eventCursor=0,markers=new Map(),ball,ballPoint={x:50,y:50},flight=null;
function preparePitch(record){clearPitch();pitch.classList.remove('hidden');markers=new Map();eventCursor=0;for(const [side,ids] of record.config.teams.entries())ids.forEach((id,i)=>{const duty=record.result.shapes[side].duty[id],node_=node('div',name(id),'pitch-player side-'+side);node_.title=duty==='spear'?'Attacker':duty==='link'?'Creator':'Anchor';node_.dataset.duty=duty;const x={anchor:18,link:38,spear:63}[duty];node_.style.left=(side?100-x:x)+'%';node_.style.top=(22+i*28)+'%';pitch.append(node_);markers.set(id,node_);});ball=node('div',undefined,'ball');ball.setAttribute('aria-hidden','true');pitch.append(ball);pitch.append(node('span','Event zones · Commander →  ← Opponent','pitch-note'));ballPoint={x:50,y:50};placeBall(ballPoint);flight=null;}
function point(zone,team){return {x:team===0?12+zone.x*25:88-zone.x*25,y:{left:24,centre:50,right:76}[zone.lane]||50};}
function placeBall(p){ball.style.left=p.x+'%';ball.style.top=p.y+'%';ballPoint=p;}
function ownBall(id,p){for(const n of markers.values())n.classList.remove('on-ball');const n=markers.get(id);if(n){n.classList.add('on-ball');n.style.left=p.x+'%';n.style.top=p.y+'%';}placeBall(p);}
function renderEvent(e,record){if(flight){clearTimeout(flight);flight=null;}if(e.positions){const cells=new Map();for(const [id,pos] of Object.entries(e.positions)){const key=pos.x+','+pos.y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(id);}for(const ids of cells.values()){const pos=e.positions[ids[0]],spread=(ids.length-1)*5,centre=Math.max(10+spread,Math.min(90-spread,24+pos.y*26));ids.forEach((id,i)=>{const marker=markers.get(id);if(marker){marker.style.left=(12+pos.x*25)+'%';marker.style.top=(centre+(i-(ids.length-1)/2)*10)+'%';marker.dataset.cell=pos.x+','+pos.y;marker.title=name(id)+' · cell '+marker.dataset.cell;marker.classList.remove('on-ball','involved');}});}const owner=(e.type==='pass'||e.type==='through_ball')&&e.outcome==='complete'?e.target:e.actor,pos=e.positions[owner];if(pos){markers.get(owner)?.classList.add('on-ball');placeBall({x:12+pos.x*25,y:24+pos.y*26});}if(e.type==='shot_attempt')placeBall({x:e.team===0?98:2,y:50});pitch.querySelector('.pitch-note').textContent='Recorded cells · shared-cell labels separated · Commander →  ← Opponent';}if(!e.positions&&e.zone&&e.actor&&markers.has(e.actor)){const p=point(e.zone,e.team);ownBall(e.actor,p);if((e.type==='pass'||e.type==='through_ball')&&e.outcome==='complete'&&e.to){const to=point(e.to,e.team);ownBall(e.target,to);}else if(e.type==='shot_attempt'){placeBall({x:e.team===0?98:2,y:50});}else if(e.type==='turnover'){ownBall(e.actor,p);}}
else if(!e.positions&&['rebound','block','press','race'].includes(e.type)&&markers.has(e.actor)){const n=markers.get(e.actor);if(e.type==='rebound'||e.type==='block'||e.type==='press'&&e.outcome==='ball_won')ownBall(e.actor,ballPoint);else n.classList.add('involved');}
if(e.type==='goal'){placeBall({x:e.team===0?98:2,y:50});$('arena').textContent='GOAL · '+name(e.actor);pitch.classList.add('scored');}}
function paintThrough(time,record){while(eventCursor<record.result.events.length&&record.result.events[eventCursor].t<=time)renderEvent(record.result.events[eventCursor++],record);}
function finish(record,isReplay){if(!isReplay&&(roundFinished||history.some(r=>r.round===record.round)))return;stop();if(!isReplay){roundFinished=true;wins[record.result.winner===0?'A':'B']++;history.push(record);pending=null;}
viewRecord=record;statView(record);recapView(record);$('arena').textContent=(record.result.winner===0?'COMMANDER':'OPPONENT')+' WINS ROUND '+record.round+' · '+record.result.score.join(' : ')+(isReplay?' · REPLAY':'');
replaying=false;historyView();refresh();setStatus(isReplay?'Replay complete. Showdown score and claims are unchanged.':Math.max(wins.A,wins.B)===3?'SHOWDOWN COMPLETE · '+wins.A+'–'+wins.B:'Round '+round+' finished · '+wins.A+'–'+wins.B);}
function playback(record,isReplay=false){
  stop();replaying=isReplay;playing=true;viewRecord=record;refresh();
  $('commentary').replaceChildren();
  $('report').textContent='Match report unlocks at the final whistle.';
  $('arena').textContent=(isReplay?'REPLAY':'LIVE')+' / FIRST GOAL WINS';
  setStatus(isReplay?'Recorded replay. Showdown victories remain unchanged.':'THE CAGE IS LIVE');
  const ctl=showViewer(record,{live:!isReplay});
  const token=ctl;
  let finished=false;
  const endOnce=()=>{
    if(finished||v5Controller!==token||viewRecord!==record)return;
    finished=true;
    finish(record,isReplay);
    // Paint the exact recorded full-time state immediately. A completed
    // match must never display a stale 0-0 canvas while the round says 1-0.
    token.seek(token.timeline.total).render();
    token.pause();
  };
  // Replays do not have the live end callback. They must never update score.
  if(isReplay){
    ctl.on('replayEnd',()=>{if(v5Controller===token){playing=false;replaying=false;refresh();setStatus('Replay complete. Wins and claims unchanged.');}});
    const watcher=()=>{
      if(v5Controller!==token)return;
      if(ctl.playback.state==='ended'&&!ctl.playback.inReplay){
        playing=false;replaying=false;statView(record);recapView(record);$('arena').textContent='REPLAY COMPLETE / '+record.result.score.join(' : ');refresh();setStatus('Replay finished. Wins and claims unchanged.');
      }
    };
    ctl.on('end',watcher);
    // For a replay, the viewer's end event is intentionally suppressed by its clock.
    // A non-scoring monitor only changes button availability.
    v5Monitor=setInterval(()=>{if(v5Controller!==token){clearInterval(v5Monitor);v5Monitor=null;return;}if(ctl.playback.state==='ended'){clearInterval(v5Monitor);v5Monitor=null;watcher();}},150);
  }else ctl.on('end',endOnce);
  ctl.play();
  $('arena').closest('section').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
function play(){if(bootChoice||recoveryBlocked||pending||playing||roundFinished||!locked.A||!locked.B)return;const config={teams:[claimed.A.slice(),claimed.B.slice()],tactics:[$('tacticA').value,$('tacticB').value],seed:crypto.getRandomValues(new Uint32Array(1))[0],mode:'ko',...(traitPreview?{traits:{enabled:true}}:{})};try{const result=E.simulate(config);pending=R.make(config,result,round);save();playback(pending);}catch(e){stop();setStatus('Match void (seed '+config.seed+'): '+e.message+'. Your claims remain saved. Enter the Cage to retry with a new seed.',true);refresh();}}
function replayRecord(record){if(playing||bootChoice)return;try{R.reproduce(record);playback(record,true);}catch(e){setStatus(e.message,true);}}
function next(){if($('next').disabled)return;stop();round++;roundFinished=false;pending=null;viewRecord=null;for(const s of ['A','B']){locked[s]=false;claimed[s]=[null,null,null];drafts[s]=['','',''];}clearPitch();$('commentary').replaceChildren();$('report').replaceChildren();$('arena').textContent='ROUND '+round+' · NEW FOOTBALLERS REQUIRED';build();announceTurn();refresh();document.querySelector('main > .grid').scrollIntoView({behavior:'smooth',block:'start'});}
function reset(){traitPreview=routeTraitPreview;updateTraitNotice();
  // Preserve a recoverable copy before an explicitly requested fresh game
  // overwrites an incompatible, corrupt or older-version saved showdown.
  try{const raw=localStorage.getItem(KEY);if(raw&&!localStorage.getItem(KEY+'.legacy-backup'))localStorage.setItem(KEY+'.legacy-backup',raw);}catch(e){}
  stop();replaying=false;bootChoice=false;recoveryBlocked=false;canSave=true;candidate=null;resumeBox.classList.add('hidden');used.clear();wins={A:0,B:0};round=1;roundFinished=false;history=[];pending=null;viewRecord=null;for(const s of ['A','B']){locked[s]=false;claimed[s]=[null,null,null];drafts[s]=['','',''];$('tactic'+s).value='balanced';}clearPitch();$('commentary').replaceChildren();$('report').replaceChildren();$('arena').textContent='THE DOORS ARE CLOSED · THE CAGE AWAITS';build();historyView();announceTurn();refresh();}
function resume(){
  // DO NOT change live state, enable Save, or unlock Play before verifying all
  // previously decided rounds. A missing historical engine is not permission
  // to reroll a goal. Keep original browser storage byte-for-byte.
  if(recoveryBlocked)return;
  let verified;
  try{
    verified=R.validateSave(candidate);
    for(const completed of verified.history)R.reproduce(completed);
    if(verified.pending)R.reproduce(verified.pending);
  }catch(e){
    bootChoice=true;canSave=false;recoveryBlocked=true;
    continueButton.disabled=true;resumeBox.classList.remove('hidden');
    resumeText.textContent='RECOVERY BLOCKED: '+e.message+'. Your previous match has NOT been replaced. Export your saved session before starting fresh.';
    setStatus('Saved match cannot be verified with this engine and roster. No fresh seed will be generated.',true);
    refresh();return;
  }
  try{
    const s=verified;
    traitPreview=Boolean(s.traitsMode??s.history[0]?.config.traits?.enabled??s.pending?.config.traits?.enabled??false);
    updateTraitNotice();
    round=s.round;wins={...s.wins};roundFinished=s.roundFinished;
    history=s.history.map(E.freeze);pending=s.pending?E.freeze(s.pending):null;
    used.clear();s.used.forEach(([id,side])=>used.set(id,side));
    for(const side of ['A','B']){claimed[side]=s.claimed[side].slice();drafts[side]=s.drafts[side].slice();locked[side]=s.locked[side];$('tactic'+side).value=s.tactics[side];}
    $('pace').value=s.pace;
    bootChoice=false;recoveryBlocked=false;canSave=true;resumeBox.classList.add('hidden');
    build();historyView();refresh();
    if(pending)playback(pending);
    else if(roundFinished){const r=history.at(-1);viewRecord=r;showViewer(r,{live:false,atEnd:true});statView(r);recapView(r);$('arena').textContent='ROUND '+round+' COMPLETE / '+r.result.score.join(' : ');setStatus('Saved showdown restored.');}
    else announceTurn();
  }catch(e){bootChoice=true;canSave=false;recoveryBlocked=true;continueButton.disabled=true;resumeBox.classList.remove('hidden');setStatus('Recovery stopped safely: '+e.message,true);}
}
importInput.onchange=async()=>{const file=importInput.files[0];if(!file)return;try{if(file.size>4e6)throw Error('Replay file is too large.');const record=R.validate(JSON.parse(await file.text()));R.reproduce(record);importStatus.replaceChildren(node('span','Verified replay · round '+record.round+' · seed '+record.config.seed));const button=node('button','Watch imported replay');button.onclick=()=>replayRecord(E.freeze(record));importStatus.append(button);}catch(e){importStatus.textContent=e.message;}importInput.value='';};
continueButton.onclick=resume;freshButton.onclick=reset;$('lockA').onclick=()=>lock('A');$('lockB').onclick=()=>lock('B');$('play').onclick=play;$('next').onclick=next;$('reset').onclick=reset;replayButton.onclick=()=>replayRecord(history.at(-1));$('pace').addEventListener('change',save);
try{const raw=localStorage.getItem(KEY);if(raw){candidate=R.validateSave(JSON.parse(raw));bootChoice=true;resumeText.textContent='Saved showdown · round '+candidate.round+' · Commander '+candidate.wins.A+'–'+candidate.wins.B+' Opponent';resumeBox.classList.remove('hidden');}else canSave=true;}catch(e){storageNote.textContent='Saved data could not be loaded. Start fresh to replace it.';resumeText.textContent='Saved showdown is damaged or from an unsupported format. Start fresh to play.';continueButton.disabled=true;resumeBox.classList.remove('hidden');bootChoice=true;canSave=false;}
build();historyView();if(!bootChoice)announceTurn();refresh();
window.CageShowdown={snapshot:()=>({...capture(),playing,turn:turn(),recoveryBlocked,bootChoice}),find:window.CageIdentity.resolve,viewer:()=>v5Controller};
})();
