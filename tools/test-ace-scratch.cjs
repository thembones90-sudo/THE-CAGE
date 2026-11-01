const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]);
const c={window:{location:{search:'?engine=t3'}}};vm.createContext(c);
for(const f of scripts){if(f==='src/identity/search.js')break;vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});}
const names=['freddy-adu','federico-macheda','royston-drenthe','leighton-baines','andriy-shevchenko'];
const src=fs.readFileSync('src/ace-recruitment-v1.js','utf8');
try{vm.runInContext(src,c,{filename:'src/ace-recruitment-v1.js'});}catch(e){console.log('ERROR',e.message);}
for(const id of names){const p=c.window.THE_CAGE_PLAYERS.find(x=>x.id===id);if(p)console.log(id,p.overall,c.window.CageOverall.evaluate(p).score);}
console.log('count',c.window.THE_CAGE_PLAYERS.length);
