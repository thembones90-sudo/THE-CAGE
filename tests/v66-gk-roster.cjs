'use strict';
const assert=require('node:assert/strict'),G=require('../src/goalkeepers.js');
assert(G.validate());assert.equal(G.players.length,30);assert.equal(new Set(G.players.map(x=>x.id)).size,30);
for(const g of G.players){assert.equal(G.ATTRS.length,7);assert.equal(g.overall,G.rawOverall(g));assert(Object.isFrozen(g)&&Object.isFrozen(g.r));assert(G.CLASSES.includes(g.keeperClass));assert(g.overall>=65&&g.overall<=100);}
const tiers=Object.fromEntries(G.TIERS.map(x=>[x,G.players.filter(g=>g.careerTier===x).length]));
assert(tiers.TITAN>0&&tiers.LEGEND>0&&tiers.ELITE>0);assert(new Set(G.players.map(g=>g.keeperClass)).size===5);
assert.throws(()=>G.rawOverall({r:{}}),/Invalid goalkeeper attribute/);
console.log('V66_GK_ROSTER_PASS 30 unique historical GK, 7 GK skills, 5 classes, formula-only OVR, historical tier labels',JSON.stringify(tiers));
