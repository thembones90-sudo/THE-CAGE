const fs=require('fs');const root='A:/THE CAGE/';let h=fs.readFileSync(root+'showdown.html','utf8');const inject=`
<script>
(function(){
const out=document.createElement('pre');out.id='testResult';document.body.append(out);
function run(){
try{
document.getElementById('pace').value='instant';
for(let round=0;round<5;round++){
const st=window.CageShowdown.snapshot();
if(st.wins.A>=3||st.wins.B>=3)break;
for(const side of ['A','B'])for(let i=0;i<3;i++){
const p=window.THE_CAGE_PLAYERS[round*6+(side==='B'?3:0)+i];
const slots=document.getElementById('slots'+side).children;
const input=slots[i].querySelector('input');input.value=p.name;slots[i].querySelector('button').click();
const confirm=slots[i].querySelector('.confirm');if(!confirm)throw Error('no confirm: '+p.name);confirm.click();
}
document.getElementById('lockA').click();document.getElementById('lockB').click();
document.getElementById('play').click();
const next=window.CageShowdown.snapshot();
if(!next.roundFinished)throw Error('unfinished '+round);
if(next.wins.A+next.wins.B!==round+1)throw Error('score '+round);
if(round<4&&next.wins.A<3&&next.wins.B<3)document.getElementById('next').click();
}
const s=window.CageShowdown.snapshot();
if(Math.max(s.wins.A,s.wins.B)!==3)throw Error('no three wins');
if(s.used.length<18)throw Error('used lost');
out.textContent='E2E_PASS '+JSON.stringify(s);
}catch(e){out.textContent='E2E_FAIL '+e.stack;}}
setTimeout(run,100);
})();
</script>`;h=h.replace('</body>',inject+'</body>');fs.writeFileSync(root+'showdown-e2e.html',h);console.log('fixture created');