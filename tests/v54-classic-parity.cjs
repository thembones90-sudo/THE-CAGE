'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const W=require('./viewer/harness.cjs').loadEngine(),E=W.CAGE_ENGINE_REGISTRY['cage-0.4.0'];
assert(E&&E.VERSION==='cage-0.4.0','Stable Classic engine unavailable');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'v54-classic-parity-fixtures.json'),'utf8'));
let checks=0;
for(const item of fixture.records){
 const result=E.simulate(item.config);
 const hash=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
 assert.equal(hash,item.sha256,'Classic engine event history drift for seed '+item.config.seed);
 assert.equal(result.winner,item.winner);assert.deepEqual(Array.from(result.score),item.score);checks++;
}
assert.equal(checks,150);
console.log('V54_CLASSIC_PARITY_PASS engine=cage-0.4.0 completeResultHashes='+checks+' preserved from clean V5.3');
