(()=>{
 const $=id=>document.getElementById(id),assert=(x,m)=>{if(!x)throw Error(m)};
 assert(!$('hints').checked,'Hints not OFF by default');
 $('begin').click();const used=new Set();
 let mounts=0;let mounted=null;const original=window.CageViewer.mount;
 window.CageViewer.mount=(...args)=>{mounts++;mounted=original(...args);return mounted;};
 for(let round=1;round<=5;round++){
  for(let pick=0;pick<6;pick++){
   $('reveal').click();
   const state=window.CageRandomDraft.snapshot();
   assert(state.pool.length===15,'Not 15 candidates in round '+round+' pick '+pick);
   assert(state.pool.every(id=>!used.has(id)),'Exhausted player reappeared');
   if(round===1&&pick===0){$('viewToggle').click();assert($('selection').classList.contains('quick-view'),'Quick view broken');$('viewToggle').click();}
   const selected=state.pool[0];used.add(selected);$('pool').querySelector('button.card').click();
  }
  $('fight').click();
  assert(!!document.querySelector('#draft-arena .cv-canvas'),'Real arena missing');
  assert(!!mounted,'Viewer did not mount');
  assert($('result').textContent==='MATCH IN PROGRESS','Premature result');
  mounted.setSpeed('instant');
  assert(!$('arena-outcome').classList.contains('hidden'),'No arena-side result');
  const series=window.CageRandomDraft.snapshot();
  assert(series.history.length===round,'Round not recorded');
  if(series.champion){
   assert(Math.max(series.wins.A,series.wins.B)===3,'Wrong champion');
   assert($('arena-next').classList.contains('hidden'),'Next round shown after champion');
   assert(!!$('champion-celebration'),'Champion graphic absent');
   assert(used.size===round*6,'Player count mismatch');
   window.CageViewer.mount=original;
   return {rounds:round,wins:series.wins,uniquePlayers:used.size,viewerMounts:mounts,champion:series.champion};
  }
  $('arena-next').click();
  assert(window.CageRandomDraft.snapshot().round===round+1,'Arena next round button broken');
 }
 throw Error('Never got a first-to-three champion');
})();