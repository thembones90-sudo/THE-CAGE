const fs=require('fs'),vm=require('vm'),path=require('path');
const dir='A:/THE CAGE/src';
const files=['players.js','roster-expansion.js','roster-100.js','roster-101.js','roster-103.js','roster-pl-134.js','roster-135.js','roster-136.js','roster-139.js'];
const ctx={window:{}};vm.createContext(ctx);
for(const file of files)vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),ctx,{filename:file});
console.log('TOTAL',ctx.window.THE_CAGE_PLAYERS.length);
for(const p of ctx.window.THE_CAGE_PLAYERS)console.log(p.id+' | '+p.name+' | '+p.role+' | '+(p.position||''));
