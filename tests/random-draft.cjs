const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const s=`(async()=>{const out=document.createElement('pre');out.id='draft-test-output';document.body.append(out);const check=(v,m)=>{if(!v)throw Error(m)};const $=id=>document.getElementById(id);
try{
check(window.__cageBootErrors?.length===0,'boot errors: '+JSON.stringify(window.__cageBootErrors));check(window.THE_CAGE_PLAYERS.length===194,'exact V5.7 roster size');check(window.CageEngine?.VERSION==='cage-t3-6','T3 engine loaded, got '+window.CageEngine?.VERSION);
check(!document.querySelector('#hints').checked,'hints OFF default');
$('hints').checked=true;
$('begin').click();let g=window.CageRandomDraft.snapshot();check(['A','B'].includes(g.winner),'coin toss winner');
let count={A:0,B:0},used=new Set();
for(let i=0;i<6;i++){
 const expected=i%2===0?g.winner:(g.winner==='A'?'B':'A');
 $('reveal').click();g=window.CageRandomDraft.snapshot();
 check(g.active&&g.pool.length===15,'pool of 15');
 check(new Set(g.pool).size===15,'unique pool');check($('pool').querySelectorAll('.card-ovr').length===15,'every draft card has OVR badge');for(const card of $('pool').querySelectorAll('.card-ovr'))check(/^[0-9]{2}OVR$/.test(card.textContent),'overall card format');
 check(g.pool.every(id=>!used.has(id)),'no mirror');
 const before=document.getElementById('clock').textContent;
 if(i===1)check(!$('counterAdvice').classList.contains('hidden')&&$('counterAdvice').textContent.length>5,'optional counterplay displayed');
 if(i<2){const previous=new Set(g.pool);$('reroll').click();g=window.CageRandomDraft.snapshot();check(g.rerolls[expected]===0,'reroll deducted');check(g.pool.length===15,'reroll size');check(g.pool.every(id=>!previous.has(id)),'reroll does not repeat previous pool');check($('reroll').disabled,'reroll once');check(Number($('clock').textContent)<=Number(before),'reroll timer not reset');}
 const first=g.pool[0];$('pool').querySelector('button.card').click();g=window.CageRandomDraft.snapshot();
 check(g.picks.length===i+1,'one claimed per turn');
 check(g.picks[i].side===expected,'ABABAB');
 check(!used.has(g.picks[i].id),'claims globally unique');
 used.add(g.picks[i].id);count[expected]++;check($('squad'+expected).textContent.includes('OVR '),'squad roster shows overall');
}
check(g.finished&&count.A===3&&count.B===3,'both squads 3');
$('fight').click();check($('result').textContent.includes('WINS'),'engine match integration '+$('error').textContent);
$('restart').click();$('begin').click();$('reveal').click();
const realNow=Date.now;Date.now=()=>realNow()+25000;
await new Promise(resolve=>setTimeout(resolve,400));Date.now=realNow;
const timeoutState=window.CageRandomDraft.snapshot();
check(timeoutState.picks.length===1&&timeoutState.picks[0].automatic===true,'random auto-pick on timeout');
out.textContent='DRAFT_TEST_PASS 194 roster, OFF default, fair-side coin, 15 unique, no mirrors, 1 reroll, ABABAB, 3v3 engine simulation';
}catch(e){out.textContent='DRAFT_TEST_FAIL '+e.stack;}
})();`;
const fixture=path.join(root,'draft-e2e.html');
fs.writeFileSync(fixture,fs.readFileSync(path.join(root,'draft.html'),'utf8').replace('</head>','<script>window.__cageBootErrors=[];window.addEventListener(\'error\',e=>window.__cageBootErrors.push(e.message));</script></head>').replace('</body>','<script>'+s+'</script></body>'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe',url=require('node:url').pathToFileURL(fixture).href;
const result=cp.spawnSync(chrome,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=8000','--dump-dom',url],{encoding:'utf8',timeout:30000,maxBuffer:16e6});
const found=result.stdout?.match(/<pre id="draft-test-output">([\s\S]*?)<\/pre>/)?.[1]; console.log(found||result.stderr?.slice(-2000)||'No result');
assert(found?.startsWith('DRAFT_TEST_PASS'),found||'Browser fixture failed');