const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('index.html','utf8'),sources=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const c={window:{location:{search:''}}};vm.createContext(c);
for(const f of sources){if(f==='src/identity/search.js')break;vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});}
const p=c.window.THE_CAGE_PLAYERS,di=p.find(x=>x.id==='paolo-di-canio');
assert.equal(p.length,190);assert.equal(di.careerTier,'ELITE');assert.equal(di.overall,87);assert.equal(c.window.CageOverall.raw(di),87);assert.deepEqual(Array.from(di.folklore),['STREET HERO','TALISMAN','STREET VILLAIN']);assert.equal(di.talismanClubs[0],'West Ham United');
assert.equal(p.filter(x=>x.id==='paolo-di-canio').length,1);
assert.equal(p.find(x=>x.id==='thomas-gravesen').careerTier,'ACE');
console.log('PASS 190 roster, Di Canio ELITE 87 derived, all 3 folklore badges, Gravesen ACE');
