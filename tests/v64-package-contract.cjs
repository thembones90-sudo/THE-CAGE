'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),r=f=>fs.readFileSync(path.join(root,f));
const page=r('draft.html').toString('utf8'),offline=r('sw.js').toString('utf8');
for(const label of ['gameMode','cpuDifficulty','ironModeInfo'])assert(page.includes('id="'+label+'"'),label+' selector absent');
assert(page.indexOf('src/cpu-draft.js')>0&&page.indexOf('src/cpu-draft.js')<page.indexOf('src/random-draft.js'),'CPU must load before draft controller');
for(const p of ['draft.html','src/cpu-draft.js','src/random-draft.js','src/cage-engine-draft.js']){
 assert(fs.existsSync(path.join(root,'public',p)),'Missing offline asset '+p);
 assert(offline.includes('./'+p),'Offline cache omits '+p);
 assert(r(p).equals(r('public/'+p)),'Offline packaged bytes differ '+p);
}
assert(page.includes('<option value="hotseat">')&&page.includes('<option value="solo">'),'Hotseat compatibility not selectable');
assert(r('src/random-draft.js').toString().includes("mode:s.mode||'hotseat'")===false,'Unexpected old game state typo');
console.log('V64_CPU_PACKAGE_PASS offline CPU bundled before draft, hotseat/solo selectors, byte-identical deploy assets');
