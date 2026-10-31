(async()=>{const out=document.createElement('pre');out.id='v64-legacy-result';document.body.append(out);const $=id=>document.getElementById(id);
try{const stage=sessionStorage.getItem('v64-old-stage');
 if(stage==='reload'){const s=window.CageRandomDraft.snapshot();if(s.mode!=='hotseat'||s.difficulty!=='competitive'||s.picks.length!==1||$('reveal').disabled||$('cpuDifficulty').disabled===false)throw Error('legacy hotseat save changed modes '+JSON.stringify(s));sessionStorage.removeItem('v64-old-stage');localStorage.removeItem('the-cage.random-showdown.v60');out.textContent='V64_LEGACY_HOTSEAT_PASS old schema1 save restored as hotseat with human reveal';return;}
 localStorage.removeItem('the-cage.random-showdown.v60');
 $('begin').click();$('reveal').click();$('pool').querySelector('button.card').click();
 const s=JSON.parse(localStorage.getItem('the-cage.random-showdown.v60'));delete s.mode;delete s.difficulty;
 localStorage.setItem('the-cage.random-showdown.v60',JSON.stringify(s));sessionStorage.setItem('v64-old-stage','reload');location.reload();
}catch(e){out.textContent='V64_LEGACY_HOTSEAT_FAIL '+e.stack;}})();
