const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]);
const c={window:{location:{search:''}}};vm.createContext(c);
for(const f of scripts){if(f==='src/identity/search.js')break;vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});}
try{vm.runInContext(fs.readFileSync('src/recruitment-four-v1.js','utf8'),c);}catch(e){console.log('ERROR',e.message);}
for(const id of ['gianluca-zambrotta','antonio-valencia','claudio-marchisio','mauro-camoranesi']){const p=c.window.THE_CAGE_PLAYERS.find(x=>x.id===id);if(p)console.log(id,p.overall,c.window.CageOverall.evaluate(p).score);}
console.log('count',c.window.THE_CAGE_PLAYERS.length);
