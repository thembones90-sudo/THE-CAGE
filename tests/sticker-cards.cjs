'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),work=path.join(root,'work'),dir=fs.mkdtempSync(path.join(work,'card-check-'));
assert.equal(path.dirname(path.resolve(dir)),work,'Test output must stay inside work');
const html=fs.readFileSync(path.join(root,'draft.html'),'utf8');
const head=html.slice(0,html.indexOf('<body>')).replace('<head>','<head><base href="/">');
const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
const loader=scripts.slice(0,scripts.indexOf('src/engine/legacy-v04.js')).concat('src/draft-cards.js').map(p=>'<script src="'+p+'"></script>').join('');
const checks=String.raw`
const out=document.createElement('pre');out.id='card-result';out.style.whiteSpace='pre-wrap';out.style.overflowWrap='anywhere';document.body.append(out);
const check=(v,msg)=>{if(!v)throw Error(msg)};
try{
 const players=THE_CAGE_PLAYERS,before=JSON.stringify(players);let claims=[],scouts=[];
 const pool=document.getElementById('pool');
 for(const p of players){
  const card=CageDraftCards.create(p,{claim:id=>claims.push(id),scout:x=>scouts.push(x.id)});pool.append(card);
  check(card.dataset.tier===(p.careerTier||p.tier),'tier changed '+p.id);
  check(card.querySelector('.name').textContent===p.name,'name changed '+p.id);
  check(card.querySelector('.card-ovr').getAttribute('aria-label')==='Overall rating '+CageOverall.read(p),'OVR changed '+p.id);
  const values=[...card.querySelectorAll('.draft-stat b')].map(x=>+x.textContent);
  check(JSON.stringify(values)===JSON.stringify(['pace','tech','pass','finish','def','phys'].map(k=>p.r[k])),'ratings changed '+p.id);
  check(card.dataset.style===p.traits.primary,'wrong style '+p.id);
  check(card.querySelector('.sticker-emblem svg'),'missing style emblem '+p.id);
  const name=card.querySelector('.name');check(name.scrollWidth<=name.clientWidth+1,'name clipped '+p.name);
  const button=card.querySelector('.card');check(button.scrollWidth<=button.clientWidth+1,'content overflow '+p.name);
  card.querySelector('.draft-scout summary').click();
  check(!claims.length,'scouting disclosure claimed player');card.querySelector('.draft-scout summary').click();
  card.querySelector('.war-scout-btn').click();check(!claims.length,'compare claimed player');
 }
 check(scouts.length===players.length,'missing scout action');
 const materials=new Map();for(const card of pool.children){const finish=getComputedStyle(card.querySelector('.card')).background;materials.set(card.dataset.tier,finish);}
 check(materials.size===5&&new Set(materials.values()).size===5,'tiers do not have five distinct materials');
 pool.querySelector('.card').click();check(claims.length===1&&claims[0]===players[0].id,'draft action changed');
 check(JSON.stringify(players)===before,'presentation mutated roster');
 check(document.documentElement.scrollWidth<=innerWidth+1,'page horizontal overflow');
 document.getElementById('selection').classList.add('quick-view');
 check([...pool.querySelectorAll('.sticker-art')].every(x=>getComputedStyle(x).display==='none'),'quick view has artwork');
 check([...pool.querySelectorAll('.name')].every(x=>getComputedStyle(x).display!=='none'),'quick view hides names');
 check(document.documentElement.scrollWidth<=innerWidth+1,'quick view horizontal overflow');
 out.textContent='STICKER_CARDS_PASS '+players.length+' players; five materials; real tiers/styles/ratings; long names; scouting isolation; draft action; immutable roster; quick view; width '+innerWidth;
}catch(e){out.textContent='STICKER_CARDS_FAIL '+e.stack;}
`;
fs.writeFileSync(path.join(dir,'check.html'),head+'<body><main><div id="selection"><div class="pool" id="pool"></div></div></main>'+loader+'<script>'+checks+'</script></body></html>');
try{
 for(const width of [1440,700,390]){
  const profile=path.join(dir,'chrome-'+width);
  const url=(process.env.CAGE_E2E_BASE||'http://127.0.0.1:51928')+'/work/'+path.basename(dir)+'/check.html';
  const r=cp.spawnSync('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-sandbox','--disable-extensions','--no-first-run','--user-data-dir='+profile,'--window-size='+width+',900','--virtual-time-budget=2500','--dump-dom',url],{encoding:'utf8',timeout:30000,maxBuffer:30e6});
  const result=r.stdout?.match(/<pre id="card-result"[^>]*>([\s\S]*?)<\/pre>/)?.[1]||'No browser result';console.log(result);assert(result.startsWith('STICKER_CARDS_PASS'),result);
 }
}finally{assert.equal(path.dirname(path.resolve(dir)),work);fs.rmSync(dir,{recursive:true,force:true,maxRetries:3});}
