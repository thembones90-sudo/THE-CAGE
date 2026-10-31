'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p));
for(const file of ['draft.html','play.html','src/random-draft.js','src/cage-engine-draft.js','src/viewer-v4/viewer.js','src/viewer-v4/renderer.js','src/viewer-v4/viewer-v4.css','src/replay/records.js','manifest.webmanifest','sw.js']){
 assert(read(file).equals(read('public/'+file)),file+' packaged copy differs from tested source');
}
assert(read('src/cage-engine.js').equals(read('src/cage-engine-draft.js')),'draft engine drifted from canonical engine');
const launcher=fs.readFileSync(path.join(root,'tools/build-sea-config.py'),'utf8');
assert(launcher.includes('process.env.CAGE_PORT||4184'),'saved browser origin port changed');
assert(launcher.includes("'/draft.html'"),'EXE does not open Random Draft');
const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.start_url==='./draft.html','PWA starts in old manual selection mode');
const worker=read('sw.js').toString();
assert(worker.includes('./draft.html')&&worker.includes('./src/random-draft.js')&&worker.includes('./src/viewer-v4/viewer.js'),'offline cache missing game modules');
console.log('V60_PACKAGE_PARITY_PASS draft/play/viewer/engine/manifest/sw byte parity, origin 4184, random draft default');
