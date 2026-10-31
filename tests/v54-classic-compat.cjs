'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function load(){
 const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const scripts=[...page.matchAll(/<script src="(src\/[^"]+)"/g)].map(m=>m[1]);
 const ctx={window:{location:{search:''}}};vm.createContext(ctx);
 for(const f of scripts){if(f==='src/showdown.js')break;vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});}
 return ctx.window;
}
const W=load(),E=W.CageEngine,R=W.CageRecords,save=JSON.parse(fs.readFileSync(path.join(root,'tests/v54-classic-v53-3round.json'),'utf8'));
assert.equal(E.VERSION,'cage-0.4.0');
R.validateSave(save);
let checks=0;
for(const record of save.history){
 assert.equal(record.engineVersion,'cage-0.4.0');
 const result=R.reproduce(record);
 assert.equal(JSON.stringify(result),JSON.stringify(record.result));
 const current=R.make(record.config,E.simulate(record.config),record.round);
 R.reproduce(current);
 assert.equal(JSON.stringify(current.result),JSON.stringify(record.result));
 assert.notEqual(current.rosterFingerprint,record.rosterFingerprint,'historic/new 182-player traits should produce distinct fingerprints');
 const invalid=R.copy(record);invalid.rosterFingerprint='f000dead';assert.throws(()=>R.reproduce(invalid));
 const altered=R.copy(record);altered.result.score[0]++;assert.throws(()=>R.reproduce(altered));
 checks++;
}
assert.equal(checks,3);
console.log('V54_CLASSIC_COMPAT_PASS old V5.3 3-round save, both fingerprints admitted, original simulated match exact, arbitrary tampering refused');
