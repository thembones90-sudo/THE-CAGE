(()=>{
 const $=id=>document.getElementById(id);
 $('begin').click();
 for(let i=0;i<6;i++){$('reveal').click();$('pool').querySelector('button.card').click();}
 const old=window.CageViewer.mount;let player;
 window.CageViewer.mount=(...args)=>{player=old(...args);return player;};
 $('fight').click();player.pause();
 const shots=player.timeline.segments.filter(s=>['shot_attempt','shot_miss','free_kick'].includes(s.type));
 const pass=player.timeline.segments.filter(s=>['pass','through_ball'].includes(s.type));
 const seg=shots[0]||pass[0]||player.timeline.segments[0];
 player.seek(seg.tau0+(seg.tau1-seg.tau0)*.5);player.render();
 $('draft-arena').scrollIntoView({behavior:'instant',block:'start'});
 const score=document.querySelector('#draft-arena .cv-scoreboard'),pitch=document.querySelector('#draft-arena .cv-stage'),action=document.querySelector('#draft-arena .cv-action');
 const shell=getComputedStyle(score),picture=pitch.getBoundingClientRect(),panel=document.querySelector('#draft-arena .cv-side').getBoundingClientRect(),header=score.getBoundingClientRect();
 const actionType=['shot_attempt','shot_miss','free_kick'].includes(seg.type)?'shot':['pass','through_ball'].includes(seg.type)?'pass':'';
 const matchBox=score.querySelector('.cv-match').getBoundingClientRect();
 window.__arenaVisual={segment:seg.type,at:player.playback.tau,goals:player.timeline.goals.length,candidates:15,canvas:!!document.querySelector('.cv-canvas'),scoreboardDisplay:shell.display,columns:shell.gridTemplateColumns.split(' ').filter(Boolean).length,scoreAligned:Math.abs((matchBox.left+matchBox.right)/2-(header.left+header.right)/2)<180,pitchWidth:Math.round(picture.width),commentaryWidth:Math.round(panel.width),actionKind:action.dataset.kind,expectedActionKind:actionType};
 return window.__arenaVisual;
})();