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
window.CageEngine.simulate=config=>{for(let seed=1;seed<1000;seed++){const result=real({...config,seed});if(result.winner===sequence[roundIndex])return result;}throw Error('no seed for fixture winner');};
const roster=window.THE_CAGE_PLAYERS.filter(p=>p.id!=='ronaldo-nazario');
for(let r=0;r<5;r++){
roundIndex=r;
let offset=r===0?0:r*6-1;
for(const side of ['A','B'])for(let i=0;i<3;i++){if(r===0&&side==='A'&&i===0)continue;claim(side,i,roster[offset++].name);}
$('lockA').click();$('lockB').click();check($('tacticA').disabled&&$('tacticB').disabled,'locked tactics');
$('pace').value=r===0?'fast':'instant';$('play').click();
if(r===0){check(!$('report').textContent.includes('Goals'),'no premature statistics');check($('arena').textContent.includes('LIVE'),'live arena');check($('pace').disabled,'pace frozen');check(document.querySelectorAll('.pitch-player').length===6,'six pitch players');
await new Promise(resolve=>{const timer=setInterval(()=>{if(window.CageShowdown.snapshot().roundFinished){clearInterval(timer);resolve();}},50);});}
let s=window.CageShowdown.snapshot();check(s.roundFinished,'round finishes');check(s.used.length===(r+1)*6,'claims retained');check($('report').textContent.includes('Goals'),'final statistics');
check(document.querySelectorAll('.event.goal').length===1,'only winning goal highlighted');
if(r<4){$('next').click();check(!document.body.classList.contains('match-view'),'draft restored');slot=search('A',0,'R9');check(!slot.querySelector('.confirm'),'previous-round reuse blocked');}
}
const final=window.CageShowdown.snapshot();check(final.wins.A===3&&final.wins.B===2,'five-round score');check($('next').disabled,'sixth round disabled');$('next').click();check(window.CageShowdown.snapshot().round===5,'no sixth round');
$('reset').click();check(window.CageShowdown.snapshot().used.length===0,'reset clears claims');check(!$('pace').disabled&&!$('tacticA').disabled,'reset restores settings');check(document.querySelectorAll('input:disabled').length===0,'reset restores entry');
out.textContent='UI_REGRESSION_PASS: stale search, claims, spoiler-free playback, six players, five rounds 3-2, reset';
}catch(e){out.textContent='UI_REGRESSION_FAIL: '+e.stack;}
})();`;
const fixture=path.join(root,'ui-regression.html');
fs.writeFileSync(fixture,fs.readFileSync(path.join(root,'index.html'),'utf8').replace('</body>','<script>'+script+'</script></body>'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const result=cp.spawnSync(chrome,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=30000','--dump-dom',require('node:url').pathToFileURL(fixture).href],{encoding:'utf8',timeout:60000,maxBuffer:8e6});
assert(!result.error,String(result.error));
const output=result.stdout.match(/<pre id="regression-result">([\s\S]*?)<\/pre>/)?.[1];
console.log(output||'No regression result');assert(output?.startsWith('UI_REGRESSION_PASS'),output||result.stderr);
