'use strict';
const assert=require('node:assert/strict');
const W=require('./viewer/harness.cjs').loadEngine(),players=W.THE_CAGE_PLAYERS,traits=W.CageTraits;
const families={D:['Wall','Enforcer','Anticipator','Hunter','Libero'],M:['Maestro','Architect','Destroyer','Engine','Surgeon'],A:['Predator','Magician','Executioner','Phantom','Juggernaut']};
const family=x=>Object.keys(families).find(k=>families[k].includes(x));
const originals=require('../proposals/trait-family-v16-reviewed.json').rows;
assert.equal(players.length,182);assert.equal(traits.CATALOG.length,15);
assert.equal(W.CAGE_ROSTER_VERSION,W.CAGE_TACTICAL_CALIBRATION.rosterVersion);
assert.equal(W.CageEngine.VERSION,'cage-t3-6');
assert.equal(W.CAGE_TRAIT_REFINEMENT.corrected,110);
assert.equal(Object.keys(originals).length,110);
assert.equal(players.some(p=>p.traits.primary==='Tracker'||p.traits.secondary==='Tracker'),false);
const taken=new Set(),counts={D:0,M:0,A:0};
for(const p of players){
 assert(!taken.has(p.id),'duplicate id '+p.id);taken.add(p.id);
 assert(p.traits&&p.traits.primary&&p.traits.secondary,'missing traits '+p.id);
 const a=family(p.traits.primary),b=family(p.traits.secondary);
 assert(a&&b,'unrecognized class '+p.id);
 assert.notEqual(a,b,'same-family traits '+p.id);
 assert.notEqual(p.traits.primary,p.traits.secondary);
 counts[a]++;
 const correction=originals[p.id];
 if(correction){
  assert.equal(p.traits.primary,correction.primary==='Tracker'?'Hunter':correction.primary);
  assert.equal(p.traits.secondary,correction.newSecondary);
 }
 for(const x of Object.values(p.r))assert(Number.isFinite(x)&&x>=0&&x<=100,'invalid original core stat '+p.id);
}
const known=new Set(traits.CATALOG);
for(const f of Object.values(families))for(const cls of f)assert(known.has(cls),'approved class unavailable '+cls);
for(const cls of traits.CATALOG){
 assert(players.some(p=>p.traits.primary===cls),'no primary class representative '+cls);
 assert(players.some(p=>p.traits.secondary===cls),'no secondary class representative '+cls);
}
console.log('V54_TRAIT_FAMILY_PASS roster=182 corrected=110 canonical=15 noTracker remaining=0 crossFamilies=182 counts='+JSON.stringify(counts));
