'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/V65_CPU_BENCHMARK.json'),'utf8')),L=report.levels;
assert.equal(report.mode,'regulation+GoldenGoal');for(const level of ['casual','competitive','ruthless'])assert.equal(L[level].matches,180);
assert(L.ruthless.averageOVR>=L.competitive.averageOVR&&L.competitive.averageOVR>L.casual.averageOVR,'draft skill should improve with level');
assert.equal(L.ruthless.completeTrioPct,100);assert.equal(L.competitive.completeTrioPct,100);assert(L.casual.completeTrioPct<100);
assert(L.ruthless.averageScoutingScore>=L.competitive.averageScoutingScore&&L.competitive.averageScoutingScore>L.casual.averageScoutingScore);
console.log('V65_CPU_QUALITY_PASS paired regulated match benchmark: '+Object.entries(L).map(([k,v])=>k+' '+v.winRatePct+'% wins, OVR '+v.averageOVR).join('; '));
