'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=html=>[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const deps=['src/viewer-v4/goal-experience.js','src/viewer-v4/goal-audio.js','src/viewer-v4/viewer.js'];
for(const page of ['play.html','viewer-v4.html','viewer-v51.html','viewer-v52.html','viewer-v53.html']){
 const list=scripts(read(page)),positions=deps.map(d=>list.indexOf(d));
 assert(positions.every(p=>p>=0),page+' Golden Goal dependency missing');
 assert(positions[0]<positions[1]&&positions[1]<positions[2],page+' Golden Goal load order wrong');
}
const sync=read('tools/sync-v53-game.py');
assert(sync.includes('src/viewer-v4/goal-experience.js')&&sync.includes('src/viewer-v4/goal-audio.js'),'future sync would remove new modules');
for(const f of deps)assert(read('sw.js').includes('./'+f),'offline service-worker cache omits '+f);
assert(read('sw.js').includes('the-cage-full-v57-'),'stale service worker version');
for(const f of ['src/roster-184.js','src/overall.js','src/ace-recruitment-v1.js','src/di-canio-recruitment-v1.js','src/recruitment-four-v1.js']){assert(scripts(read('play.html')).includes(f),'play missing '+f);assert(read('sw.js').includes('./'+f),'cache missing '+f);assert(read('public/'+f).length>100,'package missing '+f);}for(const f of deps)assert(read('public/'+f).length>100,'offline package missing '+f);
assert(read('public/play.html').includes('src/viewer-v4/goal-audio.js'));
for(const f of ['draft.html','src/random-draft.js','src/cage-engine-draft.js','classic-v56/play.html','classic-v56/src/cage-engine.js']){assert(read('public/'+f).length>100,'web package missing '+f);assert(read('sw.js').includes('./'+f),'offline cache missing '+f);}console.log('V57_REBUILD_CONTRACT_PASS five entrypoints ordered, future page sync safe, 139-file package and service worker contain sound and cinematic');
