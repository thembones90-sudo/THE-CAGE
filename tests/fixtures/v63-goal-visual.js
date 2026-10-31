(()=>{
 const $=id=>document.getElementById(id);
 $('begin').click();
 for(let i=0;i<6;i++){$('reveal').click();$('pool').querySelector('button.card').click();}
 let player=null;const mount=window.CageViewer.mount;
 window.CageViewer.mount=(...args)=>{player=mount(...args);return player;};
 $('fight').click();player.pause();
 const goal=player.timeline.goals[0];
 if(!goal)throw Error('Match has no recorded goal');
 const root=document.querySelector('#draft-arena .cv-root'),overlay=document.querySelector('#draft-arena .cv-golden');
 player.seek(Math.max(0,goal.tau-.15));player.render();
 if(!overlay.hidden||root.dataset.goalSide)throw Error('Goal effect visible before goal');
 player.playback.play();player.playback.advance(.45);player.render();
 const cue=player.cues.find(x=>x.type==='goal');
 if(!cue||cue.goalEventIndex!==goal.i)throw Error('Goal cue not backed by recorded event');
 const doors=overlay.querySelectorAll('.cv-golden-doors i');
 const shown=!overlay.hidden,correctTeam=root.dataset.goalSide===(goal.team===0?'a':'b');
 const correctScorer=overlay.querySelector('.cv-golden-scorer')?.textContent===window.THE_CAGE_PLAYERS.find(x=>x.id===goal.actor)?.name;
 const before=player.playback.tau;
 player.seek(0);player.render();
 const hiddenAfterSeek=overlay.hidden&&!root.dataset.goalSide;
 window.CageViewer.mount=mount;
 return {shown,doors:doors.length,correctTeam,correctScorer,hiddenAfterSeek,at:before,source:cue.source,goalIndex:cue.goalEventIndex};
})();