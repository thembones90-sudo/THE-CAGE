(async()=>{
 const out=document.createElement('pre');out.id='v56-cinema-test';document.body.append(out);
 const ok=(x,msg)=>{if(!x)throw Error(msg)},$=id=>document.getElementById(id);
 function claim(side,i,p){
  const slot=$('slots'+side).children[i],input=slot.querySelector('input');
  input.value=p.name;input.dispatchEvent(new Event('input'));slot.querySelector('button').click();
  const confirm=[...slot.querySelectorAll('.confirm')].find(b=>b.textContent.includes(p.name))||slot.querySelector('.confirm');
  ok(confirm,'unable to claim '+p.name);confirm.click();
 }
 try{
  ok(window.THE_CAGE_PLAYERS.length===194,'roster missing');
  const people=window.THE_CAGE_PLAYERS.filter(p=>window.CageIdentity.resolve(p.name).matches?.some(x=>x.id===p.id));
  let j=0;for(let i=0;i<3;i++)for(const side of ['A','B'])claim(side,i,people[j++]);
  $('lockA').click();$('lockB').click();$('pace').value='normal';$('play').click();
  const ctl=window.CageShowdown.viewer(),snap=window.CageShowdown.snapshot();
  ok(ctl&&snap.pending,'match viewer missing');
  const record=snap.pending,overlay=document.querySelector('#integrated-viewer [data-k=golden]');
  const button=document.querySelector('#integrated-viewer [data-k=sound]');
  const holder=document.querySelector('#integrated-viewer [data-k=goalcard]');
  ok(overlay&&button&&holder,'V5.6 controls not mounted');
  ok(button.textContent==='Sound: Off'&&button.getAttribute('aria-pressed')==='false','sound must be silent by default');
  ok(overlay.hidden,'goal shown before recorded event');
  const g=ctl.timeline.goals[0];ok(g,'real match has no goal event');
  ctl.pause();ctl.seek(Math.max(0,g.tau-.23));ctl.play();ctl.playback.advance(2);ctl.render();
  ok(!overlay.hidden,'goal cinematic missing at real event crossing goalTau='+g.tau+' actualTau='+ctl.playback.tau+' state='+ctl.playback.state+' goalShown='+!holder.hidden+' inner='+overlay.textContent.slice(0,60));
  ok(overlay.textContent.includes('FINAL STRIKE')&&overlay.textContent.includes('GOAL'),'golden goal reveal malformed');
  const scorer=window.THE_CAGE_PLAYERS.find(p=>p.id===g.actor).name;
  ok(overlay.textContent.toLowerCase().includes(scorer.toLowerCase()),'wrong scorer name');
  ok(overlay.textContent.includes('RECORDED EVENT'),'goal not marked as recorded');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
   ok(getComputedStyle(overlay).animationName==='none','reduced-motion cinematic still animates');
   const reduced=window.CageGoalExperience.phase({tau:g.tau},g.tau,0,0,true);
   ok(reduced.flash===0,'reduced-motion should suppress impact flashes');
  }

  ok(overlay.querySelector('.cv-golden-score'),'recorded score not displayed');
  ok(holder.hidden,'old goal plaque must not obscure cinematic');
  const slider=document.querySelector('#integrated-viewer [data-k=seek]');
  slider.value='0';slider.dispatchEvent(new Event('input'));ctl.render();
  ok(overlay.hidden,'manual slider must immediately dismiss ongoing celebration');
  ctl.seek(Math.max(0,g.tau-.23));ctl.play();ctl.playback.advance(2);ctl.render();
  ok(!overlay.hidden,'second authentic crossing should restore cinematic');

  await new Promise(r=>setTimeout(r,3100));ctl.render();
  ok(overlay.hidden&&!holder.hidden,'cinematic did not hand off to persistent goal plaque');
  const beforeHash=record.result.eventHash;
  ctl.seek(0);ctl.render();ok(overlay.hidden,'scrub backward did not hide active celebration');
  button.click();ok(button.getAttribute('aria-pressed')==='true','sound opt-in switch failed');
  button.click();ok(button.getAttribute('aria-pressed')==='false','sound switch not reversible');
  ctl.seek(ctl.timeline.total-1);ctl.play();ctl.playback.advance(20);ctl.render();
  const finished=window.CageShowdown.snapshot();
  ok(finished.history.length===1&&finished.wins.A+finished.wins.B===1,'goal not awarded exactly once');
  ok(finished.history[0].result.eventHash===beforeHash,'presentation changed recorded match');
  ok(ctl.replayGoal()===true,'replay unavailable');
  let steps=0;while(ctl.playback.state==='playing'&&steps++<10000)ctl.playback.advance(1);
  ctl.render();const after=window.CageShowdown.snapshot();
  ok(after.history.length===1&&after.wins.A+after.wins.B===1,'goal replay awarded duplicate win');
  ok(after.history[0].result.eventHash===beforeHash,'replay record changed');
  ok(overlay.textContent.includes('SLOW-MOTION REPLAY'),'replay cinematic not distinguished');
  out.textContent='V57_CINEMATIC_BROWSER_PASS 194 roster, real goal, original scorer and score, optional sound OFF/ON/OFF, seek hides overlay, replay no extra win, hash immutable';
 }catch(e){out.textContent='V56_CINEMATIC_BROWSER_FAIL '+e.stack;}
})();