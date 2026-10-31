'use strict';
const assert=require('node:assert/strict'),R=require('../src/tactics/goalkeeper-rules.js'),G=require('../src/goalkeepers.js');
const ref={r:{reflexes:88,positioning:88,handling:88,oneOnOne:88,aerialControl:88,distribution:88,sweeping:88},keeperClass:'DISTRIBUTOR'};
assert.equal(R.logitShift(ref,'box'),0,'reference must preserve original shot odds');
for(const g of G.players){for(const k of ['box','one_v_one','fk']){const d=R.logitShift(g,k);assert(Number.isFinite(d));assert(Math.abs(d)<=R.MAX_LOGIT_SHIFT);}}
assert(R.logitShift(G.BY_ID['gianluigi-buffon'],'box')<R.logitShift(G.BY_ID['rene-higuita'],'box'));
const sample=Array.from({length:1000},(_,i)=>R.afterMiss(G.BY_ID['manuel-neuer'],'box',(i+.5)/1000));
assert(sample.some(x=>x.type==='gk_save'));assert(sample.some(x=>x.type==='gk_parry'));assert(sample.some(x=>x.type==='shot_miss'));
assert.equal(R.validateKeepers(['gianluigi-buffon','manuel-neuer'],G.BY_ID).length,2);
assert.throws(()=>R.validateKeepers(['gianluigi-buffon','gianluigi-buffon'],G.BY_ID));
assert.throws(()=>R.afterMiss(G.players[0],'box',1));
console.log('V66_GK_RULES_PASS reference-shift zero, 50 keeper contexts, bounded goal logit, save/parry/wide split, unique keeper validation');
