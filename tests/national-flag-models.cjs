'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),F=require('../src/national-flags.js');
const context={window:{},console};vm.createContext(context);
const html=fs.readFileSync(path.join(root,'draft.html'),'utf8');
for(const m of html.matchAll(/<script src="([^"]+)"/g)){if(m[1]==='src/engine/legacy-v04.js')break;vm.runInContext(fs.readFileSync(path.join(root,m[1]),'utf8'),context);}
const players=context.window.THE_CAGE_PLAYERS,before=JSON.stringify(players),countries=new Set();
for(const p of players){const flag=F.resolve(p);assert(flag,'Unmapped roster nationality: '+p.country);countries.add(p.country);assert(fs.existsSync(path.join(root,flag.asset)),flag.asset);}
assert.equal(JSON.stringify(players),before);
assert.equal(F.resolve('Republic of Ireland').code,'ie');assert.equal(F.resolve('Côte d’Ivoire').code,'ci');
assert.equal(F.resolve('England').code,'gb-eng');assert.equal(F.resolve('Scotland').code,'gb-sct');assert.equal(F.resolve('Wales').code,'gb-wls');
assert.equal(F.resolve('Yugoslavia / Croatia').code,'hr');assert.equal(F.resolve('Yugoslavia / Bosnia and Herzegovina').code,'ba');
assert.equal(F.resolve('Congo'),null);assert.equal(F.resolve('Yugoslavia'),null);assert.equal(F.resolve({}),null);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/flags/manifest.json')));
for(const [code,asset] of Object.entries(manifest.assets)){const bytes=fs.readFileSync(path.join(root,'assets/flags',code+'.svg'));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256,'Original flag changed: '+code);}
console.log('FLAG_MAPPING_PASS '+players.length+' players; '+countries.size+' nationality labels; '+Object.keys(manifest.assets).length+' original SVG hashes; aliases and unknown fallback');

const fixture=String.raw`
(async()=>{const out=document.createElement('pre');out.id='flag-model-result';out.style.whiteSpace='pre-wrap';out.style.overflowWrap='anywhere';document.body.append(out);const check=(v,m)=>{if(!v)throw Error(m)};
try{
 const normalize=el=>new XMLSerializer().serializeToString(el).replace(/tier-model-\d+-/g,'');
 const bases=await Promise.all(CageTierModels.TIERS.map(async tier=>[tier,new DOMParser().parseFromString(await (await fetch('/design/tier-models/'+tier.toLowerCase()+'.svg')).text(),'image/svg+xml')]));
 const originals=new Map(bases),holder=document.getElementById('cards'),allIds=new Set();
 const sample=Object.freeze({country:'Italy',r:Object.freeze({pace:99}),careerTier:'ACE'}),snapshot=JSON.stringify(sample),first=[];
 for(const tier of CageTierModels.TIERS){
  const card=await CageTierModels.create({tier,player:sample});holder.append(card);first.push(card);
  check(card.dataset.flag==='it'&&card.dataset.tier===tier,'Tier/nationality crossed');
  check(normalize(card.querySelector('[data-part="frame"]'))===normalize(originals.get(tier).querySelector('[data-part="frame"]')),'Frame altered '+tier);
  check(normalize(card.querySelector('[data-part="shirt"]'))===normalize(originals.get(tier).querySelector('[data-part="shirt"]')),'Generic shirt altered '+tier);
  check(card.querySelector('pattern[id$="shirt-fabric"]'),'Shared fabric material absent '+tier);
  check(card.querySelector('[data-part="primary-style-slot"]')&&card.querySelector('[data-part="secondary-style-slot"]'),'Style hierarchy absent '+tier);
  const flag=card.querySelector('[data-part="national-flag"]'),shirt=card.querySelector('[data-part="shirt"]');
  check(flag.compareDocumentPosition(shirt)&Node.DOCUMENT_POSITION_FOLLOWING,'Flag is not behind shirt');
  const image=flag.querySelector('image'),box=card.querySelector('clipPath[id$="flag-window"] path').getBBox();
  check(+image.getAttribute('x')<=box.x+.001&&+image.getAttribute('y')<=box.y+.001&&+image.getAttribute('x')+ +image.getAttribute('width')>=box.x+box.width-.001&&+image.getAttribute('y')+ +image.getAttribute('height')>=box.y+box.height-.001,'Flag does not fill artwork '+tier);
  for(const el of card.querySelectorAll('[id]')){check(!allIds.has(el.id),'Duplicate SVG reference');allIds.add(el.id);}
 }
 check(JSON.stringify(sample)===snapshot,'Roster record mutated');
 check(new Set(first.map(c=>c.querySelector('image').getAttribute('href'))).size===1,'Acceptance cards use different flags');
 let checks=0;
 for(const country of Object.keys(CageNationalFlags.COUNTRIES))for(const tier of CageTierModels.TIERS){
  const card=await CageTierModels.create({tier,player:{nationality:country}}),image=card.querySelector('image'),ratio=+image.dataset.nativeRatio;
  check(Math.abs(+image.getAttribute('width')/+image.getAttribute('height')-ratio)<1e-9,'Flag stretched '+country+' '+tier);
  check(card.dataset.flag===CageNationalFlags.resolve(country).code,'Wrong flag '+country);
  check(image.getAttribute('href').startsWith('data:image/svg+xml'),'External runtime flag dependency');
  check(card.querySelector('[data-part="tier-finish"]'),'Tier treatment absent '+tier);checks++;
 }
 const unknown=await CageTierModels.create({tier:'ACE',player:{country:'Unknown'}});check(unknown.dataset.flagStatus==='unavailable'&&!unknown.querySelector('image'),'Unknown nationality got fabricated flag');
 check(document.documentElement.scrollWidth<=innerWidth,'Horizontal overflow');
 out.textContent='FLAG_MODELS_PASS '+checks+' country/tier pairs; same Italy flag and generic shirt; exact original frames and shirts; correct foreground order; native flag proportions; unique SVG references; local assets; safe unknown fallback; width '+innerWidth;
}catch(e){out.textContent='FLAG_MODELS_FAIL '+e.stack;}
})();`;
const work=path.join(root,'work','flag-model-check');fs.mkdirSync(work,{recursive:true});
fs.writeFileSync(path.join(work,'check.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}#cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}#cards svg{width:100%;height:auto}@media(max-width:650px){#cards{grid-template-columns:repeat(2,minmax(0,1fr))}}</style></head><body><div id="cards"></div><script src="/src/national-flags.js"></script><script src="/src/tier-card-models.js"></script><script>'+fixture+'</script></body></html>');
const profile=fs.mkdtempSync(path.join(work,'chrome-'));assert.equal(path.dirname(path.resolve(profile)),work);
try{
 const url=(process.env.CAGE_E2E_BASE||'http://127.0.0.1:51931')+'/work/flag-model-check/check.html';
 const r=cp.spawnSync('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--disable-extensions','--no-first-run','--no-sandbox','--user-data-dir='+profile,'--window-size=1440,1000','--virtual-time-budget=15000','--dump-dom',url],{encoding:'utf8',timeout:40000,maxBuffer:30e6});
 const result=r.stdout?.match(/<pre id="flag-model-result"[^>]*>([\s\S]*?)<\/pre>/)?.[1]||'No browser result';console.log(result);assert(result.startsWith('FLAG_MODELS_PASS'),result);
}finally{assert.equal(path.dirname(path.resolve(profile)),work);fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}
