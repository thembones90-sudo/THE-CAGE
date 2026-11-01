(async()=>{const out=document.createElement('pre');out.id='v64-legacy-result';document.body.append(out);const $=id=>document.getElementById(id);
try{const stage=sessionStorage.getItem('v64-old-stage');
 if(stage==='reload'){const s=window.CageRandomDraft.snapshot();if(s.mode!=='hotseat'||s.difficulty!=='competitive'||s.picks.length!==1||$('reveal').disabled||$('cpuDifficulty').disabled===false)throw Error('legacy hotseat save changed modes '+JSON.stringify(s));sessionStorage.removeItem('v64-old-stage');localStorage.removeItem('the-cage.random-showdown.v60');out.textContent='V64_LEGACY_HOTSEAT_PASS old schema1 save restored as hotseat with human reveal';return;}
 localStorage.removeItem('the-cage.random-showdown.v60');
 $('begin').click();$('reveal').click();$('pool').querySelector('button.card').click();
 // New showdowns are mandatory 3+1 (owner rule 2026-11-01). Rebuild the pre-V6.6 schema-1 hotseat save from the current one so legacy resume stays covered.
 const s=JSON.parse(localStorage.getItem('the-cage.random-showdown.v66-gk'));s.schema=1;s.keeperMode=false;delete s.keeperUsed;delete s.keeperState;delete s.mode;delete s.difficulty;localStorage.removeItem('the-cage.random-showdown.v66-gk');localStorage.setItem('the-cage.random-showdown.active-v66','standard');
 localStorage.setItem('the-cage.random-showdown.v60',JSON.stringify(s));sessionStorage.setItem('v64-old-stage','reload');location.reload();
}catch(e){out.textContent='V64_LEGACY_HOTSEAT_FAIL '+e.stack;}})();
