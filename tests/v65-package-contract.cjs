'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),r=f=>fs.readFileSync(path.join(root,f));const html=r('draft.html').toString(),sw=r('sw.js').toString();
const files=['src/cpu-draft.js','src/war-room.js','src/random-draft.js','src/cage-engine-draft.js','src/replay/records.js','src/viewer-v4/goal-experience.js','src/viewer/timeline.js'];
for(const p of files){assert(html.includes('src="'+p+'"'),'Draft must load '+p);assert(fs.existsSync(path.join(root,'public',p)),'package missing '+p);assert(r(p).equals(r('public/'+p)),'packaged file differs '+p);assert(sw.includes('./'+p),'offline cache missing '+p);}
assert(html.indexOf('src/cpu-draft.js')<html.indexOf('src/war-room.js')&&html.indexOf('src/war-room.js')<html.indexOf('src/random-draft.js'),'War Room/CPU load sequence wrong');
assert(html.includes('id="warRoom"'));assert(html.includes('GOLDEN GOAL OVERTIME'));assert(r('src/random-draft.js').toString().includes("mode:'score'"));
assert(r('src/showdown-v5.js').toString().includes("mode:'score'"));
assert(!html.includes('FIRST GOAL WINS'));
console.log('V65_PACKAGE_CONTRACT_PASS War Room, CPU 2.0, regulation tie-break, offline assets, script order');
