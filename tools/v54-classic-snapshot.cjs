'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const oldRoot=process.argv[2];if(!oldRoot)throw Error('Pass verified clean V5.3 root for Classic compatibility snapshot');
const W=require(path.resolve(oldRoot,'tests/viewer/harness.cjs')).loadEngine();
const rows=Object.fromEntries(W.THE_CAGE_PLAYERS.map(p=>[p.id,[p.traits.primary,p.traits.secondary]]));
assert.equal(W.THE_CAGE_PLAYERS.length,182);
assert.equal(Object.keys(rows).length,182);
fs.writeFileSync(path.resolve(__dirname,'../proposals/trait-v15-classic-compat.json'),JSON.stringify({source:'clean c049502 V5.3 182-player trait fingerprint; replay-compatibility only, not gameplay or roster assignment',traits:rows},null,2)+'\n');
console.log('CLASSIC_TRAIT_SNAPSHOT',Object.keys(rows).length,'TRACKER',Object.values(rows).filter(a=>a.includes('Tracker')).length);
