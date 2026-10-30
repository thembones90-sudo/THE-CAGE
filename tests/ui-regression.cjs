const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const script=`
(async()=>{
const out=document.createElement('pre');out.id='regression-result';document.body.append(out);
const check=(v,m)=>{if(!v)throw Error(m)},$=id=>document.getElementById(id);
function search(side,i,name){const slot=$('slots'+side).children[i],input=slot.querySelector('input');input.value=name;input.dispatchEvent(new Event('input'));slot.querySelector('button').click();return slot;}
function claim(side,i,name){const slot=search(side,i,name),b=slot.querySelector('.confirm');check(b,'missing claim '+name);b.click();}
try{
check([...document.querySelectorAll('input')].every(e=>e.value===''),'initial blank');
let slot=search('A',0,'Jaap Stam');check(slot.querySelector('.confirm'),'Stam resolves');
slot.querySelector('input').value='Invented';slot.querySelector('input').dispatchEvent(new Event('input'));
check(!slot.querySelector('.confirm'),'stale confirmation cleared');
claim('A',0,'R9');check($('slotsA').children[0].querySelector('input').value==='Ronaldo Nazário','canonical input');
slot=search('B',0,'Ronaldo Nazario');check(!slot.querySelector('.confirm')&&slot.textContent.includes('already claimed'),'early unavailable feedback');
// UI boundary fixture: choose real seeded results with a specified winner to cover 2-2 and a fifth round.
const real=window.CageEngine.simulate,sequence=[0,1,0,1,0];let roundIndex=0;
window.CageEngine.simulate=config=>{for(let seed=1;seed<1000;seed++){const result=real({...config,seed});if(result.winner===sequence[roundIndex]){config.seed=seed;return result;}}throw Error('no seed for fixture winner');};
const roster=window.THE_CAGE_PLAYERS.filter(p=>p.id!=='ronaldo-nazario');
for(let r=0;r<5;r++){
roundIndex=r;
let offset=r===0?0:r*6-1;
const order=r%2?['B','A']:['A','B'];
for(let i=0;i<3;i++)for(const side of order){if(r===0&&side==='A'&&i===0)continue;check(window.CageShowdown.snapshot().turn===side,'alternating claim turn');claim(side,i,roster[offset++].name);}
$('lockA').click();$('lockB').click();check($('tacticA').disabled&&$('tacticB').disabled,'locked tactics');
$('pace').value=r===0?'fast':'instant';
if(r===0){const simulate=window.CageEngine.simulate;window.CageEngine.simulate=()=>{throw Error('Cage golden-goal safety limit: test fixture');};$('play').click();check($('status').textContent.includes('Match void'),'safety cap awards no winner');check(window.CageShowdown.snapshot().used.length===6&&window.CageShowdown.snapshot().history.length===0,'void preserves claims');check(!$('play').disabled,'void round can retry');window.CageEngine.simulate=simulate;}
$('play').click();
if(r===0){check(!$('report').textContent.includes('Goals'),'no premature statistics');check($('arena').textContent.includes('LIVE'),'live arena');check($('pace').disabled,'pace frozen');check(document.querySelectorAll('.pitch-player').length===6,'six pitch players');
await new Promise(resolve=>{const timer=setInterval(()=>{if(window.CageShowdown.snapshot().roundFinished){clearInterval(timer);resolve();}},50);});}
let s=window.CageShowdown.snapshot();check(s.roundFinished,'round finishes');check(s.used.length===(r+1)*6,'claims retained');check($('report').textContent.includes('Goals'),'final statistics');
check(document.querySelectorAll('.event.goal').length===1,'only winning goal highlighted');
check($('recap').textContent.includes('winning goal'),'factual recap');
const before=JSON.stringify({wins:s.wins,used:s.used,round:s.round,history:s.history});
window.CageEngine.simulate=real;$('pace').value='instant';$('replay-match').click();
const after=window.CageShowdown.snapshot();check(before===JSON.stringify({wins:after.wins,used:after.used,round:after.round,history:after.history}),'replay cannot add wins or claims');
check($('arena').textContent.includes('REPLAY'),'replay verified');
window.CageEngine.simulate=config=>{for(let seed=1;seed<1000;seed++){const result=real({...config,seed});if(result.winner===sequence[roundIndex]){config.seed=seed;return result;}}throw Error('no seed');};
if(r<4){$('next').click();check(!document.body.classList.contains('match-view'),'draft restored');const first=(r+1)%2?'B':'A';slot=search(first,0,'R9');check(!slot.querySelector('.confirm'),'previous-round reuse blocked');}
}
const final=window.CageShowdown.snapshot();check(final.wins.A===3&&final.wins.B===2,'five-round score');check($('next').disabled,'sixth round disabled');$('next').click();check(window.CageShowdown.snapshot().round===5,'no sixth round');
$('reset').click();check(window.CageShowdown.snapshot().used.length===0,'reset clears claims');check(!$('pace').disabled&&!$('tacticA').disabled,'reset restores settings');check(document.querySelectorAll('#slotsA input:disabled').length===0&&document.querySelectorAll('#slotsB input:disabled').length===3,'reset starts with Commander turn');
out.textContent='UI_REGRESSION_PASS: alternating turns, stale search, exhausted claims, timed playback, six players, five rounds 3-2, reproducible replays without scoring twice, recaps, reset';
}catch(e){out.textContent='UI_REGRESSION_FAIL: '+e.stack;}
})();`;
const fixture=path.join(root,'ui-regression.html');
fs.writeFileSync(fixture,fs.readFileSync(path.join(root,'index.html'),'utf8').replace('</body>','<script>'+script+'</script></body>'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const result=cp.spawnSync(chrome,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=45000','--dump-dom',require('node:url').pathToFileURL(fixture).href],{encoding:'utf8',timeout:60000,maxBuffer:8e6});
assert(!result.error,String(result.error));
const output=result.stdout.match(/<pre id="regression-result">([\s\S]*?)<\/pre>/)?.[1];
console.log(output||'No regression result');assert(output?.startsWith('UI_REGRESSION_PASS'),output||result.stderr);
